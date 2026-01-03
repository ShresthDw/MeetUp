# MeetUp — 1-on-1 Real-Time Video & Chat Platform

MeetUp is a full-stack, anonymous 1-on-1 random video and text chat platform built with **React**, **WebRTC**, **Socket.IO**, **Redis**, and **Node.js/Express**.

---

## 🚀 Features

- **P2P HD Video & Audio**: Direct browser-to-browser WebRTC connection with ultra-low latency and encryption.
- **Smart Matchmaking Queue**: Fast matchmaking powered by distributed Redis queues with support for custom topic filters and random matching.
- **In-Call Real-Time Text Chat**: Instant peer-to-peer text messaging with conversation icebreaker generator and floating emoji reactions.
- **Live Device Previews**: Self-camera and microphone preview controls with mute/unmute and camera toggle prior to joining queues.
- **Screen Sharing**: One-click screen sharing support directly within video calls.
- **Quick Skip & Next**: Seamlessly disconnect and pair with a new stranger via button click or `Spacebar` keyboard shortcut.
- **Safety & Moderation**: User reporting system with automated queue disconnection and safety guidelines.
- **Member Authentication (Optional)**: Guest mode active by default with optional account creation and JWT authentication backed by MongoDB.
- **Live User Counter**: Real-time connected user tracking synchronized across all clients via WebSockets.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **React 19** (Vite build tool)
- **Tailwind CSS v4**
- **Socket.IO Client** for signaling & matchmaking
- **Native WebRTC API** (`RTCPeerConnection`, MediaStreams)
- **Lucide React** for modern UI iconography
- **Canvas Confetti** for interactive reactions

### Backend (`/server`)
- **Node.js & Express**
- **Socket.IO** for real-time WebSocket signaling
- **Redis (ioredis)** for high-throughput matchmaking queues
- **MongoDB (Mongoose)** for user account storage & authentication
- **JSON Web Tokens (JWT)** for session management

---

## 📁 Project Structure

```text
Meetup/
├── client/                      # React Frontend (Vite)
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── app/                 # App root & state wrappers
│   │   ├── components/          # Shared components (Navbar, etc.)
│   │   ├── config/              # Environment & socket configuration
│   │   ├── features/
│   │   │   ├── auth/            # Auth modal & API handlers
│   │   │   ├── home/            # Landing & camera preview page
│   │   │   └── room/            # Video room & WebRTC hook
│   │   ├── utils/               # WebRTC helpers & utilities
│   │   ├── index.css            # Design system & CSS rules
│   │   └── main.jsx             # React entrypoint
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Node.js & Express Backend
│   ├── config/                  # Environment loader
│   ├── controllers/             # Auth controllers
│   ├── middleware/              # Auth middleware
│   ├── models/                  # MongoDB schemas (User model)
│   ├── routes/                  # API routes
│   ├── socket/                  # WebSocket & WebRTC signaling handlers
│   ├── matchmaker.js            # Redis matchmaking engine
│   ├── mongo.js                 # MongoDB connection
│   ├── redisClient.js           # Redis client initialization
│   ├── index.js                 # Server entrypoint
│   └── package.json
│
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **Redis** server (Local or cloud e.g. Upstash, Redis Cloud)
- **MongoDB** instance (Local or MongoDB Atlas)

---

### 1. Backend Setup

1. Navigate to the server folder:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables by creating a `.env` file in the `server` directory:
   ```env
   PORT=4000
   CLIENT_ORIGIN=http://localhost:5173
   JWT_SECRET=your-secure-jwt-secret-key
   REDIS_URI=redis://localhost:6379
   MONGO_URI=mongodb://localhost:27017/meetup
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will start on `http://localhost:4000`.*

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure frontend environment variables by creating a `.env` file in the `client` directory:
   ```env
   VITE_API_URL=http://localhost:4000
   VITE_SOCKET_URL=http://localhost:4000
   VITE_SOCKET_TRANSPORT=polling
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run at `http://localhost:5173`.*

---

## ⌨️ Shortcuts

| Key | Action |
| --- | --- |
| **`Space`** | Find next stranger / skip partner |
| **`Esc`** | Close modals |
| **`Enter`** | Send chat message |

---

## 🔒 Security & Privacy

- **Direct P2P**: Video and audio streams flow directly peer-to-peer between client browsers via encrypted WebRTC connections.
- **Zero Storage**: Video and audio feeds are never recorded or stored on any server.
- **Reporting**: Instant one-click user report system automatically terminates abusive sessions.

---

## 📜 License

This project is open source and available under the [ISC License](file:///c:/Users/91830/Desktop/Meetup/server/package.json).
