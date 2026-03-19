import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { MobileNav } from '@/components/layout/MobileNav';

export const viewport: Viewport = {
  themeColor: '#00c8f0',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'JARVIS QUIZ — Stark Intelligence Platform',
  description: 'AI-powered quiz platform with Iron Man aesthetics',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'JARVIS QUIZ',
  },
};

interface MobileNavLinkProps {
  href: string;
  icon: string;
  label: string;
}

function MobileNavLink({ href, icon, label }: MobileNavLinkProps) {
  return (
    
    <a  href={href}
      className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all"
      style={{ color: 'var(--iron-text-soft)', minWidth: '48px' }}>
      <span className="text-base">{icon}</span>
      <span style={{
        fontFamily: 'Orbitron',
        fontSize: '8px',
        letterSpacing: '0.08em',
        fontWeight: 700,
      }}>
        {label}
      </span>
    </a>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="iron-grid min-h-screen">
        <ErrorBoundary>
          <AuthProvider>
            <Navbar />
            <main className="pt-16 pb-20 md:pb-0">{children}</main>
            <MobileNav />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}