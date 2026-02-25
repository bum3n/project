import prisma from '../config/database';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { REFRESH_TOKEN_TTL_MS } from '../config/jwt';
import { createHttpError } from '../middleware/errorHandler';
import { JwtPayload } from '../types';

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const authService = {
  /** Register a new user and return tokens. */
  async register(input: RegisterInput): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    // Check for existing email or username
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }] },
    });
    if (existing) {
      if (existing.email === input.email) throw createHttpError(409, 'Email already in use');
      throw createHttpError(409, 'Username already taken');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash,
        displayName: input.displayName,
      },
    });

    const tokens = await generateAndStoreTokens(user);
    return { user: sanitizeUser(user), tokens };
  },

  /** Login with email + password and return tokens. */
  async login(input: LoginInput): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw createHttpError(401, 'Invalid credentials');

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) throw createHttpError(401, 'Invalid credentials');

    // Mark user as online
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeenAt: new Date() },
    });

    const tokens = await generateAndStoreTokens(user);
    return { user: sanitizeUser(user), tokens };
  },

  /** Exchange a valid refresh token for a new token pair (rotation). */
  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    // Verify JWT signature first
    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw createHttpError(401, 'Invalid refresh token');
    }

    // Check DB record (single-use rotation: delete old, issue new)
    const stored = await prisma.refreshToken.findUnique({ where: { token: rawRefreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      // Possible token reuse attack – invalidate all tokens for this user
      await prisma.refreshToken.deleteMany({ where: { userId: payload.userId } });
      throw createHttpError(401, 'Refresh token revoked or expired');
    }

    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });
    return generateAndStoreTokens(user);
  },

  /** Logout: revoke the provided refresh token and mark user offline. */
  async logout(rawRefreshToken: string, userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token: rawRefreshToken, userId } });
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: false, lastSeenAt: new Date() },
    });
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

type UserRow = Awaited<ReturnType<typeof prisma.user.findUniqueOrThrow>>;
type SafeUser = Omit<UserRow, 'passwordHash'>;

function sanitizeUser(user: UserRow): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safe } = user;
  return safe;
}

async function generateAndStoreTokens(user: UserRow): Promise<AuthTokens> {
  const payload: JwtPayload = { userId: user.id, email: user.email, username: user.username };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return { accessToken, refreshToken };
}

export default authService;
