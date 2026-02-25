import { Request, Response, NextFunction } from 'express';
/**
 * Middleware that validates the Bearer JWT in the Authorization header.
 * Sets req.user with the decoded payload if valid.
 */
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map