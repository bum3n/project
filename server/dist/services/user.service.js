"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const password_1 = require("../utils/password");
const USER_PUBLIC_SELECT = {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    bio: true,
    isOnline: true,
    lastSeenAt: true,
    createdAt: true,
};
const userService = {
    /** Get a single user's public profile. */
    async getProfile(userId) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            select: USER_PUBLIC_SELECT,
        });
        if (!user)
            throw (0, errorHandler_1.createHttpError)(404, 'User not found');
        return user;
    },
    /** Update the authenticated user's profile. */
    async updateProfile(userId, data) {
        const user = await database_1.default.user.update({
            where: { id: userId },
            data,
            select: USER_PUBLIC_SELECT,
        });
        return user;
    },
    /** Change password after verifying the old one. */
    async changePassword(userId, currentPassword, newPassword) {
        const user = await database_1.default.user.findUniqueOrThrow({ where: { id: userId } });
        const valid = await (0, password_1.verifyPassword)(currentPassword, user.passwordHash);
        if (!valid)
            throw (0, errorHandler_1.createHttpError)(400, 'Current password is incorrect');
        const passwordHash = await (0, password_1.hashPassword)(newPassword);
        await database_1.default.user.update({ where: { id: userId }, data: { passwordHash } });
    },
    /** Search users by username or displayName (excludes self). */
    async searchUsers(query, requesterId, limit = 20) {
        return database_1.default.user.findMany({
            where: {
                AND: [
                    { id: { not: requesterId } },
                    {
                        OR: [
                            { username: { contains: query, mode: 'insensitive' } },
                            { displayName: { contains: query, mode: 'insensitive' } },
                        ],
                    },
                ],
            },
            select: USER_PUBLIC_SELECT,
            take: limit,
            orderBy: { username: 'asc' },
        });
    },
    /** Get all contacts of the user (members who share at least one chat). */
    async getContacts(userId) {
        // Find all chats the user is a member of
        const memberships = await database_1.default.chatMember.findMany({
            where: { userId },
            select: { chatId: true },
        });
        const chatIds = memberships.map((m) => m.chatId);
        // Find all OTHER members in those chats
        const contacts = await database_1.default.chatMember.findMany({
            where: { chatId: { in: chatIds }, userId: { not: userId } },
            distinct: ['userId'],
            select: { user: { select: USER_PUBLIC_SELECT } },
        });
        return contacts.map((c) => c.user);
    },
    /** Mark user as online/offline (also updated via Socket.io). */
    async setOnlineStatus(userId, isOnline) {
        return database_1.default.user.update({
            where: { id: userId },
            data: { isOnline, lastSeenAt: new Date() },
            select: USER_PUBLIC_SELECT,
        });
    },
};
exports.default = userService;
//# sourceMappingURL=user.service.js.map