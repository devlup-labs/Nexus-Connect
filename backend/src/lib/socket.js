import { Server } from "socket.io";
import Message from "../models/message.js";
import mongoose from "mongoose";

let io;

// Store active users: Map<userId, socketId>
const activeUsers = new Map();

export const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true,
            methods: ["GET", "POST"],
        },
        transports: ["websocket", "polling"],
        pingInterval: 25000,
        pingTimeout: 60000,
    });

    io.on("connection", (socket) => {
        console.log("New socket connection:", socket.id);

        // ── User Connected ──────────────────────────────────
        socket.on("user_connected", async (userId) => {
            activeUsers.set(userId, socket.id);
            socket.userId = userId;
            socket.join(`user_${userId}`);

            // Broadcast online status to everyone
            io.emit("user_status_update", {
                userId,
                status: "online",
                timestamp: new Date(),
            });

            // Broadcast the full list of online users to ALL connected sockets
            io.emit("active_users", Array.from(activeUsers.keys()));

            // Send unread message counts
            try {
                const unreadCounts = await getUnreadMessageCounts(userId);
                socket.emit("unread_counts", unreadCounts);
            } catch (err) {
                console.error("Error fetching unread counts:", err);
            }

            console.log(`User ${userId} connected. Active users: ${activeUsers.size}`);
        });

        // ── Send Message ────────────────────────────────────
        socket.on("send_message", async (data) => {
            try {
                const { senderId, receiverId, text, image, replyTo } = data;

                const newMessage = new Message({
                    senderId,
                    receiverId,
                    text,
                    image,
                    replyTo,
                    isEdited: false,
                    status: "sent",
                });

                await newMessage.save();

                const messageData = newMessage.toObject();

                // If receiver is online, mark as delivered
                if (activeUsers.has(receiverId)) {
                    messageData.status = "delivered";
                    await Message.findByIdAndUpdate(newMessage._id, { status: "delivered" });
                }

                // Emit to receiver
                io.to(`user_${receiverId}`).emit("message_received", messageData);

                // Confirm back to sender
                socket.emit("message_sent", {
                    _id: newMessage._id,
                    tempId: data.tempId,
                    status: messageData.status,
                    createdAt: newMessage.createdAt,
                });
            } catch (error) {
                console.error("Error sending message via socket:", error);
                socket.emit("message_error", { error: error.message, tempId: data.tempId });
            }
        });

        // ── Typing Indicators ───────────────────────────────
        socket.on("user_typing", (data) => {
            const { receiverId } = data;
            io.to(`user_${receiverId}`).emit("typing_indicator", {
                userId: socket.userId,
                isTyping: true,
            });
        });

        socket.on("user_stopped_typing", (data) => {
            const { receiverId } = data;
            io.to(`user_${receiverId}`).emit("typing_indicator", {
                userId: socket.userId,
                isTyping: false,
            });
        });

        // ── Mark as Read ────────────────────────────────────
        socket.on("mark_as_read", async (data) => {
            try {
                const { messageIds, conversationPartnerId } = data;

                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    { status: "read", readAt: new Date() }
                );

                // Notify the sender that their messages were read
                io.to(`user_${conversationPartnerId}`).emit("messages_read", {
                    messageIds,
                    readAt: new Date(),
                    readBy: socket.userId,
                });
            } catch (err) {
                console.error("Error marking messages as read:", err);
            }
        });

        // ── Disconnect ──────────────────────────────────────
        socket.on("disconnect", () => {
            if (socket.userId) {
                activeUsers.delete(socket.userId);

                io.emit("user_status_update", {
                    userId: socket.userId,
                    status: "offline",
                    lastSeen: new Date(),
                });

                // Broadcast updated active users list to all remaining sockets
                io.emit("active_users", Array.from(activeUsers.keys()));

                console.log(`User ${socket.userId} disconnected. Active users: ${activeUsers.size}`);
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized");
    }
    return io;
};

export const getActiveUsers = () => activeUsers;

async function getUnreadMessageCounts(userId) {
    const results = await Message.aggregate([
        {
            $match: {
                receiverId: new mongoose.Types.ObjectId(userId),
                status: { $ne: "read" },
            },
        },
        {
            $group: {
                _id: "$senderId",
                count: { $sum: 1 },
            },
        },
    ]);

    return results.reduce((acc, item) => {
        acc[item._id.toString()] = item.count;
        return acc;
    }, {});
}
