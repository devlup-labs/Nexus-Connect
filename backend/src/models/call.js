import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
    {
        callId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        callerId: {
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
        callType: {
            type: String,
            enum: ["voice", "video"],
            required: true,
        },
        status: {
            type: String,
            enum: ["ringing", "answered", "rejected", "missed", "canceled", "ended", "failed"],
            default: "ringing",
            index: true,
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        answeredAt: {
            type: Date,
            default: null,
        },
        endedAt: {
            type: Date,
            default: null,
        },
        durationSec: {
            type: Number,
            default: 0,
        },
        endedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        endReason: {
            type: String,
            enum: ["hangup", "reject", "missed", "cancel", "network", "error"],
            default: null,
        },
    },
    { timestamps: true }
);

callSchema.index({ callerId: 1, startedAt: -1 });
callSchema.index({ receiverId: 1, startedAt: -1 });

const Call = mongoose.model("Call", callSchema);
export default Call;
