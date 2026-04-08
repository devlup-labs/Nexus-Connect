/**
 * sessionStore.js — IndexedDB persistence for E2EE key material and session state
 *
 * Three object stores:
 * - identityKeys:  per-user identity, signing, signed prekey, and one-time prekey pairs
 * - sessions:      Double Ratchet session state per conversation partner
 * - metadata:      misc metadata (e.g., registration status)
 */

const DB_NAME = "nexus-e2ee-keys";
// v4: add decryptedCacheV2 keyed by cacheKey (messageId or fingerprint)
const DB_VERSION = 4;

let dbInstance = null;

// ── Open / Initialize ──────────────────────────────────

const openDB = () => {
    return new Promise((resolve, reject) => {
        if (dbInstance) return resolve(dbInstance);

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("identityKeys")) {
                db.createObjectStore("identityKeys", { keyPath: "userId" });
            }
            if (!db.objectStoreNames.contains("sessions")) {
                db.createObjectStore("sessions", { keyPath: "partnerId" });
            }
            if (!db.objectStoreNames.contains("metadata")) {
                db.createObjectStore("metadata", { keyPath: "key" });
            }
            if (!db.objectStoreNames.contains("decryptedCache")) {
                db.createObjectStore("decryptedCache", { keyPath: "messageId" });
            }
            // v4+: new cache store keyed by "cacheKey" so we can cache by messageId *or*
            // a deterministic fingerprint (ciphertext+nonce+header) to survive send races.
            if (!db.objectStoreNames.contains("decryptedCacheV2")) {
                db.createObjectStore("decryptedCacheV2", { keyPath: "cacheKey" });
            }
            if (!db.objectStoreNames.contains("archivedIdentityKeys")) {
                db.createObjectStore("archivedIdentityKeys", { keyPath: "archiveId" });
            }
            if (!db.objectStoreNames.contains("archivedSessions")) {
                db.createObjectStore("archivedSessions", { keyPath: "archiveId" });
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
};

// ── Generic helpers ────────────────────────────────────

const getStore = async (storeName, mode = "readonly") => {
    const db = await openDB();
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
};

const putItem = async (storeName, item) => {
    const store = await getStore(storeName, "readwrite");
    return new Promise((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
};

const getItem = async (storeName, key) => {
    const store = await getStore(storeName, "readonly");
    return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = (e) => reject(e.target.error);
    });
};

const deleteItem = async (storeName, key) => {
    const store = await getStore(storeName, "readwrite");
    return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
};

const clearStore = async (storeName) => {
    const store = await getStore(storeName, "readwrite");
    return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
};

// ── Identity Keys ──────────────────────────────────────

/**
 * Store identity key material for a user.
 * @param {string} userId
 * @param {Object} keyData - {
 *   identityKeyPair: { publicKey (b64), privateKey (b64) },
 *   signingKeyPair: { publicKey (b64), privateKey (b64) },
 *   signedPreKeyPair: { keyId, publicKey (b64), privateKey (b64) },
 *   oneTimePreKeys: [{ keyId, publicKey (b64), privateKey (b64) }]
 * }
 */
export const storeIdentityKeys = async (userId, keyData) => {
    // Archive existing keys before overwriting
    const existing = await getIdentityKeys(userId);
    if (existing) {
        await putItem("archivedIdentityKeys", {
            archiveId: `${userId}_${Date.now()}`,
            ...existing
        });
    }
    await putItem("identityKeys", { userId, ...keyData });
};

export const getIdentityKeys = async (userId) => {
    return getItem("identityKeys", userId);
};

export const getArchivedIdentityKeys = async (userId) => {
    const db = await openDB();
    const tx = db.transaction("archivedIdentityKeys", "readonly");
    const store = tx.objectStore("archivedIdentityKeys");
    return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => {
            const result = req.result || [];
            // filter by userId and sort descending
            resolve(result.filter(k => k.userId === userId).sort((a, b) => b.archiveId.localeCompare(a.archiveId)));
        };
        req.onerror = (e) => reject(e.target.error);
    });
};

export const deleteIdentityKeys = async (userId) => {
    return deleteItem("identityKeys", userId);
};

// ── Sessions ───────────────────────────────────────────

/**
 * Store a serialized Double Ratchet session for a conversation partner.
 * @param {string} partnerId
 * @param {Object} sessionData - serialized session from doubleRatchet.serializeSession()
 * @param {Object} extraMeta - optional metadata (theirIdentityKey, etc.)
 */
export const storeSession = async (partnerId, sessionData, extraMeta = {}) => {
    // Archive existing session before overwriting
    const existing = await getSession(partnerId);
    if (existing) {
        await putItem("archivedSessions", {
            archiveId: `${partnerId}_${Date.now()}`,
            ...existing
        });
    }
    await putItem("sessions", { partnerId, ...sessionData, ...extraMeta, updatedAt: Date.now() });
};

export const getSession = async (partnerId) => {
    return getItem("sessions", partnerId);
};

export const getArchivedSessions = async (partnerId) => {
    const db = await openDB();
    const tx = db.transaction("archivedSessions", "readonly");
    const store = tx.objectStore("archivedSessions");
    return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => {
            const result = req.result || [];
            resolve(result.filter(s => s.partnerId === partnerId).sort((a, b) => b.archiveId.localeCompare(a.archiveId)));
        };
        req.onerror = (e) => reject(e.target.error);
    });
};

export const deleteSession = async (partnerId) => {
    return deleteItem("sessions", partnerId);
};

/**
 * Archive the current session for a partner (if present).
 * Useful before resetting so late-arriving messages can still decrypt
 * via archivedSessions fallback.
 */
export const archiveSession = async (partnerId) => {
    const existing = await getSession(partnerId);
    if (!existing) return false;
    await putItem("archivedSessions", {
        archiveId: `${partnerId}_${Date.now()}`,
        ...existing,
    });
    return true;
};

// ── Metadata ───────────────────────────────────────────

export const setMetadata = async (key, value) => {
    await putItem("metadata", { key, value });
};

export const getMetadata = async (key) => {
    const item = await getItem("metadata", key);
    return item ? item.value : null;
};

// ── Cleanup ────────────────────────────────────────────

/** Clear all E2EE data (for logout) */
export const clearAllE2EEData = async () => {
    await clearStore("identityKeys");
    await clearStore("sessions");
    await clearStore("metadata");
    // Best-effort: might not exist for older DBs
    if ((await openDB()).objectStoreNames.contains("decryptedCacheV2")) {
        await clearStore("decryptedCacheV2");
    }
    if ((await openDB()).objectStoreNames.contains("decryptedCache")) {
        await clearStore("decryptedCache");
    }
    await clearStore("archivedIdentityKeys");
    await clearStore("archivedSessions");
};

/** Clear sessions only (keep identity keys) */
export const clearAllSessions = async () => {
    await clearStore("sessions");
};

// ── Decrypted Message Cache ────────────────────────────

/**
 * Cache decrypted plaintext for a message so it survives session resets.
 * Prefer caching to decryptedCacheV2 (keyed by cacheKey).
 * @param {string} messageId
 * @param {string} plaintext
 */
export const cacheDecryptedMessage = async (messageId, plaintext) => {
    const db = await openDB();
    if (db.objectStoreNames.contains("decryptedCacheV2")) {
        await putItem("decryptedCacheV2", { cacheKey: messageId, plaintext, cachedAt: Date.now() });
        return;
    }
    await putItem("decryptedCache", { messageId, plaintext, cachedAt: Date.now() });
};

/**
 * Cache decrypted plaintext using an arbitrary cacheKey (e.g. messageId or fingerprint).
 * @param {string} cacheKey
 * @param {string} plaintext
 */
export const cacheDecryptedMessageByKey = async (cacheKey, plaintext) => {
    const db = await openDB();
    if (db.objectStoreNames.contains("decryptedCacheV2")) {
        await putItem("decryptedCacheV2", { cacheKey, plaintext, cachedAt: Date.now() });
        return;
    }
    // Fallback: store in old cache using the cacheKey as messageId.
    await putItem("decryptedCache", { messageId: cacheKey, plaintext, cachedAt: Date.now() });
};

/**
 * Batch-cache multiple decrypted messages.
 * @param {Array<{messageId: string, plaintext: string}>} entries
 */
export const cacheDecryptedMessages = async (entries) => {
    const db = await openDB();
    const storeName = db.objectStoreNames.contains("decryptedCacheV2") ? "decryptedCacheV2" : "decryptedCache";
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const now = Date.now();
    for (const { messageId, plaintext } of entries) {
        if (storeName === "decryptedCacheV2") store.put({ cacheKey: messageId, plaintext, cachedAt: now });
        else store.put({ messageId, plaintext, cachedAt: now });
    }
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
};

/**
 * Retrieve cached plaintext for a message.
 * @param {string} messageId
 * @returns {string|null}
 */
export const getCachedDecryptedMessage = async (messageId) => {
    const db = await openDB();
    if (db.objectStoreNames.contains("decryptedCacheV2")) {
        const item = await getItem("decryptedCacheV2", messageId);
        return item ? item.plaintext : null;
    }
    const item = await getItem("decryptedCache", messageId);
    return item ? item.plaintext : null;
};

/**
 * Retrieve cached plaintext for an arbitrary cacheKey (messageId or fingerprint).
 * @param {string} cacheKey
 * @returns {string|null}
 */
export const getCachedDecryptedMessageByKey = async (cacheKey) => {
    return getCachedDecryptedMessage(cacheKey);
};

/**
 * Batch-retrieve cached plaintext for multiple messages.
 * @param {string[]} messageIds
 * @returns {Map<string, string>}
 */
export const getCachedDecryptedMessages = async (messageIds) => {
    const db = await openDB();
    const storeName = db.objectStoreNames.contains("decryptedCacheV2") ? "decryptedCacheV2" : "decryptedCache";
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const results = new Map();

    const promises = messageIds.map(id => new Promise((resolve) => {
        const req = store.get(id);
        req.onsuccess = () => {
            if (req.result) results.set(id, req.result.plaintext);
            resolve();
        };
        req.onerror = () => resolve(); // Skip on error
    }));

    await Promise.all(promises);
    return results;
};

// ── Export / Import Utilities ───────────────────────────────

export const exportAllE2EEKeys = async (userId) => {
    const db = await openDB();

    const getAll = (storeName) => new Promise((resolve, reject) => {
        if (!db.objectStoreNames.contains(storeName)) return resolve([]);
        const tx = db.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = (e) => reject(e.target.error);
    });

    const [identities, archivedIdentities, sessions, archivedSessions, decryptedCacheLegacy, decryptedCacheV2] = await Promise.all([
        getAll("identityKeys"),
        getAll("archivedIdentityKeys"),
        getAll("sessions"),
        getAll("archivedSessions"),
        getAll("decryptedCache"),
        getAll("decryptedCacheV2"),
    ]);

    return JSON.stringify({
        version: DB_VERSION,
        userId: userId,
        exportDate: new Date().toISOString(),
        data: {
            identityKeys: identities.filter(k => k.userId === userId),
            archivedIdentityKeys: archivedIdentities.filter(k => k.userId === userId),
            sessions: sessions, // optionally could filter by conversation if needed
            archivedSessions: archivedSessions,
            // Include decrypted cache so sent E2EE messages can show previews on other devices.
            decryptedCacheLegacy,
            decryptedCacheV2,
        }
    });
};

export const importAllE2EEKeys = async (userId, jsonString) => {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !parsed.data) throw new Error("Invalid E2EE backup format");

    // Safety check just in case, though they could import another account's keys if they bypass UI
    if (parsed.userId && parsed.userId !== userId) {
        throw new Error("Cannot import backup from a different user ID");
    }

    const {
        identityKeys = [],
        archivedIdentityKeys = [],
        sessions = [],
        archivedSessions = [],
        decryptedCacheLegacy = [],
        decryptedCacheV2 = [],
    } = parsed.data;

    // We do NOT clear current keys, we append/overwrite what's in the backup.
    for (const keyData of identityKeys) {
        // If an active key exists, wait, we might overwrite it. Use putItem carefully.
        const currentActive = await getIdentityKeys(userId);
        if (currentActive) {
            await putItem("archivedIdentityKeys", { archiveId: `${userId}_${Date.now()}`, ...currentActive });
        }
        await putItem("identityKeys", keyData);
    }

    for (const archKey of archivedIdentityKeys) {
        await putItem("archivedIdentityKeys", archKey);
    }

    for (const sessionData of sessions) {
        await putItem("sessions", sessionData);
    }

    for (const archSess of archivedSessions) {
        await putItem("archivedSessions", archSess);
    }

    // Import decrypted caches (best-effort, safe even if stores missing).
    const db = await openDB();
    if (db.objectStoreNames.contains("decryptedCacheV2")) {
        for (const entry of decryptedCacheV2) {
            if (entry?.cacheKey && typeof entry?.plaintext === "string") {
                await putItem("decryptedCacheV2", entry);
            }
        }
    }
    if (db.objectStoreNames.contains("decryptedCache")) {
        for (const entry of decryptedCacheLegacy) {
            if (entry?.messageId && typeof entry?.plaintext === "string") {
                await putItem("decryptedCache", entry);
            }
        }
    }

    return true;
};
