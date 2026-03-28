import express from "express";
import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
  editMessage,
  deleteForMe,
  deleteForEveryone,
  replyMessage,
} from "../controllers/message.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();
router.use(arcjetProtection, protectRoute);
router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);
router.put("/:id", editMessage);
router.post("/reply/:id", replyMessage);
router.delete("/delete-me/:id", deleteForMe);
router.delete("/delete-everyone/:id", deleteForEveryone);

export default router;
