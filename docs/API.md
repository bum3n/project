# iWa Messenger — API Documentation

Base URL: `http://localhost:3000/api/v1`

All protected endpoints require the `Authorization: Bearer <access_token>` header.

---

## Authentication

### POST /auth/register
Register a new user.

**Body:**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "StrongPass123!",
  "displayName": "Alice"
}
```

**Response 201:**
```json
{
  "user": { "id": "...", "username": "alice", "email": "...", "displayName": "Alice" },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

### POST /auth/login
Authenticate an existing user.

**Body:**
```json
{ "email": "alice@example.com", "password": "StrongPass123!" }
```

**Response 200:** Same as register.

---

### POST /auth/refresh
Rotate access + refresh tokens.

**Body:**
```json
{ "refreshToken": "eyJ..." }
```

**Response 200:**
```json
{ "accessToken": "eyJ...", "refreshToken": "eyJ..." }
```

---

### POST /auth/logout *(protected)*
Invalidate the current refresh token.

**Body:**
```json
{ "refreshToken": "eyJ..." }
```

**Response 204:** No content.

---

## Users

### GET /users/me *(protected)*
Get the current user's profile.

### PUT /users/me *(protected)*
Update profile (displayName, bio, username).

**Body:** `multipart/form-data` — fields: `displayName`, `bio`, `username`; file: `avatar`

### GET /users/search?q=alice *(protected)*
Search users by username or display name.

### GET /users/:id *(protected)*
Get a user's public profile.

---

## Chats

### GET /chats *(protected)*
List all chats the current user is a member of, sorted by last message time.

### POST /chats *(protected)*
Create a private chat with another user, or a group chat.

**Body (private):**
```json
{ "type": "PRIVATE", "userId": "<target-user-id>" }
```

**Body (group):**
```json
{ "type": "GROUP", "name": "Dev Team", "memberIds": ["id1", "id2"] }
```

### GET /chats/:id *(protected)*
Get chat details (members, last message, unread count).

### DELETE /chats/:id *(protected)*
Leave / delete a chat (owner only for group chats).

### GET /chats/search?q=dev *(protected)*
Search chats by name.

---

## Messages

### GET /chats/:chatId/messages *(protected)*
Get paginated message history.

**Query:** `cursor` (last seen message id), `limit` (default 50)

**Response 200:**
```json
{
  "messages": [...],
  "nextCursor": "msg-id-or-null"
}
```

### POST /chats/:chatId/messages *(protected)*
Send a message (text or with attachments).

**Body:** `multipart/form-data` — fields: `content`, `type`, `replyToId`; files: `attachments[]`

### PATCH /messages/:id *(protected)*
Edit a message (sender only, text messages only).

### DELETE /messages/:id *(protected)*
Soft-delete a message (sender only).

### POST /chats/:chatId/messages/read *(protected)*
Mark all messages in a chat as read.

---

## Notifications

### GET /notifications *(protected)*
List unread + recent notifications.

**Query:** `cursor`, `limit`

### PATCH /notifications/:id/read *(protected)*
Mark a notification as read.

### PATCH /notifications/read-all *(protected)*
Mark all notifications as read.

---

## WebSocket Events (Socket.io)

Connect: `ws://localhost:3000` with query `token=<access_token>`.

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join_chat` | `{ chatId }` | Join a chat room |
| `leave_chat` | `{ chatId }` | Leave a chat room |
| `send_message` | `{ chatId, content, type?, replyToId? }` | Send a message |
| `typing_start` | `{ chatId }` | Start typing indicator |
| `typing_stop` | `{ chatId }` | Stop typing indicator |
| `mark_read` | `{ chatId, messageId }` | Mark messages as read |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `new_message` | `Message` | New message in a chat room |
| `message_updated` | `Message` | Message edited |
| `message_deleted` | `{ id, chatId }` | Message soft-deleted |
| `typing` | `{ chatId, userId, username, isTyping }` | Typing indicator |
| `messages_read` | `{ chatId, userId, lastReadAt }` | Read receipt |
| `user_online` | `{ userId }` | User came online |
| `user_offline` | `{ userId, lastSeenAt }` | User went offline |
| `notification` | `Notification` | New in-app notification |
