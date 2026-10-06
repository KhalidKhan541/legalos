'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  CalendarClock,
  Check,
  Settings,
  LogOut,
  UserRound,
  Inbox,
  PanelLeft,
} from 'lucide-react';

import { MOCK_COURT_DATES, MOCK_NOTIFICATIONS } from '@/lib/mock-data';
import { cn, formatDate, formatRelative, getInitials } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useSidebar } from '@/contexts/SidebarContext';

/* -------------------------------------------------------------------------- */
/* court clock pill — today's hearings                                         */
/* -------------------------------------------------------------------------- */

function CourtClockPill() {
  const todays = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const count = MOCK_COURT_DATES.filter(
      (d) => d.date.slice(0, 10) === today && d.status !== 'cancelled'
    ).length;
    if (count > 0) return { count, label: `${count} hearing${count > 1 ? 's' : ''} today` };
    const next = MOCK_COURT_DATES.filter(
      (d) => d.date.slice(0, 10) >= today && d.status === 'scheduled'
    ).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!next) return { count: 0, label: 'Calendar clear' };
    return { count: 0, label: `Next: ${formatDate(next.date, 'MMM d')}` };
  }, []);

  const tone =
    todays.count > 0
      ? 'bg-crimson-50 text-crimson-700 ring-crimson-200 dark:bg-crimson-950/60 dark:text-crimson-300 dark:ring-crimson-900'
      : 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900';

  return (
    <span
      className={cn(
        'hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 md:inline-flex',
        tone
      )}
      title="Court calendar"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      <CalendarClock className="h-3.5 w-3.5" />
      {todays.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* notifications dropdown                                                      */
/* -------------------------------------------------------------------------- */

function NotificationsMenu() {
  const {
    notifications,
    unreadCount,
    open,
    setOpen,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  const items = notifications.length ? notifications : MOCK_NOTIFICATIONS;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`Notifications (${unreadCount} unread)`}
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-crimson-600 px-1 text-[9px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div
        className={cn(
          'absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-xl border border-slate-200 bg-white shadow-xl transition-all dark:border-slate-800 dark:bg-slate-900',
          open
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        )}
        role="menu"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            Notifications
          </span>
          <button
            type="button"
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs font-medium text-crimson-600 hover:text-crimson-700 dark:text-crimson-400"
          >
            <Check className="h-3.5 w-3.5" /> Mark all read
          </button>
        </div>
        <ul className="max-h-80 overflow-y-auto py-1">
          {items.slice(0, 6).map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => markAsRead(n.id)}
                className={cn(
                  'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60',
                  !n.read && 'bg-crimson-50/50 dark:bg-crimson-950/20'
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    n.read ? 'bg-slate-300 dark:bg-slate-600' : 'bg-crimson-500'
                  )}
                />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {n.title}
                  </span>
                  <span className="mt-0.5 block line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                    {n.body}
                  </span>
                  <span className="mt-1 block text-[10px] text-slate-400 dark:text-slate-500">
                    {formatRelative(n.createdAt)}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="flex flex-col items-center gap-1 px-4 py-8 text-center">
              <Inbox className="h-6 w-6 text-slate-300 dark:text-slate-600" />
              <span className="text-xs text-slate-400">You&apos;re all caught up</span>
            </li>
          )}
        </ul>
        <div className="border-t border-slate-100 px-4 py-2.5 text-center dark:border-slate-800">
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* avatar menu                                                                 */
/* -------------------------------------------------------------------------- */

function AccountMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Account menu"
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-crimson-500 to-crimson-700 text-xs font-bold text-white ring-2 ring-white transition-transform hover:scale-105 dark:ring-slate-900"
      >
        {getInitials('Khalid Khan')}
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
      </button>
      <div
        className={cn(
          'absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all dark:border-slate-800 dark:bg-slate-900',
          open
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        )}
        role="menu"
      >
        <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            Khalid Khan
          </p>
          <p className="truncate text-xs text-slate-500">managing-partner@legalos.app</p>
        </div>
        {[
          { label: 'Profile', icon: UserRound, href: '/dashboard/team' },
          { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            role="menuitem"
          >
            <item.icon className="h-4 w-4 text-slate-400" /> {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-crimson-600 hover:bg-crimson-50 dark:text-crimson-400 dark:hover:bg-crimson-950/40"
          role="menuitem"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* top bar                                                                     */
/* -------------------------------------------------------------------------- */

export function TopBar() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { toggleMobile, toggleCollapsed, collapsed } = useSidebar();
  const searchRef = useRef<HTMLInputElement>(null);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent));
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 sm:px-6">
      <button
        type="button"
        aria-label="Open sidebar"
        onClick={toggleMobile}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={toggleCollapsed}
        className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:block"
      >
        <PanelLeft className="h-5 w-5" />
      </button>

      {/* search */}
      <div className="relative min-w-0 flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={searchRef}
          type="search"
          placeholder="Search matters, clients, documents…"
          aria-label="Search"
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-14 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-crimson-400 focus:bg-white focus:ring-2 focus:ring-crimson-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:bg-slate-900/60"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800 sm:block">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <CourtClockPill />

        <button
          type="button"
          aria-label="Toggle theme"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        <NotificationsMenu />
        <AccountMenu />
      </div>
    </header>
  );
}

export default TopBar;
