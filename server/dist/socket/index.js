"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketIO = getSocketIO;
exports.initSocketIO = initSocketIO;
const socket_io_1 = require("socket.io");
const jwt_1 = require("../utils/jwt");
const user_service_1 = __importDefault(require("../services/user.service"));
const message_service_1 = __importDefault(require("../services/message.service"));
const notification_service_1 = __importDefault(require("../services/notification.service"));
// Singleton reference so controllers can emit events
let io = null;
/** Returns the active Socket.io server (or null before initialisation). */
function getSocketIO() {
    return io;
}
function initSocketIO(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        // Increase ping timeout for mobile clients
        pingTimeout: 60000,
    });
    // ── Authentication Middleware ─────────────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth.token ||
            (socket.handshake.headers.authorization?.replace('Bearer ', '') ?? '');
        if (!token)
            return next(new Error('Authentication token required'));
        try {
            const payload = (0, jwt_1.verifyAccessToken)(token);
            socket.user = payload;
            next();
        }
        catch {
            next(new Error('Invalid or expired token'));
        }
    });
    // ── Connection Handler ────────────────────────────────────────────────────
    io.on('connection', async (socket) => {
        const user = socket.user;
        const { userId, username } = user;
        console.log(`[Socket] ${username} (${userId}) connected – socket ${socket.id}`);
        // Join user-specific room for targeted notifications/presence events
        void socket.join(`user:${userId}`);
        // Mark the user as online in DB and broadcast to contacts
        await user_service_1.default.setOnlineStatus(userId, true);
        broadcastPresence(userId, true);
        // ── Event: join a chat room ──────────────────────────────────────────────
        socket.on('join:chat', ({ chatId }) => {
            void socket.join(`chat:${chatId}`);
            console.log(`[Socket] ${username} joined room chat:${chatId}`);
        });
        // ── Event: leave a chat room ─────────────────────────────────────────────
        socket.on('leave:chat', ({ chatId }) => {
            void socket.leave(`chat:${chatId}`);
        });
        // ── Event: send a message via socket (alternative to REST) ───────────────
        socket.on('send:message', async ({ chatId, content, type = 'TEXT', replyToId, }) => {
            try {
                const message = await message_service_1.default.sendMessage({
                    chatId,
                    senderId: userId,
                    content,
                    type: type,
                    replyToId,
                });
                // Broadcast to the chat room (including sender for confirmation)
                io.to(`chat:${chatId}`).emit('message:new', { message });
                // Create and dispatch notifications
                const notifications = await notification_service_1.default.notifyNewMessage(chatId, message.id, userId, username, null, content);
                notifications?.forEach((n) => {
                    io.to(`user:${n.userId}`).emit('notification:new', {
                        id: n.id,
                        type: n.type,
                        title: n.title,
                        body: n.body,
                        chatId: n.chatId,
                        createdAt: n.createdAt,
                    });
                });
            }
            catch (err) {
                socket.emit('error', {
                    event: 'send:message',
                    message: err instanceof Error ? err.message : 'Failed to send message',
                });
            }
        });
        // ── Event: typing indicator ──────────────────────────────────────────────
        socket.on('typing:start', ({ chatId }) => {
            socket.to(`chat:${chatId}`).emit('typing:update', {
                chatId,
                userId,
                username,
                isTyping: true,
            });
        });
        socket.on('typing:stop', ({ chatId }) => {
            socket.to(`chat:${chatId}`).emit('typing:update', {
                chatId,
                userId,
                username,
                isTyping: false,
            });
        });
        // ── Event: read receipt ──────────────────────────────────────────────────
        socket.on('mark:read', async ({ chatId, messageId }) => {
            try {
                await message_service_1.default.markAsRead(chatId, userId, messageId);
                io.to(`chat:${chatId}`).emit('message:read', {
                    chatId,
                    messageId,
                    userId,
                    readAt: new Date(),
                });
            }
            catch {
                // Silently ignore read receipt errors (non-critical)
            }
        });
        // ── Disconnect ───────────────────────────────────────────────────────────
        socket.on('disconnect', async () => {
            console.log(`[Socket] ${username} disconnected – socket ${socket.id}`);
            // Check if the user has any other active connections before marking offline
            const sockets = await io.in(`user:${userId}`).fetchSockets();
            const remainingSockets = sockets.filter((s) => s.id !== socket.id);
            if (remainingSockets.length === 0) {
                await user_service_1.default.setOnlineStatus(userId, false);
                broadcastPresence(userId, false);
            }
        });
    });
    console.log('[Socket.io] Initialised');
    return io;
}
/**
 * Broadcast online/offline status to all rooms the user's contacts might be watching.
 * We emit to the global event so all connected clients can update their UI.
 */
function broadcastPresence(userId, isOnline) {
    if (!io)
        return;
    io.emit(isOnline ? 'user:online' : 'user:offline', {
        userId,
        isOnline,
        lastSeenAt: new Date(),
    });
}
//# sourceMappingURL=index.js.map