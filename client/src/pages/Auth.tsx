import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema, forgotPasswordSchema } from '../utils/validators';
import useAuth from '../hooks/useAuth';
import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import apiClient from '../utils/apiClient';

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const Auth: React.FC = () => {
  const { login, register: registerUser, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const schema = mode === 'login' ? loginSchema : mode === 'register' ? registerSchema : forgotPasswordSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData | RegisterFormData | ForgotPasswordFormData>({
    resolver: zodResolver(schema),
  });

  const switchMode = (newMode: 'login' | 'register' | 'forgot-password') => {
    setMode(newMode);
    setMessage(null);
    reset();
  };

  const onSubmit = async (data: LoginFormData | RegisterFormData | ForgotPasswordFormData) => {
    setMessage(null);
    if (mode === 'login') {
      login(data as LoginFormData, {
        onSuccess: (responseData: any) => {
          if (responseData.user?.role === 'admin') {
            navigate({ to: '/admin' });
          } else {
            navigate({ to: '/home' });
          }
        },
        onError: (error: any) => {
          setMessage(error.response?.data?.error || 'Login failed. Please check your credentials.');
        }
      });
    } else if (mode === 'register') {
      registerUser(data as RegisterFormData, {
        onSuccess: (responseData: any) => {
          if (responseData.user?.role === 'admin') {
            navigate({ to: '/admin' });
          } else {
            navigate({ to: '/home' });
          }
        },
        onError: (error: any) => {
          setMessage(error.response?.data?.error || 'Registration failed. Please try again.');
        }
      });
    } else {
      try {
        await apiClient.post('/auth/forgot-password', data);
        setMessage('Password reset email sent. Please check your inbox.');
      } catch (error: any) {
        setMessage(error.response?.data?.error || 'Failed to send reset email');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] animate-in fade-in duration-700">
      <div className="w-full max-w-md p-8 glass-card rounded-3xl transition-premium shadow-premium border border-white/10">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">⚡</div>
          <h2 className="text-4xl font-black tracking-tight text-white">
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Join ElectroCare' : 'Reset Password'}
          </h2>
          <p className="text-white/60 mt-2 font-medium">
            {mode === 'login'
              ? 'Sign in to your premium account'
              : mode === 'register'
                ? 'Create your account to get started'
                : 'Enter your email to reset your password'}
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-semibold animate-in slide-in-from-top-2 ${message.includes('sent') ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {mode === 'register' && (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Full Name</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white placeholder:text-white/20"
                  placeholder="John Doe"
                />
                {/* @ts-ignore */}
                {errors.name && <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mt-1 ml-1">{errors.name.message as string}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Phone Number</label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white placeholder:text-white/20"
                  placeholder="+1234567890"
                />
                {/* @ts-ignore */}
                {errors.phone && <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mt-1 ml-1">{errors.phone.message as string}</p>}
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Email Address</label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white placeholder:text-white/20"
              placeholder="you@example.com"
            />
            {/* @ts-ignore */}
            {errors.email && <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mt-1 ml-1">{errors.email.message as string}</p>}
          </div>

          {mode !== 'forgot-password' && (
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white placeholder:text-white/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-premium p-1"
                >
                  {showPassword ? '👁️' : '🕶️'}
                </button>
              </div>
              {/* @ts-ignore */}
              {errors.password && <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mt-1 ml-1">{errors.password.message as string}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full premium-gradient text-white py-4 rounded-xl font-black uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-premium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading
              ? 'Processing...'
              : mode === 'login'
                ? 'Sign In'
                : mode === 'register'
                  ? 'Create Account'
                  : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          {mode === 'login' && (
            <>
              <p className="text-sm text-white/60">
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('register')}
                  className="text-brand hover:text-brand-vibrant font-bold transition-premium focus:outline-none"
                >
                  Sign Up
                </button>
              </p>
              <button
                onClick={() => switchMode('forgot-password')}
                className="text-sm text-brand/60 hover:text-brand transition-premium focus:outline-none block w-full"
              >
                Forgot Password?
              </button>
            </>
          )}
          {mode === 'register' && (
            <p className="text-sm text-white/60">
              Already have an account?{' '}
              <button
                onClick={() => switchMode('login')}
                className="text-brand hover:text-brand-vibrant font-bold transition-premium focus:outline-none"
              >
                Log In
              </button>
            </p>
          )}
          {mode === 'forgot-password' && (
            <button
              onClick={() => switchMode('login')}
              className="text-sm text-brand hover:text-brand-vibrant font-bold transition-premium focus:outline-none"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
