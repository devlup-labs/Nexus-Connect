# Nexus Connect - Full Project Analysis

## 1) What This Project Is

Nexus Connect is a real-time chat and calling platform with:
- JWT cookie authentication
- Real-time messaging over Socket.IO
- Message lifecycle states (`sent`, `delivered`, `read`)
- User presence (`online`, `offline`)
- Voice/video call signaling over WebSockets + WebRTC media
- Optional end-to-end encryption (E2EE) for text messages
- Rich chat attachments (images, video, documents, voice notes)
- Theming system with multiple visual themes and animated backgrounds

It is split into:
- `backend/` (Node.js + Express + MongoDB + Socket.IO)
- `frontend/` (React + Vite + Tailwind utilities + custom CSS variables)

---

## 2) Repository Structure and Roles

### Root
- `package.json`: convenience scripts for full build/start (`backend` + `frontend`).
- `LICENSE`
- `tmp/`: temporary local test scripts for E2EE/session logic validation.

### Backend
- `backend/src/server.js`: app bootstrap, middleware, route mounting, production static serving, socket startup.
- `backend/src/routes/*`: route definitions by domain.
- `backend/src/controllers/*`: request handlers and business logic.
- `backend/src/models/*`: MongoDB schemas.
- `backend/src/middleware/*`: auth and Arcjet security middleware.
- `backend/src/lib/*`: DB/env/socket/token/security/util integrations.

### Frontend
- `frontend/src/App.jsx`: top-level app shell, auth gate, socket and call orchestration.
- `frontend/src/api.js`: Axios API client and endpoint wrappers.
- `frontend/src/Components/*`: major UI panels and interactive components.
- `frontend/src/services/*`: socket client, WebRTC helper, E2EE cryptographic stack and storage.
- `frontend/src/contexts/ThemeContext.jsx`: theme state and persistence.
- `frontend/src/themes.css`, `frontend/src/index.css`, `frontend/src/mobile.css`: design tokens, global style, responsive behavior.

---

## 3) End-to-End Runtime Flow

## 3.1 Startup
1. Backend starts (`backend/src/server.js`).
2. Loads env vars and configures DNS resolvers.
3. Creates Express app and HTTP server.
4. Initializes Socket.IO (`initializeSocket(httpServer)`).
5. Registers JSON parser, cookies, CORS.
6. Mounts API routes under `/api/*`.
7. In production, serves `frontend/dist` and falls back to `index.html` for SPA routing.
8. Connects to MongoDB on server listen.

## 3.2 Frontend bootstrap
1. React entry (`frontend/src/main.jsx`) renders `App`.
2. `App` checks auth via `GET /api/auth/check`.
3. If authenticated:
   - Initializes socket client and emits `user_connected`.
   - Ensures E2EE keys are ready/registered (`ensureKeysRegistered`).
   - Renders dock + stream/chat/settings/call-log panels.
4. If not authenticated:
   - Renders login/signup flow.

---

## 4) Backend Deep Dive

## 4.1 Server and Middleware

### `backend/src/server.js`
Key responsibilities:
- `express.json({ limit: "50mb" })`
- `cookieParser()`
- `cors({ origin: process.env.CLIENT_URL, credentials: true })`
- Health endpoint: `GET /health`
- Route mounting:
  - `/api/auth`
  - `/api/messages`
  - `/api/users`
  - `/api/calls`
  - `/api/keys`
- Production SPA serving from `frontend/dist`

### Auth middleware
`backend/src/middleware/auth.middleware.js`
- Reads JWT from `req.cookies.jwt`.
- Verifies token with `JWT_SECRET`.
- Loads current user (excluding password) and attaches to `req.user`.

### Arcjet middleware
`backend/src/middleware/arcjet.middleware.js`
- Applies Arcjet decisioning from `backend/src/lib/arcjet.js`.
- Handles deny reasons:
  - rate limit -> `429`
  - bot -> `403`
  - policy deny -> `403`
- Detects spoofed bots with `@arcjet/inspect`.

### Utility/token
`backend/src/lib/utils.js`
- Creates 7-day JWT cookie.
- Uses production-aware cookie settings:
  - production: `SameSite=None`, `Secure=true`
  - non-production: `SameSite=lax`, `Secure=false`

---

## 4.2 API Surface

### Auth (`/api/auth`)
Defined in `auth.route.js`, implemented in `controllers/auth.js`.
- `POST /signup`
- `POST /login`
- `POST /logout`
- `PUT /update-profile` (protected)
- `GET /check` (protected)

Behavior:
- Signup validates required fields, email format, password length.
- Password hashing via `bcryptjs`.
- Login returns user profile and sets JWT cookie.
- Profile update supports name/about and profile picture upload to Cloudinary.

### Messages (`/api/messages`)
Defined in `message.route.js`, implemented in `controllers/message.js`.
- `GET /contacts`
- `GET /chats`
- `GET /:id` (conversation with user)
- `POST /send/:id`
- `PUT /:id` (edit)
- `POST /reply/:id`
- `DELETE /delete-me/:id`
- `DELETE /delete-everyone/:id`

Behavior:
- Supports plaintext (`text`, `image`) and E2EE payloads (`ciphertext`, `nonce`, `ratchetHeader`).
- Sets initial status based on receiver online state (`sent` vs `delivered`).
- Emits real-time events for receive/edit/delete.
- Chat list endpoint masks encrypted preview as `Encrypted message` server-side unless frontend has local cache.

### Users (`/api/users`)
Defined in `user.route.js`, implemented in `controllers/user.controller.js`.
- `PATCH /archive/:id`
- `GET /archived`

Behavior:
- Per-user archive list (`archivedUsers`) controls chat visibility.

### Calls (`/api/calls`)
Defined in `call.route.js`, implemented in `controllers/call.controller.js`.
- `POST /`
- `GET /`

Behavior:
- Persists call records and fetches call history for authenticated user.

### Key Bundles (`/api/keys`)
Defined in `keys.route.js`, implemented in `controllers/keys.controller.js`.
- `POST /register`
- `GET /bundle/:userId`
- `POST /rotate-signed-prekey`
- `POST /upload-one-time-prekeys`
- `GET /has-keys/:userId`

Behavior:
- Stores identity key + signed prekey + one-time prekeys.
- `getKeyBundle` consumes one unused one-time prekey (marks as used).

---

## 4.3 Data Models (MongoDB)

### `User`
Fields:
- `email` (unique)
- `fullName`
- `password`
- `profilePic`
- `about`
- `archivedUsers[]`

### `Message`
Supports dual modes:
- Plaintext mode: `text`, `image`, `encryptionVersion = none`
- E2EE mode: `ciphertext`, `nonce`, `ratchetHeader`, key metadata, `encryptionVersion = e2ee-v1`

Also includes:
- `replyTo`
- `isEdited`
- `deletedBy[]`
- `status: sent|delivered|read`
- `readAt`

### `Call`
Fields include:
- `callId` (unique)
- `callerId`, `receiverId`
- `callType: voice|video`
- `status: ringing|answered|rejected|missed|ended|failed`
- `startedAt`, `answeredAt`, `endedAt`, `durationSec`
- `endedBy`, `endReason`

### `KeyBundle`
- `userId` unique
- `identityKeyPublic`
- `signedPreKey` (id + pub + signature)
- `oneTimePreKeys[]` with `used` flag

---

## 4.4 Socket.IO Event System

Core socket implementation: `backend/src/lib/socket.js`

### Presence
- `user_connected`
- `active_users:request`
- Broadcasts:
  - `active_users`
  - `user_status_update`

Tracks `Map<userId, Set<socketId>>` so one user can have multiple tabs/devices.

### Messaging
Inbound:
- `send_message`
- `user_typing`
- `user_stopped_typing`
- `mark_as_read`

Outbound:
- `message_received`
- `message_sent_ack`
- `typing_indicator`
- `messages_read`
- `message_edited`
- `message_deleted`

### Calling (signaling)
Inbound:
- `call:invite`
- `call:accept`
- `call:reject`
- `call:end`
- `call:offer`
- `call:answer`
- `call:ice-candidate`

Outbound:
- `call:incoming`
- `call:ringing`
- `call:accepted`
- `call:ended`
- forwarding of offer/answer/ICE

Call sessions are tracked in-memory with timeout logic for missed calls.
Call finalization persists status and duration to MongoDB.

---

## 5) Frontend Deep Dive

## 5.1 App shell and navigation

### `frontend/src/App.jsx`
Main responsibilities:
- Auth gate (`checkAuth`).
- Socket initialization on authenticated user.
- E2EE key registration kickoff.
- Global call state machine (`idle`, `dialing`, `ringing`, `incoming`, `connecting`, `connected`, etc.).
- WebRTC signaling integration through socket events.
- View switching among:
  - Home
  - Messages (ChatContainer)
  - Contacts
  - Call Log
  - Settings

Layout pattern:
- Left dock navigation (`Dock`).
- Stream/contact panel.
- Main content panel.
- Mobile uses horizontal panel snapping and bottom dock (`mobile.css`).

---

## 5.2 API client layer

`frontend/src/api.js`
- Axios instance with `withCredentials: true`.
- Base URL from `VITE_URL` or local `/api` (works with Vite proxy).
- Exposes grouped wrappers:
  - auth
  - messages
  - users
  - calls
  - key management

---

## 5.3 Chat system (UI + realtime + E2EE)

### `ChatContainer.jsx`
This is the most complex frontend file.

Major capabilities:
- Fetches chat history via REST (`getMessages`).
- Applies batch decrypt for E2EE history (`decryptMessagesBatch`).
- Handles live message/socket updates.
- Typing indicators.
- Read receipts via socket `mark_as_read`.
- Message editing/deleting/forwarding/replying/select mode.
- Rich attachment rendering:
  - image viewer + lightbox
  - custom audio player
  - custom video player
  - document cards + download
- Message search with next/prev match navigation.
- Profile side panel for selected contact.
- Context menu actions, including `Reset E2EE Session`.

Sending flow:
1. Build optimistic message.
2. If text-only and crypto ready, attempt `encryptMessage`.
3. If encrypted payload exists, send ciphertext-based body.
4. If unsupported partner and no E2EE expectation, fallback to plaintext.
5. Replace optimistic message with API response.
6. Cache decrypted plaintext for future previews/reloads.

---

## 5.4 Stream panel (chat list)

### `StreamPanel.jsx`
Responsibilities:
- Fetch chat partner list and last message preview.
- Display online states and unread badges.
- Resolve encrypted preview text from local decrypted cache.
- Real-time refresh on incoming/sent/edited messages.
- Archive/unarchive UI and modal.
- Custom context menu for feed-level actions.

Chat cards adapt by media type:
- text
- image
- video
- voice/audio
- document

---

## 5.5 Contacts, calls, settings, home

### `ContactsPanel.jsx`
- Full user directory from `GET /messages/contacts`.
- Presence updates from socket.
- Profile drawer and lightbox.
- Send message action hands selected contact back to parent.

### `CallOverlay.jsx`
- Renders incoming/ringing/connected call UI.
- Controls mute/video toggles via WebRTC service.
- Displays local and remote streams.
- Plays ringtone loop with Web Audio API during ringing states.

### `CallLog.jsx`
- Loads call history from backend.
- Filters by missed/incoming/outgoing/voice/video.
- One-click callback (voice/video).

### `Settings.jsx`
- Profile editing and profile picture crop/upload.
- Theme selection.
- Notification/language toggles (UI state currently local).
- E2EE operations:
  - Export backup
  - Import backup
  - Reset local E2EE state

### `HomePanel.jsx`
- Dashboard-like summary view.
- Pulls chat and call stats.
- Clock widget and quick actions.

---

## 5.6 E2EE Architecture (Frontend Services)

## Crypto layer
`frontend/src/services/cryptoService.js`
- libsodium init
- X25519 keypair generation and DH
- Ed25519 signing
- HKDF-like derivations
- XChaCha20-Poly1305 encryption/decryption
- base64 conversions

## X3DH handshake
`frontend/src/services/x3dh.js`
- `performX3DH` for initiator.
- `respondX3DH` for responder.
- Produces initial shared secret for ratchet session setup.

## Double Ratchet
`frontend/src/services/doubleRatchet.js`
- Session state with DH and symmetric chains.
- Ratchet encrypt/decrypt.
- Header format includes ratchet pubkey, counters.
- Skipped-key handling for out-of-order delivery.
- Serialization/deserialization helpers.

## Session + key orchestration
`frontend/src/services/keyManager.js`
- Ensures identity/signing/prekeys exist.
- Registers public bundle with server.
- Creates sessions on demand.
- Encrypt/decrypt wrappers for UI layer.
- Recovery paths for session/key resets.
- Archive-aware fallback decryption attempts.
- In-memory lock per partner to avoid race conditions.

## Persistent storage
`frontend/src/services/sessionStore.js`
IndexedDB stores:
- `identityKeys`
- `sessions`
- `metadata`
- decrypted message caches (`decryptedCache`, `decryptedCacheV2`)
- archived keys/sessions

Also supports:
- full E2EE export/import JSON backup
- reset/clear operations

---

## 5.7 WebRTC service

`frontend/src/services/webrtc.js`
- Peer connection lifecycle helper.
- local media acquisition.
- track attaching.
- offer/answer create/apply.
- ICE candidate queueing (before remote description available).
- cleanup and mute/video toggles.

Important: backend sockets only signal SDP/ICE; audio/video streams are peer-to-peer via WebRTC.

---

## 6) Theme and UI System

### Theme state
`ThemeContext.jsx`
- Persists active theme to localStorage key `nexus-connect-theme`.
- Applies theme through `data-theme` on document root.

### Tokens
`themes.css`
- Defines large CSS variable sets per theme (nexus, light, cosmic, teal, carbon, nightowl, cyberpunk, sakura, celestia, reddit, 4chan).
- Variables include colors, surface opacities, borders, glow, status colors, dock styling, font tokens.

### Responsive behavior
`mobile.css`
- Converts side dock to bottom nav on phones.
- Uses horizontal snapping between panels.
- Adapts headings and panel widths to full viewport.

### Animated backgrounds
- `NexusBackground.jsx` (starfield + planet)
- `SakuraBackground.jsx` (falling petals)
- `CelestiaBackground.jsx` (dust/mountains/moon)

---

## 7) Environment and Config Requirements

From `backend/src/lib/env.js` and runtime usage:

Required backend vars:
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `NODE_ENV`
- `CLIENT_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ARCJET_KEY`
- `ARCJET_ENV`
- Also used by resend helper: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`

Frontend vars:
- `VITE_URL` (API/server origin)
- optional `VITE_WS_URL` (socket endpoint override)

Vite proxy (`frontend/vite.config.js`) forwards:
- `/api` -> backend
- `/socket.io` -> backend with websocket support

---

## 8) Build and Run

## Root scripts
- `npm run build`
  - installs backend deps
  - installs frontend deps
  - builds frontend
- `npm run start`
  - starts backend server

## Backend
- `npm run dev --prefix backend`
- `npm run start --prefix backend`

## Frontend
- `npm run dev --prefix frontend`
- `npm run build --prefix frontend`
- `npm run preview --prefix frontend`

Production serving pattern:
- backend serves API + socket + static frontend from `frontend/dist`.

---

## 9) Temporary Test Scripts in `tmp/`

These are standalone local sanity checks, not integrated into automated test runners.

- `tmp/test_e2ee_restoration.js`
  - simulates restoring session metadata and verifying `_meta` reconstruction.

- `tmp/test_session_reset_flow.js`
  - simulates reset + re-establish flow and verifies encrypted send resumes.

---

## 10) Observed Implementation Notes (Important)

These are architectural observations to understand current behavior:

1. E2EE is text-focused.
- Text messages can be E2EE.
- Attachments currently flow through plaintext media upload path.

2. Message preview and resilience are cache-assisted.
- Encrypted previews rely heavily on local decrypted cache (`decryptedCacheV2`) when server only stores ciphertext.

3. Session reset and recovery are intentionally defensive.
- App includes archive-backed recovery and reset logic to survive ratchet/key drift.

4. Presence model supports multiple sockets per user.
- Backend tracks sets of socket IDs for each user.

5. Calling uses mixed persistence paths.
- Realtime call logs are persisted from socket flow.
- There is also REST `createCallLog` path.

6. Security middleware coverage differs by route.
- Arcjet is used on most route groups.
- Keys route currently uses auth protection but not Arcjet wrapper.

7. Frontend import casing is mixed (`Components` and `components`).
- Works on Windows (case-insensitive FS).
- Can break on Linux/macOS deployments if path casing is inconsistent.

---

## 11) How Everything Connects (Short Summary)

Nexus Connect combines:
- REST for persistence and initial loads,
- Socket.IO for live updates and signaling,
- WebRTC for peer media,
- and a client-managed Signal-inspired E2EE stack for encrypted chat text.

Backend keeps authoritative user/message/call/key-bundle data in MongoDB. Frontend handles rich UX, encryption session lifecycle, decrypted cache management, and theme-driven interface rendering.

The result is a full-stack messaging platform with modern real-time behavior and an advanced (client-side) cryptographic messaging path layered on top of standard API/socket infrastructure.
