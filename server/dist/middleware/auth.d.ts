import { Request, Response, NextFunction } from 'express';
export default function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=auth.d.ts.map