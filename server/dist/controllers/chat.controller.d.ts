import { Request, Response, NextFunction } from 'express';
declare const chatController: {
    /** POST /chats/private – get-or-create 1-to-1 chat. */
    getOrCreatePrivate(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** POST /chats/group – create a new group. */
    createGroup(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /chats – list user's chats. */
    listChats(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /chats/:id – get single chat. */
    getChat(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** PATCH /chats/:id – update group info. */
    updateGroup(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** POST /chats/:id/members – add members to group. */
    addMembers(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** DELETE /chats/:id/members/:userId – remove a member. */
    removeMember(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /chats/search?q=... */
    searchChats(req: Request, res: Response, next: NextFunction): Promise<void>;
};
export default chatController;
//# sourceMappingURL=chat.controller.d.ts.map