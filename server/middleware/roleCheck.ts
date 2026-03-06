import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to restrict access based on user roles.
 * Expects req.user to be populated by authMiddleware.
 * 
 * @param roles Array of allowed roles (e.g., ['admin', 'technician'])
 */
export const roleCheck = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            console.warn(`Access denied for user ${req.user.id} with role ${req.user.role}. Required: ${roles.join(', ')}`);
            return res.status(403).json({ error: 'Access denied. Unauthorized role.' });
        }

        next();
    };
};
