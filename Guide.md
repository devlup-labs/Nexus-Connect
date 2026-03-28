# WebSocket Implementation Guide - Nexus Connect

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Feature Implementation](#feature-implementation)
4. [Installation & Setup](#installation--setup)
5. [Real-Time Messaging](#real-time-messaging)
6. [Online/Offline Indicators](#onlineoffline-indicators)
7. [Typing Indicators](#typing-indicators)
8. [Unread Message Counter](#unread-message-counter)
9. [Additional WebSocket Features](#additional-websocket-features)
10. [Database Schema Updates](#database-schema-updates)
11. [Implementation Order](#implementation-order)
12. [Testing & Deployment](#testing--deployment)

---

## Overview

Currently, the Nexus Connect project uses **HTTP REST API** for all communication. To enhance real-time communication and create a better user experience, implementing **WebSocket** technology is essential. WebSockets provide:

- **Bidirectional Communication** - Server can push data to clients instantly
- **Lower Latency** - No HTTP overhead for each message
- **Persistent Connections** - Keeps connection open for instant updates
- **Broadcasting Capabilities** - Update multiple users simultaneously

### Why WebSockets for Nexus Connect?

1. **Instant Messaging** - Messages appear immediately without polling
2. **Presence Awareness** - See when users come online/go offline
3. **Typing Indicators** - Know when someone is typing
4. **Unread Badges** - Real-time sync of unread message counts
5. **Call Notifications** - Instant call invitations
6. **Notification System** - Real-time notifications

---

## Architecture

### Current Architecture
```
Frontend (React) ←→ REST API ←→ Backend (Express) ←→ MongoDB
    (HTTP)           (axios)
```

### Proposed WebSocket Architecture
```
Frontend (React) ←→ WebSocket ←→ Backend (Express) ←→ MongoDB
  (socket.io)      (bi-directional)  (socket.io)
  
    ↓ (Falls back to HTTP for non-real-time requests)
    REST API (still used for auth, file uploads, etc.)
```

### Technology Stack
- **Backend**: `socket.io` + Express.js
- **Frontend**: `socket.io-client` + React
- **Protocol**: WebSocket with fallback to HTTP polling
- **Event-Based**: Custom events for different operations

---

## Feature Implementation

### 1. Real-Time Messaging
**Current Flow (HTTP)**:
```
User A sends message → HTTP POST → Server → HTTP Response → User A sees message
                                   ↓ (polling needed)
User B polls every N seconds ← HTTP GET
```

**WebSocket Flow**:
```
User A sends message → WebSocket event → Server → Broadcasts to User B
                                         ↓
User B receives instantly via listener
```

### 2. Online/Offline Indicators
**Current**: No online status tracking
**WebSocket**: 
- Track user presence when connected
- Broadcast "user_online" event when they connect
- Broadcast "user_offline" event when they disconnect
- Show status in ContactsPanel and ChatContainer

### 3. Typing Indicators
**Current**: Not implemented
**WebSocket**:
- Emit "user_typing" event while typing
- Stop emitting after 2 seconds of inactivity
- Show "User is typing..." in ChatContainer

### 4. Unread Message Counter
**Current**: Applied only on message fetch
**WebSocket**:
- Real-time sync of unread counts
- Show badge on contact in ContactsPanel
- Update when message is read
- Persist read status in database

### 5. Message Status (Delivered/Read)
**Current**: Not tracked
**WebSocket**:
- Track "delivered" status when message reaches server
- Track "read" status when recipient opens chat
- Show status indicators next to messages (✓ ✓✓)

---

## Installation & Setup

### Step 1: Install Dependencies

**Backend**:
```bash
npm install socket.io
npm install socket.io-client  # For testing (optional)
```

**Frontend**:
```bash
npm install socket.io-client
```

### Step 2: Environment Variables

**.env** (Backend):
```
# Existing variables
PORT=3000
MONGODB_URI=...
CLIENT_URL=http://localhost:5173
 
# New WebSocket configuration
WS_CORS_ORIGIN=http://localhost:5173
WS_PATH=/socket.io
WS_TRANSPORTS=websocket,http_long_polling
```

**frontend/.env.local** (Frontend - if using vite):
```
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### Step 3: Verify Installation
```bash
# Backend
npm list socket.io

# Frontend
npm list socket.io-client
```

---

## Real-Time Messaging

### Backend Implementation

#### 1. Initialize Socket.IO in server.js

```javascript
// backend/src/server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

// Existing middleware
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(cors({...}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
// ... other routes

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Production deployment
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(_dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(_dirname, '../frontend/dist/index.html'));
  });
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});

// Export io for use in routes
export default io;
```

#### 2. Create Socket Manager

```javascript
// backend/src/lib/socket.js
import Message from '../models/message.js';

// Store active users: Map<userId, socketId>
const activeUsers = new Map();

export const registerSocketEvents = (io) => {
  io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);
    
    // User joins with their userId
    socket.on('user_connected', async (userId) => {
      activeUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(`user_${userId}`); // Join a room for this user
      
      // Broadcast user is online to their contacts
      io.emit('user_status_update', {
        userId,
        status: 'online',
        timestamp: new Date()
      });
      
      console.log(`User ${userId} connected. Active users: ${activeUsers.size}`);
    });
    
    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        const { senderId, receiverId, text, image, replyTo } = data;
        
        // Save message to database
        const newMessage = new Message({
          senderId,
          receiverId,
          text,
          image,
          replyTo,
          isEdited: false
        });
        
        await newMessage.save();
        
        // Emit to receiver
        io.to(`user_${receiverId}`).emit('message_received', {
          _id: newMessage._id,
          senderId,
          receiverId,
          text,
          image,
          replyTo,
          createdAt: newMessage.createdAt,
          status: 'delivered'
        });
        
        // Emit back to sender for confirmation
        socket.emit('message_sent', {
          _id: newMessage._id,
          status: 'sent'
        });
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: error.message });
      }
    });
    
    // Handle message read
    socket.on('message_read', async (data) => {
      const { messageId, conversationPartnerId } = data;
      
      // Broadcast read status
      io.to(`user_${conversationPartnerId}`).emit('message_read_receipt', {
        messageId,
        readBy: socket.userId,
        readAt: new Date()
      });
    });
    
    // Handle user disconnect
    socket.on('disconnect', () => {
      activeUsers.delete(socket.userId);
      
      io.emit('user_status_update', {
        userId: socket.userId,
        status: 'offline',
        lastSeen: new Date()
      });
      
      console.log(`User ${socket.userId} disconnected`);
    });
  });
};

export const getActiveUsers = () => activeUsers;
```

### Frontend Implementation

#### 1. Create Socket Service

```javascript
// frontend/src/services/socket.js
import io from 'socket.io-client';

let socket = null;

export const initializeSocket = (userId) => {
  if (socket) return socket;
  
  const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
  
  socket = io(WS_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });
  
  socket.on('connect', () => {
    console.log('Connected to server');
    // Tell server about this user
    socket.emit('user_connected', userId);
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });
  
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Message events
export const sendMessage = (senderId, receiverId, text, image, replyTo) => {
  if (!socket) return;
  
  socket.emit('send_message', {
    senderId,
    receiverId,
    text,
    image,
    replyTo
  });
};

export const onMessageReceived = (callback) => {
  if (!socket) return;
  socket.on('message_received', callback);
};

export const onMessageSent = (callback) => {
  if (!socket) return;
  socket.on('message_sent', callback);
};

export const onMessageReadReceipt = (callback) => {
  if (!socket) return;
  socket.on('message_read_receipt', callback);
};

// Status events
export const onUserStatusUpdate = (callback) => {
  if (!socket) return;
  socket.on('user_status_update', callback);
};

export const markMessageAsRead = (messageId, conversationPartnerId) => {
  if (!socket) return;
  socket.emit('message_read', {
    messageId,
    conversationPartnerId
  });
};
```

#### 2. Update ChatContainer Component

```javascript
// frontend/src/components/ChatContainer.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  initializeSocket,
  getSocket,
  sendMessage,
  onMessageReceived,
  onMessageSent,
  markMessageAsRead,
  onUserStatusUpdate
} from '../services/socket';
import { getMessages } from '../api';

const ChatContainer = ({ selectedContact, authUser, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Initialize WebSocket on component mount
  useEffect(() => {
    if (authUser) {
      initializeSocket(authUser._id);
    }
  }, [authUser]);
  
  // Load message history when contact is selected
  useEffect(() => {
    if (selectedContact) {
      loadMessages();
    }
  }, [selectedContact]);
  
  // Listen for incoming messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    
    const handleMessageReceived = (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    };
    
    const handleMessageSent = (data) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === data._id ? { ...msg, status: 'sent' } : msg
        )
      );
    };
    
    onMessageReceived(handleMessageReceived);
    onMessageSent(handleMessageSent);
    
    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('message_sent', handleMessageSent);
    };
  }, []);
  
  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await getMessages(selectedContact._id);
      setMessages(response.data);
      
      // Mark messages as read
      response.data.forEach(msg => {
        if (msg.receiverId === authUser._id && msg.status !== 'read') {
          markMessageAsRead(msg._id, selectedContact._id);
        }
      });
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedContact) return;
    
    // Optimistic update - add message to UI immediately
    const tempMessage = {
      _id: Date.now(),
      senderId: authUser._id,
      receiverId: selectedContact._id,
      text: messageText,
      createdAt: new Date(),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setMessageText('');
    
    // Send via WebSocket
    sendMessage(authUser._id, selectedContact._id, messageText);
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-white font-semibold">{selectedContact?.fullName}</h2>
            <p className="text-white/40 text-sm">Online</p>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${
              msg.senderId === authUser._id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.senderId === authUser._id
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white/10 text-white'
              }`}
            >
              <p>{msg.text}</p>
              <div className="text-xs mt-1 opacity-70">
                {msg.status === 'sending' && '⏱'}
                {msg.status === 'sent' && '✓'}
                {msg.status === 'delivered' && '✓✓'}
                {msg.status === 'read' && '✓✓'}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-white/10 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/10 text-white placeholder-white/40 px-4 py-2 rounded-lg"
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="bg-cyan-500 text-white px-6 py-2 rounded-lg"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatContainer;
```

---

## Online/Offline Indicators

### Backend - Track User Status

```javascript
// backend/src/lib/socket.js - Add to existing socket manager

const userPresence = new Map(); // Map<userId, { status, lastSeen, socketId }>

export const updateUserPresence = (userId, status, socketId = null) => {
  const presence = {
    status,
    lastSeen: new Date(),
    socketId
  };
  
  if (status === 'offline') {
    userPresence.delete(userId);
  } else {
    userPresence.set(userId, presence);
  }
};

export const getUserPresence = (userId) => {
  return userPresence.get(userId) || { status: 'offline', lastSeen: null };
};

export const getUsersOnlineStatus = (userIds) => {
  return userIds.reduce((acc, userId) => {
    acc[userId] = getUserPresence(userId);
    return acc;
  }, {});
};
```

### Frontend - Listen to Status Updates

```javascript
// frontend/src/services/socket.js - Add to socket service

export const onUserStatusUpdate = (callback) => {
  if (!socket) return;
  socket.on('user_status_update', callback);
};

export const subscribeToUserPresence = (userIds) => {
  if (!socket) return;
  socket.emit('subscribe_to_presence', userIds);
};
```

### Update ContactsPanel Component

```javascript
// frontend/src/components/ContactsPanel.jsx
import { onUserStatusUpdate, subscribeToUserPresence, getSocket } from '../services/socket';

const ContactsPanel = () => {
  const [contacts, setContacts] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    
    const handleStatusUpdate = (data) => {
      setUserStatuses(prev => ({
        ...prev,
        [data.userId]: data.status
      }));
    };
    
    onUserStatusUpdate(handleStatusUpdate);
    
    // Subscribe to status updates for all contacts
    if (contacts.length > 0) {
      subscribeToUserPresence(contacts.map(c => c._id));
    }
    
    return () => {
      socket.off('user_status_update', handleStatusUpdate);
    };
  }, [contacts]);
  
  const getStatusColor = (status) => {
    return status === 'online' ? '#22c55e' : '#6b7280';
  };
  
  return (
    <div>
      {contacts.map((contact) => (
        <div key={contact._id} className="contact-item">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={contact.profilePic} alt={contact.fullName} />
              {/* Online indicator */}
              <div
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900"
                style={{ backgroundColor: getStatusColor(userStatuses[contact._id] || 'offline') }}
              />
            </div>
            <div>
              <p>{contact.fullName}</p>
              <p className="text-xs text-white/40">
                {userStatuses[contact._id] === 'online' ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## Typing Indicators

### Backend - Handle Typing Events

```javascript
// backend/src/lib/socket.js - Add to registerSocketEvents

socket.on('user_typing', (data) => {
  const { receiverId } = data;
  
  io.to(`user_${receiverId}`).emit('typing_indicator', {
    userId: socket.userId,
    isTyping: true
  });
});

socket.on('user_stopped_typing', (data) => {
  const { receiverId } = data;
  
  io.to(`user_${receiverId}`).emit('typing_indicator', {
    userId: socket.userId,
    isTyping: false
  });
});
```

### Frontend - Implement Typing Indicator

```javascript
// frontend/src/services/socket.js - Add to socket service

export const emitTyping = (receiverId) => {
  if (!socket) return;
  socket.emit('user_typing', { receiverId });
};

export const emitStoppedTyping = (receiverId) => {
  if (!socket) return;
  socket.emit('user_stopped_typing', { receiverId });
};

export const onTypingIndicator = (callback) => {
  if (!socket) return;
  socket.on('typing_indicator', callback);
};
```

### Update ChatContainer with Typing Handler

```javascript
// frontend/src/components/ChatContainer.jsx - Add to component

const typingTimeoutRef = useRef(null);
const [isUserTyping, setIsUserTyping] = useState(false);

useEffect(() => {
  const socket = getSocket();
  if (!socket) return;
  
  const handleTypingIndicator = (data) => {
    if (data.userId === selectedContact._id) {
      setIsUserTyping(data.isTyping);
    }
  };
  
  socket.on('typing_indicator', handleTypingIndicator);
  
  return () => {
    socket.off('typing_indicator', handleTypingIndicator);
  };
}, [selectedContact]);

const handleInputChange = (e) => {
  const value = e.target.value;
  setMessageText(value);
  
  // Emit typing event
  if (value.length > 0 && selectedContact) {
    emitTyping(selectedContact._id);
    
    // Clear previous timeout
    clearTimeout(typingTimeoutRef.current);
    
    // Emit stopped typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitStoppedTyping(selectedContact._id);
    }, 2000);
  }
};

// In render:
{isUserTyping && (
  <div className="text-white/50 text-sm italic">
    {selectedContact.fullName} is typing...
  </div>
)}
```

---

## Unread Message Counter

### Database Schema Update

```javascript
// backend/src/models/message.js - Update schema

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, trim: true, maxlength: 2000 },
    image: String,
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    isEdited: { type: Boolean, default: false },
    deletedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    },
    readAt: Date,
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  { timestamps: true }
);
```

### Backend - Send Unread Count on Connect

```javascript
// backend/src/lib/socket.js

socket.on('user_connected', async (userId) => {
  activeUsers.set(userId, socket.id);
  socket.userId = userId;
  socket.join(`user_${userId}`);
  
  // Send unread message counts for all conversations
  const unreadCounts = await getUnreadMessageCounts(userId);
  socket.emit('unread_counts', unreadCounts);
  
  io.emit('user_status_update', {
    userId,
    status: 'online',
    timestamp: new Date()
  });
});

async function getUnreadMessageCounts(userId) {
  const conversationPartners = await Message.aggregate([
    {
      $match: {
        receiverId: mongoose.Types.ObjectId(userId),
        status: { $ne: 'read' }
      }
    },
    {
      $group: {
        _id: '$senderId',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return conversationPartners.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});
}
```

### Frontend - Display Unread Badge

```javascript
// frontend/src/components/ContactsPanel.jsx

const [unreadCounts, setUnreadCounts] = useState({});

useEffect(() => {
  const socket = getSocket();
  if (!socket) return;
  
  socket.on('unread_counts', (counts) => {
    setUnreadCounts(counts);
  });
  
  return () => {
    socket.off('unread_counts');
  };
}, []);

// In render:
{contacts.map((contact) => (
  <div key={contact._id} className="contact-item">
    <div className="flex items-center gap-3 justify-between">
      <div className="flex items-center gap-3">
        <img src={contact.profilePic} alt={contact.fullName} />
        <p>{contact.fullName}</p>
      </div>
      {unreadCounts[contact._id] > 0 && (
        <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          {unreadCounts[contact._id]}
        </div>
      )}
    </div>
  </div>
))}
```

---

## Additional WebSocket Features

### 1. Message Delivery Status

**Events**: `sending` → `sent` → `delivered` → `read`

```javascript
// Backend
socket.on('message_delivered', async (messageId) => {
  await Message.findByIdAndUpdate(messageId, { status: 'delivered' });
  io.emit('message_status_update', { messageId, status: 'delivered' });
});

// Frontend
socket.emit('message_delivered', messageId);
```

### 2. User Activity (Last Active)

```javascript
// Backend
export let lastActivityTime = new Map();

socket.on('user_activity', (userId) => {
  lastActivityTime.set(userId, new Date());
});

export function getLastActive(userId) {
  return lastActivityTime.get(userId) || null;
}

// Frontend
const trackActivity = () => {
  const socket = getSocket();
  socket.emit('user_activity', authUser._id);
};

// Call on message send, typing, etc.
```

### 3. Read Receipts with Timestamps

```javascript
// Backend
socket.on('mark_as_read', async (data) => {
  const { messageIds, conversationPartnerId } = data;
  
  await Message.updateMany(
    { _id: { $in: messageIds } },
    { status: 'read', readAt: new Date() }
  );
  
  io.to(`user_${conversationPartnerId}`).emit('messages_read', {
    messageIds,
    readAt: new Date(),
    readBy: socket.userId
  });
});

// Frontend
const markMessagesAsRead = (messageIds, partnerId) => {
  const socket = getSocket();
  socket.emit('mark_as_read', { messageIds, conversationPartnerId: partnerId });
};
```

### 4. Real-Time Contact List Updates

```javascript
// Backend
socket.on('user_connected', async (userId) => {
  // Broadcast updated contacts to all users
  const contacts = await getUpdatedContacts(userId);
  socket.broadcast.emit('contacts_updated', contacts);
});

// Frontend
socket.on('contacts_updated', (contacts) => {
  setContacts(contacts);
});
```

### 5. Call/Video Invitation Notifications

```javascript
// Backend
socket.on('initiate_call', (data) => {
  const { from, to, callType } = data;
  
  io.to(`user_${to}`).emit('incoming_call', {
    from,
    callType,
    timestamp: new Date()
  });
});

socket.on('call_accepted', (data) => {
  io.to(`user_${data.from}`).emit('call_accepted', data);
});

socket.on('call_rejected', (data) => {
  io.to(`user_${data.from}`).emit('call_rejected', data);
});

// Frontend
const initiateCall = (to, callType) => {
  const socket = getSocket();
  socket.emit('initiate_call', {
    from: authUser._id,
    to,
    callType
  });
};

socket.on('incoming_call', (data) => {
  showCallInvitationModal(data);
});
```

### 6. Bulk Message Updates (Edit/Delete)

```javascript
// Backend
socket.on('edit_message', async (data) => {
  const { messageId, newText, conversationPartnerId } = data;
  
  const message = await Message.findByIdAndUpdate(
    messageId,
    { text: newText, isEdited: true },
    { new: true }
  );
  
  io.to(`user_${conversationPartnerId}`).emit('message_edited', {
    messageId,
    newText,
    editedAt: new Date()
  });
});

socket.on('delete_message', async (data) => {
  const { messageId, deleteFor, conversationPartnerId } = data;
  
  if (deleteFor === 'everyone') {
    await Message.findByIdAndUpdate(
      messageId,
      { deletedBy: [socket.userId] }
    );
    io.emit('message_deleted_everyone', { messageId });
  }
});

// Frontend
const editMessageViaSocket = (messageId, newText, partnerId) => {
  socket.emit('edit_message', {
    messageId,
    newText,
    conversationPartnerId: partnerId
  });
};
```

### 7. Notifications Center

```javascript
// Backend
socket.on('notifications_subscribe', (userId) => {
  socket.join(`notifications_${userId}`);
});

function sendNotification(userId, notification) {
  io.to(`notifications_${userId}`).emit('new_notification', {
    ...notification,
    timestamp: new Date(),
    read: false
  });
}

// Frontend
socket.on('new_notification', (notification) => {
  addToNotificationCenter(notification);
  showToastNotification(notification);
});
```

---

## Database Schema Updates

### Updated Message Schema

```javascript
// backend/src/models/message.js

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: String,
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    deletedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
      index: true
    },
    readAt: Date,
    readBy: [{
      userId: mongoose.Schema.Types.ObjectId,
      readAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

// Compound index for faster queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, status: 1 });
```

### User Schema with Online Status

```javascript
// backend/src/models/user.js

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String, default: "" },
    archivedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    // Real-time presence info (not persisted in DB, kept in-memory)
    // onlineStatus: { type: String, enum: ['online', 'offline'], default: 'offline' },
    // lastActive: Date,
  },
  { timestamps: true }
);
```

---

## Implementation Order

### Phase 1: Foundation (Week 1)
1. **Install dependencies** (socket.io, socket.io-client)
2. **Initialize Socket.IO** on backend
3. **Create socket service** on frontend
4. **Test basic connection**

### Phase 2: Real-Time Messaging (Week 2)
1. Implement `send_message` event
2. Implement `message_received` event
3. Update ChatContainer to use WebSockets
4. Add optimistic UI updates
5. Keep HTTP fallback for message history

### Phase 3: Presence & Status (Week 2-3)
1. Implement `user_connected` and `user_disconnected`
2. Track active users on server
3. Broadcast online/offline status
4. Update ContactsPanel with status indicators
5. Show "Last active" timestamp

### Phase 4: Typing Indicators & Read Receipts (Week 3)
1. Implement typing event handlers
2. Add typing UI to ChatContainer
3. Implement read receipt system
4. Update message status indicators

### Phase 5: Unread Counter (Week 3-4)
1. Update Message schema with status field
2. Implement unread count tracking
3. Send unread counts on connection
4. Display badges in ContactsPanel
5. Update counts in real-time

### Phase 6: Advanced Features (Week 4+)
1. Message edit/delete via WebSocket
2. Call invitation notifications
3. Message delivery status
4. Activity tracking
5. Bulk read receipts

### Phase 7: Testing & Optimization (Week 5)
1. Load testing with socket.io
2. Memory optimization
3. Connection pooling
4. Error handling & reconnection
5. Production deployment

---

## Testing & Deployment

### Local Testing

```bash
# Terminal 1 - Start backend
cd backend
npm run dev

# Terminal 2 - Start frontend
cd frontend
npm run dev

# Test in browser
# Open http://localhost:5173
# Open multiple browser tabs to simulate multiple users
```

### Testing Checklist

- [ ] Messages send and receive in real-time
- [ ] Online/offline status updates
- [ ] Typing indicators appear/disappear
- [ ] Unread counters sync
- [ ] Reconnection works after network loss
- [ ] Old messages load from HTTP endpoint
- [ ] Multiple browser tabs sync properly
- [ ] Mobile browsers work (test on phone)
- [ ] Load test with 100+ concurrent users

### Production Deployment

```javascript
// server.js - Production config

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true
  },
  transports: ['websocket', 'polling'],
  path: '/socket.io',
  // Compression
  pingInterval: 25000,
  pingTimeout: 60000,
});

// Enable Redis for multi-server setup (optional)
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

if (process.env.REDIS_URL) {
  const redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.connect();
  io.adapter(createAdapter(redisClient));
}
```

### Nginx Configuration (if needed)

```nginx
# Handle WebSocket upgrade
location /socket.io {
  proxy_pass http://backend:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_cache_bypass $http_upgrade;
}
```

### Environment Variables Checklist

```bash
# Backend
PORT=3000
MONGODB_URI=mongodb+srv://...
CLIENT_URL=https://yourdomain.com
NODE_ENV=production
WS_CORS_ORIGIN=https://yourdomain.com

# Frontend
VITE_API_BASE_URL=https://yourdomain.com
VITE_WS_URL=https://yourdomain.com
```

---

## Performance Considerations

### 1. Connection Pooling
- Limit concurrent connections per server
- Use Redis adapter for multi-server setup
- Implement connection queuing

### 2. Message Queueing
- Queue messages if receiver is offline
- Use MongoDB for persistence
- Deliver queued messages on reconnection

### 3. Memory Management
- Limit in-memory user map size
- Clean up inactive connections
- Implement garbage collection

### 4. Bandwidth Optimization
- Compress WebSocket messages
- Send diffs instead of full objects
- Implement message batching for bulk operations

### 5. Scalability
- Use Socket.IO Redis adapter for horizontal scaling
- Load balance connections across multiple servers
- Implement connection stickiness

---

## Common Pitfalls & Solutions

### Issue: Messages not syncing between tabs
**Solution**: Use localStorage + window.postMessage for cross-tab sync
```javascript
window.addEventListener('storage', (e) => {
  if (e.key === 'ws_message') {
    const message = JSON.parse(e.newValue);
    setMessages(prev => [...prev, message]);
  }
});
```

### Issue: High CPU usage on server
**Solution**: Implement throttling for typing indicators
```javascript
let lastTypingTime = Date.now();
if (Date.now() - lastTypingTime > 300) {
  socket.emit('user_typing', { receiverId });
  lastTypingTime = Date.now();
}
```

### Issue: Reconnection creates duplicate messages
**Solution**: Use unique message IDs + server deduplication
```javascript
socket.emit('send_message', {
  ...message,
  clientId: `${userId}_${timestamp}` // Unique ID
});
```

### Issue: Mobile battery drain from frequent pings
**Solution**: Increase ping interval on mobile
```javascript
const pingInterval = isMobile ? 60000 : 25000;
const pingTimeout = isMobile : 120000 : 60000;
```

---

## Summary

This implementation guide provides a complete roadmap for adding WebSocket functionality to Nexus Connect. The phased approach allows for incremental development and testing, while maintaining backward compatibility with existing HTTP APIs.

**Key Benefits After Implementation**:
- ✅ Real-time messaging
- ✅ Online/offline presence
- ✅ Typing indicators  
- ✅ Read receipts
- ✅ Unread message counters
- ✅ Lower latency
- ✅ Better user experience

**Estimated Timeline**: 4-5 weeks for full implementation
**Complexity**: Medium (builds on existing architecture)
**Technology**: Socket.IO (battle-tested, widely used)

---

## Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [Socket.IO Client Documentation](https://socket.io/docs/client-api/)
- [WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
- [Real-time Communication Best Practices](https://www.npmjs.com/package/socket.io)
- [Scaling Socket.IO with Redis](https://socket.io/docs/v4/redis-adapter/)
