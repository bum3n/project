"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notification_service_1 = __importDefault(require("../services/notification.service"));
const notificationController = {
    /** GET /notifications */
    async getNotifications(req, res, next) {
        try {
            const { userId } = req.user;
            const cursor = req.query.cursor;
            const limit = parseInt(req.query.limit || '30', 10);
            const result = await notification_service_1.default.getNotifications(userId, cursor, limit);
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    },
    /** GET /notifications/unread-count */
    async getUnreadCount(req, res, next) {
        try {
            const { userId } = req.user;
            const count = await notification_service_1.default.getUnreadCount(userId);
            res.json({ success: true, data: { count } });
        }
        catch (err) {
            next(err);
        }
    },
    /** PATCH /notifications/:id/read */
    async markAsRead(req, res, next) {
        try {
            const { userId } = req.user;
            await notification_service_1.default.markAsRead(req.params.id, userId);
            res.json({ success: true, message: 'Notification marked as read' });
        }
        catch (err) {
            next(err);
        }
    },
    /** PATCH /notifications/read-all */
    async markAllAsRead(req, res, next) {
        try {
            const { userId } = req.user;
            const result = await notification_service_1.default.markAllAsRead(userId);
            res.json({ success: true, data: { updated: result.count } });
        }
        catch (err) {
            next(err);
        }
    },
    /** DELETE /notifications/:id */
    async deleteNotification(req, res, next) {
        try {
            const { userId } = req.user;
            await notification_service_1.default.deleteNotification(req.params.id, userId);
            res.json({ success: true, message: 'Notification deleted' });
        }
        catch (err) {
            next(err);
        }
    },
};
exports.default = notificationController;
//# sourceMappingURL=notification.controller.js.map