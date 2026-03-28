import Call from "../models/call.js";
import User from "../models/user.js";

export const createCallLog = async (req, res) => {
    try {
        const { receiverId, startTime, endTime, type } = req.body;
        const callerId = req.user._id;

        if (callerId.toString() === receiverId) {
            return res.status(400).json({ message: "You cannot call yourself" });
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: "Receiver not found" });
        }

        if (type !== 0 && type !== 1) {
            return res.status(400).json({ message: "Invalid call type" });
        }

        const newCall = new Call({
            callerId,
            receiverId,
            startTime,
            endTime,
            type,
        });

        await newCall.save();

        res.status(201).json(newCall);
    } catch (error) {
        console.log("Error in createCallLog controller: ", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

export const getCallLogs = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        const calls = await Call.find({
            $or: [{ callerId: loggedInUserId }, { receiverId: loggedInUserId }],
        })
            .populate("callerId", "fullName profilePic")
            .populate("receiverId", "fullName profilePic")
            .sort({ startTime: -1 });

        res.status(200).json(calls);
    } catch (error) {
        console.log("Error in getCallLogs controller: ", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
