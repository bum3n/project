import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
/** Returns the active Socket.io server (or null before initialisation). */
export declare function getSocketIO(): SocketServer | null;
export declare function initSocketIO(httpServer: HttpServer): SocketServer;
//# sourceMappingURL=index.d.ts.map