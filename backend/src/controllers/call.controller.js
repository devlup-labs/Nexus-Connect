import Call from "../models/call.js";

export const getCallLogs = async (req, res) => {
    try {
        const userId = req.user._id;

        const calls = await Call.find({
            $or: [{ callerId: userId }, { receiverId: userId }],
        })
            .populate("callerId", "fullName profilePic")
            .populate("receiverId", "fullName profilePic")
            .sort({ startedAt: -1 });

        res.status(200).json(calls);
    } catch (error) {
        console.error("Error in getCallLogs controller: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
