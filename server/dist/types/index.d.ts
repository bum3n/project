import { Request } from 'express';
export interface AuthRequest extends Request {
    user?: JwtPayload;
}
export interface JwtPayload {
    userId: string;
    email: string;
    username: string;
}
export interface SocketUser {
    userId: string;
    username: string;
    socketId: string;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
    cursor?: string;
}
export interface PaginatedResult<T> {
    items: T[];
    total?: number;
    nextCursor?: string;
    hasMore: boolean;
}
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'SYSTEM';
export type ChatType = 'PRIVATE' | 'GROUP';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type NotificationType = 'NEW_MESSAGE' | 'MENTION' | 'GROUP_INVITE' | 'SYSTEM';
export interface SocketEvents {
    'join:chat': {
        chatId: string;
    };
    'leave:chat': {
        chatId: string;
    };
    'send:message': {
        chatId: string;
        content: string;
        type?: MessageType;
        replyToId?: string;
    };
    'typing:start': {
        chatId: string;
    };
    'typing:stop': {
        chatId: string;
    };
    'mark:read': {
        chatId: string;
        messageId: string;
    };
    'message:new': NewMessageEvent;
    'message:read': ReadReceiptEvent;
    'typing:update': TypingEvent;
    'user:online': UserStatusEvent;
    'user:offline': UserStatusEvent;
    'notification:new': NotificationEvent;
    'chat:updated': {
        chatId: string;
    };
}
export interface NewMessageEvent {
    message: {
        id: string;
        chatId: string;
        senderId: string;
        content: string | null;
        type: MessageType;
        createdAt: Date;
        sender: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        attachments: AttachmentInfo[];
        replyTo?: {
            id: string;
            content: string | null;
            sender: {
                displayName: string;
            };
        } | null;
    };
}
export interface ReadReceiptEvent {
    chatId: string;
    messageId: string;
    userId: string;
    readAt: Date;
}
export interface TypingEvent {
    chatId: string;
    userId: string;
    username: string;
    isTyping: boolean;
}
export interface UserStatusEvent {
    userId: string;
    isOnline: boolean;
    lastSeenAt: Date;
}
export interface NotificationEvent {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    chatId?: string | null;
    createdAt: Date;
}
export interface AttachmentInfo {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    url: string;
}
//# sourceMappingURL=index.d.ts.map