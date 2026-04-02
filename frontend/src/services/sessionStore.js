/**
 * sessionStore.js — IndexedDB persistence for E2EE key material and session state
 *
 * Three object stores:
 * - identityKeys:  per-user identity, signing, signed prekey, and one-time prekey pairs
 * - sessions:      Double Ratchet session state per conversation partner
 * - metadata:      misc metadata (e.g., registration status)
 */

const DB_NAME = "nexus-e2ee-keys";
const DB_VERSION = 2;

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
    await putItem("identityKeys", { userId, ...keyData });
};

export const getIdentityKeys = async (userId) => {
    return getItem("identityKeys", userId);
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
    await putItem("sessions", { partnerId, ...sessionData, ...extraMeta, updatedAt: Date.now() });
};

export const getSession = async (partnerId) => {
    return getItem("sessions", partnerId);
};

export const deleteSession = async (partnerId) => {
    return deleteItem("sessions", partnerId);
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
};

/** Clear sessions only (keep identity keys) */
export const clearAllSessions = async () => {
    await clearStore("sessions");
};

// ── Decrypted Message Cache ────────────────────────────

/**
 * Cache decrypted plaintext for a message so it survives session resets.
 * @param {string} messageId
 * @param {string} plaintext
 */
export const cacheDecryptedMessage = async (messageId, plaintext) => {
    await putItem("decryptedCache", { messageId, plaintext, cachedAt: Date.now() });
};

/**
 * Batch-cache multiple decrypted messages.
 * @param {Array<{messageId: string, plaintext: string}>} entries
 */
export const cacheDecryptedMessages = async (entries) => {
    const db = await openDB();
    const tx = db.transaction("decryptedCache", "readwrite");
    const store = tx.objectStore("decryptedCache");
    const now = Date.now();
    for (const { messageId, plaintext } of entries) {
        store.put({ messageId, plaintext, cachedAt: now });
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
    const item = await getItem("decryptedCache", messageId);
    return item ? item.plaintext : null;
};

/**
 * Batch-retrieve cached plaintext for multiple messages.
 * @param {string[]} messageIds
 * @returns {Map<string, string>}
 */
export const getCachedDecryptedMessages = async (messageIds) => {
    const db = await openDB();
    const tx = db.transaction("decryptedCache", "readonly");
    const store = tx.objectStore("decryptedCache");
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
