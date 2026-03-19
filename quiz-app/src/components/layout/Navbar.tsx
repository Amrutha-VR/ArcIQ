'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const links = [
  { href: '/dashboard', label: 'SYSTEMS' },
  { href: '/history', label: 'MISSION LOG' },
  { href: '/leaderboard', label: 'RANKINGS' },
  { href: '/wallet', label: 'WALLET' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [time, setTime] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(8,14,26,0.92)',
        borderBottom: '1px solid var(--iron-border)',
        backdropFilter: 'blur(12px)',
      }}>
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="relative w-7 h-7 rounded-full arc-glow flex items-center justify-center"
            style={{ background: 'radial-gradient(circle, var(--arc-blue), var(--arc-glow))', animation: 'arcPulse 2s infinite' }}>
            <div className="w-2.5 h-2.5 rounded-full"
              style={{ background: 'var(--iron-darker)', boxShadow: 'inset 0 0 6px rgba(0,200,240,0.8)' }} />
          </div>
          <span className="font-black tracking-widest text-sm hidden sm:block"
            style={{ fontFamily: 'Orbitron', color: 'var(--arc-blue)' }}>
            JARVIS QUIZ
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          {links.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href}
                className="px-3 py-2 rounded-lg text-xs font-bold tracking-widest transition-all"
                style={{
                  fontFamily: 'Orbitron',
                  fontSize: '10px',
                  color: isActive ? 'var(--arc-blue)' : 'var(--iron-text)',
                  background: isActive ? 'rgba(0,200,240,0.08)' : 'transparent',
                  borderBottom: isActive ? '1px solid var(--arc-blue)' : '1px solid transparent',
                }}>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden lg:block text-xs font-mono arc-pulse"
            style={{ color: 'var(--arc-blue)', fontFamily: 'Orbitron', fontSize: '10px' }}>
            {time}
          </span>

          <Link href="/quiz/create"
            className="btn-arc btn-primary px-4 py-2 hidden sm:flex"
            style={{ fontSize: '10px' }}>
            ⚡ NEW MISSION
          </Link>

          {user ? (
            <button onClick={handleSignOut}
              className="btn-arc btn-danger px-3 py-2"
              style={{ fontSize: '10px' }}>
              LOGOUT
            </button>
          ) : (
            <Link href="/auth"
              className="btn-arc btn-outline px-3 py-2"
              style={{ fontSize: '10px' }}>
              LOGIN
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}