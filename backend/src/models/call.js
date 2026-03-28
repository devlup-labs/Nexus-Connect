import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
    {
        callId: {
            type: String,
            required: true,
            unique: true,
        },
        callerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        callType: {
            type: String,
            enum: ["voice", "video"],
            required: true,
        },
        status: {
            type: String,
            enum: ["ringing", "answered", "rejected", "missed", "ended", "failed"],
            default: "ringing",
        },
        startedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        answeredAt: {
            type: Date,
        },
        endedAt: {
            type: Date,
        },
        durationSec: {
            type: Number,
            default: 0,
        },
        endedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        endReason: {
            type: String,
        },
    },
    { timestamps: true }
);

const Call = mongoose.model("Call", callSchema);

export default Call;
