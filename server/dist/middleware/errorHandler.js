"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.createHttpError = createHttpError;
const zod_1 = require("zod");
/**
 * Centralised error handler. Must be registered LAST in Express middleware chain.
 */
function errorHandler(err, _req, res, _next) {
    // Zod validation errors → 400
    if (err instanceof zod_1.ZodError) {
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
function createHttpError(status, message) {
    const err = new Error(message);
    err.status = status;
    return err;
}
function isHttpError(err) {
    return err instanceof Error && 'status' in err && typeof err.status === 'number';
}
//# sourceMappingURL=errorHandler.js.map