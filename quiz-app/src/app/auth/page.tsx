'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();
  const googleClickedRef = useRef(false);

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function reset() {
    setError(null);
    setMessage(null);
    setEmail('');
    setPassword('');
  }

  function switchMode(next: AuthMode) {
    reset();
    setMode(next);
  }

  function validate(): string | null {
    if (!email.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return 'Please enter a valid email address.';
    if (mode !== 'forgot') {
      if (!password) return 'Password is required.';
      if (mode === 'signup' && password.length < 6)
        return 'Password must be at least 6 characters.';
    }
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Account created! Check your email for a confirmation link.');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset`,
        });
        if (error) throw error;
        setMessage('Reset link sent! Check your inbox. The link expires in 1 hour.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (googleClickedRef.current) return;
    googleClickedRef.current = true;
    setGoogleLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // KEY FIX: point to /auth/callback not /dashboard
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      if (error) throw error;
      // Keep loading true — browser will redirect
      setTimeout(() => {
        googleClickedRef.current = false;
        setGoogleLoading(false);
      }, 10000);
    } catch (err: unknown) {
      googleClickedRef.current = false;
      setGoogleLoading(false);
      setError(err instanceof Error ? err.message : 'Google login failed.');
    }
  }

  const titles: Record<AuthMode, string> = {
    login: 'WELCOME BACK',
    signup: 'JOIN THE TEAM',
    forgot: 'RESET ACCESS CODE',
  };

  const subtitles: Record<AuthMode, string> = {
    login: 'Sign in to access your mission data',
    signup: 'Create your Stark Intelligence account',
    forgot: 'JARVIS will send a secure reset link to your inbox',
  };

  const submitLabel: Record<AuthMode, string> = {
    login: '⚡ Sign In',
    signup: '⚡ Create Account',
    forgot: '📨 Send Reset Link',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center arc-glow"
            style={{
              background: 'radial-gradient(circle, rgba(0,200,240,0.2), rgba(0,200,240,0.04))',
              border: '2px solid var(--arc-blue)',
            }}>
            <div className="w-6 h-6 rounded-full arc-pulse"
              style={{ background: 'radial-gradient(circle, var(--arc-blue), var(--arc-glow))' }} />
          </div>
          <h1 className="font-black tracking-wider mb-3"
            style={{ fontFamily: 'Orbitron', color: 'var(--iron-bright)', fontSize: '22px' }}>
            {titles[mode]}
          </h1>
          <p style={{ color: 'var(--iron-text)', fontFamily: 'Rajdhani', fontSize: '16px' }}>
            {subtitles[mode]}
          </p>
        </div>

        <div className="hud-panel corner-accent p-8 space-y-6">

          {mode !== 'forgot' && (
            <>
              <button
                onClick={handleGoogle}
                disabled={googleLoading || loading}
                className="w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all"
                style={{
                  background: googleLoading ? 'rgba(0,200,240,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${googleLoading ? 'var(--arc-blue)' : 'var(--iron-border)'}`,
                  cursor: googleLoading || loading ? 'not-allowed' : 'pointer',
                  opacity: googleLoading || loading ? 0.8 : 1,
                }}>
                {googleLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full arc-pulse"
                      style={{ background: 'var(--arc-blue)' }} />
                    <span style={{ fontFamily: 'Rajdhani', color: 'var(--arc-blue)', fontSize: '15px', fontWeight: 600 }}>
                      Redirecting to Google...
                    </span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span style={{ fontFamily: 'Rajdhani', color: 'var(--iron-text)', fontSize: '15px', fontWeight: 600 }}>
                      Continue with Google
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'var(--iron-border)' }} />
                <span className="stat-label">or</span>
                <div className="flex-1 h-px" style={{ background: 'var(--iron-border)' }} />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="stat-label block">Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null); }}
              placeholder="agent@stark.com"
              className="input-arc"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="stat-label block">Password</label>
                {mode === 'login' && (
                  <button
                    onClick={() => switchMode('forgot')}
                    style={{
                      fontFamily: 'Rajdhani', fontSize: '13px',
                      color: 'var(--arc-blue)', background: 'none',
                      border: 'none', cursor: 'pointer',
                    }}>
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
                className="input-arc"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          )}

          {mode === 'forgot' && (
            <div className="rounded-xl p-4"
              style={{
                background: 'rgba(0,200,240,0.05)',
                border: '1px solid rgba(0,200,240,0.15)',
              }}>
              <p className="stat-label mb-2" style={{ color: 'var(--arc-blue)' }}>
                HOW IT WORKS
              </p>
              <p style={{
                fontFamily: 'Rajdhani', fontSize: '14px',
                color: 'var(--iron-text)', lineHeight: 1.7,
              }}>
                Enter your registered email. JARVIS will send a secure reset link.
                Click it to set a new password. Expires in 1 hour.
              </p>
            </div>
          )}

          {error && (
            <div className="px-4 py-3.5 rounded-xl"
              style={{
                background: 'rgba(255,68,68,0.07)',
                border: '1px solid rgba(255,68,68,0.25)',
                color: 'var(--danger-red)',
                fontFamily: 'Rajdhani', fontSize: '14px', lineHeight: 1.5,
              }}>
              ⚠ {error}
            </div>
          )}

          {message && (
            <div className="px-4 py-3.5 rounded-xl"
              style={{
                background: 'rgba(0,232,122,0.07)',
                border: '1px solid rgba(0,232,122,0.25)',
                color: 'var(--success-green)',
                fontFamily: 'Rajdhani', fontSize: '14px', lineHeight: 1.5,
              }}>
              ✓ {message}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || googleLoading}
            className="btn-arc btn-primary w-full py-4 disabled:opacity-50"
            style={{ fontSize: '12px' }}>
            {loading ? '⚙ Processing...' : submitLabel[mode]}
          </button>

          <div className="pt-1">
            {mode === 'login' && (
              <p className="text-center"
                style={{ fontFamily: 'Rajdhani', color: 'var(--iron-text)', fontSize: '14px' }}>
                Don&apos;t have an account?{' '}
                <button onClick={() => switchMode('signup')}
                  style={{ color: 'var(--arc-blue)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Sign up
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p className="text-center"
                style={{ fontFamily: 'Rajdhani', color: 'var(--iron-text)', fontSize: '14px' }}>
                Already have an account?{' '}
                <button onClick={() => switchMode('login')}
                  style={{ color: 'var(--arc-blue)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p className="text-center"
                style={{ fontFamily: 'Rajdhani', color: 'var(--iron-text)', fontSize: '14px' }}>
                Remembered it?{' '}
                <button onClick={() => switchMode('login')}
                  style={{ color: 'var(--arc-blue)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Back to sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
