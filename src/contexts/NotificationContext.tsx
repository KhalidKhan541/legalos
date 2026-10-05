'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type NotificationType = 'deadline' | 'invoice' | 'mention' | 'filing' | 'system';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  /** ISO timestamp */
  createdAt: string;
  read: boolean;
  href?: string;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  open: boolean;
  setOpen: (value: boolean) => void;
  toggle: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  push: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => string;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const STORAGE_KEY = 'legalos-notifications';

const SEED: AppNotification[] = [
  {
    id: 'ntf_seed_1',
    type: 'deadline',
    title: 'Motion to Compel due tomorrow',
    body: 'Henderson v. Meridian Logistics — filing deadline 5:00 PM.',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    read: false,
    href: '/matters',
  },
  {
    id: 'ntf_seed_2',
    type: 'invoice',
    title: 'Invoice INV-2026-0114 is overdue',
    body: 'Northwind Manufacturing · $48,750.00 · 12 days past due.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    read: false,
    href: '/invoices',
  },
  {
    id: 'ntf_seed_3',
    type: 'filing',
    title: 'Filing accepted by the court',
    body: 'Complaint — Case No. 2026-CV-0417 accepted.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    read: true,
    href: '/filings',
  },
  {
    id: 'ntf_seed_4',
    type: 'mention',
    title: 'Priya Raghavan mentioned you',
    body: '"@you can you review §4.2 indemnity before the call?"',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 49).toISOString(),
    read: true,
    href: '/documents',
  },
  {
    id: 'ntf_seed_5',
    type: 'system',
    title: 'Trust reconciliation completed',
    body: 'All six ledgers balanced for September 2026.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    read: true,
    href: '/trust',
  },
  {
    id: 'ntf_seed_6',
    type: 'deadline',
    title: 'Deposition scheduled',
    body: 'Avery Chen — Oct 14, 2026 at 10:00 AM, Courtroom 4B.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    read: true,
    href: '/court-dates',
  },
];

function load(): AppNotification[] {
  if (typeof window === 'undefined') return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as AppNotification[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED;
    return parsed;
  } catch {
    return SEED;
  }
}

function persist(items: AppNotification[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
  } catch {
    /* storage unavailable */
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setNotifications(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persist(notifications);
  }, [notifications, hydrated]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const push = useCallback(
    (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
      const id = `ntf_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 7)}`;
      setNotifications((prev) => [
        { ...notification, id, createdAt: new Date().toISOString(), read: false },
        ...prev,
      ]);
      return id;
    },
    []
  );

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      open,
      setOpen,
      toggle,
      markAsRead,
      markAllAsRead,
      dismiss,
      clearAll,
      push,
    }),
    [
      notifications,
      unreadCount,
      open,
      toggle,
      markAsRead,
      markAllAsRead,
      dismiss,
      clearAll,
      push,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a <NotificationProvider>');
  }
  return ctx;
}

// Aliases kept for ergonomic parity with the rest of the app.
export const LgNotificationProvider = NotificationProvider;
export default NotificationProvider;
