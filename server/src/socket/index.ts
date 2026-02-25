import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import userService from '../services/user.service';
import messageService from '../services/message.service';
import notificationService from '../services/notification.service';
import { JwtPayload } from '../types';

// Singleton reference so controllers can emit events
let io: SocketServer | null = null;

/** Returns the active Socket.io server (or null before initialisation). */
export function getSocketIO(): SocketServer | null {
  return io;
}

/** Extend Socket type to carry authenticated user data. */
interface AuthSocket extends Socket {
  user: JwtPayload;
}

export function initSocketIO(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
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
    const token =
      (socket.handshake.auth.token as string | undefined) ||
      (socket.handshake.headers.authorization?.replace('Bearer ', '') ?? '');

    if (!token) return next(new Error('Authentication token required'));

    try {
      const payload = verifyAccessToken(token);
      (socket as AuthSocket).user = payload;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection Handler ────────────────────────────────────────────────────
  io.on('connection', async (socket) => {
    const user = (socket as AuthSocket).user;
    const { userId, username } = user;

    console.log(`[Socket] ${username} (${userId}) connected – socket ${socket.id}`);

    // Join user-specific room for targeted notifications/presence events
    void socket.join(`user:${userId}`);

    // Mark the user as online in DB and broadcast to contacts
    await userService.setOnlineStatus(userId, true);
    broadcastPresence(userId, true);

    // ── Event: join a chat room ──────────────────────────────────────────────
    socket.on('join:chat', ({ chatId }: { chatId: string }) => {
      void socket.join(`chat:${chatId}`);
      console.log(`[Socket] ${username} joined room chat:${chatId}`);
    });

    // ── Event: leave a chat room ─────────────────────────────────────────────
    socket.on('leave:chat', ({ chatId }: { chatId: string }) => {
      void socket.leave(`chat:${chatId}`);
    });

    // ── Event: send a message via socket (alternative to REST) ───────────────
    socket.on(
      'send:message',
      async ({
        chatId,
        content,
        type = 'TEXT',
        replyToId,
      }: {
        chatId: string;
        content: string;
        type?: string;
        replyToId?: string;
      }) => {
        try {
          const message = await messageService.sendMessage({
            chatId,
            senderId: userId,
            content,
            type: type as 'TEXT',
            replyToId,
          });

          // Broadcast to the chat room (including sender for confirmation)
          io!.to(`chat:${chatId}`).emit('message:new', { message });

          // Create and dispatch notifications
          const notifications = await notificationService.notifyNewMessage(
            chatId,
            message.id,
            userId,
            username,
            null,
            content,
          );

          notifications?.forEach((n) => {
            io!.to(`user:${n.userId}`).emit('notification:new', {
              id: n.id,
              type: n.type,
              title: n.title,
              body: n.body,
              chatId: n.chatId,
              createdAt: n.createdAt,
            });
          });
        } catch (err: unknown) {
          socket.emit('error', {
            event: 'send:message',
            message: err instanceof Error ? err.message : 'Failed to send message',
          });
        }
      },
    );

    // ── Event: typing indicator ──────────────────────────────────────────────
    socket.on('typing:start', ({ chatId }: { chatId: string }) => {
      socket.to(`chat:${chatId}`).emit('typing:update', {
        chatId,
        userId,
        username,
        isTyping: true,
      });
    });

    socket.on('typing:stop', ({ chatId }: { chatId: string }) => {
      socket.to(`chat:${chatId}`).emit('typing:update', {
        chatId,
        userId,
        username,
        isTyping: false,
      });
    });

    // ── Event: read receipt ──────────────────────────────────────────────────
    socket.on(
      'mark:read',
      async ({ chatId, messageId }: { chatId: string; messageId: string }) => {
        try {
          await messageService.markAsRead(chatId, userId, messageId);
          io!.to(`chat:${chatId}`).emit('message:read', {
            chatId,
            messageId,
            userId,
            readAt: new Date(),
          });
        } catch {
          // Silently ignore read receipt errors (non-critical)
        }
      },
    );

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[Socket] ${username} disconnected – socket ${socket.id}`);

      // Check if the user has any other active connections before marking offline
      const sockets = await io!.in(`user:${userId}`).fetchSockets();
      const remainingSockets = sockets.filter((s) => s.id !== socket.id);

      if (remainingSockets.length === 0) {
        await userService.setOnlineStatus(userId, false);
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
function broadcastPresence(userId: string, isOnline: boolean): void {
  if (!io) return;
  io.emit(isOnline ? 'user:online' : 'user:offline', {
    userId,
    isOnline,
    lastSeenAt: new Date(),
  });
}
