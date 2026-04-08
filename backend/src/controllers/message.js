import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.js";
import User from "../models/user.js";
import { getIO, getActiveUsers } from "../lib/socket.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find().select("-password -archivedUsers");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
      deletedBy: { $ne: myId },
    }).sort({ createdAt: 1 }).populate('replyTo', 'text image senderId');

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, replyTo, ciphertext, nonce, encryptionVersion, messageType, ratchetHeader, senderIdentityKey, senderEphemeralKey } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const isE2EE = encryptionVersion === "e2ee-v1";

    // Validate: either plaintext fields or E2EE fields must be present
    if (!isE2EE && !text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }
    if (isE2EE && !ciphertext) {
      return res.status(400).json({ message: "Ciphertext is required for E2EE messages." });
    }

    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    let imageUrl;
    if (!isE2EE && image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        resource_type: "auto",
      });
      imageUrl = uploadResponse.secure_url;
    }

    // Determine initial status based on receiver's online state
    const activeUsers = getActiveUsers();
    const initialStatus = activeUsers.has(receiverId.toString()) ? "delivered" : "sent";

    const messageData = {
      senderId,
      receiverId,
      replyTo: replyTo || null,
      status: initialStatus,
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
      messageData.image = imageUrl;
    }

    const newMessage = new Message(messageData);
    await newMessage.save();

    // Populate replyTo for legacy messages
    if (!isE2EE && newMessage.replyTo) {
      await newMessage.populate('replyTo', 'text image senderId');
    }

    // Build socket payload (include E2EE metadata for session bootstrap)
    const socketPayload = newMessage.toObject();
    if (isE2EE) {
      socketPayload.senderIdentityKey = senderIdentityKey;
      socketPayload.senderEphemeralKey = senderEphemeralKey;
    }

    // Emit real-time event to receiver via WebSocket
    try {
      const io = getIO();
      io.to(`user_${receiverId}`).emit("message_received", socketPayload);
      io.to(`user_${senderId}`).emit("message_sent_ack", socketPayload);
    } catch (socketErr) {
      console.error("Socket emit error:", socketErr.message);
    }

    res.status(201).json(socketPayload);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
      deletedBy: { $ne: loggedInUserId }
    }).sort({ createdAt: -1 });

    const chatPartnerMap = new Map();

    messages.forEach((msg) => {
      const partnerId =
        msg.senderId.toString() === loggedInUserId.toString()
          ? msg.receiverId.toString()
          : msg.senderId.toString();

      if (!chatPartnerMap.has(partnerId)) {
        chatPartnerMap.set(partnerId, msg);
      }
    });

    const chatPartnerIds = Array.from(chatPartnerMap.keys());

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password -archivedUsers");

    //don't show archived users
    const user = await User.findById(loggedInUserId);
    const filteredChatPartners = chatPartners
      .filter((partner) => !user.archivedUsers.some((id) => id.toString() === partner._id.toString()))
      .map((partner) => {
        const pObj = partner.toObject();
        const lastMsg = chatPartnerMap.get(partner._id.toString());
        if (lastMsg) {
          const msgObj = lastMsg.toObject ? lastMsg.toObject() : lastMsg;
          // Mask E2EE message content on server side
          if (msgObj.encryptionVersion === "e2ee-v1") {
            msgObj.text = "🔒 Encrypted message";
            delete msgObj.ciphertext;
            delete msgObj.nonce;
            delete msgObj.ratchetHeader;
          }
          pObj.lastMessage = msgObj;
        }
        return pObj;
      })
      .sort((a, b) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
        const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
        return dateB - dateA;
      });

    res.status(200).json(filteredChatPartners);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, ciphertext, nonce, ratchetHeader, encryptionVersion } = req.body;
    const loggedInUserId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== loggedInUserId.toString()) {
      return res.status(403).json({ message: "Can't edit this message" });
    }

    const isE2EE = encryptionVersion === "e2ee-v1" || message.encryptionVersion === "e2ee-v1";

    if (isE2EE) {
      message.ciphertext = ciphertext;
      message.nonce = nonce;
      if (ratchetHeader) message.ratchetHeader = ratchetHeader;
    } else {
      message.text = text;
    }
    message.isEdited = true;
    await message.save();

    // Emit real-time edit event to the receiver
    try {
      const io = getIO();
      const receiverId = message.receiverId.toString();
      const editPayload = {
        messageId: id,
        senderId: message.senderId.toString(),
        isEdited: true,
        editedAt: new Date(),
      };
      if (isE2EE) {
        editPayload.ciphertext = ciphertext;
        editPayload.nonce = nonce;
        editPayload.ratchetHeader = ratchetHeader;
        editPayload.encryptionVersion = "e2ee-v1";
      } else {
        editPayload.newText = text;
      }
      io.to(`user_${receiverId}`).emit("message_edited", editPayload);
    } catch (socketErr) {
      console.error("Socket emit error:", socketErr.message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in editMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteForEveryone = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Action not allowed" });
    }

    const receiverId = message.receiverId.toString();
    await Message.findByIdAndDelete(id);

    // Emit real-time delete event to the receiver
    try {
      const io = getIO();
      io.to(`user_${receiverId}`).emit("message_deleted", {
        messageId: id,
      });
    } catch (socketErr) {
      console.error("Socket emit error:", socketErr.message);
    }

    res.status(200).json({ message: "Deleted for everyone" });
  } catch (error) {
    console.log("Error in deleteForEveryone:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteForMe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (
      message.senderId.toString() !== userId.toString() &&
      message.receiverId.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!message.deletedBy.includes(userId)) {
      message.deletedBy.push(userId);
      await message.save();
    }

    res.status(200).json({ message: "Deleted for you" });
  } catch (error) {
    console.log("Error in deleteForMe:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const replyMessage = async (req, res) => {
  try {
    const { id: originalMessageId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image required." });
    }

    const originalMessage = await Message.findById(originalMessageId);
    if (!originalMessage) {
      return res.status(404).json({ message: "Original message not found." });
    }

    const receiverId = originalMessage.senderId.toString() === senderId.toString()
      ? originalMessage.receiverId
      : originalMessage.senderId;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      replyTo: originalMessageId,
    });

    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

