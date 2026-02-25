import { Request, Response, NextFunction } from 'express';
declare const messageController: {
    /** POST /chats/:chatId/messages */
    sendMessage(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /chats/:chatId/messages */
    getMessages(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** PATCH /messages/:id */
    editMessage(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** DELETE /messages/:id */
    deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** POST /chats/:chatId/messages/read */
    markAsRead(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /chats/:chatId/messages/unread-count */
    getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void>;
};
export default messageController;
//# sourceMappingURL=message.controller.d.ts.map