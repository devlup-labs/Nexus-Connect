import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
    {
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
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        type: {
            type: Number,
            required: true,
            enum: [0, 1], //0 = voice, 1 = video
        },
    },

);

const Call = mongoose.model("Call", callSchema);

export default Call;
