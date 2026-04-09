/**
 * keyManager.js — High-level key lifecycle management
 *
 * Handles: key generation on first login, registration with server,
 * key bundle fetching, session establishment via X3DH + Double Ratchet,
 * encrypt/decrypt wrappers for ChatContainer.
 */
import {
    initCrypto,
    generateKeyPair,
    generateSigningKeyPair,
    sign,
    toBase64,
    fromBase64,
} from "./cryptoService.js";
import { performX3DH, respondX3DH } from "./x3dh.js";
import {
    initSession,
    initSessionResponder,
    ratchetEncrypt,
    ratchetDecrypt,
    serializeSession,
    deserializeSession,
} from "./doubleRatchet.js";
import {
    storeIdentityKeys,
    getIdentityKeys,
    getArchivedIdentityKeys,
    storeSession,
    getSession,
    getArchivedSessions,
    deleteSession,
    archiveSession,
    cacheDecryptedMessages,
    getCachedDecryptedMessages,
    cacheDecryptedMessage,
    getCachedDecryptedMessage,
    setMetadata,
    getMetadata,
} from "./sessionStore.js";
import {
    registerKeys as apiRegisterKeys,
    getKeyBundle as apiGetKeyBundle,
} from "../api.js";

let cryptoReady = false;

// In-memory session cache (to avoid IndexedDB reads on every message)
const sessionCache = new Map();

// Per-conversation locks to prevent race conditions during state-mutating operations
const sessionLocks = new Map();

/**
 * Executes a function with a per-conversation lock.
 * Ensures that multiple calls for the same partner are processed sequentially.
 */
const withLock = async (partnerId, fn) => {
    // Get existing queue or create new one
    if (!sessionLocks.has(partnerId)) {
        sessionLocks.set(partnerId, Promise.resolve());
    }

    const lock = sessionLocks.get(partnerId);
    let release;
    const nextLock = new Promise((resolve) => {
        release = resolve;
    });

    // Update queue safely to the new unsettled promise, ignoring previous rejections
    sessionLocks.set(partnerId, nextLock);

    try {
        // Wait for previous operation, catch any previous errors so we don't crash
        await lock.catch(() => { });
        return await fn();
    } finally {
        // Resolve the next lock in line
        release();
    }
};

// ── Decrypted-cache fingerprinting ───────────────────────
// We cache sent-message plaintext under both:
// - messageId (when we have it), and
// - a deterministic fingerprint derived from ciphertext+nonce+header
// so a reload/tab-close race (before server returns _id) still has a cache hit later.
const getMsgCacheKey = (msg) => {
    if (!msg) return null;
    // Prefer stable server id if present
    const id = msg._id || msg.messageId;
    if (id) return String(id);
    const { encryptionVersion, ciphertext, nonce, ratchetHeader } = msg;
    if (!ciphertext || !nonce || !ratchetHeader) return null;
    // Keep it simple + stable across devices (strings from API payload)
    const headerStr = typeof ratchetHeader === "string" ? ratchetHeader : JSON.stringify(ratchetHeader);
    return `${encryptionVersion || "e2ee"}|${nonce}|${ciphertext}|${headerStr}`;
};

// ── Initialization ──────────────────────────────────────

/**
 * Initialize crypto and ensure keys are generated + registered for this user.
 * Should be called after login/auth check.
 */
export const ensureKeysRegistered = async (userId) => {
    if (!cryptoReady) {
        await initCrypto();
        cryptoReady = true;
    }

    // Check if keys already exist in IndexedDB
    let keys = await getIdentityKeys(userId);
    if (keys) {
        console.log("[E2EE] Keys already exist locally for user", userId);

        // from another device. If so, we SHOULD NOT overwrite the server with our stale keys
        // UNLESS we just performed an explicit import.
        try {
            const importPending = await getMetadata("import_pending_registration");
            const res = await apiGetKeyBundle(userId).catch(() => null);
            const serverBundle = res?.data;

            if (serverBundle && serverBundle.identityKeyPublic !== keys.identityKeyPair.publicKey && importPending !== "true") {
                console.warn("[E2EE] Server has a different identity key (newer registration detected?); bypassing re-registration to avoid corruption.");
                return keys;
            }

            if (importPending === "true") {
                console.log("[E2EE] Import detected; forcing key registration to sync server with restored keys.");
                await setMetadata("import_pending_registration", "false");
            }
        } catch (err) {
            console.warn("[E2EE] Could not verify server bundle during key check:", err);
        }

        try {
            const signedPreKeySignature = sign(
                fromBase64(keys.signedPreKeyPair.publicKey),
                fromBase64(keys.signingKeyPair.privateKey)
            );
            await apiRegisterKeys({
                identityKeyPublic: keys.identityKeyPair.publicKey,
                signedPreKey: {
                    keyId: keys.signedPreKeyPair.keyId,
                    publicKey: keys.signedPreKeyPair.publicKey,
                    signature: toBase64(signedPreKeySignature),
                    createdAt: new Date().toISOString(),
                },
                oneTimePreKeys: (keys.oneTimePreKeys || []).map((k) => ({
                    keyId: k.keyId,
                    publicKey: k.publicKey,
                })),
            });
        } catch (err) {
            // Non-fatal: encryption can still work if server bundle is correct already.
            console.warn("[E2EE] Failed to re-register existing keys:", err?.message || err);
        }
        return keys;
    }

    console.log("[E2EE] Generating new keys for user", userId);

    // Generate identity key pair (X25519)
    const identityKeyPair = generateKeyPair();

    // Generate signing key pair (Ed25519, for signing prekeys)
    const signingKeyPair = generateSigningKeyPair();

    // Generate signed prekey
    const signedPreKeyPair = generateKeyPair();
    const signedPreKeyId = Date.now();
    const signedPreKeySignature = sign(signedPreKeyPair.publicKey, signingKeyPair.privateKey);

    // Generate one-time prekeys (batch of 20)
    const oneTimePreKeys = [];
    for (let i = 0; i < 20; i++) {
        const otp = generateKeyPair();
        oneTimePreKeys.push({
            keyId: signedPreKeyId + i + 1,
            publicKey: toBase64(otp.publicKey),
            privateKey: toBase64(otp.privateKey),
        });
    }

    // Store all keys locally
    const keyData = {
        identityKeyPair: {
            publicKey: toBase64(identityKeyPair.publicKey),
            privateKey: toBase64(identityKeyPair.privateKey),
        },
        signingKeyPair: {
            publicKey: toBase64(signingKeyPair.publicKey),
            privateKey: toBase64(signingKeyPair.privateKey),
        },
        signedPreKeyPair: {
            keyId: signedPreKeyId,
            publicKey: toBase64(signedPreKeyPair.publicKey),
            privateKey: toBase64(signedPreKeyPair.privateKey),
        },
        oneTimePreKeys,
    };

    await storeIdentityKeys(userId, keyData);

    // Register public keys with server
    try {
        await apiRegisterKeys({
            identityKeyPublic: keyData.identityKeyPair.publicKey,
            signedPreKey: {
                keyId: signedPreKeyId,
                publicKey: keyData.signedPreKeyPair.publicKey,
                signature: toBase64(signedPreKeySignature),
                createdAt: new Date().toISOString(),
            },
            oneTimePreKeys: oneTimePreKeys.map((k) => ({
                keyId: k.keyId,
                publicKey: k.publicKey,
            })),
        });
        console.log("[E2EE] Keys registered with server");
    } catch (err) {
        console.error("[E2EE] Failed to register keys:", err);
        // Keys are stored locally, they'll be registered next time
    }

    return keyData;
};

// ── Session Management ──────────────────────────────────

/**
 * Get or establish an encrypted session with a conversation partner.
 * Returns the Double Ratchet session state.
 */
export const getOrCreateSession = async (myUserId, theirUserId) => {
    // 1. Fetch current key bundle from server to verify partner's identity hasn't changed
    let bundle;
    try {
        const res = await apiGetKeyBundle(theirUserId);
        bundle = res.data;
    } catch (err) {
        console.warn("[E2EE] Failed to fetch key bundle during session check for", theirUserId);
    }

    // 2. Check in-memory cache
    let session = sessionCache.get(theirUserId);
    if (!session) {
        const stored = await getSession(theirUserId);
        if (stored) {
            session = deserializeSession(stored);
            session._meta = {
                theirIdentityKey: stored.theirIdentityKey,
                ephemeralPublicKey: stored.ephemeralPublicKey,
                aliceEphemeralKey: stored.aliceEphemeralKey,
                isInitiator: stored.isInitiator,
            };
        }
    }

    // 3. Verify integrity: if partner rotated keys, discard stale session
    if (session && bundle && session._meta?.theirIdentityKey !== bundle.identityKeyPublic) {
        console.warn("[E2EE] Partner identity key changed (reset detected), discarding stale session for", theirUserId);
        sessionCache.delete(theirUserId);
        await deleteSession(theirUserId);
        session = null;
    }

    if (session) {
        sessionCache.set(theirUserId, session);
        return session;
    }

    // 4. Need to establish a new session via X3DH
    if (!bundle) {
        console.error("[E2EE] Cannot establish session: bundle missing for", theirUserId);
        return null;
    }

    console.log("[E2EE] Establishing new session with", theirUserId);
    if (bundle) {
        console.log("[E2EE-INIT] Target Identity Key:", bundle.identityKeyPublic.slice(0, 12));
        console.log("[E2EE-INIT] Target Signed PreKey:", bundle.signedPreKey.publicKey.slice(0, 12));
    }

    const myKeys = await getIdentityKeys(myUserId);
    if (!myKeys) {
        throw new Error("No identity keys found. Cannot establish E2EE session.");
    }

    const myIdentityKeyPair = {
        publicKey: fromBase64(myKeys.identityKeyPair.publicKey),
        privateKey: fromBase64(myKeys.identityKeyPair.privateKey),
    };

    const { sharedSecret, ephemeralPublicKey } = performX3DH(myIdentityKeyPair, bundle);

    // Initialize Double Ratchet session as initiator
    const freshSession = initSession(sharedSecret, bundle.signedPreKey.publicKey);
    freshSession._meta = {
        theirIdentityKey: bundle.identityKeyPublic,
        ephemeralPublicKey,
        isInitiator: true,
    };

    // Persist
    await persistSession(theirUserId, freshSession);
    sessionCache.set(theirUserId, freshSession);

    return freshSession;
};

const prepareFirstSessionWithKeys = (myKeys, theirIdentityPubB64, theirEphemeralPubB64) => {
    if (!myKeys) {
        throw new Error("No identity keys found.");
    }

    const myIdentityKeyPair = {
        publicKey: fromBase64(myKeys.identityKeyPair.publicKey),
        privateKey: fromBase64(myKeys.identityKeyPair.privateKey),
    };

    const mySignedPreKeyPair = {
        publicKey: fromBase64(myKeys.signedPreKeyPair.publicKey),
        privateKey: fromBase64(myKeys.signedPreKeyPair.privateKey),
    };

    console.log("[E2EE-RESP] My Identity Key:", myKeys.identityKeyPair.publicKey.slice(0, 12));
    console.log("[E2EE-RESP] My Signed PreKey:", myKeys.signedPreKeyPair.publicKey.slice(0, 12));
    console.log("[E2EE-RESP] Their Identity Key:", theirIdentityPubB64.slice(0, 12));
    console.log("[E2EE-RESP] Their Ephemeral Key:", theirEphemeralPubB64.slice(0, 12));

    const myOneTimePreKeyPair = null;

    const { sharedSecret } = respondX3DH(
        myIdentityKeyPair,
        mySignedPreKeyPair,
        myOneTimePreKeyPair,
        theirIdentityPubB64,
        theirEphemeralPubB64
    );

    const session = initSessionResponder(sharedSecret, mySignedPreKeyPair);
    session._meta = {
        theirIdentityKey: theirIdentityPubB64,
        isInitiator: false,
        aliceEphemeralKey: theirEphemeralPubB64, // Store initiator's key for potential recovery
    };
    return session;
};

/**
 * Internal helper: responder side of X3DH (without side effects).
 */
const prepareFirstSession = async (myUserId, theirUserId, theirIdentityPubB64, theirEphemeralPubB64) => {
    const myKeys = await getIdentityKeys(myUserId);
    return prepareFirstSessionWithKeys(myKeys, theirIdentityPubB64, theirEphemeralPubB64);
};

/**
 * Attempt decryption using all archived keys and sessions.
 * Returns plaintext or null.
 */
const tryDecryptWithArchive = async (myUserId, theirUserId, ciphertext, nonce, ratchetHeader, senderIdentityKey, senderEphemeralKey) => {
    // 1. Try past archived sessions
    const archivedSessions = await getArchivedSessions(theirUserId) || [];
    for (const stored of archivedSessions) {
        let archSession = deserializeSession(stored);
        try {
            const { plaintext } = ratchetDecrypt(archSession, ratchetHeader, ciphertext, nonce);
            return plaintext;
        } catch (e) { }
    }

    // 2. Try past archived identity keys
    if (senderIdentityKey && senderEphemeralKey) {
        const archivedIdKeys = await getArchivedIdentityKeys(myUserId) || [];
        for (const archMyKeys of archivedIdKeys) {
            try {
                const resetSess = prepareFirstSessionWithKeys(archMyKeys, senderIdentityKey, senderEphemeralKey);
                const { plaintext } = ratchetDecrypt(resetSess, ratchetHeader, ciphertext, nonce);
                return plaintext;
            } catch (e) { }
        }
    }
    return null;
};

/**
 * Handle receiving the first message from someone (responder side X3DH).
 * Creates a session from the incoming message's header.
 */
export const handleFirstMessage = async (myUserId, theirUserId, theirIdentityPubB64, theirEphemeralPubB64) => {
    const session = await prepareFirstSession(myUserId, theirUserId, theirIdentityPubB64, theirEphemeralPubB64);

    await persistSession(theirUserId, session);
    sessionCache.set(theirUserId, session);

    return session;
};


/**
 * Decrypt a batch of messages for history view.
 * Handles potential session resets within the history and avoids corrupting the live session.
 */
export const decryptMessagesBatch = async (myUserId, theirUserId, msgs) => {
    return withLock(theirUserId, async () => {
        let currentSession = sessionCache.get(theirUserId) || null;
        if (!currentSession) {
            const stored = await getSession(theirUserId);
            if (stored) {
                currentSession = deserializeSession(stored);
            }
        }

        // Pre-fetch cached plaintext for all encrypted messages (fast batch lookup)
        const encryptedMsgIds = msgs
            .filter(m => m.encryptionVersion === 'e2ee-v1' && m.ciphertext && m._id)
            .map(m => m._id);
        const cachedPlaintexts = encryptedMsgIds.length > 0
            ? await getCachedDecryptedMessages(encryptedMsgIds)
            : new Map();

        const decryptedMsgs = [];
        const newCacheEntries = []; // Collect successful decryptions to cache
        let sessionForBatch = null;
        if (currentSession) {
            // Deep clone via serialization to ensure 100% isolation from live state
            sessionForBatch = deserializeSession(serializeSession(currentSession));
            sessionForBatch._meta = { ...currentSession._meta };
        }
        let sessionModified = false;

        for (const msg of msgs) {
            if (msg.encryptionVersion === 'e2ee-v1' && msg.ciphertext) {
                // Own sent message — check cache for plaintext
                if (String(msg.senderId) === String(myUserId)) {
                    let cached = msg._id ? cachedPlaintexts.get(msg._id) : null;
                    if (!cached) {
                        const fpKey = getMsgCacheKey(msg);
                        if (fpKey) {
                            try {
                                const fpCached = await getCachedDecryptedMessage(fpKey);
                                if (fpCached) cached = fpCached;
                            } catch { }
                        }
                    }
                    decryptedMsgs.push({
                        ...msg,
                        _decryptedText: cached || '[Sent Encrypted Message]',
                        _isEncrypted: true,
                        _fromCache: !!cached,
                    });
                    continue;
                }

                try {
                    // 1. If no session yet, try to bootstrap from message
                    if (!sessionForBatch && msg.senderIdentityKey && msg.senderEphemeralKey) {
                        sessionForBatch = await prepareFirstSession(myUserId, theirUserId, msg.senderIdentityKey, msg.senderEphemeralKey);
                        sessionModified = true;
                    }

                    if (sessionForBatch) {
                        try {
                            const { plaintext, state } = ratchetDecrypt(sessionForBatch, msg.ratchetHeader, msg.ciphertext, msg.nonce);
                            sessionForBatch = state;
                            sessionModified = true;
                            decryptedMsgs.push({ ...msg, _decryptedText: plaintext, _isEncrypted: true });
                            // Cache the successful decryption
                            if (msg._id) newCacheEntries.push({ messageId: msg._id, plaintext });
                        } catch (decryptErr) {
                            if (msg.senderIdentityKey && msg.senderEphemeralKey) {
                                try {
                                    const resetSess = await prepareFirstSession(myUserId, theirUserId, msg.senderIdentityKey, msg.senderEphemeralKey);
                                    const { plaintext, state } = ratchetDecrypt(resetSess, msg.ratchetHeader, msg.ciphertext, msg.nonce);
                                    sessionForBatch = state;
                                    sessionModified = true;
                                    decryptedMsgs.push({ ...msg, _decryptedText: plaintext, _isEncrypted: true });
                                    if (msg._id) newCacheEntries.push({ messageId: msg._id, plaintext });
                                } catch (innerErr) {
                                    // Try Archive
                                    const archivedPlaintext = await tryDecryptWithArchive(myUserId, theirUserId, msg.ciphertext, msg.nonce, msg.ratchetHeader, msg.senderIdentityKey, msg.senderEphemeralKey);
                                    if (archivedPlaintext) {
                                        decryptedMsgs.push({ ...msg, _decryptedText: archivedPlaintext, _isEncrypted: true });
                                        if (msg._id) newCacheEntries.push({ messageId: msg._id, plaintext: archivedPlaintext });
                                        continue;
                                    }

                                    // Fall back to cache
                                    const cached = cachedPlaintexts.get(msg._id);
                                    if (cached) {
                                        decryptedMsgs.push({ ...msg, _decryptedText: cached, _isEncrypted: true, _fromCache: true });
                                    } else {
                                        decryptedMsgs.push({ ...msg, _decryptedText: '[Previous session message]', _isEncrypted: true });
                                    }
                                }
                            } else {
                                // Try Archive
                                const archivedPlaintext = await tryDecryptWithArchive(myUserId, theirUserId, msg.ciphertext, msg.nonce, msg.ratchetHeader, msg.senderIdentityKey, msg.senderEphemeralKey);
                                if (archivedPlaintext) {
                                    decryptedMsgs.push({ ...msg, _decryptedText: archivedPlaintext, _isEncrypted: true });
                                    if (msg._id) newCacheEntries.push({ messageId: msg._id, plaintext: archivedPlaintext });
                                    continue;
                                }

                                // Fall back to cache
                                const cached = cachedPlaintexts.get(msg._id);
                                if (cached) {
                                    decryptedMsgs.push({ ...msg, _decryptedText: cached, _isEncrypted: true, _fromCache: true });
                                } else {
                                    decryptedMsgs.push({ ...msg, _decryptedText: '[Previous session message]', _isEncrypted: true });
                                }
                            }
                        }
                    } else {
                        // No session — try Archive
                        const archivedPlaintext = await tryDecryptWithArchive(myUserId, theirUserId, msg.ciphertext, msg.nonce, msg.ratchetHeader, msg.senderIdentityKey, msg.senderEphemeralKey);
                        if (archivedPlaintext) {
                            decryptedMsgs.push({ ...msg, _decryptedText: archivedPlaintext, _isEncrypted: true });
                            if (msg._id) newCacheEntries.push({ messageId: msg._id, plaintext: archivedPlaintext });
                            continue;
                        }

                        // try cache
                        const cached = cachedPlaintexts.get(msg._id);
                        if (cached) {
                            decryptedMsgs.push({ ...msg, _decryptedText: cached, _isEncrypted: true, _fromCache: true });
                        } else {
                            decryptedMsgs.push({ ...msg, _decryptedText: '[Previous session message]', _isEncrypted: true });
                        }
                    }
                } catch (err) {
                    console.error('[E2EE] Batch decryption error for message:', msg._id, err);
                    const cached = cachedPlaintexts.get(msg._id);
                    if (cached) {
                        decryptedMsgs.push({ ...msg, _decryptedText: cached, _isEncrypted: true, _fromCache: true });
                    } else {
                        decryptedMsgs.push({ ...msg, _decryptedText: '[Decryption error]', _isEncrypted: true });
                    }
                }
            } else {
                decryptedMsgs.push(msg);
            }
        }

        // Isolation: We DO NOT persist the session advanced/created during batch decryption
        // to the global cache or storage. This prevents history-based "recovery" sessions
        // (which might use old ephemeral keys) from polluting the live session used for 
        // new outgoing messages.
        /* 
        if (sessionForBatch && sessionModified) {
            const stored = await getSession(theirUserId);
            const batchProgress = (sessionForBatch.Ns || 0) + (sessionForBatch.Nr || 0);
            const storedProgress = stored ? (stored.Ns || 0) + (stored.Nr || 0) : -1;

            if (batchProgress > storedProgress) {
                sessionCache.set(theirUserId, sessionForBatch);
                await persistSession(theirUserId, sessionForBatch);
            }
        }
        */

        // Batch-cache all newly decrypted messages
        if (newCacheEntries.length > 0) {
            try {
                await cacheDecryptedMessages(newCacheEntries);
            } catch (cacheErr) {
                console.warn('[E2EE] Failed to cache decrypted messages:', cacheErr);
            }
        }

        return decryptedMsgs;
    });
};

// ── Encrypt / Decrypt Wrappers ──────────────────────────

/**
 * Encrypt a message for sending.
 */
export const encryptMessage = async (myUserId, theirUserId, plaintext) => {
    return withLock(theirUserId, async () => {
        let session = await getOrCreateSession(myUserId, theirUserId);
        if (!session) {
            return null; // Can't encrypt, send as plaintext
        }

        try {
            const { header, ciphertext, nonce, state } = ratchetEncrypt(session, plaintext);

            // Update the session in cache and storage
            sessionCache.set(theirUserId, state);
            await persistSession(theirUserId, state);

            const myKeys = await getIdentityKeys(myUserId);

            return {
                ciphertext,
                nonce,
                ratchetHeader: header,
                encryptionVersion: "e2ee-v1",
                senderIdentityKey: myKeys?.identityKeyPair.publicKey,
                senderEphemeralKey: state._meta?.isInitiator
                    ? state._meta?.ephemeralPublicKey
                    : state._meta?.aliceEphemeralKey,
            };
        } catch (encErr) {
            console.warn("[E2EE] Encryption failed with current session, re-establishing...", encErr);
            // Session is likely stale/corrupted after a reset — re-establish
            sessionCache.delete(theirUserId);
            await deleteSession(theirUserId);

            // Establish a fresh session
            let freshSession = await getOrCreateSession(myUserId, theirUserId);
            if (!freshSession) return null;

            const { header, ciphertext, nonce, state } = ratchetEncrypt(freshSession, plaintext);
            sessionCache.set(theirUserId, state);
            await persistSession(theirUserId, state);

            const myKeys = await getIdentityKeys(myUserId);
            return {
                ciphertext,
                nonce,
                ratchetHeader: header,
                encryptionVersion: "e2ee-v1",
                senderIdentityKey: myKeys?.identityKeyPair.publicKey,
                senderEphemeralKey: state._meta?.isInitiator
                    ? state._meta?.ephemeralPublicKey
                    : state._meta?.aliceEphemeralKey,
            };
        }
    });
};

/**
 * Decrypt a single received message.
 */
export const decryptMessage = async (myUserId, theirUserId, msgData) => {
    return withLock(theirUserId, async () => {
        const { ciphertext, nonce, ratchetHeader, senderIdentityKey, senderEphemeralKey } = msgData;

        let session = sessionCache.get(theirUserId) || null;

        if (!session) {
            const stored = await getSession(theirUserId);
            if (stored) {
                session = deserializeSession(stored);
                session._meta = {
                    theirIdentityKey: stored.theirIdentityKey,
                    ephemeralPublicKey: stored.ephemeralPublicKey,
                    aliceEphemeralKey: stored.aliceEphemeralKey,
                    isInitiator: stored.isInitiator,
                };
                sessionCache.set(theirUserId, session);
            }
        }

        if (!session) {
            if (!senderIdentityKey || !senderEphemeralKey) {
                return "[Decryption failed: Session state missing]";
            }
            session = await handleFirstMessage(myUserId, theirUserId, senderIdentityKey, senderEphemeralKey);
        }

        try {
            const { plaintext, state } = ratchetDecrypt(session, ratchetHeader, ciphertext, nonce);
            sessionCache.set(theirUserId, state);
            await persistSession(theirUserId, state);
            // Cache the successful decryption
            const targetId = msgData._id || msgData.messageId;
            if (targetId) {
                cacheDecryptedMessage(targetId, plaintext).catch(() => { });
            }
            return plaintext;
        } catch (err) {
            console.warn("[E2EE] Decryption failed, checking for session reset...", err);

            // Strategy 1: Try respondX3DH with sender's header keys
            if (senderIdentityKey && senderEphemeralKey) {
                try {
                    const newSession = await prepareFirstSession(myUserId, theirUserId, senderIdentityKey, senderEphemeralKey);
                    const { plaintext, state } = ratchetDecrypt(newSession, ratchetHeader, ciphertext, nonce);
                    sessionCache.set(theirUserId, state);
                    await persistSession(theirUserId, state);
                    const targetId = msgData._id || msgData.messageId;
                    if (targetId) {
                        cacheDecryptedMessage(targetId, plaintext).catch(() => { });
                    }
                    return plaintext;
                } catch (resetErr) {
                    console.error("[E2EE] Session recovery via respondX3DH failed:", resetErr);
                }
            }

            // Strategy 2: Handshake Reset (Initiator mode)
            // If Strategy 1 failed, we establish a brand new session so FUTURE messages work.
            try {
                console.warn(`[E2EE] Attempting handshake reset recovery for ${theirUserId}`);
                const freshSession = await getOrCreateSession(myUserId, theirUserId);

                if (freshSession) {
                    // This initiator session is primarily for future outgoing messages.
                    // We try to decrypt the current one too, though it often requires Strategy 1.
                    try {
                        const { plaintext: retryPt, state: newState } = ratchetDecrypt(freshSession, ratchetHeader, ciphertext, nonce);
                        sessionCache.set(theirUserId, newState);
                        await persistSession(theirUserId, newState);
                        return retryPt;
                    } catch (retryErr) {
                        console.warn("[E2EE] Handshake reset complete for future messages, but current message remains unrecoverable.");
                    }
                }
            } catch (reEstablishErr) {
                console.error("[E2EE] Re-establish session failed:", reEstablishErr);
            }

            // Strategy 3: Try Archive
            const archivedPlaintext = await tryDecryptWithArchive(myUserId, theirUserId, ciphertext, nonce, ratchetHeader, senderIdentityKey, senderEphemeralKey);
            if (archivedPlaintext) {
                const targetId = msgData._id || msgData.messageId;
                if (targetId) {
                    cacheDecryptedMessage(targetId, archivedPlaintext).catch(() => { });
                }
                return archivedPlaintext;
            }

            // Strategy 4: Final fallback — check cache
            const targetId = msgData._id || msgData.messageId;
            if (targetId) {
                const cached = await getCachedDecryptedMessage(targetId);
                if (cached) return cached;
            }
            // Also try fingerprint cache key (covers send races / missing ids)
            const fpKey = getMsgCacheKey(msgData);
            if (fpKey) {
                const cached = await getCachedDecryptedMessage(fpKey);
                if (cached) return cached;
            }
            throw err;
        }
    });
};

// ── Persistence helper ──────────────────────────────────

const persistSession = async (partnerId, session) => {
    const serialized = serializeSession(session);
    await storeSession(partnerId, serialized, {
        theirIdentityKey: session._meta?.theirIdentityKey || null,
        ephemeralPublicKey: session._meta?.ephemeralPublicKey || null,
        aliceEphemeralKey: session._meta?.aliceEphemeralKey || null,
        isInitiator: !!session._meta?.isInitiator,
    });
};

// ── Session cleanup ─────────────────────────────────────

export const clearSessionCache = () => {
    sessionCache.clear();
};

export const resetSession = async (theirUserId) => {
    // Archive current session so any in-flight messages from the old ratchet
    // can still be decrypted via tryDecryptWithArchive().
    try {
        await archiveSession(theirUserId);
    } catch { }
    sessionCache.delete(theirUserId);
    sessionLocks.delete(theirUserId);
    await deleteSession(theirUserId);
};

export const hasSession = async (theirUserId) => {
    if (sessionCache.has(theirUserId)) return true;
    const stored = await getSession(theirUserId);
    return !!stored;
};

export const isE2EESupported = async (theirUserId) => {
    // If we already have a session, E2EE is supported
    if (sessionCache.has(theirUserId)) return true;
    try {
        if (await hasSession(theirUserId)) return true;
        const res = await apiGetKeyBundle(theirUserId).catch(() => null);
        return !!(res && res.data);
    } catch (err) {
        return false;
    }
};

export const isCryptoReady = () => cryptoReady;
