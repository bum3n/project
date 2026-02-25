import prisma from '../config/database';
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
declare const authService: {
    /** Register a new user and return tokens. */
    register(input: RegisterInput): Promise<{
        user: SafeUser;
        tokens: AuthTokens;
    }>;
    /** Login with email + password and return tokens. */
    login(input: LoginInput): Promise<{
        user: SafeUser;
        tokens: AuthTokens;
    }>;
    /** Exchange a valid refresh token for a new token pair (rotation). */
    refresh(rawRefreshToken: string): Promise<AuthTokens>;
    /** Logout: revoke the provided refresh token and mark user offline. */
    logout(rawRefreshToken: string, userId: string): Promise<void>;
};
type UserRow = Awaited<ReturnType<typeof prisma.user.findUniqueOrThrow>>;
type SafeUser = Omit<UserRow, 'passwordHash'>;
export default authService;
//# sourceMappingURL=auth.service.d.ts.map