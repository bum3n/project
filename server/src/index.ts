import 'dotenv/config'; // load .env before anything else
import http from 'http';
import app from './app';
import { initSocketIO } from './socket';
import prisma from './config/database';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function bootstrap(): Promise<void> {
  // Verify database connectivity on startup
  try {
    await prisma.$connect();
    console.log('[Database] Connected to PostgreSQL');
  } catch (err) {
    console.error('[Database] Failed to connect:', err);
    process.exit(1);
  }

  // Wrap Express app in an HTTP server so Socket.io can share the same port
  const httpServer = http.createServer(app);

  // Attach Socket.io
  initSocketIO(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`[Server] iWa Messenger API running on http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV ?? 'development'}`);
  });

  // ── Graceful Shutdown ──────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal} – shutting down gracefully…`);
    httpServer.close(async () => {
      await prisma.$disconnect();
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // Unhandled promise rejections should not silently swallow errors
  process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled rejection:', reason);
  });
}

void bootstrap();
