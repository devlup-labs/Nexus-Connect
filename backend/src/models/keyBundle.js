import mongoose from "mongoose";

const keyBundleSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        identityKeyPublic: {
            type: String,
            required: true,
        },
        signedPreKey: {
            keyId: { type: Number, required: true },
            publicKey: { type: String, required: true },
            signature: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
        },
        oneTimePreKeys: [
            {
                keyId: { type: Number, required: true },
                publicKey: { type: String, required: true },
                used: { type: Boolean, default: false },
            },
        ],
    },
    { timestamps: true }
);

const KeyBundle = mongoose.model("KeyBundle", keyBundleSchema);

export default KeyBundle;
