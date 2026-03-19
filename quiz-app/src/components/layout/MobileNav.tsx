'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', icon: '🏠', label: 'HOME' },
  { href: '/quiz/create', icon: '⚡', label: 'QUIZ' },
  { href: '/dashboard', icon: '📊', label: 'STATS' },
  { href: '/history', icon: '📋', label: 'LOG' },
  { href: '/wallet', icon: '🏆', label: 'WALLET' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(8,14,26,0.95)',
        borderTop: '1px solid var(--iron-border)',
        backdropFilter: 'blur(12px)',
      }}>
      <div className="flex items-center justify-around px-1 py-2">
        {links.map(({ href, icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all"
              style={{
                color: isActive ? 'var(--arc-blue)' : 'var(--iron-text-soft)',
                background: isActive ? 'rgba(0,200,240,0.08)' : 'transparent',
                minWidth: '48px',
              }}>
              <span className="text-base">{icon}</span>
              <span style={{
                fontFamily: 'Orbitron',
                fontSize: '8px',
                letterSpacing: '0.08em',
                fontWeight: 700,
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}