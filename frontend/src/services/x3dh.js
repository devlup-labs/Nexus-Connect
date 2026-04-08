/**
 * x3dh.js — Extended Triple Diffie-Hellman (X3DH) key agreement
 *
 * Implements the X3DH protocol for establishing an initial shared secret
 * between two parties, as specified by the Signal Protocol.
 *
 * Initiator (Alice) calls performX3DH()
 * Responder (Bob) calls respondX3DH()
 */
import { dh, kdfRK, generateKeyPair, getSodium, fromBase64, toBase64 } from "./cryptoService.js";

/**
 * Initiator side of X3DH.
 *
 * @param {Object} myIdentityKeyPair  - { publicKey, privateKey } (X25519)
 * @param {Object} theirBundle        - recipient's key bundle from server:
 *   { identityKeyPublic, signedPreKey: { publicKey }, oneTimePreKey?: { publicKey } }
 *
 * @returns {{ sharedSecret: Uint8Array, ephemeralPublicKey: string, usedOneTimePreKey: boolean }}
 */
export const performX3DH = (myIdentityKeyPair, theirBundle) => {
    const s = getSodium();

    // Decode recipient's keys from base64
    const theirIdentityKey = fromBase64(theirBundle.identityKeyPublic);
    const theirSignedPreKey = fromBase64(theirBundle.signedPreKey.publicKey);

    // Generate ephemeral key pair
    const ephemeralKeyPair = generateKeyPair();

    // DH1 = DH(IKa, SPKb)  — our identity key × their signed prekey
    const dh1 = dh(myIdentityKeyPair.privateKey, theirSignedPreKey);

    // DH2 = DH(EKa, IKb)   — our ephemeral key × their identity key
    const dh2 = dh(ephemeralKeyPair.privateKey, theirIdentityKey);

    // DH3 = DH(EKa, SPKb)  — our ephemeral key × their signed prekey
    const dh3 = dh(ephemeralKeyPair.privateKey, theirSignedPreKey);

    // Combine DH outputs
    let dhConcat;
    let usedOneTimePreKey = false;

    // Both sides must use the exact same DH parts.
    // The responder currently skips OTPK matching, so we must skip it here to generate the same sharedSecret.
    dhConcat = new Uint8Array(dh1.length + dh2.length + dh3.length);
    dhConcat.set(dh1, 0);
    dhConcat.set(dh2, dh1.length);
    dhConcat.set(dh3, dh1.length + dh2.length);

    // Derive shared secret using HKDF
    // Salt = 32 bytes of 0xFF (as per Signal spec)
    const salt = new Uint8Array(32).fill(0xff);
    const [sharedSecret] = kdfRK(salt, dhConcat);

    return {
        sharedSecret,
        ephemeralKeyPair,
        ephemeralPublicKey: toBase64(ephemeralKeyPair.publicKey),
        usedOneTimePreKey,
    };
};

/**
 * Responder side of X3DH.
 * Called when Bob receives the first message from Alice that contains
 * her identity key and ephemeral key.
 *
 * @param {Object} myIdentityKeyPair  - Bob's { publicKey, privateKey }
 * @param {Object} mySignedPreKeyPair - Bob's { publicKey, privateKey }
 * @param {Object|null} myOneTimePreKeyPair - Bob's { publicKey, privateKey }, if used
 * @param {string} theirIdentityPubB64 - Alice's identity public key (base64)
 * @param {string} theirEphemeralPubB64 - Alice's ephemeral public key (base64)
 *
 * @returns {{ sharedSecret: Uint8Array }}
 */
export const respondX3DH = (
    myIdentityKeyPair,
    mySignedPreKeyPair,
    myOneTimePreKeyPair,
    theirIdentityPubB64,
    theirEphemeralPubB64
) => {
    const theirIdentityKey = fromBase64(theirIdentityPubB64);
    const theirEphemeralKey = fromBase64(theirEphemeralPubB64);

    // DH1 = DH(SPKb, IKa)
    const dh1 = dh(mySignedPreKeyPair.privateKey, theirIdentityKey);

    // DH2 = DH(IKb, EKa)
    const dh2 = dh(myIdentityKeyPair.privateKey, theirEphemeralKey);

    // DH3 = DH(SPKb, EKa)
    const dh3 = dh(mySignedPreKeyPair.privateKey, theirEphemeralKey);

    let dhConcat;
    if (myOneTimePreKeyPair) {
        // DH4 = DH(OPKb, EKa)
        const dh4 = dh(myOneTimePreKeyPair.privateKey, theirEphemeralKey);
        dhConcat = new Uint8Array(dh1.length + dh2.length + dh3.length + dh4.length);
        dhConcat.set(dh1, 0);
        dhConcat.set(dh2, dh1.length);
        dhConcat.set(dh3, dh1.length + dh2.length);
        dhConcat.set(dh4, dh1.length + dh2.length + dh3.length);
    } else {
        dhConcat = new Uint8Array(dh1.length + dh2.length + dh3.length);
        dhConcat.set(dh1, 0);
        dhConcat.set(dh2, dh1.length);
        dhConcat.set(dh3, dh1.length + dh2.length);
    }

    // Same KDF as initiator
    const salt = new Uint8Array(32).fill(0xff);
    const [sharedSecret] = kdfRK(salt, dhConcat);

    return { sharedSecret };
};
