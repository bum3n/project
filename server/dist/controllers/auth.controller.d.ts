import { Request, Response, NextFunction } from 'express';
declare const authController: {
    register(req: Request, res: Response, next: NextFunction): Promise<void>;
    login(req: Request, res: Response, next: NextFunction): Promise<void>;
    refresh(req: Request, res: Response, next: NextFunction): Promise<void>;
    logout(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** Return the authenticated user's info (no DB call – from token). */
    me(req: Request, res: Response): Promise<void>;
};
export default authController;
//# sourceMappingURL=auth.controller.d.ts.map