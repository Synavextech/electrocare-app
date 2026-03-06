import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to restrict access based on user roles.
 * Expects req.user to be populated by authMiddleware.
 *
 * @param roles Array of allowed roles (e.g., ['admin', 'technician'])
 */
export declare const roleCheck: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=roleCheck.d.ts.map