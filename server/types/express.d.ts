import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';  // Add for payload intersection (stable 9.0.2)

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email?: string;
        name?: string;
      };
    }
  }
}