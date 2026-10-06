'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Gavel,
  Clock3,
  Receipt,
  CalendarClock,
  ArrowUpRight,
  Activity as ActivityIcon,
  Scale,
} from 'lucide-react';

import { Card, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import {
  MOCK_MATTERS,
  MOCK_INVOICES,
  MOCK_KPI,
  MOCK_COURT_DATES,
  MOCK_ACTIVITY,
} from '@/lib/mock-data';
import {
  cn,
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPercent,
  formatDate,
  formatRelative,
} from '@/lib/utils';

const SEVERITY_TONE: Record<string, string> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'secondary',
} as const;

export default function DashboardPage() {
  const stats = useMemo(() => {
    const open = MOCK_MATTERS.filter((m) => m.status !== 'closed');
    const inTrial = MOCK_MATTERS.filter((m) => m.status === 'trial');
    const overdue = MOCK_INVOICES.filter((i) => i.status === 'overdue');
    const overdueTotal = overdue.reduce((s, i) => s + i.balance, 0);
    const outstanding = MOCK_INVOICES.reduce(
      (s, i) => s + (i.status === 'paid' ? 0 : i.balance),
      0
    );
    const thisMonth = MOCK_KPI[MOCK_KPI.length - 1];
    const billable = thisMonth?.billableHours ?? 0;
    const collections = thisMonth?.collections ?? 0;

    return {
      openCount: open.length,
      trialCount: inTrial.length,
      overdueCount: overdue.length,
      overdueTotal,
      outstanding,
      billable,
      collections,
      utilization: thisMonth?.utilization ?? 0,
      realization: thisMonth?.realization ?? 0,
    };
  }, []);

  const chartData = useMemo(
    () =>
      MOCK_KPI.map((k) => ({
        label: k.label,
        billing: k.billing,
        collections: k.collections,
        hours: k.billableHours,
      })),
    []
  );

  const stageData = useMemo(() => {
    const stages = ['open', 'discovery', 'trial', 'on_hold', 'closed'] as const;
    const labels: Record<string, string> = {
      open: 'Open',
      discovery: 'Discovery',
      trial: 'Trial',
      on_hold: 'On Hold',
      closed: 'Closed',
    };
    return stages.map((s) => ({
      stage: labels[s],
      count: MOCK_MATTERS.filter((m) => m.status === s).length,
    }));
  }, []);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...MOCK_COURT_DATES]
      .filter((d) => d.date.slice(0, 10) >= today && d.status !== 'cancelled')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, []);

  const nextDeadlines = useMemo(
    () =>
      [...MOCK_MATTERS]
        .filter((m) => m.nextDeadline && m.status !== 'closed')
        .sort((a, b) => (a.nextDeadline ?? '').localeCompare(b.nextDeadline ?? ''))
        .slice(0, 5),
    []
  );

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Firm dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {formatDate(new Date(), 'EEEE, MMMM d, yyyy')} · deadlines, billing and matters in
            one view
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/time"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Clock3 className="h-4 w-4" /> Track time
          </Link>
          <Link
            href="/dashboard/matters"
            className="inline-flex items-center gap-1.5 rounded-lg bg-crimson-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-crimson-700"
          >
            <Gavel className="h-4 w-4" /> New matter
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Open matters"
          value={formatNumber(stats.openCount)}
          subvalue={`${stats.trialCount} in trial`}
          icon={<Gavel className="h-5 w-5" />}
          delta={`${stats.openCount} active`}
          deltaTone="info"
        />
        <MetricCard
          title="Billable hours"
          value={`${formatNumber(stats.billable)}h`}
          subvalue="this month"
          icon={<Clock3 className="h-5 w-5" />}
          change={stats.utilization * 100}
          changeLabel="utilization"
          hint={`realization ${formatPercent(stats.realization)}`}
        />
        <MetricCard
          title="Outstanding A/R"
          value={formatCurrency(stats.outstanding, { compact: true })}
          icon={<Receipt className="h-5 w-5" />}
          hint={`${stats.overdueCount} invoices overdue`}
          delta={`${formatCurrency(stats.overdueTotal, { compact: true })} past due`}
          deltaTone="danger"
        />
        <MetricCard
          title="Collections"
          value={formatCurrency(stats.collections, { compact: true })}
          subvalue="this month"
          icon={<Scale className="h-5 w-5" />}
          change={12}
          changeLabel="vs prior month"
        />
      </div>

      {/* chart + court dates */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="p-5 pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Billing vs collections</CardTitle>
              <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-crimson-500" /> Billing
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Collections
                </span>
              </div>
            </div>
          </div>
          <div className="h-72 px-2 pb-4 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="billingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="collectionsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'billing' ? 'Billing' : 'Collections',
                  ]}
                  contentStyle={{
                    background: 'var(--lg-surface, #fff)',
                    border: '1px solid var(--lg-border, #e2e8f0)',
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="billing" stroke="#dc2626" strokeWidth={2} fill="url(#billingFill)" />
                <Area type="monotone" dataKey="collections" stroke="#10b981" strokeWidth={2} fill="url(#collectionsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="p-5 pb-0">
            <CardTitle>Upcoming court dates</CardTitle>
          </div>
          <ul className="space-y-3 p-5 pt-4">
            {upcoming.map((d) => {
              const days = Math.ceil(
                (new Date(d.date).getTime() - Date.now()) / 86_400_000
              );
              return (
                <li key={d.id}>
                  <Link
                    href="/dashboard/court-dates"
                    className="group flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:border-crimson-200 hover:bg-crimson-50/40 dark:border-slate-800 dark:hover:border-crimson-900 dark:hover:bg-crimson-950/30"
                  >
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <span className="text-[9px] font-semibold uppercase leading-none text-crimson-600 dark:text-crimson-400">
                        {formatDate(d.date, 'MMM')}
                      </span>
                      <span className="text-sm font-bold leading-tight">
                        {formatDate(d.date, 'd')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {d.case}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {d.court} · {d.judge}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={days <= 3 ? 'danger' : 'secondary'} size="sm">
                        {days === 0 ? 'Today' : `${days}d`}
                      </Badge>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
                        {d.hearingType}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
            {upcoming.length === 0 && (
              <li className="py-8 text-center text-sm text-slate-400">
                No upcoming hearings
              </li>
            )}
          </ul>
        </Card>
      </div>

      {/* stage funnel + deadlines + activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <div className="p-5 pb-0">
            <CardTitle>Matters by stage</CardTitle>
          </div>
          <div className="h-56 px-2 pb-4 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 4, right: 12, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(220,38,38,0.06)' }}
                  contentStyle={{
                    background: 'var(--lg-surface, #fff)',
                    border: '1px solid var(--lg-border, #e2e8f0)',
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [v, 'Matters']}
                />
                <Bar dataKey="count" fill="#dc2626" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="p-5 pb-0">
            <CardTitle>Next deadlines</CardTitle>
          </div>
          <ul className="divide-y divide-slate-100 px-5 pb-4 pt-2 dark:divide-slate-800/70">
            {nextDeadlines.map((m) => {
              const overdue =
                m.nextDeadline !== null &&
                new Date(m.nextDeadline).getTime() < Date.now();
              return (
                <li key={m.id}>
                  <Link
                    href="/dashboard/matters"
                    className="flex items-center gap-3 py-3 transition-opacity hover:opacity-80"
                  >
                    <span
                      className={cn(
                        'h-2 w-2 shrink-0 rounded-full',
                        overdue ? 'bg-crimson-500' : 'bg-slate-300 dark:bg-slate-600'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {m.deadlineLabel ?? 'Deadline'}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {m.number} · {m.clientName}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 text-xs font-medium',
                        overdue
                          ? 'text-crimson-600 dark:text-crimson-400'
                          : 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      {m.nextDeadline ? formatDate(m.nextDeadline, 'MMM d') : '—'}
                    </span>
                  </Link>
                </li>
              );
            })}
            {nextDeadlines.length === 0 && (
              <li className="py-8 text-center text-sm text-slate-late-400">No deadlines</li>
            )}
          </ul>
        </Card>

        <Card>
          <div className="p-5 pb-0">
            <CardTitle>Recent activity</CardTitle>
          </div>
          <ul className="space-y-4 px-5 pb-5 pt-4">
            {MOCK_ACTIVITY.slice(0, 6).map((a) => (
              <li key={a.id} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-crimson-50 text-crimson-600 dark:bg-crimson-950/60 dark:text-crimson-400">
                  <ActivityIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {a.title}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {a.description}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                    {formatRelative(a.at)} <ArrowUpRight className="h-3 w-3" />
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
