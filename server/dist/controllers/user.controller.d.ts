import { Request, Response, NextFunction } from 'express';
declare const userController: {
    /** GET /users/me – full profile of the authenticated user. */
    getMe(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /users/:id */
    getProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** PATCH /users/me */
    updateProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** POST /users/me/change-password */
    changePassword(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /users/search?q=... */
    searchUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /users/contacts */
    getContacts(req: Request, res: Response, next: NextFunction): Promise<void>;
};
export default userController;
//# sourceMappingURL=user.controller.d.ts.map