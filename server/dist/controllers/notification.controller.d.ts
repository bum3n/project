import { Request, Response, NextFunction } from 'express';
declare const notificationController: {
    /** GET /notifications */
    getNotifications(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /notifications/unread-count */
    getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** PATCH /notifications/:id/read */
    markAsRead(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** PATCH /notifications/read-all */
    markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** DELETE /notifications/:id */
    deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void>;
};
export default notificationController;
//# sourceMappingURL=notification.controller.d.ts.map