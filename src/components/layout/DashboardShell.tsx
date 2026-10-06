'use client';

import type * as React from 'react';

import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/**
 * Shell composition: fixed sidebar + sticky top bar + padded main area.
 * The content column offsets itself by the sidebar width on large screens
 * (w-64 expanded / w-20 collapsed) and stacks under the mobile drawer.
 *
 * Providers (Theme / Sidebar / Notification) are mounted once by the root
 * layout — this shell only consumes them.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-[var(--lg-bg)]">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <Sidebar />

      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-200 ease-out',
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        <TopBar />

        <main
          id="main-content"
          className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-6 sm:px-6 lg:px-8"
        >
          {children}
        </main>

        <footer className="mx-auto w-full max-w-[1680px] border-t border-[var(--lg-border)] px-4 py-4 text-xs text-[var(--lg-text-muted)] sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>LegalOS · Halloran &amp; Reyes LLP · mock workspace</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Systems operational
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default DashboardShell;
