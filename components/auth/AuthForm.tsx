'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Coffee, ArrowRight, Loader2 } from 'lucide-react';

type Mode = 'login' | 'signup';

const isConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function getSupabase() {
    if (!isConfigured) return null;
    return createClient();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const supabase = getSupabase();
    if (!supabase) { setError('Supabase is not configured.'); return; }
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setSuccess('Check your email to confirm your account, then sign in.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const supabase = getSupabase();
    if (!supabase) { setError('Supabase is not configured.'); return; }
    setGoogleLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setSuccess('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Brand */}
      <div className="flex flex-col items-center pt-[max(64px,env(safe-area-inset-top,0px))] pb-8 px-6">
        <div className="w-14 h-14 bg-zinc-900 rounded-[20px] flex items-center justify-center mb-5 shadow-lg">
          <Coffee className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
          Dev<span className="text-amber-600">Café</span>
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {mode === 'login' ? 'Welcome back' : 'Find your coding spot'}
        </p>
      </div>

      {/* Form area */}
      <div className="flex-1 px-6 pb-[max(32px,env(safe-area-inset-bottom,0px))]">
        {/* Google — primary CTA */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || !isConfigured}
          className={cn(
            'w-full flex items-center justify-center gap-3 rounded-2xl py-4 text-sm font-semibold',
            'border-2 border-zinc-200 text-zinc-800 bg-white',
            'active:bg-zinc-50 transition-colors',
            (googleLoading || !isConfigured) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-zinc-100" />
          <span className="text-xs font-medium text-zinc-400">or</span>
          <div className="flex-1 h-px bg-zinc-100" />
        </div>

        {/* Email / password form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                required
                className={inputCls}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={cn(inputCls, 'pr-11')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !isConfigured}
            className={cn(
              'w-full bg-zinc-900 text-white rounded-2xl py-4 text-sm font-bold mt-1',
              'flex items-center justify-center gap-2 transition-colors',
              'active:bg-zinc-800',
              (loading || !isConfigured) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Sign in' : 'Create account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-zinc-500 mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            className="font-bold text-zinc-900"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

const inputCls = cn(
  'w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm text-zinc-900',
  'placeholder:text-zinc-400 outline-none',
  'focus:border-zinc-400 focus:bg-white transition-colors'
);
