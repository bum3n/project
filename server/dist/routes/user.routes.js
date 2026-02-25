"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("../controllers/user.controller"));
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// All routes here require authentication (applied in routes/index.ts)
router.get('/me', user_controller_1.default.getMe);
router.patch('/me', upload_1.upload.single('avatar'), user_controller_1.default.updateProfile);
router.post('/me/change-password', user_controller_1.default.changePassword);
router.get('/search', user_controller_1.default.searchUsers);
router.get('/contacts', user_controller_1.default.getContacts);
router.get('/:id', user_controller_1.default.getProfile);
exports.default = router;
//# sourceMappingURL=user.routes.js.map