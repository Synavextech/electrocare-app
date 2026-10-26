import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '../utils/supabase';
import apiClient from '../utils/apiClient';
import { KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tokenDetected, setTokenDetected] = useState<boolean | null>(null);
  const [recoveryAccessToken, setRecoveryAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check URL hash (Supabase default: #access_token=...&refresh_token=...&type=recovery)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    // 2. Check query params (e.g. ?code=... for PKCE flow)
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');

    if (accessToken && type === 'recovery') {
      setRecoveryAccessToken(accessToken);
      setTokenDetected(true);
      if (refreshToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).catch((err) => console.warn('Session set error:', err));
      }
    } else if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (!error && data.session) {
          setRecoveryAccessToken(data.session.access_token);
          setTokenDetected(true);
        } else {
          setTokenDetected(false);
        }
      });
    } else {
      // 3. Listen to Supabase onAuthStateChange for PASSWORD_RECOVERY event
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
          if (session?.access_token) {
            setRecoveryAccessToken(session.access_token);
          }
          setTokenDetected(true);
        }
      });

      // Give 1 second grace period to detect session
      const timer = setTimeout(() => {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            setRecoveryAccessToken(data.session.access_token);
            setTokenDetected(true);
          } else {
            setTokenDetected((prev) => (prev === null ? false : prev));
          }
        });
      }, 1000);

      return () => {
        authListener?.subscription.unsubscribe();
        clearTimeout(timer);
      };
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);

    try {
      // 1. Update in Supabase Auth client session if active
      let clientSuccess = false;
      const { error: supabaseError } = await supabase.auth.updateUser({ password });
      if (!supabaseError) {
        clientSuccess = true;
      }

      // 2. Also notify backend with recovery token if present
      if (recoveryAccessToken) {
        try {
          await apiClient.post('/auth/reset-password', {
            password,
            accessToken: recoveryAccessToken,
          });
          clientSuccess = true;
        } catch (apiErr) {
          if (!clientSuccess) throw apiErr;
        }
      } else if (!clientSuccess && supabaseError) {
        throw supabaseError;
      }

      setMessage({
        type: 'success',
        text: 'Password updated successfully! Redirecting to login...',
      });

      setTimeout(() => {
        navigate({ to: '/login' });
      }, 2000);
    } catch (err: any) {
      console.error('Password reset failure:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to update password. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 animate-in fade-in duration-700">
      <div className="w-full max-w-md p-8 md:p-10 glass-card rounded-3xl shadow-premium border border-white/10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-3xl mx-auto mb-4 text-brand">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase">
            Reset Password
          </h2>
          <p className="text-white/50 text-xs mt-2">
            Enter a new password for your ElectroCare account.
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {tokenDetected === false ? (
          <div className="text-center space-y-4 p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="text-4xl">⚠️</div>
            <h4 className="text-white font-bold text-sm">Expired or Missing Reset Link</h4>
            <p className="text-white/50 text-xs leading-relaxed">
              This password reset link is invalid or has expired. Please request a fresh recovery email from the login page.
            </p>
            <button
              onClick={() => navigate({ to: '/login' })}
              className="w-full py-3 rounded-xl vibrant-gradient text-white text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-lg"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-widest text-white/50 ml-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none transition-premium text-white placeholder:text-white/20 text-sm focus:border-brand pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-widest text-white/50 ml-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                minLength={6}
                required
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none transition-premium text-white placeholder:text-white/20 text-sm focus:border-brand"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full vibrant-gradient text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-premium shadow-xl disabled:opacity-50 cursor-pointer text-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Save New Password'
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate({ to: '/login' })}
                className="text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
