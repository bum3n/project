import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Centralised error handler. Must be registered LAST in Express middleware chain.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors → 400
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  // Known operational errors with a status code attached
  if (isHttpError(err)) {
    res.status(err.status).json({ success: false, error: err.message });
    return;
  }

  // Unexpected errors
  console.error('[Unhandled Error]', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
}

/** Attach a custom HTTP status to any Error. */
export function createHttpError(status: number, message: string): HttpError {
  const err = new Error(message) as HttpError;
  err.status = status;
  return err;
}

interface HttpError extends Error {
  status: number;
}

function isHttpError(err: unknown): err is HttpError {
  return err instanceof Error && 'status' in err && typeof (err as HttpError).status === 'number';
}
