import { Request, Response, NextFunction } from 'express';
/**
 * Centralised error handler. Must be registered LAST in Express middleware chain.
 */
export declare function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void;
/** Attach a custom HTTP status to any Error. */
export declare function createHttpError(status: number, message: string): HttpError;
interface HttpError extends Error {
    status: number;
}
export {};
//# sourceMappingURL=errorHandler.d.ts.map