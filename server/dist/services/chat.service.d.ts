declare const chatService: {
    /** Get or create a private (1-to-1) chat between two users. */
    getOrCreatePrivateChat(userId: string, targetUserId: string): Promise<{
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        description: string | null;
        members: {
            user: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
                isOnline: boolean;
                lastSeenAt: Date;
            };
            role: import(".prisma/client").$Enums.MemberRole;
            joinedAt: Date;
            lastReadAt: Date;
        }[];
    } & {
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        description: string | null;
        createdBy: string | null;
    }>;
    /** Create a new group chat. */
    createGroup(creatorId: string, name: string, memberIds: string[], description?: string): Promise<{
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        description: string | null;
        members: {
            user: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
                isOnline: boolean;
                lastSeenAt: Date;
            };
            role: import(".prisma/client").$Enums.MemberRole;
            joinedAt: Date;
            lastReadAt: Date;
        }[];
    } & {
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        description: string | null;
        createdBy: string | null;
    }>;
    /** List all chats for the current user, ordered by last message time. */
    listUserChats(userId: string): Promise<{
        unreadCount: number;
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            messages: number;
        };
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        description: string | null;
        members: {
            user: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
                isOnline: boolean;
                lastSeenAt: Date;
            };
            role: import(".prisma/client").$Enums.MemberRole;
            joinedAt: Date;
            lastReadAt: Date;
        }[];
        messages: {
            id: string;
            createdAt: Date;
            content: string | null;
            type: import(".prisma/client").$Enums.MessageType;
            sender: {
                displayName: string;
            };
        }[];
        createdBy: string | null;
    }[]>;
    /** Get a single chat by ID (verifies membership). */
    getChatById(chatId: string, userId: string): Promise<{
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        description: string | null;
        members: {
            user: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
                isOnline: boolean;
                lastSeenAt: Date;
            };
            role: import(".prisma/client").$Enums.MemberRole;
            joinedAt: Date;
            lastReadAt: Date;
        }[];
    } & {
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        description: string | null;
        createdBy: string | null;
    }>;
    /** Add members to a group chat (only owner/admin can do this). */
    addMembers(chatId: string, requesterId: string, newMemberIds: string[]): Promise<({
        members: {
            id: string;
            userId: string;
            chatId: string;
            role: import(".prisma/client").$Enums.MemberRole;
            joinedAt: Date;
            lastReadAt: Date;
        }[];
    } & {
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        description: string | null;
        createdBy: string | null;
    }) | ({
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        description: string | null;
        members: {
            user: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
                isOnline: boolean;
                lastSeenAt: Date;
            };
            role: import(".prisma/client").$Enums.MemberRole;
            joinedAt: Date;
            lastReadAt: Date;
        }[];
    } & {
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        description: string | null;
        createdBy: string | null;
    })>;
    /** Remove a member from a group chat. */
    removeMember(chatId: string, requesterId: string, targetUserId: string): Promise<void>;
    /** Update group chat details (owner/admin only). */
    updateGroup(chatId: string, requesterId: string, data: {
        name?: string;
        description?: string;
        avatarUrl?: string;
    }): Promise<{
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        description: string | null;
        members: {
            user: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
                isOnline: boolean;
                lastSeenAt: Date;
            };
            role: import(".prisma/client").$Enums.MemberRole;
            joinedAt: Date;
            lastReadAt: Date;
        }[];
    } & {
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        description: string | null;
        createdBy: string | null;
    }>;
    /** Search chats by name (group chats only). */
    searchChats(query: string, userId: string): Promise<({
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        description: string | null;
        members: {
            user: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
                isOnline: boolean;
                lastSeenAt: Date;
            };
            role: import(".prisma/client").$Enums.MemberRole;
            joinedAt: Date;
            lastReadAt: Date;
        }[];
    } & {
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        type: import(".prisma/client").$Enums.ChatType;
        description: string | null;
        createdBy: string | null;
    })[]>;
};
export default chatService;
//# sourceMappingURL=chat.service.d.ts.map