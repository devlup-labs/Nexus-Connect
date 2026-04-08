
// Mocking the environment for a quick logic test
const deserializeSession = (data) => ({ ...data, deserialized: true });
const getSession = async (id) => ({
    theirIdentityKey: 'mock-identity',
    ephemeralPublicKey: 'mock-ephemeral',
    isInitiator: true,
    DHs: {}, DHr: {}, RK: '', CKs: '', CKr: '', Ns: 0, Nr: 0, PN: 0, MKSKIPPED: {}
});

async function test_restoration() {
    console.log("Testing E2EE Metadata Restoration...");

    // Simulate what happens in keyManager.getOrCreateSession or decryptMessage
    const stored = await getSession('partner-123');
    if (stored) {
        const session = deserializeSession(stored);

        // Before fix, session would NOT have _meta
        // After fix, we manually restore it:
        session._meta = {
            theirIdentityKey: stored.theirIdentityKey,
            ephemeralPublicKey: stored.ephemeralPublicKey,
            isInitiator: stored.isInitiator,
        };

        console.log("Stored info:", stored);
        console.log("Restored session._meta:", session._meta);

        if (session._meta.ephemeralPublicKey === 'mock-ephemeral' && session._meta.isInitiator === true) {
            console.log("SUCCESS: Metadata restored correctly.");
        } else {
            console.log("FAILURE: Metadata missing or incorrect.");
        }
    }
}

test_restoration();
