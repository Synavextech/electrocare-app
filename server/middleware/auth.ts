import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db.js';
import jwt from 'jsonwebtoken';

export default async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.access_token;

  if (!token) {
    token = req.headers.authorization?.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    let userId: string | null = null;
    let userEmail: string | undefined;

    // Fast local verification with JWT_SECRET
    if (process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
        if (decoded?.sub) {
          userId = decoded.sub;
          userEmail = decoded.email;
        }
      } catch (jwtErr) {
        // Fall back to Supabase cloud auth
      }
    }

    if (!userId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
      }

      userId = user.id;
      userEmail = user.email;
    }

    // Fetch user profile to get the role
    const { data: profile, error: profileError } = await supabase
      .from('User')
      .select('role, name, email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      // Fallback or error if profile doesn't exist?
      // According to system rules, profile should exist.
      req.user = {
        id: userId,
        role: 'user', // Default to user if profile not found
        email: userEmail
      };
    } else {
      req.user = {
        id: userId,
        role: profile.role,
        email: profile.email || userEmail,
        name: profile.name
      };
    }

    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}