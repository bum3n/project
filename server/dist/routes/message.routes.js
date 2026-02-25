"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.standaloneMessageRouter = void 0;
const express_1 = require("express");
const message_controller_1 = __importDefault(require("../controllers/message.controller"));
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)({ mergeParams: true }); // inherit :chatId from parent
// All routes require authentication (applied in routes/index.ts)
// Chat-scoped message routes
router.get('/', message_controller_1.default.getMessages);
router.post('/', upload_1.upload.array('files', 10), message_controller_1.default.sendMessage);
router.get('/unread-count', message_controller_1.default.getUnreadCount);
router.post('/read', message_controller_1.default.markAsRead);
// Standalone message routes (registered separately in index.ts)
exports.standaloneMessageRouter = (0, express_1.Router)();
exports.standaloneMessageRouter.patch('/:id', message_controller_1.default.editMessage);
exports.standaloneMessageRouter.delete('/:id', message_controller_1.default.deleteMessage);
exports.default = router;
//# sourceMappingURL=message.routes.js.map