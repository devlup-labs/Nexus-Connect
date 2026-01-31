import User from "../models/user.js";

export const toggleArchiveUser = async (req, res) => {
    try {
        const { id: targetUserId } = req.params;
        const currentUserId = req.user._id;

        const user = await User.findById(currentUserId);
        const targetUser = await User.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (currentUserId.toString() === targetUserId.toString()) {
            return res.status(400).json({ message: "You cannot archive yourself" });
        }

        const isArchived = user.archivedUsers.some((id) => id.toString() === targetUserId.toString());

        if (isArchived) {
            //unarchive
            await User.findByIdAndUpdate(currentUserId, {
                $pull: { archivedUsers: targetUserId },
            });
            res.status(200).json({ message: "User unarchived" });
        } else {
            //archive
            await User.findByIdAndUpdate(currentUserId, {
                $addToSet: { archivedUsers: targetUserId },
            });
            res.status(200).json({ message: "User archived" });
        }
    } catch (error) {
        console.error("Error in toggleArchiveUser:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getArchivedUsers = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const user = await User.findById(currentUserId).populate("archivedUsers", "-password");

        res.status(200).json(user.archivedUsers);
    } catch (error) {
        console.error("Error in getArchivedUsers:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
