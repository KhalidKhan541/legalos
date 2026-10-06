import type { Metadata } from 'next';

import DashboardShell from '@/components/layout/DashboardShell';

export const metadata: Metadata = {
  title: { absolute: 'Dashboard · LegalOS' },
  description:
    'LegalOS dashboard: open matters, billable hours, court deadlines, invoices and firm analytics at a glance.',
  robots: { index: false, follow: true },
};

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DashboardShell>{children}</DashboardShell>;
}
