import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

import './globals.css';

/**
 * Inter is loaded through next/font so the stylesheet is self-hosted and
 * zero-request at runtime. `variable` exposes `--font-inter`, which is the
 * family consumed by tailwind.config.ts and `--lg-font-sans`.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'LegalOS — Legal Practice Management',
    template: '%s · LegalOS',
  },
  description:
    'LegalOS is the operating system for modern law firms: matter management, client intake, document automation, time & billing, trust accounting, court deadlines and firm analytics in one workspace.',
  keywords: [
    'legal practice management',
    'law firm software',
    'matter management',
    'client intake',
    'time and billing',
    'trust accounting',
    'court calendar',
    'legal research',
    'document automation',
    'LegalOS',
  ],
  applicationName: 'LegalOS',
  authors: [{ name: 'KhalidKhan541' }],
  creator: 'KhalidKhan541',
  publisher: 'LegalOS',
  category: 'business',
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: APP_URL,
    siteName: 'LegalOS',
    locale: 'en_US',
    title: 'LegalOS — Legal Practice Management',
    description:
      'Run your firm like a Fortune 500 legal dept. Matters, intake, documents, billing, trust accounting, court calendar and analytics — one crimson-accented operating system.',
  },
  twitter: {
    card: 'summary',
    title: 'LegalOS — Legal Practice Management',
    description:
      'Run your firm like a Fortune 500 legal dept. Matters, intake, documents, billing, trust accounting, court calendar and analytics — one workspace.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f17' },
  ],
};

/**
 * Pre-hydration theme bootstrap — prevents the light/dark flash (FOUC).
 *
 * Runs synchronously while the document is still parsing, before first paint
 * and before React hydrates, so `.dark` is already correct on <html>.
 *
 * Storage key precedence:
 *   1. `lg-theme`          — public theming key (documented in README)
 *   2. `legalos-theme`     — ThemeContext's STORAGE_KEY fallback
 *   3. OS preference via `prefers-color-scheme` when nothing is stored.
 */
const themeInitScript = `(function(){try{
var stored=null;
try{stored=window.localStorage.getItem('lg-theme');}catch(e){}
if(!stored){try{stored=window.localStorage.getItem('legalos-theme');}catch(e){}}
var dark;
if(stored==='dark'){dark=true;}else if(stored==='light'){dark=false;}
else{dark=!!(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);}
var root=document.documentElement;
root.classList.toggle('dark',dark);
root.style.colorScheme=dark?'dark':'light';
}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        className={inter.className}
        style={{ fontFamily: 'var(--font-inter), var(--lg-font-sans), sans-serif' }}
      >
        {/* Inline, parser-blocking: applied before first paint (no FOUC). */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />

        <ThemeProvider defaultTheme="system">
          <SidebarProvider>
            <NotificationProvider>
              {children}

              <Toaster
                position="bottom-right"
                reverseOrder={false}
                gutter={10}
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--lg-surface, #ffffff)',
                    color: 'var(--lg-text, #0f172a)',
                    border: '1px solid var(--lg-border, #e5e7eb)',
                    borderRadius: 'var(--lg-radius-md, 0.75rem)',
                    boxShadow: 'var(--lg-shadow-md, 0 4px 12px -2px rgb(15 23 42 / 0.1))',
                    fontSize: '0.875rem',
                    padding: '0.75rem 0.875rem',
                    maxWidth: '24rem',
                  },
                  success: {
                    iconTheme: { primary: '#16a34a', secondary: '#ffffff' },
                  },
                  error: {
                    iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
                  },
                }}
              />
            </NotificationProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
