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

export const editMessage = (msgId, text, encryptedData) => {
  if (encryptedData) {
    return API.put(`/messages/${msgId}`, {
      ciphertext: encryptedData.ciphertext,
      nonce: encryptedData.nonce,
      ratchetHeader: encryptedData.ratchetHeader,
      encryptionVersion: encryptedData.encryptionVersion,
    });
  }
  return API.put(`/messages/${msgId}`, { text });
};

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

// ─── E2EE Keys ───────────────────────────────────────
export const registerKeys = (keyBundle) =>
  API.post("/keys/register", keyBundle);

export const getKeyBundle = (userId) => API.get(`/keys/bundle/${userId}`);

export const rotateSignedPreKey = (data) =>
  API.post("/keys/rotate-signed-prekey", data);

export const uploadOneTimePreKeys = (keys) =>
  API.post("/keys/upload-one-time-prekeys", keys);

export const hasKeys = (userId) => API.get(`/keys/has-keys/${userId}`);

