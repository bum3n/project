"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = __importDefault(require("../controllers/chat.controller"));
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// All routes here require authentication (applied in routes/index.ts)
router.get('/', chat_controller_1.default.listChats);
router.get('/search', chat_controller_1.default.searchChats);
router.post('/private', chat_controller_1.default.getOrCreatePrivate);
router.post('/group', chat_controller_1.default.createGroup);
router.get('/:id', chat_controller_1.default.getChat);
router.patch('/:id', upload_1.upload.single('avatar'), chat_controller_1.default.updateGroup);
router.post('/:id/members', chat_controller_1.default.addMembers);
router.delete('/:id/members/:userId', chat_controller_1.default.removeMember);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map