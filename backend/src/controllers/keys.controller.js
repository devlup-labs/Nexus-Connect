import KeyBundle from "../models/keyBundle.js";

// POST /api/keys/register
export const registerKeys = async (req, res) => {
    try {
        const userId = req.user._id;
        const { identityKeyPublic, signedPreKey, oneTimePreKeys } = req.body;

        if (!identityKeyPublic || !signedPreKey || !signedPreKey.publicKey) {
            return res.status(400).json({ message: "Identity key and signed prekey are required." });
        }

        const existing = await KeyBundle.findOne({ userId });
        if (existing) {
            // Update existing bundle
            existing.identityKeyPublic = identityKeyPublic;
            existing.signedPreKey = signedPreKey;
            if (oneTimePreKeys && oneTimePreKeys.length > 0) {
                existing.oneTimePreKeys = oneTimePreKeys;
            }
            await existing.save();
            return res.status(200).json({ message: "Key bundle updated." });
        }

        const keyBundle = new KeyBundle({
            userId,
            identityKeyPublic,
            signedPreKey,
            oneTimePreKeys: oneTimePreKeys || [],
        });

        await keyBundle.save();
        res.status(201).json({ message: "Key bundle registered." });
    } catch (error) {
        console.error("Error in registerKeys:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/keys/bundle/:userId
export const getKeyBundle = async (req, res) => {
    try {
        const { userId } = req.params;

        const bundle = await KeyBundle.findOne({ userId });
        if (!bundle) {
            return res.status(404).json({ message: "Key bundle not found for this user." });
        }

        // Pick one unused one-time prekey if available
        let oneTimePreKey = null;
        const unusedIndex = bundle.oneTimePreKeys.findIndex((k) => !k.used);
        if (unusedIndex !== -1) {
            oneTimePreKey = {
                keyId: bundle.oneTimePreKeys[unusedIndex].keyId,
                publicKey: bundle.oneTimePreKeys[unusedIndex].publicKey,
            };
            // Mark it as used
            bundle.oneTimePreKeys[unusedIndex].used = true;
            await bundle.save();
        }

        res.status(200).json({
            userId: bundle.userId,
            identityKeyPublic: bundle.identityKeyPublic,
            signedPreKey: {
                keyId: bundle.signedPreKey.keyId,
                publicKey: bundle.signedPreKey.publicKey,
                signature: bundle.signedPreKey.signature,
            },
            oneTimePreKey,
        });
    } catch (error) {
        console.error("Error in getKeyBundle:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// POST /api/keys/rotate-signed-prekey
export const rotateSignedPreKey = async (req, res) => {
    try {
        const userId = req.user._id;
        const { signedPreKey } = req.body;

        if (!signedPreKey || !signedPreKey.publicKey || !signedPreKey.signature) {
            return res.status(400).json({ message: "Signed prekey data required." });
        }

        const bundle = await KeyBundle.findOne({ userId });
        if (!bundle) {
            return res.status(404).json({ message: "Key bundle not found." });
        }

        bundle.signedPreKey = signedPreKey;
        await bundle.save();

        res.status(200).json({ message: "Signed prekey rotated." });
    } catch (error) {
        console.error("Error in rotateSignedPreKey:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// POST /api/keys/upload-one-time-prekeys
export const uploadOneTimePreKeys = async (req, res) => {
    try {
        const userId = req.user._id;
        const { oneTimePreKeys } = req.body;

        if (!oneTimePreKeys || !Array.isArray(oneTimePreKeys) || oneTimePreKeys.length === 0) {
            return res.status(400).json({ message: "One-time prekeys array required." });
        }

        const bundle = await KeyBundle.findOne({ userId });
        if (!bundle) {
            return res.status(404).json({ message: "Key bundle not found." });
        }

        // Remove used keys and add new ones
        bundle.oneTimePreKeys = bundle.oneTimePreKeys.filter((k) => !k.used);
        bundle.oneTimePreKeys.push(...oneTimePreKeys);
        await bundle.save();

        res.status(200).json({ message: "One-time prekeys uploaded." });
    } catch (error) {
        console.error("Error in uploadOneTimePreKeys:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/keys/has-keys/:userId
export const hasKeys = async (req, res) => {
    try {
        const { userId } = req.params;
        const bundle = await KeyBundle.findOne({ userId });
        res.status(200).json({ hasKeys: !!bundle });
    } catch (error) {
        console.error("Error in hasKeys:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
