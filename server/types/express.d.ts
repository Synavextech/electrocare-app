import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';  // Add for payload intersection (stable 9.0.2)

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {  // Intersect with JwtPayload for full JWT support
        id: string;        // Standardize to 'id' (string for DB consistency)
        role: string;      // Enum-like from schemas (user/technician/delivery/admin)
      };
    }
  }
}