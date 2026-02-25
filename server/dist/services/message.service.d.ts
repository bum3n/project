import { MessageType } from '../types';
export interface SendMessageInput {
    chatId: string;
    senderId: string;
    content?: string;
    type?: MessageType;
    replyToId?: string;
    attachments?: Array<{
        filename: string;
        storedName: string;
        mimeType: string;
        size: number;
        url: string;
    }>;
}
declare const messageService: {
    /** Send a message (text or with attachments). */
    sendMessage(input: SendMessageInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            readBy: number;
        };
        chatId: string;
        content: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        isEdited: boolean;
        isDeleted: boolean;
        sender: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        replyTo: {
            id: string;
            content: string | null;
            isDeleted: boolean;
            sender: {
                id: string;
                displayName: string;
            };
        } | null;
        readBy: {
            userId: string;
            readAt: Date;
        }[];
        attachments: {
            id: string;
            filename: string;
            storedName: string;
            mimeType: string;
            size: number;
            url: string;
        }[];
    }>;
    /** Fetch paginated message history for a chat. Uses cursor-based pagination. */
    getMessages(chatId: string, userId: string, cursor?: string, limit?: number): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            _count: {
                readBy: number;
            };
            chatId: string;
            content: string | null;
            type: import(".prisma/client").$Enums.MessageType;
            isEdited: boolean;
            isDeleted: boolean;
            sender: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
            };
            replyTo: {
                id: string;
                content: string | null;
                isDeleted: boolean;
                sender: {
                    id: string;
                    displayName: string;
                };
            } | null;
            readBy: {
                userId: string;
                readAt: Date;
            }[];
            attachments: {
                id: string;
                filename: string;
                storedName: string;
                mimeType: string;
                size: number;
                url: string;
            }[];
        }[];
        nextCursor: string | undefined;
        hasMore: boolean;
    }>;
    /** Edit a message (sender only, text messages only). */
    editMessage(messageId: string, userId: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            readBy: number;
        };
        chatId: string;
        content: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        isEdited: boolean;
        isDeleted: boolean;
        sender: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        replyTo: {
            id: string;
            content: string | null;
            isDeleted: boolean;
            sender: {
                id: string;
                displayName: string;
            };
        } | null;
        readBy: {
            userId: string;
            readAt: Date;
        }[];
        attachments: {
            id: string;
            filename: string;
            storedName: string;
            mimeType: string;
            size: number;
            url: string;
        }[];
    }>;
    /** Soft-delete a message (sender only). */
    deleteMessage(messageId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            readBy: number;
        };
        chatId: string;
        content: string | null;
        type: import(".prisma/client").$Enums.MessageType;
        isEdited: boolean;
        isDeleted: boolean;
        sender: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        replyTo: {
            id: string;
            content: string | null;
            isDeleted: boolean;
            sender: {
                id: string;
                displayName: string;
            };
        } | null;
        readBy: {
            userId: string;
            readAt: Date;
        }[];
        attachments: {
            id: string;
            filename: string;
            storedName: string;
            mimeType: string;
            size: number;
            url: string;
        }[];
    }>;
    /** Mark messages in a chat as read up to a specific message. */
    markAsRead(chatId: string, userId: string, messageId: string): Promise<{
        markedCount: number;
    }>;
    /** Get the number of unread messages in a chat for a user. */
    getUnreadCount(chatId: string, userId: string): Promise<number>;
};
export default messageService;
//# sourceMappingURL=message.service.d.ts.map