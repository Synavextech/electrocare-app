import { Request, Response } from 'express';
import { supabase } from '../db.js';
import { UserSchema } from '../models/user.js';
import { createReferral } from '../models/referral.js';
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

    const fallbackName = data.name || data.email.split('@')[0];
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: fallbackName,
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

    // Ensure the public user profile exists and is updated
    const { error: profileError } = await supabase
      .from('User')
      .upsert({
        id: authData.user.id,
        email: data.email,
        name: fallbackName,
        phone: data.phone,
        role: 'user',
        referralCode: referralCode
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    // Ensure wallet exists for user
    await supabase
      .from('Wallet')
      .upsert({
        userId: authData.user.id,
        balance: 0,
        points: 0
      }, { onConflict: 'userId' });

    // Handle referral if present
    if (req.body.referralCode) {
      await handleReferral(req.body.referralCode, authData.user.id);
    }

    // Send welcome email
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_HOST !== 'smtp.example.com') {
        await transporter.sendMail({
          to: data.email,
          subject: 'Welcome to ElectroCare',
          text: `Welcome! Your referral code is: ${referralCode}`,
        });
      }
    } catch (emailError) {
      console.warn('Email sending failed, but registration succeeded:', emailError);
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
      maxAge: 7 * 24 * 3600 * 1000, // 7 days
    };

    if (authData.session?.access_token) {
      res.cookie('access_token', authData.session.access_token, cookieOptions);
    }

    res.json({ user: authData.user, message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration failed:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase Login Error:', JSON.stringify(error, null, 2));
      return res.status(401).json({ error: error.message });
    }

    if (!data.session) {
      console.warn('Login successful but no session returned');
      return res.status(401).json({ error: 'Auth session failed' });
    }

    // Fetch profile to get role, phone, referralCode, and wallet
    const { data: profile } = await supabase
      .from('User')
      .select('*, wallet:Wallet(*)')
      .eq('id', data.user.id)
      .single();

    const walletData = Array.isArray(profile?.wallet) ? profile.wallet[0] : profile?.wallet;
    const refCode = profile?.referralCode || profile?.referral_code || data.user.user_metadata?.referralCode;

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
      maxAge: 7 * 24 * 3600 * 1000, // 7 days
    };

    // Set HttpOnly cookie
    res.cookie('access_token', data.session.access_token, cookieOptions);

    res.json({
      user: {
        ...data.user,
        ...profile,
        phone: profile?.phone || data.user.user_metadata?.phone,
        referralCode: refCode,
        referral_code: refCode,
        wallet: walletData,
        points: walletData?.points || 0,
        wallet_balance: walletData?.balance || 0,
      }
    });
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

    const userWallet = Array.isArray(referrer.wallet) ? referrer.wallet[0] : referrer.wallet;

    // Award 10 points per system design guide
    if (userWallet) {
      await supabase.from('Wallet').update({
        points: (userWallet.points || 0) + 10
      }).eq('id', userWallet.id);

      await supabase.from('Transaction').insert({
        walletId: userWallet.id,
        amount: 10,
        type: 'deposit'
      });
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

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { password, accessToken } = req.body;
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (!accessToken) {
      return res.status(400).json({ error: 'Recovery session token is required' });
    }

    // Verify recovery token with Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid or expired password reset link. Please request a new one.' });
    }

    // Update password using Admin client
    const { error: updateError } = await supabase.auth.admin.updateUserById(userData.user.id, {
      password,
    });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ success: true, message: 'Password updated successfully. You can now log in.' });
  } catch (err: any) {
    console.error('Reset password failed:', err.message);
    res.status(500).json({ error: err.message || 'Failed to reset password' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  });
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  // req.user is set by authMiddleware
  // Fetch full profile and wallet
  const { data: profile } = await supabase
    .from('User')
    .select('*, wallet:Wallet(*)')
    .eq('id', req.user.id)
    .single();

  const walletData = Array.isArray(profile?.wallet) ? profile.wallet[0] : profile?.wallet;
  const refCode = profile?.referralCode || profile?.referral_code;

  res.json({
    user: {
      ...req.user,
      ...profile,
      phone: profile?.phone || (req.user as any)?.phone,
      referralCode: refCode,
      referral_code: refCode,
      wallet: walletData,
      points: walletData?.points || 0,
      wallet_balance: walletData?.balance || 0,
    }
  });
};
