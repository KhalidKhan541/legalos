'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, type ElementType } from 'react';

import { ScaleIcon } from '@/components/icons';
import { useSidebar } from '@/contexts/SidebarContext';
import { SIDEBAR_NAV } from '@/lib/constants';
import {
  MOCK_CLIENTS,
  MOCK_CONTRACTS,
  MOCK_COURT_DATES,
  MOCK_DOCUMENTS,
  MOCK_FILINGS,
  MOCK_INVOICES,
  MOCK_INTAKE,
  MOCK_MATTERS,
  MOCK_TEAM,
  MOCK_TIME_ENTRIES,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { ChevronsLeft, X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Data helpers                                                        */
/* ------------------------------------------------------------------ */

/**
 * `SIDEBAR_NAV` hrefs are authored root-relative (`/matters`) while the actual
 * routes live under the dashboard segment (`/dashboard/matters`).
 */
function resolveHref(href: string): string {
  if (href === '/dashboard' || href.startsWith('/dashboard/')) return href;
  if (href === '/') return '/dashboard';
  return `/dashboard${href}`;
}

/** Live counts surfaced as nav badges, keyed by the href's final segment. */
const NAV_COUNTS: Record<string, number> = {
  clients: MOCK_CLIENTS.filter((c) => c.status === 'active').length,
  intake: MOCK_INTAKE.filter((r) => r.status === 'new').length,
  matters: MOCK_MATTERS.filter((m) => m.status !== 'closed').length,
  'court-dates': MOCK_COURT_DATES.filter(
    (d) => d.status !== 'completed' && d.status !== 'cancelled'
  ).length,
  filings: MOCK_FILINGS.filter((f) => f.status === 'draft').length,
  documents: MOCK_DOCUMENTS.filter(
    (d) => d.status === 'draft' || d.status === 'review'
  ).length,
  contracts: MOCK_CONTRACTS.filter(
    (c) => c.status === 'drafting' || c.status === 'negotiating'
  ).length,
  time: MOCK_TIME_ENTRIES.filter((t) => t.status === 'draft').length,
  invoices: MOCK_INVOICES.filter((i) => i.status === 'overdue').length,
  team: MOCK_TEAM.filter((t) => t.status === 'active').length,
};

/** Open (non-closed) matters for the crimson widget. */
export const OPEN_MATTER_COUNT = MOCK_MATTERS.filter(
  (m) => m.status !== 'closed'
).length;

/** Overdue invoices + their outstanding balance for the crimson widget. */
const OVERDUE_INVOICES = MOCK_INVOICES.filter((i) => i.status === 'overdue');
export const OVERDUE_INVOICE_COUNT = OVERDUE_INVOICES.length;
export const OVERDUE_INVOICE_BALANCE = OVERDUE_INVOICES.reduce(
  (sum, i) => sum + i.balance,
  0
);

/* ------------------------------------------------------------------ */
/* Active-route matching                                               */
/* ------------------------------------------------------------------ */

const stripSlash = (path: string) => path.replace(/\/+$/, '');
const finalSegment = (path: string) => path.slice(path.lastIndexOf('/') + 1);

/**
 * Active state is decided by the **final path segment**, because nav hrefs
 * are authored root-relative (`/matters`) while routes live under
 * `/dashboard/*` — full-path equality would miss detail pages like
 * `/dashboard/matters/mt_001`.
 */
function isActive(pathname: string, href: string): boolean {
  const current = stripSlash(pathname) || '/';
  const target = stripSlash(href);
  if (!current || !target) return false;

  // The Dashboard root item only matches the dashboard index itself.
  if (target === '/dashboard') return current === target;

  if (finalSegment(current) === finalSegment(target)) return true;

  // Nested routes keep their parent nav item highlighted.
  return current.startsWith(`${target}/`);
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#dc2626] to-[#7f1d1d] text-white shadow-[0_4px_12px_-4px_rgba(220,38,38,0.7)]',
        className
      )}
      aria-hidden="true"
    >
      <ScaleIcon className="h-5 w-5" />
    </span>
  );
}

/** Crimson gradient card: open matters + overdue invoices. Collapses to a ring. */
function ClientMatterWidget({ compact }: { compact: boolean }) {
  const detail = `${OPEN_MATTER_COUNT} open matters · ${OVERDUE_INVOICE_COUNT} overdue invoices`;

  if (compact) {
    return (
      <div className="flex justify-center">
        <span
          title={detail}
          className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#dc2626] via-[#b91c1c] to-[#7f1d1d] shadow-[0_8px_20px_-8px_rgba(220,38,38,0.7)] ring-1 ring-inset ring-white/25"
        >
          <span className="flex h-11 w-11 flex-col items-center justify-center rounded-full bg-white text-crimson-700 dark:bg-[#0b0f17]/85 dark:text-crimson-300">
            <span className="text-sm font-bold leading-none tabular-nums">
              {OPEN_MATTER_COUNT}
            </span>
            <span className="mt-0.5 text-[7px] font-semibold uppercase leading-none tracking-wider opacity-70">
              open
            </span>
          </span>
          {OVERDUE_INVOICE_COUNT > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-400 dark:border-[#0b0f17]"
            />
          )}
          <span className="sr-only">{detail}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#dc2626] via-[#b91c1c] to-[#7f1d1d] p-3.5 text-white shadow-[0_8px_24px_-10px_rgba(220,38,38,0.8)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/75">
          Client &amp; matter pulse
        </span>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white/90">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/90"
            aria-hidden="true"
          />
          Live
        </span>
      </div>

      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl font-semibold leading-none tabular-nums">
            {OPEN_MATTER_COUNT}
          </p>
          <p className="mt-1 truncate text-[11px] text-white/85">Open matters</p>
        </div>
        <div className="min-w-0 text-right">
          <p
            className={cn(
              'text-2xl font-semibold leading-none tabular-nums',
              OVERDUE_INVOICE_COUNT > 0 && 'text-amber-300'
            )}
          >
            {OVERDUE_INVOICE_COUNT}
          </p>
          <p className="mt-1 truncate text-[11px] text-white/85">
            Overdue invoices
          </p>
        </div>
      </div>

      <p className="mt-2 truncate text-[11px] text-white/75 tabular-nums">
        {OVERDUE_INVOICE_BALANCE.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        })}{' '}
        receivable past due
      </p>
    </div>
  );
}

interface BodyProps {
  collapsed: boolean;
  pathname: string;
  /** Present in the mobile drawer — labels always show, nav closes the drawer. */
  overlay?: boolean;
  onClose?: () => void;
}

function SidebarBody({ collapsed, pathname, overlay, onClose }: BodyProps) {
  const { toggleCollapsed } = useSidebar();
  const compact = collapsed && !overlay;

  return (
    <>
      {/* Brand header */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center gap-3 border-b border-[var(--lg-border)] px-4',
          compact && 'justify-center px-0'
        )}
      >
        <BrandMark />
        {!compact && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-[var(--lg-text)]">
              LegalOS
            </p>
            <p className="truncate text-[10px] font-medium uppercase tracking-wider text-[var(--lg-text-muted)]">
              Legal Practice OS
            </p>
          </div>
        )}
        {overlay && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--lg-text-muted)] transition-colors hover:bg-[var(--lg-surface-muted)] hover:text-[var(--lg-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        aria-label="Primary"
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4"
      >
        {SIDEBAR_NAV.map((section) => (
          <div key={section.title}>
            {!compact ? (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
                {section.title}
              </p>
            ) : (
              <div
                className="mx-3 mb-2 border-t border-[var(--lg-border)]"
                aria-hidden="true"
              />
            )}

            <ul className="space-y-1">
              {section.items.map((item) => {
                const href = resolveHref(item.href);
                const active = isActive(pathname, href);
                const Icon = item.icon as ElementType;
                const count = NAV_COUNTS[finalSegment(href)] ?? item.badge;
                const hasCount =
                  typeof count === 'number'
                    ? count > 0
                    : typeof count === 'string' && count.length > 0;

                return (
                  <li key={item.href}>
                    <Link
                      href={href}
                      onClick={overlay ? onClose : undefined}
                      title={compact ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                        compact && 'justify-center px-0 py-2.5',
                        active
                          ? 'bg-crimson-600/10 text-crimson-700 dark:bg-crimson-500/15 dark:text-crimson-300'
                          : 'text-[var(--lg-text-secondary)] hover:bg-[var(--lg-surface-muted)] hover:text-[var(--lg-text)]'
                      )}
                    >
                      {/* Crimson active rail indicator */}
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-[#dc2626]"
                        />
                      )}

                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0 transition-colors',
                          active
                            ? 'text-[#dc2626]'
                            : 'text-[var(--lg-text-muted)] group-hover:text-[var(--lg-text-secondary)]'
                        )}
                      />

                      {!compact && <span className="truncate">{item.label}</span>}

                      {item.ComingSoon && !compact && (
                        <span className="ml-auto shrink-0 rounded-full border border-[var(--lg-border)] px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-[var(--lg-text-muted)]">
                          Soon
                        </span>
                      )}

                      {!compact && !item.ComingSoon && hasCount && (
                        <span
                          className={cn(
                            'ml-auto shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                            active
                              ? 'bg-crimson-600/15 text-crimson-700 dark:text-crimson-300'
                              : 'bg-[var(--lg-surface-sunken)] text-[var(--lg-text-secondary)]'
                          )}
                        >
                          {count}
                        </span>
                      )}

                      {compact && hasCount && (
                        <span
                          aria-hidden="true"
                          className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#dc2626] ring-2 ring-white dark:ring-[var(--lg-surface)]"
                        />
                      )}
                      {compact && hasCount && (
                        <span className="sr-only">{`${item.label}: ${count}`}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Client / matter widget */}
      <div className={cn('shrink-0 px-3 pb-3', compact && 'px-2')}>
        <ClientMatterWidget compact={compact} />
      </div>

      {/* Collapse toggle (desktop only) */}
      {!overlay && (
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'mx-3 mb-3 hidden shrink-0 items-center gap-3 rounded-lg border border-[var(--lg-border)] px-3 py-2 text-xs font-medium text-[var(--lg-text-muted)] transition-colors hover:bg-[var(--lg-surface-muted)] hover:text-[var(--lg-text)] lg:flex',
            collapsed && 'justify-center px-0'
          )}
        >
          <ChevronsLeft
            className={cn(
              'h-4 w-4 shrink-0 transition-transform duration-200',
              collapsed && 'rotate-180'
            )}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, closeMobile } = useSidebar();

  // Escape dismisses the mobile drawer (body-scroll lock lives in
  // SidebarContext; the backdrop handles pointer dismissal).
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobile();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, closeMobile]);

  return (
    <>
      {/* Desktop rail — w-64 expanded / w-20 collapsed */}
      <aside
        aria-label="Primary navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[var(--lg-border)] bg-[var(--lg-surface)] transition-[width] duration-200 ease-out lg:flex',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        <SidebarBody collapsed={collapsed} pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={closeMobile}
            className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-sm"
          />
          <aside
            aria-label="Primary navigation"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-[var(--lg-border)] bg-[var(--lg-surface)] shadow-[var(--lg-shadow-lg)] animate-slide-in-left"
          >
            <SidebarBody
              collapsed={false}
              pathname={pathname}
              overlay
              onClose={closeMobile}
            />
          </aside>
        </div>
      )}
    </>
  );
}

export default Sidebar;
