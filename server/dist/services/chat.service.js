"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const CHAT_SELECT = {
    id: true,
    type: true,
    name: true,
    description: true,
    avatarUrl: true,
    createdAt: true,
    updatedAt: true,
    members: {
        select: {
            role: true,
            joinedAt: true,
            lastReadAt: true,
            user: {
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    isOnline: true,
                    lastSeenAt: true,
                },
            },
        },
    },
};
const chatService = {
    /** Get or create a private (1-to-1) chat between two users. */
    async getOrCreatePrivateChat(userId, targetUserId) {
        if (userId === targetUserId)
            throw (0, errorHandler_1.createHttpError)(400, 'Cannot create chat with yourself');
        const target = await database_1.default.user.findUnique({ where: { id: targetUserId } });
        if (!target)
            throw (0, errorHandler_1.createHttpError)(404, 'Target user not found');
        // Look for an existing PRIVATE chat that has exactly these two members
        const existing = await database_1.default.chat.findFirst({
            where: {
                type: 'PRIVATE',
                AND: [
                    { members: { some: { userId } } },
                    { members: { some: { userId: targetUserId } } },
                ],
            },
            include: { ...CHAT_SELECT },
        });
        if (existing)
            return existing;
        // Create a new private chat
        const chat = await database_1.default.chat.create({
            data: {
                type: 'PRIVATE',
                members: {
                    create: [
                        { userId, role: 'MEMBER' },
                        { userId: targetUserId, role: 'MEMBER' },
                    ],
                },
            },
            include: { ...CHAT_SELECT },
        });
        return chat;
    },
    /** Create a new group chat. */
    async createGroup(creatorId, name, memberIds, description) {
        // Ensure creator is included and de-duplicate
        const uniqueIds = Array.from(new Set([creatorId, ...memberIds]));
        // Validate all member IDs exist
        const users = await database_1.default.user.findMany({ where: { id: { in: uniqueIds } } });
        if (users.length !== uniqueIds.length) {
            throw (0, errorHandler_1.createHttpError)(400, 'One or more member IDs are invalid');
        }
        const chat = await database_1.default.chat.create({
            data: {
                type: 'GROUP',
                name,
                description,
                createdBy: creatorId,
                members: {
                    create: uniqueIds.map((uid) => ({
                        userId: uid,
                        role: uid === creatorId ? 'OWNER' : 'MEMBER',
                    })),
                },
            },
            include: { ...CHAT_SELECT },
        });
        return chat;
    },
    /** List all chats for the current user, ordered by last message time. */
    async listUserChats(userId) {
        const chats = await database_1.default.chat.findMany({
            where: { members: { some: { userId } } },
            include: {
                ...CHAT_SELECT,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        content: true,
                        type: true,
                        createdAt: true,
                        sender: { select: { displayName: true } },
                    },
                },
                _count: { select: { messages: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
        // Attach unread counts per chat
        return Promise.all(chats.map(async (chat) => {
            const membership = chat.members.find((m) => m.user.id === userId);
            const lastReadAt = membership?.lastReadAt ?? new Date(0);
            const unreadCount = await database_1.default.message.count({
                where: {
                    chatId: chat.id,
                    createdAt: { gt: lastReadAt },
                    senderId: { not: userId },
                    isDeleted: false,
                },
            });
            return { ...chat, unreadCount };
        }));
    },
    /** Get a single chat by ID (verifies membership). */
    async getChatById(chatId, userId) {
        const chat = await database_1.default.chat.findUnique({
            where: { id: chatId },
            include: { ...CHAT_SELECT },
        });
        if (!chat)
            throw (0, errorHandler_1.createHttpError)(404, 'Chat not found');
        const isMember = chat.members.some((m) => m.user.id === userId);
        if (!isMember)
            throw (0, errorHandler_1.createHttpError)(403, 'You are not a member of this chat');
        return chat;
    },
    /** Add members to a group chat (only owner/admin can do this). */
    async addMembers(chatId, requesterId, newMemberIds) {
        const chat = await database_1.default.chat.findUnique({
            where: { id: chatId },
            include: { members: true },
        });
        if (!chat)
            throw (0, errorHandler_1.createHttpError)(404, 'Chat not found');
        if (chat.type !== 'GROUP')
            throw (0, errorHandler_1.createHttpError)(400, 'Can only add members to group chats');
        const requester = chat.members.find((m) => m.userId === requesterId);
        if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN')) {
            throw (0, errorHandler_1.createHttpError)(403, 'Only admins can add members');
        }
        const existingIds = new Set(chat.members.map((m) => m.userId));
        const toAdd = newMemberIds.filter((id) => !existingIds.has(id));
        if (toAdd.length === 0)
            return chat;
        await database_1.default.chatMember.createMany({
            data: toAdd.map((userId) => ({ chatId, userId, role: 'MEMBER' })),
            skipDuplicates: true,
        });
        return database_1.default.chat.findUniqueOrThrow({ where: { id: chatId }, include: { ...CHAT_SELECT } });
    },
    /** Remove a member from a group chat. */
    async removeMember(chatId, requesterId, targetUserId) {
        const chat = await database_1.default.chat.findUnique({
            where: { id: chatId },
            include: { members: true },
        });
        if (!chat)
            throw (0, errorHandler_1.createHttpError)(404, 'Chat not found');
        if (chat.type !== 'GROUP')
            throw (0, errorHandler_1.createHttpError)(400, 'Only group chats support this action');
        const requester = chat.members.find((m) => m.userId === requesterId);
        const isSelf = requesterId === targetUserId;
        if (!isSelf && (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN'))) {
            throw (0, errorHandler_1.createHttpError)(403, 'Insufficient permissions');
        }
        await database_1.default.chatMember.deleteMany({ where: { chatId, userId: targetUserId } });
    },
    /** Update group chat details (owner/admin only). */
    async updateGroup(chatId, requesterId, data) {
        const member = await database_1.default.chatMember.findUnique({
            where: { chatId_userId: { chatId, userId: requesterId } },
        });
        if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
            throw (0, errorHandler_1.createHttpError)(403, 'Only admins can update the group');
        }
        return database_1.default.chat.update({
            where: { id: chatId },
            data,
            include: { ...CHAT_SELECT },
        });
    },
    /** Search chats by name (group chats only). */
    async searchChats(query, userId) {
        return database_1.default.chat.findMany({
            where: {
                type: 'GROUP',
                members: { some: { userId } },
                name: { contains: query, mode: 'insensitive' },
            },
            include: { ...CHAT_SELECT },
            take: 20,
        });
    },
};
exports.default = chatService;
//# sourceMappingURL=chat.service.js.map