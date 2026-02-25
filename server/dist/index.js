"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config"); // load .env before anything else
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const socket_1 = require("./socket");
const database_1 = __importDefault(require("./config/database"));
const PORT = parseInt(process.env.PORT || '3000', 10);
async function bootstrap() {
    // Verify database connectivity on startup
    try {
        await database_1.default.$connect();
        console.log('[Database] Connected to PostgreSQL');
    }
    catch (err) {
        console.error('[Database] Failed to connect:', err);
        process.exit(1);
    }
    // Wrap Express app in an HTTP server so Socket.io can share the same port
    const httpServer = http_1.default.createServer(app_1.default);
    // Attach Socket.io
    (0, socket_1.initSocketIO)(httpServer);
    httpServer.listen(PORT, () => {
        console.log(`[Server] iWa Messenger API running on http://localhost:${PORT}`);
        console.log(`[Server] Environment: ${process.env.NODE_ENV ?? 'development'}`);
    });
    // ── Graceful Shutdown ──────────────────────────────────────────────────────
    const shutdown = async (signal) => {
        console.log(`\n[Server] Received ${signal} – shutting down gracefully…`);
        httpServer.close(async () => {
            await database_1.default.$disconnect();
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
//# sourceMappingURL=index.js.map