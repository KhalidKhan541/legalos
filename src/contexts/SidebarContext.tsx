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

type SidebarContextValue = {
  /** Desktop collapsed state (icon rail). */
  collapsed: boolean;
  /** Mobile / overlay drawer open state. */
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

const COLLAPSE_KEY = 'legalos-sidebar-collapsed';

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSE_KEY);
      if (stored === '1' || stored === 'true') setCollapsedState(true);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    try {
      window.localStorage.setItem(COLLAPSE_KEY, value ? '1' : '0');
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((prev) => !prev), []);

  const value = useMemo<SidebarContextValue>(
    () => ({
      collapsed,
      mobileOpen,
      toggleCollapsed,
      setCollapsed,
      openMobile,
      closeMobile,
      toggleMobile,
    }),
    [
      collapsed,
      mobileOpen,
      toggleCollapsed,
      setCollapsed,
      openMobile,
      closeMobile,
      toggleMobile,
    ]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar must be used within a <SidebarProvider>');
  }
  return ctx;
}

// Alias kept for ergonomic parity with the rest of the app.
export const LgSidebarProvider = SidebarProvider;
export default SidebarProvider;
