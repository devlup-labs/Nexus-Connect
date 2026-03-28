import { io } from "socket.io-client";

let socket = null;
let activeUsers = [];

export const getActiveUsers = () => activeUsers;

export const initializeSocket = (userId) => {
    if (socket) return socket;

    // In dev, Vite proxies /socket.io to the backend
    // In production, same origin serves both, or VITE_URL is used
    const WS_URL = import.meta.env.VITE_URL || import.meta.env.VITE_WS_URL || "";

    socket = io(WS_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
    });

    socket.on("connect", () => {
        console.log("Connected to WebSocket server");
        socket.emit("user_connected", userId);
    });

    socket.on("active_users", (users) => {
        activeUsers = users;
    });

    socket.on("user_status_update", (data) => {
        if (data.status === "online") {
            if (!activeUsers.includes(data.userId)) {
                activeUsers.push(data.userId);
            }
        } else {
            activeUsers = activeUsers.filter((id) => id !== data.userId);
        }
    });

    socket.on("disconnect", (reason) => {
        console.log("Disconnected from WebSocket server:", reason);
    });

    socket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error.message);
    });

    socket.on("reconnect", () => {
        console.log("Reconnected to WebSocket server");
        socket.emit("user_connected", userId);
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        activeUsers = [];
    }
};

// ── Typing ──────────────────────────────────────────────
export const emitTyping = (receiverId) => {
    if (!socket) return;
    socket.emit("user_typing", { receiverId });
};

export const emitStoppedTyping = (receiverId) => {
    if (!socket) return;
    socket.emit("user_stopped_typing", { receiverId });
};

// ── Read Receipts ───────────────────────────────────────
export const emitMarkAsRead = (messageIds, conversationPartnerId) => {
    if (!socket) return;
    socket.emit("mark_as_read", { messageIds, conversationPartnerId });
};
