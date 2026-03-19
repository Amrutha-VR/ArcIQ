'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase handles the token from the URL hash automatically
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
  }, []);

  function validate(): string | null {
    if (!password) return 'New password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  }

  async function handleReset() {
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="hud-panel p-10 max-w-sm w-full text-center space-y-5">
          <div className="text-5xl">✅</div>
          <h2 className="font-black tracking-wider"
            style={{ fontFamily: 'Orbitron', color: 'var(--success-green)', fontSize: '16px' }}>
            PASSWORD UPDATED
          </h2>
          <p style={{ color: 'var(--iron-text)', fontFamily: 'Rajdhani', fontSize: '15px', lineHeight: 1.6 }}>
            Your access code has been successfully reset.
            Redirecting you to the dashboard now...
          </p>
          <div className="w-full h-1 rounded-full" style={{ background: 'var(--iron-border)' }}>
            <div
              className="h-full rounded-full arc-glow"
              style={{
                width: '100%',
                background: 'var(--success-green)',
                animation: 'bootUp 3s linear forwards',
              }} />
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="hud-panel p-10 max-w-sm w-full text-center space-y-5">
          <div className="text-4xl arc-pulse">🔐</div>
          <h2 className="font-black tracking-wider"
            style={{ fontFamily: 'Orbitron', color: 'var(--arc-blue)', fontSize: '15px' }}>
            VERIFYING RESET LINK
          </h2>
          <p style={{ color: 'var(--iron-text)', fontFamily: 'Rajdhani', fontSize: '15px', lineHeight: 1.6 }}>
            JARVIS is validating your reset token.
            Please wait a moment...
          </p>
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map(i => (
              <div key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: 'var(--arc-blue)',
                  animation: 'arcPulse 1s infinite',
                  animationDelay: `${i * 0.2}s`,
                }} />
            ))}
          </div>
          <p style={{ color: 'var(--iron-text-soft)', fontFamily: 'Rajdhani', fontSize: '13px' }}>
            If this takes too long,{' '}
            <button
              onClick={() => router.push('/auth')}
              style={{ color: 'var(--arc-blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
              request a new link
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center arc-glow"
            style={{
              background: 'radial-gradient(circle, rgba(0,200,240,0.2), rgba(0,200,240,0.04))',
              border: '2px solid var(--arc-blue)',
            }}>
            <span style={{ fontSize: '22px' }}>🔐</span>
          </div>
          <h1 className="font-black tracking-wider mb-3"
            style={{ fontFamily: 'Orbitron', color: 'var(--iron-bright)', fontSize: '20px' }}>
            SET NEW PASSWORD
          </h1>
          <p style={{ color: 'var(--iron-text)', fontFamily: 'Rajdhani', fontSize: '16px' }}>
            Choose a strong new access code for your account
          </p>
        </div>

        {/* Form */}
        <div className="hud-panel corner-accent p-8 space-y-6">

          {/* Password requirements info */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(0,200,240,0.05)',
              border: '1px solid rgba(0,200,240,0.15)',
            }}>
            <p className="stat-label mb-2" style={{ color: 'var(--arc-blue)' }}>
              PASSWORD REQUIREMENTS
            </p>
            <ul style={{
              fontFamily: 'Rajdhani',
              fontSize: '14px',
              color: 'var(--iron-text)',
              lineHeight: 1.8,
              paddingLeft: '4px',
              listStyle: 'none',
            }}>
              <li>✓ Minimum 6 characters</li>
              <li>✓ Both fields must match</li>
              <li>✓ Avoid reusing old passwords</li>
            </ul>
          </div>

          {/* New password */}
          <div className="space-y-2">
            <label className="stat-label block">New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(null); }}
              placeholder="Enter new password"
              className="input-arc"
            />
            {/* Strength indicator */}
            {password.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(level => {
                    const strength =
                      password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4
                      : password.length >= 8 && /[0-9]/.test(password) ? 3
                      : password.length >= 6 ? 2
                      : 1;
                    const color =
                      strength >= 4 ? 'var(--success-green)'
                      : strength >= 3 ? 'var(--arc-blue)'
                      : strength >= 2 ? 'var(--warning-amber)'
                      : 'var(--danger-red)';
                    return (
                      <div key={level} className="flex-1 h-1 rounded-full"
                        style={{
                          background: level <= strength ? color : 'var(--iron-border)',
                          transition: 'background 0.2s',
                        }} />
                    );
                  })}
                </div>
                <p style={{
                  fontFamily: 'Orbitron',
                  fontSize: '9px',
                  color: password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                    ? 'var(--success-green)'
                    : password.length >= 8 ? 'var(--arc-blue)'
                    : password.length >= 6 ? 'var(--warning-amber)'
                    : 'var(--danger-red)',
                  letterSpacing: '0.06em',
                }}>
                  {password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                    ? 'STRONG'
                    : password.length >= 8 ? 'GOOD'
                    : password.length >= 6 ? 'WEAK'
                    : 'TOO SHORT'}
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <label className="stat-label block">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(null); }}
              placeholder="Re-enter new password"
              className="input-arc"
              onKeyDown={e => e.key === 'Enter' && handleReset()}
              style={{
                borderColor: confirm.length > 0
                  ? confirm === password ? 'var(--success-green)' : 'var(--danger-red)'
                  : undefined,
              }}
            />
            {confirm.length > 0 && (
              <p style={{
                fontFamily: 'Orbitron',
                fontSize: '9px',
                letterSpacing: '0.06em',
                color: confirm === password ? 'var(--success-green)' : 'var(--danger-red)',
              }}>
                {confirm === password ? '✓ PASSWORDS MATCH' : '✗ PASSWORDS DO NOT MATCH'}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3.5 rounded-xl"
              style={{
                background: 'rgba(255,68,68,0.07)',
                border: '1px solid rgba(255,68,68,0.25)',
                color: 'var(--danger-red)',
                fontFamily: 'Rajdhani',
                fontSize: '14px',
                lineHeight: 1.5,
              }}>
              ⚠ {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleReset}
            disabled={loading}
            className="btn-arc btn-primary w-full py-4 disabled:opacity-50"
            style={{ fontSize: '12px' }}>
            {loading ? '⚙ Updating...' : '🔐 UPDATE PASSWORD'}
          </button>

          <p className="text-center"
            style={{ fontFamily: 'Rajdhani', color: 'var(--iron-text)', fontSize: '14px' }}>
            <button
              onClick={() => router.push('/auth')}
              style={{ color: 'var(--arc-blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
              ← Back to Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}