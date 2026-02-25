export interface UpdateProfileInput {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
}
declare const userService: {
    /** Get a single user's public profile. */
    getProfile(userId: string): Promise<{
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        bio: string | null;
        isOnline: boolean;
        lastSeenAt: Date;
        createdAt: Date;
    }>;
    /** Update the authenticated user's profile. */
    updateProfile(userId: string, data: UpdateProfileInput): Promise<{
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        bio: string | null;
        isOnline: boolean;
        lastSeenAt: Date;
        createdAt: Date;
    }>;
    /** Change password after verifying the old one. */
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    /** Search users by username or displayName (excludes self). */
    searchUsers(query: string, requesterId: string, limit?: number): Promise<{
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        bio: string | null;
        isOnline: boolean;
        lastSeenAt: Date;
        createdAt: Date;
    }[]>;
    /** Get all contacts of the user (members who share at least one chat). */
    getContacts(userId: string): Promise<{
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        bio: string | null;
        isOnline: boolean;
        lastSeenAt: Date;
        createdAt: Date;
    }[]>;
    /** Mark user as online/offline (also updated via Socket.io). */
    setOnlineStatus(userId: string, isOnline: boolean): Promise<{
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        bio: string | null;
        isOnline: boolean;
        lastSeenAt: Date;
        createdAt: Date;
    }>;
};
export default userService;
//# sourceMappingURL=user.service.d.ts.map