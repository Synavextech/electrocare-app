import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db.js';
import jwt from 'jsonwebtoken';

export default async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.access_token;
  if (!token) {
    token = req.headers.authorization?.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    let userId: string | null = null;
    let userEmail: string | undefined;

    if (process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
        if (decoded?.sub) {
          userId = decoded.sub;
          userEmail = decoded.email;
        }
      } catch (jwtErr) {
        // Fall back to Supabase auth
      }
    }

    if (!userId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
        userEmail = user.email;
      }
    }

    if (userId) {
      const { data: profile } = await supabase
        .from('User')
        .select('role, name, email')
        .eq('id', userId)
        .single();

      req.user = {
        id: userId,
        role: profile?.role || 'user',
        email: userEmail || profile?.email,
      };
    }
  } catch (err) {
    // Non-fatal for optional auth
  }

  next();
}
