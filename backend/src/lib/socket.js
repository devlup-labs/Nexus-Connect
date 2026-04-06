import { Server } from "socket.io";
import Message from "../models/message.js";
import Call from "../models/call.js";
import User from "../models/user.js";
import mongoose from "mongoose";
import crypto from "crypto";

let io;

// Store active users: Map<userId, Set<socketId>>
const activeUsers = new Map();

// activeCalls.set(callId, { callerId, receiverId, callType, status, startedAt, answeredAt });
const activeCalls = new Map();

function getOtherParticipant(callInfo, userId) {
    if (!callInfo) return null;
    if (String(callInfo.callerId) === String(userId)) return String(callInfo.receiverId);
    if (String(callInfo.receiverId) === String(userId)) return String(callInfo.callerId);
    return null;
}

async function finalizeCall(io, { callId, endedBy, status, endReason }) {
    const active = activeCalls.get(callId);
    if (!active) return;

    if (active.timeoutId) clearTimeout(active.timeoutId);

    const endedAt = new Date();
    const answeredAt = active.answeredAt || null;
    const durationSec = answeredAt ? Math.max(0, Math.floor((endedAt - answeredAt) / 1000)) : 0;

    await Call.findOneAndUpdate(
        { callId },
        {
            status,
            answeredAt,
            endedAt,
            durationSec,
            endedBy,
            endReason,
        },
        { new: true }
    );

    io.to(`user_${active.callerId}`).emit("call:ended", { callId, status, endReason, endedAt, durationSec });
    io.to(`user_${active.receiverId}`).emit("call:ended", { callId, status, endReason, endedAt, durationSec });

    activeCalls.delete(callId);
}


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
            if (!activeUsers.has(userId)) {
                activeUsers.set(userId, new Set());
            }
            activeUsers.get(userId).add(socket.id);
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

            console.log(`User ${userId} connected (${socket.id}). Active users: ${activeUsers.size}`);
        });

        // ── Send Message ────────────────────────────────────
        socket.on("send_message", async (data) => {
            try {
                const { senderId, receiverId, text, image, replyTo,
                    ciphertext, nonce, encryptionVersion, messageType,
                    ratchetHeader, senderIdentityKey, senderEphemeralKey } = data;

                const isE2EE = encryptionVersion === "e2ee-v1";

                const messageData = {
                    senderId,
                    receiverId,
                    replyTo,
                    isEdited: false,
                    status: "sent",
                    encryptionVersion: isE2EE ? "e2ee-v1" : "none",
                };

                if (isE2EE) {
                    messageData.ciphertext = ciphertext;
                    messageData.nonce = nonce;
                    messageData.messageType = messageType || "text";
                    messageData.ratchetHeader = ratchetHeader;
                    messageData.senderIdentityKey = senderIdentityKey || null;
                    messageData.senderEphemeralKey = senderEphemeralKey || null;
                } else {
                    messageData.text = text;
                    messageData.image = image;
                }

                const newMessage = new Message(messageData);
                await newMessage.save();

                const socketPayload = newMessage.toObject();

                // Include E2EE metadata for session bootstrap
                if (isE2EE) {
                    socketPayload.senderIdentityKey = senderIdentityKey;
                    socketPayload.senderEphemeralKey = senderEphemeralKey;
                }

                // If receiver is online, mark as delivered
                if (activeUsers.has(receiverId)) {
                    socketPayload.status = "delivered";
                    await Message.findByIdAndUpdate(newMessage._id, { status: "delivered" });
                }

                // Emit to receiver
                io.to(`user_${receiverId}`).emit("message_received", socketPayload);

                // Confirm back to sender
                socket.emit("message_sent", {
                    _id: newMessage._id,
                    tempId: data.tempId,
                    status: socketPayload.status,
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

                if (!messageIds || Array.isArray(messageIds) && messageIds.length === 0) return;

                const objectIds = messageIds.map(id => new mongoose.Types.ObjectId(id));

                await Message.updateMany(
                    { _id: { $in: objectIds } },
                    { $set: { status: "read", readAt: new Date() } }
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

        // ── WebRTC Calling ──────────────────────────────────
        socket.on("call:invite", async (payload, ack) => {
            try {
                const { toUserId, callType } = payload;
                const fromUserId = socket.userId;

                if (!fromUserId || !toUserId) {
                    return ack?.({ ok: false, error: "Invalid participants" });
                }
                if (String(fromUserId) === String(toUserId)) {
                    return ack?.({ ok: false, error: "Cannot call yourself" });
                }
                if (!["voice", "video"].includes(callType)) {
                    return ack?.({ ok: false, error: "Invalid callType" });
                }

                if (!activeUsers.has(String(toUserId))) {
                    await Call.create({
                        callId: crypto.randomUUID(),
                        callerId: fromUserId,
                        receiverId: toUserId,
                        callType,
                        status: "missed",
                        startedAt: new Date(),
                    });
                    return ack?.({ ok: false, error: "User is offline" });
                }

                const callId = crypto.randomUUID();
                const startedAt = new Date();

                const timeoutId = setTimeout(async () => {
                    const callInfo = activeCalls.get(callId);
                    if (callInfo && callInfo.status === "ringing") {
                        await finalizeCall(io, { callId, endedBy: null, status: "missed", endReason: "timeout" });
                    }
                }, 30000);

                activeCalls.set(callId, {
                    callerId: String(fromUserId),
                    receiverId: String(toUserId),
                    callType,
                    status: "ringing",
                    startedAt,
                    timeoutId,
                });

                await Call.create({
                    callId,
                    callerId: fromUserId,
                    receiverId: toUserId,
                    callType,
                    status: "ringing",
                    startedAt,
                });

                const caller = await User.findById(fromUserId).select("-password");

                io.to(`user_${toUserId}`).emit("call:incoming", {
                    callId,
                    fromUserId,
                    fromUserName: caller?.fullName || "Unknown",
                    fromUserPic: caller?.profilePic || null,
                    callType,
                    startedAt,
                });

                socket.emit("call:ringing", { callId, toUserId, callType, startedAt });

                return ack?.({ ok: true, callId });
            } catch (error) {
                console.error("Error in call:invite:", error);
                return ack?.({ ok: false, error: "Failed to invite" });
            }
        });

        socket.on("call:accept", async (payload, ack) => {
            const { callId } = payload;
            const callInfo = activeCalls.get(callId);
            if (!callInfo) return ack?.({ ok: false, error: "Invalid call" });

            callInfo.status = "answered";
            callInfo.answeredAt = new Date();

            await Call.findOneAndUpdate({ callId }, { status: "answered", answeredAt: callInfo.answeredAt });

            io.to(`user_${callInfo.callerId}`).emit("call:accepted", { callId, answeredAt: callInfo.answeredAt });
            ack?.({ ok: true });
        });

        socket.on("call:reject", async (payload, ack) => {
            const { callId } = payload;
            await finalizeCall(io, { callId, endedBy: socket.userId, status: "rejected", endReason: "reject" });
            ack?.({ ok: true });
        });

        socket.on("call:end", async (payload, ack) => {
            const { callId } = payload;
            const callInfo = activeCalls.get(callId);
            let status = "ended";
            if (callInfo && callInfo.status === "ringing") {
                status = "missed";
            }
            await finalizeCall(io, { callId, endedBy: socket.userId, status, endReason: "hangup" });
            ack?.({ ok: true });
        });

        socket.on("call:offer", (payload, ack) => {
            const { callId, sdp } = payload;
            const callInfo = activeCalls.get(callId);
            const toUserId = getOtherParticipant(callInfo, socket.userId);
            if (!callInfo || !toUserId) return ack?.({ ok: false, error: "Invalid call" });

            io.to(`user_${toUserId}`).emit("call:offer", { callId, fromUserId: socket.userId, sdp });
            ack?.({ ok: true });
        });

        socket.on("call:answer", (payload, ack) => {
            const { callId, sdp } = payload;
            const callInfo = activeCalls.get(callId);
            const toUserId = getOtherParticipant(callInfo, socket.userId);
            if (!callInfo || !toUserId) return ack?.({ ok: false, error: "Invalid call" });

            io.to(`user_${toUserId}`).emit("call:answer", { callId, fromUserId: socket.userId, sdp });
            ack?.({ ok: true });
        });

        socket.on("call:ice-candidate", (payload) => {
            const { callId, candidate } = payload;
            const callInfo = activeCalls.get(callId);
            const toUserId = getOtherParticipant(callInfo, socket.userId);
            if (!callInfo || !toUserId) return;

            io.to(`user_${toUserId}`).emit("call:ice-candidate", {
                callId,
                fromUserId: socket.userId,
                candidate,
            });
        });

        // ── Disconnect ──────────────────────────────────────
        socket.on("disconnect", async () => {
            if (socket.userId) {
                const userSockets = activeUsers.get(socket.userId);
                if (userSockets) {
                    userSockets.delete(socket.id);
                    if (userSockets.size === 0) {
                        activeUsers.delete(socket.userId);
                        io.emit("user_status_update", {
                            userId: socket.userId,
                            status: "offline",
                            lastSeen: new Date(),
                        });
                    }
                }

                // Broadcast updated active users list to all remaining sockets
                io.emit("active_users", Array.from(activeUsers.keys()));

                // End any active calls the user is part of
                for (const [callId, callInfo] of activeCalls.entries()) {
                    if (String(callInfo.callerId) === String(socket.userId) || String(callInfo.receiverId) === String(socket.userId)) {
                        const status = callInfo.status === "ringing" ? "missed" : "failed";
                        const endReason = callInfo.status === "ringing" ? "network" : "error";
                        await finalizeCall(io, { callId, endedBy: socket.userId, status, endReason });
                    }
                }

                console.log(`User ${socket.userId} socket disconnected (${socket.id}). Active users overall: ${activeUsers.size}`);
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
                deletedBy: { $ne: new mongoose.Types.ObjectId(userId) }
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
