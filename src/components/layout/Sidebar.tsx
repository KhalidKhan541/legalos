'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import {
  Scale,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Gavel,
  Receipt,
  type LucideIcon,
} from 'lucide-react';

import { SIDEBAR_NAV, APP_NAME, APP_BRAND } from '@/lib/constants';
import { MOCK_MATTERS, MOCK_INVOICES, MOCK_CLIENTS } from '@/lib/mock-data';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** SIDEBAR_NAV hrefs are root-relative (e.g. '/analytics'); routes live under /dashboard. */
function resolveHref(href: string): string {
  if (href === '/dashboard') return '/dashboard';
  if (href.startsWith('/dashboard')) return href;
  return `/dashboard${href}`;
}

/** Match by final path segment so nested routes keep their parent highlighted. */
function isActive(pathname: string, href: string): boolean {
  const resolved = resolveHref(href);
  if (resolved === '/dashboard') return pathname === '/dashboard';
  return pathname === resolved || pathname.startsWith(`${resolved}/`);
}

function Badge({ value }: { value?: string | number }) {
  if (value === undefined || value === null) return null;
  return (
    <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-crimson-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-crimson-700 dark:bg-crimson-950 dark:text-crimson-300">
      {value}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* firm widget — live numbers derived from mock data                           */
/* -------------------------------------------------------------------------- */

function FirmWidget({ collapsed }: { collapsed: boolean }) {
  const stats = useMemo(() => {
    const openMatters = MOCK_MATTERS.filter((m) => m.status !== 'closed').length;
    const overdue = MOCK_INVOICES.filter(
      (i) => i.status === 'overdue' || i.daysOverdue > 0
    ).reduce((sum, i) => sum + i.balance, 0);
    const activeClients = MOCK_CLIENTS.filter((c) => c.status === 'active').length;
    return { openMatters, overdue, activeClients };
  }, []);

  if (collapsed) {
    return (
      <div
        className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-crimson-500 to-crimson-700 text-xs font-bold text-white shadow-md ring-2 ring-crimson-200 dark:ring-crimson-900"
        title={`${stats.openMatters} open matters · ${formatCurrency(stats.overdue)} overdue`}
      >
        {stats.openMatters}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-crimson-600 via-crimson-700 to-crimson-800 p-4 text-white shadow-lg shadow-crimson-600/20">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-crimson-100/90">
        <Gavel className="h-3.5 w-3.5" /> Firm pulse
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold leading-none tabular-nums">
            {stats.openMatters}
          </div>
          <div className="mt-1 text-[11px] text-crimson-100/90">open matters</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold leading-none tabular-nums">
            {formatCurrency(stats.overdue)}
          </div>
          <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-crimson-100/90">
            <Receipt className="h-3 w-3" /> overdue
          </div>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/25">
        <div
          className="h-full rounded-full bg-white"
          style={{
            width: `${Math.min(100, (stats.activeClients / Math.max(1, MOCK_CLIENTS.length)) * 100)}%`,
          }}
        />
      </div>
      <div className="mt-1.5 text-[10px] text-crimson-100/80">
        {stats.activeClients} active clients
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* sidebar                                                                     */
/* -------------------------------------------------------------------------- */

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, toggleCollapsed, closeMobile } = useSidebar();

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, closeMobile]);

  const railWidth = collapsed ? 'lg:w-20' : 'lg:w-64';

  const nav = (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
      {SIDEBAR_NAV.map((section) => (
        <div key={section.title} className="mb-5 last:mb-0">
          {!collapsed && (
            <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {section.title}
            </div>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const href = resolveHref(item.href);
              const active = isActive(pathname, item.href);
              const Icon: LucideIcon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    onClick={() => {
                      if (mobileOpen) closeMobile();
                    }}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      collapsed && 'justify-center px-2',
                      active
                        ? 'bg-crimson-50 text-crimson-700 dark:bg-crimson-950/60 dark:text-crimson-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                    )}
                  >
                    {/* active rail indicator */}
                    <span
                      aria-hidden
                      className={cn(
                        'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-crimson-600 transition-opacity',
                        active ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0 transition-colors',
                        active
                          ? 'text-crimson-600 dark:text-crimson-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                      )}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && <Badge value={item.badge} />}
                    {collapsed && item.badge !== undefined && (
                      <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-crimson-500" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const header = (
    <div
      className={cn(
        'flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-800',
        collapsed && 'justify-center px-2'
      )}
    >
      <Link href="/dashboard" className="flex items-center gap-2.5" aria-label={APP_NAME}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-crimson-500 to-crimson-700 text-white shadow-sm shadow-crimson-600/30">
          <Scale className="h-5 w-5" strokeWidth={2.2} />
        </span>
        {!collapsed && (
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              {APP_NAME}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-crimson-600 dark:text-crimson-400">
              {APP_BRAND.tagline}
            </span>
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={closeMobile}
        aria-label="Close sidebar"
        className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );

  const footer = (
    <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
      <div className={cn(collapsed && 'flex justify-center')}>
        <FirmWidget collapsed={collapsed} />
      </div>
      {!collapsed && (
        <button
          type="button"
          onClick={toggleCollapsed}
          className="mt-2 hidden w-full items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:flex"
        >
          <PanelLeftClose className="h-4 w-4" /> Collapse
        </button>
      )}
      {collapsed && (
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label="Expand sidebar"
          className="mx-auto mt-2 hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:block"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200 bg-white transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-950 lg:flex',
          railWidth
        )}
      >
        {header}
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        aria-hidden={!mobileOpen}
        onClick={closeMobile}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-hidden={!mobileOpen}
      >
        {header}
        {nav}
        {footer}
      </aside>
    </>
  );
}

export default Sidebar;
