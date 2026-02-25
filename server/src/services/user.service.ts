import prisma from '../config/database';
import { createHttpError } from '../middleware/errorHandler';
import { hashPassword, verifyPassword } from '../utils/password';

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

const USER_PUBLIC_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  isOnline: true,
  lastSeenAt: true,
  createdAt: true,
} as const;

const userService = {
  /** Get a single user's public profile. */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_PUBLIC_SELECT,
    });
    if (!user) throw createHttpError(404, 'User not found');
    return user;
  },

  /** Update the authenticated user's profile. */
  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: USER_PUBLIC_SELECT,
    });
    return user;
  },

  /** Change password after verifying the old one. */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw createHttpError(400, 'Current password is incorrect');

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  },

  /** Search users by username or displayName (excludes self). */
  async searchUsers(query: string, requesterId: string, limit = 20) {
    return prisma.user.findMany({
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
  async getContacts(userId: string) {
    // Find all chats the user is a member of
    const memberships = await prisma.chatMember.findMany({
      where: { userId },
      select: { chatId: true },
    });
    const chatIds = memberships.map((m) => m.chatId);

    // Find all OTHER members in those chats
    const contacts = await prisma.chatMember.findMany({
      where: { chatId: { in: chatIds }, userId: { not: userId } },
      distinct: ['userId'],
      select: { user: { select: USER_PUBLIC_SELECT } },
    });

    return contacts.map((c) => c.user);
  },

  /** Mark user as online/offline (also updated via Socket.io). */
  async setOnlineStatus(userId: string, isOnline: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { isOnline, lastSeenAt: new Date() },
      select: USER_PUBLIC_SELECT,
    });
  },
};

export default userService;
