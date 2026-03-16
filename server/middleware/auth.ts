import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db.js';

export default async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.access_token;

  if (!token) {
    token = req.headers.authorization?.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    // Fetch user profile to get the role
    const { data: profile, error: profileError } = await supabase
      .from('User')
      .select('role, name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Fallback or error if profile doesn't exist?
      // According to system rules, profile should exist.
      req.user = {
        id: user.id,
        role: 'user', // Default to user if profile not found
        email: user.email
      };
    } else {
      req.user = {
        id: user.id,
        role: profile.role,
        email: profile.email || user.email,
        name: profile.name
      };
    }

    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}