/** Hash a plain-text password. */
export declare function hashPassword(plain: string): Promise<string>;
/** Compare plain-text password against stored hash. */
export declare function verifyPassword(plain: string, hash: string): Promise<boolean>;
//# sourceMappingURL=password.d.ts.map