import { SignOptions } from 'jsonwebtoken';
export declare const jwtConfig: {
    access: {
        secret: string;
        expiresIn: SignOptions["expiresIn"];
    };
    refresh: {
        secret: string;
        expiresIn: SignOptions["expiresIn"];
    };
};
/** How long a refresh token lives in milliseconds (for DB expiry calculation) */
export declare const REFRESH_TOKEN_TTL_MS: number;
//# sourceMappingURL=jwt.d.ts.map