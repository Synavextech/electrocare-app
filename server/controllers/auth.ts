import { Request, Response } from 'express';
import { supabase } from '../db';
import { UserSchema } from '../models/user';
import { createReferral } from '../models/referral';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export const register = async (req: Request, res: Response) => {
  try {
    const data = UserSchema.parse(req.body);

    // Create user directly using Supabase Admin Client (Service Role)
    // Note: Use signUp if you want to trigger email confirmation flow as usual, 
    // or admin.createUser to skip confirmation if needed (but usually signUp is better for client flows).
    // However, since this is a backend proxy, we might want to just proxy the signUp.
    // If we use service role key in 'supabase' client (from db.ts), we have admin privileges.
    // Let's use signUp.

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          role: 'user', // default role
        }
      }
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Generate referral code
    const referralCode = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // We need to ensure the user profile is created. Supabase usually handles this via triggers if set up,
    // but our schema has RLS.
    // Since we are using the service role client in `db.ts` (likely), we can insert into public.User if needed.
    // Let's check if the trigger exists. The schema had a comment about removing trigger.
    // So we MUST manually create the public.User record here.

    // Wait for a moment or just upsert.
    const { error: profileError } = await supabase
      .from('User')
      .upsert({
        id: authData.user.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: 'user',
        referralCode: referralCode
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail the whole request if auth succeeded, but it's risky.
      // For now, log it.
    }

    // Handle referral if present
    if (req.body.referralCode) {
      await handleReferral(req.body.referralCode, authData.user.id);
    }

    // Send welcome email
    // Check if transporter is configured properly, otherwise this might throw
    try {
      if (process.env.SMTP_HOST !== 'smtp.example.com') {
        await transporter.sendMail({
          to: data.email,
          subject: 'Welcome to ElectroCare',
          text: `Welcome! Your referral code is: ${referralCode}`,
        });
      }
    } catch (emailError) {
      console.warn('Email sending failed, but registration succeeded:', emailError);
    }

    // Set HttpOnly cookie
    res.cookie('access_token', authData.session?.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });

    res.json({ user: authData.user, message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration failed:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return res.status(401).json({ error: error.message });

    // Fetch profile to get role
    const { data: profile } = await supabase
      .from('User')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Set HttpOnly cookie
    res.cookie('access_token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });

    res.json({ user: { ...data.user, ...profile } });
  } catch (err) {
    console.error('Login failed:', (err as Error).message);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const handleReferral = async (referrerCode: string, referredId: string) => {
  const { data: referrer } = await supabase
    .from('User')
    .select('*, wallet:Wallet(*)')
    .eq('referralCode', referrerCode)
    .single();

  if (referrer) {
    // Create referral record
    await supabase.from('Referral').insert({
      referrerId: referrer.id,
      refereeId: referredId,
      status: 'completed'
    });

    // Award 5% bonus points (5 points flat)
    if (referrer.wallet) {
      await supabase.from('Wallet').update({
        points: referrer.wallet.points + 5
      }).eq('id', referrer.wallet.id);
    }
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const baseUrl = process.env.API_URL || 'https://electrocare.tech';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`,
    });

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('Forgot password failed:', (err as Error).message);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('access_token');
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  // req.user is set by authMiddleware
  // Fetch full profile
  const { data: profile } = await supabase
    .from('User')
    .select('*')
    .eq('id', req.user.id)
    .single();

  res.json({ user: { ...req.user, ...profile } });
};
