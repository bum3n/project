# iWa Messenger

A production-structured real-time messenger application inspired by Telegram. Built with Node.js (Express), React (Vite), PostgreSQL (Prisma ORM), and Socket.io.

> This repository also contains **Шакальность (Shakalnost)** — see [below](#shakalnost-desktop-meme-editor).

---

## Project Structure

```
/
├── client/          React + Vite + Tailwind CSS frontend
├── server/          Node.js + Express + Socket.io backend
├── database/        Prisma schema reference copy
├── docs/            API documentation
├── src/             Shakalnost C++ source
└── CMakeLists.txt   Shakalnost build
```

---

## iWa Messenger

### Features

- 🔐 JWT authentication (access + refresh tokens, rotation, replay protection)
- 👤 User profiles (avatar, bio, username, online/offline status)
- 💬 Private 1-to-1 chats (auto-created on first message)
- 👥 Group chats (create, manage members)
- ⚡ Real-time messaging via Socket.io
- 📜 Persistent message history in PostgreSQL
- ✅ Read / unread message status & delivery receipts
- 🔍 Search users and chats
- 📎 File & image attachments (local storage, cloud-ready)
- 🟢 Online / offline presence
- 🔔 In-app notifications
- 😊 Emoji support

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS, Zustand |
| Backend | Node.js, Express, TypeScript |
| Real-time | Socket.io |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File uploads | Multer (local storage) |
| Validation | Zod |

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or pnpm

### Setup

#### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

#### 2. Configure environment

```bash
cd server
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT secrets
```

#### 3. Set up the database

```bash
cd server
npx prisma migrate dev --name init
npx prisma db seed   # Optional: seed demo accounts
```

Demo accounts after seeding (password: `Demo1234!`):
- `alice@iwa.app`
- `bob@iwa.app`
- `carol@iwa.app`

#### 4. Run

```bash
# Terminal 1 — backend (http://localhost:3000)
cd server && npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd client && npm run dev
```

### API Documentation

See [`docs/API.md`](docs/API.md) for the complete REST + WebSocket API reference.

### Architecture

```
server/src/
  routes/        Express routers per resource
  controllers/   HTTP request handlers
  services/      Business logic layer
  middleware/    Auth guard, error handler, file upload
  socket/        Socket.io real-time hub
  utils/         JWT helpers, password hashing, storage
  config/        Prisma client, JWT config

client/src/
  api/           Axios modules (auth, users, chats, messages)
  socket/        Socket.io singleton
  store/         Zustand global state (auth, chats, notifications)
  hooks/         useSocket, useAuth, useChat
  components/    UI components (chat, layout, auth, notifications)
  pages/         LoginPage, RegisterPage, MainPage, ProfilePage
```

---

## Shakalnost Desktop Meme Editor

Desktop meme editor for intentional image degradation. Make your memes cursed.

### Building

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release   # Windows: build/Release/Shakalnost.exe
cmake --build build                    # Linux: build/Shakalnost
```

Linux prerequisites: `sudo apt install libgl1-mesa-dev libx11-dev libxrandr-dev libxinerama-dev libxcursor-dev libxi-dev`

## License

MIT
