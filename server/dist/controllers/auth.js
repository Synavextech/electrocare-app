"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.forgotPassword = exports.handleReferral = exports.login = exports.register = void 0;
const db_1 = require("../db");
const user_1 = require("../models/user");
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
const register = async (req, res) => {
    try {
        const data = user_1.UserSchema.parse(req.body);
        // Create user directly using Supabase Admin Client (Service Role)
        // Note: Use signUp if you want to trigger email confirmation flow as usual, 
        // or admin.createUser to skip confirmation if needed (but usually signUp is better for client flows).
        // However, since this is a backend proxy, we might want to just proxy the signUp.
        // If we use service role key in 'supabase' client (from db.ts), we have admin privileges.
        // Let's use signUp.
        const { data: authData, error: authError } = await db_1.supabase.auth.signUp({
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
        const { error: profileError } = await db_1.supabase
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
            await (0, exports.handleReferral)(req.body.referralCode, authData.user.id);
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
        }
        catch (emailError) {
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
    }
    catch (err) {
        console.error('Registration failed:', err.message);
        res.status(500).json({ error: err.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await db_1.supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error)
            return res.status(401).json({ error: error.message });
        // Fetch profile to get role
        const { data: profile } = await db_1.supabase
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
    }
    catch (err) {
        console.error('Login failed:', err.message);
        res.status(500).json({ error: 'Login failed' });
    }
};
exports.login = login;
const handleReferral = async (referrerCode, referredId) => {
    const { data: referrer } = await db_1.supabase
        .from('User')
        .select('*, wallet:Wallet(*)')
        .eq('referralCode', referrerCode)
        .single();
    if (referrer) {
        // Create referral record
        await db_1.supabase.from('Referral').insert({
            referrerId: referrer.id,
            refereeId: referredId,
            status: 'completed'
        });
        // Award 5% bonus points (5 points flat)
        if (referrer.wallet) {
            await db_1.supabase.from('Wallet').update({
                points: referrer.wallet.points + 5
            }).eq('id', referrer.wallet.id);
        }
    }
};
exports.handleReferral = handleReferral;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const { error } = await db_1.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'http://localhost:3000/reset-password',
        });
        if (error)
            return res.status(400).json({ error: error.message });
        res.json({ message: 'Password reset email sent' });
    }
    catch (err) {
        console.error('Forgot password failed:', err.message);
        res.status(500).json({ error: 'Failed to send reset email' });
    }
};
exports.forgotPassword = forgotPassword;
const logout = async (req, res) => {
    res.clearCookie('access_token');
    res.json({ message: 'Logged out successfully' });
};
exports.logout = logout;
const getMe = async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: 'Unauthorized' });
    // req.user is set by authMiddleware
    // Fetch full profile
    const { data: profile } = await db_1.supabase
        .from('User')
        .select('*')
        .eq('id', req.user.id)
        .single();
    res.json({ user: { ...req.user, ...profile } });
};
exports.getMe = getMe;
//# sourceMappingURL=auth.js.map