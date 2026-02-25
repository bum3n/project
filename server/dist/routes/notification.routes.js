"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = __importDefault(require("../controllers/notification.controller"));
const router = (0, express_1.Router)();
// All routes require authentication (applied in routes/index.ts)
router.get('/', notification_controller_1.default.getNotifications);
router.get('/unread-count', notification_controller_1.default.getUnreadCount);
router.patch('/read-all', notification_controller_1.default.markAllAsRead);
router.patch('/:id/read', notification_controller_1.default.markAsRead);
router.delete('/:id', notification_controller_1.default.deleteNotification);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map