
/**
 * Test for session reset and re-establishment.
 */

// Simulation of storage
const store = new Map();
const sessionCache = new Map();

async function resetSession(id) {
    console.log(`[Test] Resetting session for ${id}...`);
    sessionCache.delete(id);
    store.delete(id);
}

async function getOrCreateSession(id) {
    if (sessionCache.has(id)) return sessionCache.get(id);
    if (store.has(id)) {
        const s = store.get(id);
        sessionCache.set(id, s);
        return s;
    }

    console.log(`[Test] Establishing NEW session for ${id}...`);
    const newSession = { Nr: 0, RK: 'root-new', CKs: 'chain-new', _meta: { ephemeralPublicKey: 'new-ephemeral' } };
    store.set(id, newSession);
    sessionCache.set(id, newSession);
    return newSession;
}

async function encrypt(id, text) {
    const session = await getOrCreateSession(id);
    if (!session) return null;

    // Simulate ratchet encrypt
    const header = { messageNumber: session.Nr };
    session.Nr++;
    return {
        ciphertext: "Encrypted: " + text,
        ratchetHeader: header,
        encryptionVersion: 'e2ee-v1',
        senderEphemeralKey: session._meta.ephemeralPublicKey
    };
}

async function runTest() {
    console.log("Scenario: Chatting, then Reset, then Chatting again");

    console.log("\n1. Initial message");
    const m1 = await encrypt('bob', 'Hello');
    console.log(`Sent: ${m1.ciphertext}, Version: ${m1.encryptionVersion}`);

    console.log("\n2. Resetting session");
    await resetSession('bob');

    console.log("\n3. Post-reset message");
    const m2 = await encrypt('bob', 'Hello again');
    console.log(`Sent: ${m2.ciphertext}, Version: ${m2.encryptionVersion}`);

    if (m2.encryptionVersion === 'e2ee-v1' && store.has('bob')) {
        console.log("\nSUCCESS: Encryption recovered after reset.");
    } else {
        console.log("\nFAILURE: Encryption failed after reset.");
    }
}

runTest();
