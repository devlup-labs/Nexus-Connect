import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Legacy plaintext fields (used when encryptionVersion === "none")
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
    },
    // E2EE fields (used when encryptionVersion === "e2ee-v1")
    ciphertext: {
      type: String,
    },
    nonce: {
      type: String,
    },
    encryptionVersion: {
      type: String,
      enum: ["none", "e2ee-v1"],
      default: "none",
      index: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "audio", "document", "system"],
      default: "text",
    },
    ratchetHeader: {
      publicKey: { type: String },
      previousChainLength: { type: Number },
      messageNumber: { type: Number },
    },
    // Sender bootstrap keys for responder-side initial X3DH on history fetch
    senderIdentityKey: {
      type: String,
    },
    senderEphemeralKey: {
      type: String,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound indexes for faster queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, status: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
