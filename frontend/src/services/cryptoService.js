/**
 * cryptoService.js — Low-level libsodium wrapper for E2EE primitives
 *
 * Provides: key generation, DH, KDF, AEAD encrypt/decrypt, signing, safety numbers
 */
import _sodium from "libsodium-wrappers-sumo";

let sodium = null;

// ── Initialization ──────────────────────────────────────
export const initCrypto = async () => {
    await _sodium.ready;
    sodium = _sodium;
    return sodium;
};

export const getSodium = () => {
    if (!sodium) throw new Error("Crypto not initialized. Call initCrypto() first.");
    return sodium;
};

// ── Key Generation ──────────────────────────────────────

/** Generate an X25519 key pair for Diffie-Hellman */
export const generateKeyPair = () => {
    const s = getSodium();
    const kp = s.crypto_box_keypair();
    return {
        publicKey: kp.publicKey,   // Uint8Array (32 bytes)
        privateKey: kp.privateKey, // Uint8Array (32 bytes)
    };
};

/** Generate an Ed25519 signing key pair (for signing prekeys) */
export const generateSigningKeyPair = () => {
    const s = getSodium();
    const kp = s.crypto_sign_keypair();
    return {
        publicKey: kp.publicKey,   // Uint8Array (32 bytes)
        privateKey: kp.privateKey, // Uint8Array (64 bytes)
    };
};

// ── Diffie-Hellman ──────────────────────────────────────

/** X25519 scalar multiplication — compute shared secret */
export const dh = (myPrivateKey, theirPublicKey) => {
    const s = getSodium();
    return s.crypto_scalarmult(myPrivateKey, theirPublicKey);
};

// ── Signing ─────────────────────────────────────────────

/** Sign a message with Ed25519 */
export const sign = (message, signingPrivateKey) => {
    const s = getSodium();
    return s.crypto_sign_detached(message, signingPrivateKey);
};

/** Verify an Ed25519 signature */
export const verify = (signature, message, signingPublicKey) => {
    const s = getSodium();
    try {
        return s.crypto_sign_verify_detached(signature, message, signingPublicKey);
    } catch {
        return false;
    }
};

// ── KDF (HKDF using HMAC-SHA-256) ───────────────────────

/** HMAC-SHA-256 */
const hmacSha256 = (key, data) => {
    const s = getSodium();
    return s.crypto_auth_hmacsha256(data, key);
};

/**
 * HKDF-Extract + Expand (simplified for our use case)
 * Returns [output1 (32 bytes), output2 (32 bytes)]
 *
 * Used for:
 * - Root chain KDF:  KDF_RK(rk, dh_out) => [new_rk, chain_key]
 * - Chain key KDF:   KDF_CK(ck)          => [new_ck, message_key]
 */
export const kdfRK = (rootKey, dhOutput) => {
    const s = getSodium();
    // HKDF-Extract: PRK = HMAC(salt=rootKey, ikm=dhOutput)
    const prk = hmacSha256(rootKey, dhOutput);
    // HKDF-Expand: output1 = HMAC(PRK, 0x01), output2 = HMAC(PRK, output1 || 0x02)
    const info1 = new Uint8Array([0x01]);
    const output1 = hmacSha256(prk, info1);
    const combined = new Uint8Array(output1.length + 1);
    combined.set(output1);
    combined[output1.length] = 0x02;
    const output2 = hmacSha256(prk, combined);
    return [output1, output2]; // [newRootKey, newChainKey]
};

/** Chain key KDF: derives next chain key and message key */
export const kdfCK = (chainKey) => {
    const msgKeyInput = new Uint8Array([0x01]);
    const ckInput = new Uint8Array([0x02]);
    const messageKey = hmacSha256(chainKey, msgKeyInput);
    const newChainKey = hmacSha256(chainKey, ckInput);
    return [newChainKey, messageKey]; // [newCK, msgKey]
};

// ── AEAD Encryption (XChaCha20-Poly1305) ─────────────────

/** Encrypt plaintext with a message key */
export const encrypt = (plaintext, key) => {
    const s = getSodium();
    const nonce = s.randombytes_buf(s.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    const plaintextBytes = typeof plaintext === "string"
        ? s.from_string(plaintext)
        : plaintext;
    // Use first 32 bytes of key for encryption
    const encKey = key.slice(0, s.crypto_aead_xchacha20poly1305_ietf_KEYBYTES);
    const ciphertext = s.crypto_aead_xchacha20poly1305_ietf_encrypt(
        plaintextBytes,
        null, // no additional data
        null, // nsec (unused)
        nonce,
        encKey
    );
    return { ciphertext, nonce };
};

/** Decrypt ciphertext with a message key */
export const decrypt = (ciphertext, nonce, key) => {
    const s = getSodium();
    const encKey = key.slice(0, s.crypto_aead_xchacha20poly1305_ietf_KEYBYTES);
    const plaintext = s.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null, // nsec (unused)
        ciphertext,
        null, // no additional data
        nonce,
        encKey
    );
    return s.to_string(plaintext);
};

// ── Encoding helpers ────────────────────────────────────

export const toBase64 = (bytes) => {
    const s = getSodium();
    return s.to_base64(bytes, s.base64_variants.ORIGINAL);
};

export const fromBase64 = (str) => {
    const s = getSodium();
    return s.from_base64(str, s.base64_variants.ORIGINAL);
};

// ── Safety Number ───────────────────────────────────────

/**
 * Compute a displayable safety number from two identity public keys.
 * Returns a 60-digit string (in groups of 5).
 */
export const computeSafetyNumber = (key1, key2) => {
    const s = getSodium();
    // Sort keys for deterministic ordering
    const buf1 = typeof key1 === "string" ? fromBase64(key1) : key1;
    const buf2 = typeof key2 === "string" ? fromBase64(key2) : key2;

    // Concatenate in deterministic order
    const compare = compareBuffers(buf1, buf2);
    const combined = new Uint8Array(buf1.length + buf2.length);
    if (compare <= 0) {
        combined.set(buf1, 0);
        combined.set(buf2, buf1.length);
    } else {
        combined.set(buf2, 0);
        combined.set(buf1, buf2.length);
    }

    const hash = s.crypto_generichash(30, combined); // 30 bytes = 60 hex chars
    // Convert to 60 digits
    let digits = "";
    for (let i = 0; i < hash.length; i++) {
        digits += hash[i].toString().padStart(3, "0").slice(-2);
    }
    // Format as groups of 5
    return digits.slice(0, 60).match(/.{1,5}/g).join(" ");
};

function compareBuffers(a, b) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] < b[i]) return -1;
        if (a[i] > b[i]) return 1;
    }
    return a.length - b.length;
}
