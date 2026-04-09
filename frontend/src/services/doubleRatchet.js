/**
 * doubleRatchet.js — Full Signal Double Ratchet implementation
 *
 * State machine for per-message forward secrecy with DH ratchet and
 * symmetric KDF chain stepping.
 *
 * References:
 * - https://signal.org/docs/specifications/doubleratchet/
 *
 * Session state:
 * {
 *   DHs:  { publicKey, privateKey },  // our current DH ratchet pair
 *   DHr:  Uint8Array | null,          // their current DH public key
 *   RK:   Uint8Array,                 // root key (32 bytes)
 *   CKs:  Uint8Array | null,          // sending chain key
 *   CKr:  Uint8Array | null,          // receiving chain key
 *   Ns:   number,                     // send message counter
 *   Nr:   number,                     // receive message counter
 *   PN:   number,                     // previous sending chain length
 *   MKSKIPPED: {}                     // skipped message keys: { "pubkey:N": key }
 * }
 */
import {
    generateKeyPair,
    dh,
    kdfRK,
    kdfCK,
    encrypt,
    decrypt,
    toBase64,
    fromBase64,
} from "./cryptoService.js";

const MAX_SKIP = 256; // Maximum number of skipped message keys to store

// ── Session Initialization ──────────────────────────────

/**
 * Initialize a Double Ratchet session as the INITIATOR (Alice).
 * Alice sends the first message. She already knows Bob's signed prekey
 * (as his initial DH ratchet public key).
 *
 * @param {Uint8Array} sharedSecret - SK from X3DH
 * @param {Uint8Array|string} theirDHPublic - Bob's signed prekey (his initial ratchet key)
 * @returns {Object} session state
 */
export const initSession = (sharedSecret, theirDHPublic) => {
    const theirPub = typeof theirDHPublic === "string" ? fromBase64(theirDHPublic) : theirDHPublic;

    // Alice generates her first ratchet DH key pair
    const dhKeyPair = generateKeyPair();

    // Perform first DH ratchet step
    const dhOutput = dh(dhKeyPair.privateKey, theirPub);
    const [rootKey, sendingChainKey] = kdfRK(sharedSecret, dhOutput);

    return {
        DHs: dhKeyPair,
        DHr: theirPub,
        RK: rootKey,
        CKs: sendingChainKey,
        CKr: null,
        Ns: 0,
        Nr: 0,
        PN: 0,
        MKSKIPPED: {},
    };
};

/**
 * Initialize a Double Ratchet session as the RESPONDER (Bob).
 * Bob hasn't sent a message yet, so he doesn't have a sending chain.
 *
 * @param {Uint8Array} sharedSecret - SK from X3DH
 * @param {Object} myDHKeyPair - Bob's signed prekey pair { publicKey, privateKey }
 * @returns {Object} session state
 */
export const initSessionResponder = (sharedSecret, myDHKeyPair) => {
    return {
        DHs: myDHKeyPair,
        DHr: null,
        RK: sharedSecret,
        CKs: null,
        CKr: null,
        Ns: 0,
        Nr: 0,
        PN: 0,
        MKSKIPPED: {},
    };
};

// ── Ratchet Encrypt ─────────────────────────────────────

/**
 * Encrypt a message using the Double Ratchet.
 *
 * @param {Object} state - session state (mutated in place)
 * @param {string} plaintext - message text to encrypt
 * @returns {{ header: Object, ciphertext: string, nonce: string, state: Object }}
 */
export const ratchetEncrypt = (state, plaintext) => {
    // Derive message key from sending chain
    const [newCKs, messageKey] = kdfCK(state.CKs);
    state.CKs = newCKs;

    // Build ratchet header
    const header = {
        publicKey: toBase64(state.DHs.publicKey),
        previousChainLength: state.PN,
        messageNumber: state.Ns,
    };

    // Encrypt
    const { ciphertext, nonce } = encrypt(plaintext, messageKey);

    state.Ns += 1;

    return {
        header,
        ciphertext: toBase64(ciphertext),
        nonce: toBase64(nonce),
        state,
    };
};

// ── Ratchet Decrypt ─────────────────────────────────────

/**
 * Decrypt a message using the Double Ratchet.
 *
 * @param {Object} state - session state (mutated in place)
 * @param {Object} header - ratchet header: { publicKey, previousChainLength, messageNumber }
 * @param {string} ciphertextB64 - base64 ciphertext
 * @param {string} nonceB64 - base64 nonce
 * @returns {{ plaintext: string, state: Object }}
 */
export const ratchetDecrypt = (state, header, ciphertextB64, nonceB64) => {
    const ciphertext = fromBase64(ciphertextB64);
    const nonce = fromBase64(nonceB64);

    // 1. Try skipped message keys first
    const skippedKey = `${header.publicKey}:${header.messageNumber}`;
    if (state.MKSKIPPED[skippedKey]) {
        const mk = state.MKSKIPPED[skippedKey];
        delete state.MKSKIPPED[skippedKey];
        try {
            const plaintext = decrypt(ciphertext, nonce, mk);
            return { plaintext, state };
        } catch (err) {
            console.error("[DR] Decryption with skipped key failed:", skippedKey, err);
        }
    }

    const headerPub = fromBase64(header.publicKey);

    // 2. Check if we need a DH ratchet step (their public key changed)
    if (!state.DHr || !uint8ArrayEquals(headerPub, state.DHr)) {
        // Skip any remaining messages in the current receiving chain
        if (state.CKr !== null) {
            skipMessageKeys(state, header.previousChainLength);
        }

        // Perform DH ratchet step
        dhRatchetStep(state, headerPub);
    }

    // 3. Skip message keys if messageNumber > Nr (out-of-order)
    skipMessageKeys(state, header.messageNumber);

    // 4. Derive message key from receiving chain
    const [newCKr, messageKey] = kdfCK(state.CKr);
    state.CKr = newCKr;
    state.Nr += 1;

    // 5. Decrypt
    const plaintext = decrypt(ciphertext, nonce, messageKey);
    return { plaintext, state };
};

// ── DH Ratchet Step ─────────────────────────────────────

/**
 * Perform a DH ratchet step when we receive a new public key from the other party.
 */
const dhRatchetStep = (state, theirNewDHPub) => {
    state.PN = state.Ns;
    state.Ns = 0;
    state.Nr = 0;
    state.DHr = theirNewDHPub;

    // Derive receiving chain key
    const dhOutput1 = dh(state.DHs.privateKey, state.DHr);
    const [rk1, receivingChainKey] = kdfRK(state.RK, dhOutput1);
    state.RK = rk1;
    state.CKr = receivingChainKey;

    // Generate new DH key pair for sending
    state.DHs = generateKeyPair();

    // Derive sending chain key
    const dhOutput2 = dh(state.DHs.privateKey, state.DHr);
    const [rk2, sendingChainKey] = kdfRK(state.RK, dhOutput2);
    state.RK = rk2;
    state.CKs = sendingChainKey;
};

// ── Skip Message Keys ───────────────────────────────────

/**
 * Store skipped message keys for out-of-order message handling.
 */
const skipMessageKeys = (state, until) => {
    if (state.CKr === null) return;

    if (until - state.Nr > MAX_SKIP) {
        throw new Error("Too many skipped messages");
    }

    while (state.Nr < until) {
        const [newCKr, mk] = kdfCK(state.CKr);
        state.CKr = newCKr;
        const key = state.DHr ? `${toBase64(state.DHr)}:${state.Nr}` : `unknown:${state.Nr}`;
        state.MKSKIPPED[key] = mk;
        state.Nr += 1;
    }
};

// ── Session Serialization ───────────────────────────────

/**
 * Serialize session state for IndexedDB storage.
 * Converts Uint8Arrays to base64 strings.
 */
export const serializeSession = (state) => {
    return {
        DHs: {
            publicKey: toBase64(state.DHs.publicKey),
            privateKey: toBase64(state.DHs.privateKey),
        },
        DHr: state.DHr ? toBase64(state.DHr) : null,
        RK: toBase64(state.RK),
        CKs: state.CKs ? toBase64(state.CKs) : null,
        CKr: state.CKr ? toBase64(state.CKr) : null,
        Ns: state.Ns,
        Nr: state.Nr,
        PN: state.PN,
        MKSKIPPED: serializeSkipped(state.MKSKIPPED),
    };
};

/**
 * Deserialize session state from IndexedDB.
 */
export const deserializeSession = (data) => {
    return {
        DHs: {
            publicKey: fromBase64(data.DHs.publicKey),
            privateKey: fromBase64(data.DHs.privateKey),
        },
        DHr: data.DHr ? fromBase64(data.DHr) : null,
        RK: fromBase64(data.RK),
        CKs: data.CKs ? fromBase64(data.CKs) : null,
        CKr: data.CKr ? fromBase64(data.CKr) : null,
        Ns: data.Ns,
        Nr: data.Nr,
        PN: data.PN,
        MKSKIPPED: deserializeSkipped(data.MKSKIPPED),
    };
};

const serializeSkipped = (skipped) => {
    const result = {};
    for (const [key, value] of Object.entries(skipped)) {
        result[key] = toBase64(value);
    }
    return result;
};

const deserializeSkipped = (skipped) => {
    if (!skipped) return {};
    const result = {};
    for (const [key, value] of Object.entries(skipped)) {
        result[key] = fromBase64(value);
    }
    return result;
};

// ── Utilities ───────────────────────────────────────────

function uint8ArrayEquals(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}
