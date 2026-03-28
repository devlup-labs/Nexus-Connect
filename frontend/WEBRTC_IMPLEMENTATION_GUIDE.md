# WebRTC Voice and Video Calling Implementation Guide

## 1) Current Project Analysis

This section summarizes the current architecture and behavior based on a full codebase review.

### Backend summary

- Backend server bootstraps Express + Socket.IO in `backend/src/server.js`.
- WebSocket server is initialized in `backend/src/lib/socket.js`.
- Existing socket events support:
  - user presence (`user_connected`, `active_users`, `user_status_update`)
  - messaging (`send_message`, `message_received`, `message_sent`)
  - typing (`user_typing`, `user_stopped_typing`)
  - read receipts (`mark_as_read`, `messages_read`)
- Auth is cookie + JWT based (`backend/src/middleware/auth.middleware.js`).
- Existing call persistence is minimal:
  - model: `backend/src/models/call.js`
  - controller: `backend/src/controllers/call.controller.js`
  - route: `backend/src/routes/call.route.js` -> `POST /api/calls`, `GET /api/calls`
- Current call data supports only:
  - `callerId`, `receiverId`, `startTime`, `endTime`, `type (0|1)`

### Frontend summary

- Socket client setup is in `frontend/src/services/socket.js`.
- Socket initialization is done in `frontend/src/App.jsx` once authenticated.
- Chat UI exists in `frontend/src/Components/ChatContainer.jsx`.
- Call icons are present in chat header (`Phone`, `Video`) but currently have no click handlers for real calling.
- Contacts context menu includes `Voice Call` and `Video Call` actions, but handlers are empty.
- `frontend/src/Components/CallLog.jsx` is currently hardcoded mock data and not connected to backend `GET /api/calls`.

### Key gap to close

The app has messaging sockets and call logs, but no WebRTC signaling and no peer-connection lifecycle.

To implement real voice/video calls, you need:

1. Socket signaling events for SDP and ICE.
2. Frontend RTCPeerConnection lifecycle management.
3. Ringing/accept/reject/end call states.
4. Reliable call logging at call end.
5. TURN/STUN configuration for NAT traversal.

---

## 2) Target Calling Architecture

### Recommended design

- Use existing Socket.IO as signaling channel.
- Keep media P2P over WebRTC.
- Persist call lifecycle in MongoDB.
- Use STUN + TURN servers from environment variables.

### High-level call flow

1. Caller clicks voice/video button.
2. Caller emits `call:invite`.
3. Receiver sees incoming UI.
4. Receiver accepts or rejects.
5. If accepted:
   - Caller creates offer -> emits `call:offer`
   - Receiver sets remote offer, creates answer -> emits `call:answer`
   - Both exchange `call:ice-candidate`
6. Media starts once peer connection is established.
7. On hangup/reject/failure, emit `call:end` and write final call log.

---

## 3) Backend Code Changes (Planned, Not Applied)

## 3.1 Update Call model

File to edit: `backend/src/models/call.js`

Replace numeric type and add status lifecycle fields.

```js
import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    callType: {
      type: String,
      enum: ["voice", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["ringing", "answered", "rejected", "missed", "canceled", "ended", "failed"],
      default: "ringing",
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    answeredAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    durationSec: {
      type: Number,
      default: 0,
    },
    endedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    endReason: {
      type: String,
      enum: ["hangup", "reject", "missed", "cancel", "network", "error"],
      default: null,
    },
  },
  { timestamps: true }
);

callSchema.index({ callerId: 1, startedAt: -1 });
callSchema.index({ receiverId: 1, startedAt: -1 });

const Call = mongoose.model("Call", callSchema);
export default Call;
```

## 3.2 Add signaling state and events in Socket.IO

File to edit: `backend/src/lib/socket.js`

Add in-memory structures:

```js
// Map<userId, socketId> already exists as activeUsers
// Add active call map
const activeCalls = new Map();
// activeCalls.set(callId, {
//   callerId,
//   receiverId,
//   callType,
//   status,
//   startedAt,
// });
```

Add event contracts:

- `call:invite` (caller -> server)
- `call:incoming` (server -> receiver)
- `call:ringing` (server -> caller)
- `call:accept` (receiver -> server)
- `call:accepted` (server -> caller)
- `call:reject` (receiver -> server)
- `call:rejected` (server -> caller)
- `call:offer` (peer -> server -> peer)
- `call:answer` (peer -> server -> peer)
- `call:ice-candidate` (peer -> server -> peer)
- `call:end` (peer -> server -> peer)
- `call:ended` (server -> both)

Reference implementation snippet:

```js
import crypto from "crypto";
import Call from "../models/call.js";

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

    const receiverSocketId = activeUsers.get(String(toUserId));
    if (!receiverSocketId) {
      return ack?.({ ok: false, error: "User is offline" });
    }

    const callId = crypto.randomUUID();
    const startedAt = new Date();

    activeCalls.set(callId, {
      callerId: String(fromUserId),
      receiverId: String(toUserId),
      callType,
      status: "ringing",
      startedAt,
    });

    await Call.create({
      callId,
      callerId: fromUserId,
      receiverId: toUserId,
      callType,
      status: "ringing",
      startedAt,
    });

    io.to(receiverSocketId).emit("call:incoming", {
      callId,
      fromUserId,
      callType,
      startedAt,
    });

    socket.emit("call:ringing", { callId, toUserId, callType, startedAt });

    return ack?.({ ok: true, callId });
  } catch (error) {
    return ack?.({ ok: false, error: "Failed to invite" });
  }
});
```

Relay SDP/ICE safely:

```js
function getOtherParticipant(callInfo, userId) {
  if (!callInfo) return null;
  if (String(callInfo.callerId) === String(userId)) return String(callInfo.receiverId);
  if (String(callInfo.receiverId) === String(userId)) return String(callInfo.callerId);
  return null;
}

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
```

End call and persist final state:

```js
async function finalizeCall({ callId, endedBy, status, endReason }) {
  const active = activeCalls.get(callId);
  if (!active) return;

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
```

Disconnect handling:

- On disconnect, if user is caller/receiver in active call, mark call as `failed` or `missed` based on current state.

## 3.3 Improve call controller for logs

File to edit: `backend/src/controllers/call.controller.js`

Replace current create/get with log-focused queries from updated schema:

```js
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
    res.status(500).json({ message: "Internal Server Error" });
  }
};
```

Optional: keep `POST /api/calls` for backward compatibility but move real lifecycle persistence to socket events.

## 3.4 Routes

File to edit: `backend/src/routes/call.route.js`

Keep:
- `GET /api/calls`

Optional:
- remove `POST /api/calls` if not used by frontend.

## 3.5 Environment variables (backend)

Add to `.env`:

```env
CLIENT_URL=http://localhost:5173

# Public STUN list for development
WEBRTC_ICE_SERVERS=[{"urls":"stun:stun.l.google.com:19302"}]

# TURN for production (recommended)
# WEBRTC_ICE_SERVERS=[{"urls":"stun:stun.l.google.com:19302"},{"urls":"turn:turn.yourdomain.com:3478","username":"user","credential":"pass"}]
```

Expose this in `backend/src/lib/env.js` and optionally provide endpoint `GET /api/calls/ice-servers` for dynamic configuration.

---

## 4) Frontend Code Changes (Planned, Not Applied)

## 4.1 Extend API layer for calls

File to edit: `frontend/src/api.js`

```js
export const getCallLogs = () => API.get("/calls");
```

If you choose dedicated endpoint for ICE servers:

```js
export const getIceServers = () => API.get("/calls/ice-servers");
```

## 4.2 Add a WebRTC client service

New file: `frontend/src/services/webrtc.js`

Responsibilities:

- Manage `RTCPeerConnection`.
- Start local media (`getUserMedia`).
- Emit/handle offer, answer, ICE events over existing socket.
- Cleanup tracks and peer connection.

Reference structure:

```js
let pc = null;
let localStream = null;
let remoteStream = null;

export function getLocalStream() {
  return localStream;
}

export function getRemoteStream() {
  return remoteStream;
}

export async function createPeerConnection({ iceServers, onIceCandidate, onTrack, onConnectionStateChange }) {
  pc = new RTCPeerConnection({ iceServers });
  remoteStream = new MediaStream();

  pc.onicecandidate = (event) => {
    if (event.candidate) onIceCandidate(event.candidate);
  };

  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
    onTrack(remoteStream);
  };

  pc.onconnectionstatechange = () => {
    onConnectionStateChange?.(pc.connectionState);
  };

  return pc;
}

export async function startLocalMedia(callType) {
  const constraints = callType === "video"
    ? { audio: true, video: { width: 1280, height: 720 } }
    : { audio: true, video: false };

  localStream = await navigator.mediaDevices.getUserMedia(constraints);
  return localStream;
}

export function addLocalTracks() {
  if (!pc || !localStream) return;
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
}

export async function createOffer() {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

export async function applyRemoteOffer(offer) {
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
}

export async function createAnswer() {
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

export async function applyRemoteAnswer(answer) {
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

export async function addIceCandidate(candidate) {
  if (!pc) return;
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
}

export function cleanupWebRTC() {
  if (pc) {
    pc.ontrack = null;
    pc.onicecandidate = null;
    pc.close();
    pc = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }

  if (remoteStream) {
    remoteStream.getTracks().forEach((t) => t.stop());
    remoteStream = null;
  }
}
```

## 4.3 Add call state and UI container

New file: `frontend/src/Components/CallOverlay.jsx`

Suggested states:

- `idle`
- `dialing`
- `incoming`
- `connecting`
- `connected`
- `ended`

UI controls:

- Accept
- Reject
- End
- Toggle mute
- Toggle camera
- Switch audio output (optional)

## 4.4 Integrate call actions in chat

File to edit: `frontend/src/Components/ChatContainer.jsx`

Where currently no-op icons exist, wire handlers:

```jsx
<button onClick={() => startCall("voice")}>
  <Phone size={18} strokeWidth={1.5} />
</button>
<button onClick={() => startCall("video")}>
  <Video size={18} strokeWidth={1.5} />
</button>
```

`startCall` flow:

1. socket emit `call:invite`.
2. create local stream.
3. create peer connection.
4. after `call:accepted`, create and send offer.

Also add socket listeners for signaling events in component root or in App-level provider.

## 4.5 Integrate incoming calls globally

File to edit: `frontend/src/App.jsx`

Add global listener once socket exists:

- `call:incoming` -> show incoming modal regardless of current page.
- Accept/reject from modal.

This is important so user can receive calls from `contacts`, `settings`, or `call-log` screens.

## 4.6 Replace mock CallLog with API data

File to edit: `frontend/src/Components/CallLog.jsx`

Replace hardcoded `callLogs` with `getCallLogs()`.

Transform each log item:

- `name`: other participant name
- `type`: incoming/outgoing based on current user ID
- `callType`: voice/video
- `status`: answered/missed/rejected
- `time`: formatted from `startedAt`
- `duration`: from `durationSec` if answered

---

## 5) WebRTC Signaling Event Contracts

Use these payload shapes consistently.

## call:invite

```json
{
  "toUserId": "<mongo-user-id>",
  "callType": "voice"
}
```

Ack:

```json
{ "ok": true, "callId": "uuid" }
```

## call:incoming

```json
{
  "callId": "uuid",
  "fromUserId": "<mongo-user-id>",
  "callType": "video",
  "startedAt": "2026-03-28T12:00:00.000Z"
}
```

## call:offer / call:answer

```json
{
  "callId": "uuid",
  "sdp": {
    "type": "offer",
    "sdp": "v=0..."
  }
}
```

## call:ice-candidate

```json
{
  "callId": "uuid",
  "candidate": {
    "candidate": "candidate:...",
    "sdpMid": "0",
    "sdpMLineIndex": 0
  }
}
```

## call:end

```json
{
  "callId": "uuid",
  "endReason": "hangup"
}
```

---

## 6) Security and Reliability Rules

1. Validate participant identity on every signaling event.
2. Never trust `fromUserId` from client payload; derive from `socket.userId`.
3. Ensure only call participants can exchange SDP/ICE for that call.
4. Add call timeout (for example 30 seconds): unanswered call -> `missed`.
5. On disconnect during active call, finalize with `failed`.
6. Use TURN in production. STUN-only is unreliable for many networks.
7. Enforce one active call per user (optional but recommended for simplicity).

---

## 7) Step-by-Step Integration Plan

1. Upgrade call model and migration handling.
2. Add socket signaling events to backend.
3. Add frontend WebRTC service and overlay UI.
4. Wire chat header call buttons.
5. Add global incoming call handler in App.
6. Replace call log mock with backend API.
7. Add timeout/cleanup logic and disconnect fallback.
8. Test voice and video across two browsers/devices.
9. Test network switch, refresh, and abrupt tab close.
10. Verify call logs for answered, missed, rejected, canceled.

---

## 8) Testing Checklist

## Functional

- Voice call connect success.
- Video call connect success.
- Reject flow works.
- Missed call auto-log works.
- Caller cancel before answer works.
- End call from either side works.
- Reconnect after page refresh works cleanly.

## Edge cases

- Receiver offline on invite.
- User disconnects while ringing.
- User disconnects mid-call.
- Microphone permission denied.
- Camera permission denied (video call).
- ICE connection fails.

## Data

- `status` correct in all outcomes.
- `durationSec` is zero unless call answered.
- Logs sorted descending by `startedAt`.

---

## 9) Important Notes About Existing Code

1. Calling UI currently exists but is not wired to signaling.
2. Call logs UI is currently mock data; backend logs are not yet consumed.
3. Existing socket auth uses `user_connected` after connect; this should continue unchanged.
4. Existing messaging socket handlers can coexist with call signaling in same connection.

---

## 10) Final Outcome After Implementation

After applying the planned changes above, Nexus Connect will support:

- Real-time one-to-one voice calls using WebRTC.
- Real-time one-to-one video calls using WebRTC.
- Secure Socket.IO signaling integrated with existing backend.
- Reliable call lifecycle persistence in MongoDB.
- Real call history rendering in Call Log screen.

This guide intentionally documents the implementation path only. No existing source code has been modified by this document generation step.
