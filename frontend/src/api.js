import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_URL ? `${import.meta.env.VITE_URL}/api` : "/api",
  withCredentials: true,
});

// ─── Auth ────────────────────────────────────────────
export const login = (email, password) =>
  API.post("/auth/login", { email, password });

export const signup = (fullName, email, password) =>
  API.post("/auth/signup", { fullName, email, password });

export const logout = () => API.post("/auth/logout");

export const checkAuth = () => API.get("/auth/check");

export const updateProfile = (data) =>
  API.put("/auth/update-profile", data);

// ─── Messages ────────────────────────────────────────
export const getContacts = () => API.get("/messages/contacts");

export const getChatPartners = () => API.get("/messages/chats");

export const getMessages = (userId) => API.get(`/messages/${userId}`);

export const sendMessage = (receiverId, data) =>
  API.post(`/messages/send/${receiverId}`, data);

export const editMessage = (msgId, text) =>
  API.put(`/messages/${msgId}`, { text });

export const deleteForMe = (msgId) =>
  API.delete(`/messages/delete-me/${msgId}`);

export const deleteForEveryone = (msgId) =>
  API.delete(`/messages/delete-everyone/${msgId}`);

// ─── Users ───────────────────────────────────────────
export const toggleArchiveUser = (userId) =>
  API.patch(`/users/archive/${userId}`);

export const getArchivedUsers = () => API.get("/users/archived");

// ─── Calls ───────────────────────────────────────────
export const getCallLogs = () => API.get("/calls");

