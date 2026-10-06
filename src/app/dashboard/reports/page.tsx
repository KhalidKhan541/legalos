'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Banknote,
  Briefcase,
  CheckCircle2,
  Clock,
  Download,
  FileBarChart,
  FileText,
  Gauge,
  Gavel,
  Landmark,
  Percent,
  Printer,
  Receipt,
  Timer,
  TrendingDown,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { MetricCard, type MetricTone } from '@/components/ui/MetricCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  MOCK_CLIENTS,
  MOCK_INVOICES,
  MOCK_KPI,
  MOCK_MATTERS,
  MOCK_REPORTS,
  MOCK_TEAM,
  MOCK_TIME_ENTRIES,
  type KpiMonth,
} from '@/lib/mock-data';
import {
  cn,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from '@/lib/utils';

/* ── Range presets ───────────────────────────────────────────── */

const DAY_MS = 86_400_000;

/** Fixed reference "today" so SSR and client renders agree. */
const REF_DATE = new Date('2026-10-06T12:00:00Z');

const RANGES = [
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
  { key: '90d', label: '90 days', days: 90 },
  { key: '12m', label: '12 months', days: 365 },
] as const;

type RangeKey = (typeof RANGES)[number]['key'];

const TAB_KEYS = ['billing', 'matters', 'clients', 'time', 'attorneys'] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'billing', label: 'Billing', icon: <Banknote className="h-4 w-4" /> },
  { key: 'matters', label: 'Matters', icon: <Gavel className="h-4 w-4" /> },
  { key: 'clients', label: 'Clients', icon: <Users className="h-4 w-4" /> },
  { key: 'time', label: 'Time', icon: <Timer className="h-4 w-4" /> },
  { key: 'attorneys', label: 'Attorneys', icon: <FileBarChart className="h-4 w-4" /> },
];

const PIE_COLORS = ['#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#f87171', '#94a3b8'];

/* ── Aggregation helpers ─────────────────────────────────────── */

function sum<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => total + pick(item), 0);
}

function average<T>(items: T[], pick: (item: T) => number): number {
  return items.length === 0 ? 0 : sum(items, pick) / items.length;
}

/** Percent change between the first and second half of a series. */
function trend<T>(items: T[], pick: (item: T) => number): number {
  if (items.length < 2) return 0;
  const head = items.slice(0, Math.ceil(items.length / 2));
  const tail = items.slice(Math.ceil(items.length / 2));
  const before = average(head, pick);
  const after = average(tail.length > 0 ? tail : head, pick);
  if (before === 0) return 0;
  return Math.round(((after - before) / before) * 1000) / 10;
}

function pctChange(before: number, after: number): number {
  if (before === 0) return 0;
  return Math.round(((after - before) / before) * 1000) / 10;
}

/** Money/hours/count fields scale with the window; ratios do not. */
function scaleMonth(base: KpiMonth, factor: number): KpiMonth {
  return {
    ...base,
    billing: Math.round(base.billing * factor),
    collections: Math.round(base.collections * factor),
    writeOffs: Math.round(base.writeOffs * factor),
    hours: Math.round(base.hours * factor),
    billableHours: Math.round(base.billableHours * factor),
    flatFeeHours: Math.round(base.flatFeeHours * factor),
    newMatters: Math.round(base.newMatters * factor),
    closedMatters: Math.round(base.closedMatters * factor),
    invoices: Math.round(base.invoices * factor),
  };
}

const WEEK_WEIGHTS = [0.27, 0.25, 0.24, 0.24];
const DAY_WEIGHTS = [0.15, 0.16, 0.14, 0.17, 0.16, 0.11, 0.11];

const DAY_LABELS = Array.from({ length: 7 }, (_unused, index) =>
  formatDate(REF_DATE.getTime() - (6 - index) * DAY_MS, 'EEE d')
);
const WEEK_LABELS = [21, 14, 7, 0].map((back) =>
  formatDate(REF_DATE.getTime() - back * DAY_MS, 'MMM d')
);

/**
 * Builds the bucketed series backing every tab: 12 monthly points, 3 monthly
 * points, 4 weekly buckets, or 7 daily buckets (the daily/weekly buckets are
 * the most recent month re-weighted into the short window).
 */
function buildSeries(range: RangeKey): KpiMonth[] {
  const latest = MOCK_KPI[MOCK_KPI.length - 1];

  if (range === '12m') return MOCK_KPI;
  if (range === '90d') return MOCK_KPI.slice(-3);

  if (range === '30d') {
    return WEEK_LABELS.map((label, index) => ({
      ...scaleMonth(latest, WEEK_WEIGHTS[index]),
      label,
      month: `${latest.month}-w${index}`,
    }));
  }

  const week = scaleMonth(latest, 7 / 30);
  return DAY_LABELS.map((label, index) => ({
    ...scaleMonth(week, DAY_WEIGHTS[index]),
    label,
    month: `${latest.month}-d${index}`,
  }));
}

function cutoffFor(range: RangeKey): number {
  const days = RANGES.find((item) => item.key === range)?.days ?? 365;
  return REF_DATE.getTime() - days * DAY_MS;
}

/* ── View models ─────────────────────────────────────────────── */

type KpiSpec = {
  title: string;
  value: string;
  subvalue?: string;
  change: number;
  changeLabel: string;
  hint?: string;
  icon: React.ReactNode;
  iconTone?: MetricTone | 'accent';
  positiveIsGood?: boolean;
};

type TableRow = {
  /** Display cells — one per column except the trailing share column. */
  cells: string[];
  /** Raw CSV values — one per column, share rendered as a percent string. */
  raw: string[];
  /** 0..1 share of the column total, drives the proportional bar. */
  share: number;
};

type TableSpec = {
  columns: string[];
  rows: TableRow[];
  empty: string;
};

type ChartSpec =
  | {
      kind: 'area';
      points: { label: string; a: number; b: number }[];
      aLabel: string;
      bLabel: string;
      format: (value: number) => string;
    }
  | {
      kind: 'bar';
      points: { label: string; a: number; b?: number }[];
      aLabel: string;
      bLabel?: string;
      format: (value: number) => string;
    }
  | {
      kind: 'pie';
      slices: { name: string; value: number; color: string }[];
      format: (value: number) => string;
    };

type TabData = {
  kpis: KpiSpec[];
  chart: ChartSpec;
  table: TableSpec;
  caption: string;
};

const money = (value: number) => formatCurrency(value, { cents: false });
const percentOf = (value: number) => formatPercent(value);

/* ── Per-tab builders ────────────────────────────────────────── */

function buildBilling(range: RangeKey): TabData {
  const series = buildSeries(range);
  const billed = sum(series, (month) => month.billing);
  const collections = sum(series, (month) => month.collections);
  const writeOffs = sum(series, (month) => month.writeOffs);
  const realization = average(series, (month) => month.realization);

  return {
    caption: `Billing performance · ${RANGES.find((r) => r.key === range)?.label}`,
    kpis: [
      {
        title: 'Fees billed',
        value: money(billed),
        change: trend(series, (month) => month.billing),
        changeLabel: 'vs prior half',
        hint: `${formatNumber(sum(series, (m) => m.invoices))} invoices issued`,
        icon: <Banknote className="h-5 w-5" />,
      },
      {
        title: 'Collections',
        value: money(collections),
        change: trend(series, (month) => month.collections),
        changeLabel: 'vs prior half',
        hint: `${formatPercent(billed === 0 ? 0 : collections / billed)} of billed fees`,
        icon: <Wallet className="h-5 w-5" />,
        iconTone: 'success',
      },
      {
        title: 'Write-offs',
        value: money(writeOffs),
        change: trend(series, (month) => month.writeOffs),
        changeLabel: 'vs prior half',
        hint: `${formatPercent(billed === 0 ? 0 : writeOffs / billed)} of billed fees`,
        icon: <TrendingDown className="h-5 w-5" />,
        iconTone: 'warning',
        positiveIsGood: false,
      },
      {
        title: 'Realization',
        value: formatPercent(realization),
        change: trend(series, (month) => month.realization),
        changeLabel: 'vs prior half',
        hint: 'Fees actually collected against standard rates',
        icon: <Percent className="h-5 w-5" />,
        iconTone: 'info',
      },
    ],
    chart: {
      kind: 'area',
      points: series.map((month) => ({
        label: month.label,
        a: month.billing,
        b: month.collections,
      })),
      aLabel: 'Billed',
      bLabel: 'Collected',
      format: money,
    },
    table: {
      columns: ['Period', 'Billed', 'Collected', 'Write-offs', 'Share'],
      empty: 'No billing activity in this window.',
      rows: series.map((month) => ({
        cells: [
          month.label,
          money(month.billing),
          money(month.collections),
          money(month.writeOffs),
        ],
        raw: [
          month.label,
          String(month.billing),
          String(month.collections),
          String(month.writeOffs),
          formatPercent(billed === 0 ? 0 : month.billing / billed),
        ],
        share: billed === 0 ? 0 : month.billing / billed,
      })),
    },
  };
}

function buildMatters(range: RangeKey): TabData {
  const series = buildSeries(range);
  const cutoff = cutoffFor(range);
  const newMatters = sum(series, (month) => month.newMatters);
  const closedMatters = sum(series, (month) => month.closedMatters);
  const openMatters = MOCK_MATTERS.filter((matter) => matter.status !== 'closed');
  const budget = sum(MOCK_MATTERS, (matter) => matter.budget);
  const spent = sum(MOCK_MATTERS, (matter) => matter.spent);

  const matterById = new Map(MOCK_MATTERS.map((matter) => [matter.id, matter]));
  const periodEntries = MOCK_TIME_ENTRIES.filter(
    (entry) => new Date(entry.date).getTime() >= cutoff
  );

  type Bucket = { count: number; hours: number; fees: number };
  const buckets = new Map<string, Bucket>();
  for (const matter of MOCK_MATTERS) {
    buckets.set(matter.practiceArea, {
      count: (buckets.get(matter.practiceArea)?.count ?? 0) + 1,
      hours: 0,
      fees: 0,
    });
  }
  for (const entry of periodEntries) {
    const matter = matterById.get(entry.matterId);
    if (!matter) continue;
    const bucket = buckets.get(matter.practiceArea);
    if (!bucket) continue;
    bucket.hours += entry.hours;
    bucket.fees += entry.amount;
  }

  const totalFees = sum([...buckets.values()], (bucket) => bucket.fees);
  const rows = [...buckets.entries()]
    .sort((a, b) => b[1].fees - a[1].fees)
    .map(([area, bucket]) => ({
      cells: [
        area,
        formatNumber(bucket.count),
        formatNumber(bucket.hours),
        money(bucket.fees),
      ],
      raw: [
        area,
        String(bucket.count),
        String(bucket.hours),
        String(bucket.fees),
        formatPercent(totalFees === 0 ? 0 : bucket.fees / totalFees),
      ],
      share: totalFees === 0 ? 0 : bucket.fees / totalFees,
    }));

  return {
    caption: `Matter activity · ${RANGES.find((r) => r.key === range)?.label}`,
    kpis: [
      {
        title: 'New matters',
        value: formatNumber(newMatters),
        change: trend(series, (month) => month.newMatters),
        changeLabel: 'vs prior half',
        hint: 'Opened inside the selected window',
        icon: <Gavel className="h-5 w-5" />,
      },
      {
        title: 'Closed matters',
        value: formatNumber(closedMatters),
        change: trend(series, (month) => month.closedMatters),
        changeLabel: 'vs prior half',
        hint: `${formatNumber(newMatters - closedMatters)} net change in inventory`,
        icon: <CheckCircle2 className="h-5 w-5" />,
        iconTone: 'success',
      },
      {
        title: 'Open matters',
        value: formatNumber(openMatters.length),
        change: 0,
        changeLabel: 'snapshot',
        hint: `${formatNumber(MOCK_MATTERS.length)} total matters on file`,
        icon: <Briefcase className="h-5 w-5" />,
        iconTone: 'info',
      },
      {
        title: 'Budget consumed',
        value: formatPercent(budget === 0 ? 0 : spent / budget),
        change: 0,
        changeLabel: 'snapshot',
        hint: `${money(spent)} of ${money(budget)} budgeted`,
        icon: <Receipt className="h-5 w-5" />,
        iconTone: 'warning',
        positiveIsGood: false,
      },
    ],
    chart: {
      kind: 'bar',
      points: series.map((month) => ({
        label: month.label,
        a: month.newMatters,
        b: month.closedMatters,
      })),
      aLabel: 'Opened',
      bLabel: 'Closed',
      format: (value) => formatNumber(value, { maximumFractionDigits: 0 }),
    },
    table: {
      columns: ['Practice area', 'Matters', 'Hours', 'Fees', 'Share'],
      empty: 'No matter time recorded in this window.',
      rows,
    },
  };
}

function buildClients(range: RangeKey): TabData {
  const cutoff = cutoffFor(range);
  const activeClients = MOCK_CLIENTS.filter((client) => client.status === 'active');
  const newClients = MOCK_CLIENTS.filter(
    (client) => new Date(client.since).getTime() >= cutoff
  );
  const periodInvoices = MOCK_INVOICES.filter(
    (invoice) => new Date(invoice.issueDate).getTime() >= cutoff
  );
  const outstanding = sum(periodInvoices, (invoice) => invoice.balance);
  const avgLifetimeValue = average(MOCK_CLIENTS, (client) => client.lifetimeValue);

  type Bucket = { invoices: number; billed: number; balance: number };
  const buckets = new Map<string, Bucket>();
  for (const invoice of periodInvoices) {
    const bucket = buckets.get(invoice.clientName) ?? { invoices: 0, billed: 0, balance: 0 };
    bucket.invoices += 1;
    bucket.billed += invoice.amount;
    bucket.balance += invoice.balance;
    buckets.set(invoice.clientName, bucket);
  }

  const totalBilled = sum([...buckets.values()], (bucket) => bucket.billed);
  const ranked = [...buckets.entries()].sort((a, b) => b[1].billed - a[1].billed);

  const rows = ranked.map(([name, bucket]) => ({
    cells: [
      name,
      formatNumber(bucket.invoices),
      money(bucket.billed),
      money(bucket.balance),
    ],
    raw: [
      name,
      String(bucket.invoices),
      String(bucket.billed),
      String(bucket.balance),
      formatPercent(totalBilled === 0 ? 0 : bucket.billed / totalBilled),
    ],
    share: totalBilled === 0 ? 0 : bucket.billed / totalBilled,
  }));

  const top = ranked.slice(0, 5);
  const otherBilled = ranked.slice(5).reduce((total, [, bucket]) => total + bucket.billed, 0);
  const slices = top.map(([name, bucket], index) => ({
    name,
    value: bucket.billed,
    color: PIE_COLORS[index % PIE_COLORS.length],
  }));
  if (otherBilled > 0) {
    slices.push({ name: 'Other clients', value: otherBilled, color: PIE_COLORS[5] });
  }

  return {
    caption: `Client revenue · ${RANGES.find((r) => r.key === range)?.label}`,
    kpis: [
      {
        title: 'Active clients',
        value: formatNumber(activeClients.length),
        change: 0,
        changeLabel: 'snapshot',
        hint: `${formatNumber(MOCK_CLIENTS.length)} clients on file`,
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: 'New clients',
        value: formatNumber(newClients.length),
        change: 0,
        changeLabel: 'in window',
        hint: 'Retained within the selected window',
        icon: <UserPlus className="h-5 w-5" />,
        iconTone: 'success',
      },
      {
        title: 'Receivables',
        value: money(outstanding),
        change: 0,
        changeLabel: 'in window',
        hint: `${formatNumber(periodInvoices.length)} invoices issued`,
        icon: <Landmark className="h-5 w-5" />,
        iconTone: 'warning',
        positiveIsGood: false,
      },
      {
        title: 'Avg lifetime value',
        value: money(avgLifetimeValue),
        change: pctChange(avgLifetimeValue * 0.9, avgLifetimeValue),
        changeLabel: 'vs book value',
        hint: 'Across the full client book',
        icon: <Wallet className="h-5 w-5" />,
        iconTone: 'info',
      },
    ],
    chart: {
      kind: 'pie',
      slices,
      format: money,
    },
    table: {
      columns: ['Client', 'Invoices', 'Billed', 'Balance', 'Share'],
      empty: 'No invoices issued to clients in this window.',
      rows,
    },
  };
}

function buildTime(range: RangeKey): TabData {
  const series = buildSeries(range);
  const cutoff = cutoffFor(range);
  const periodEntries = MOCK_TIME_ENTRIES.filter(
    (entry) => new Date(entry.date).getTime() >= cutoff
  );
  const source = periodEntries.length > 0 ? periodEntries : MOCK_TIME_ENTRIES;

  const hours = sum(source, (entry) => entry.hours);
  const billableHours = sum(
    source.filter((entry) => entry.billable),
    (entry) => entry.hours
  );
  const fees = sum(source, (entry) => entry.amount);

  type Bucket = { hours: number; billable: number; fees: number };
  const buckets = new Map<string, Bucket>();
  for (const entry of source) {
    const bucket = buckets.get(entry.attorney) ?? { hours: 0, billable: 0, fees: 0 };
    bucket.hours += entry.hours;
    if (entry.billable) bucket.billable += entry.hours;
    bucket.fees += entry.amount;
    buckets.set(entry.attorney, bucket);
  }

  const ranked = [...buckets.entries()].sort((a, b) => b[1].fees - a[1].fees);

  return {
    caption: `Timekeeping · ${RANGES.find((r) => r.key === range)?.label}`,
    kpis: [
      {
        title: 'Billable hours',
        value: formatNumber(billableHours, { maximumFractionDigits: 0 }),
        change: trend(series, (month) => month.billableHours),
        changeLabel: 'vs prior half',
        hint: `${formatPercent(hours === 0 ? 0 : billableHours / hours)} of recorded time`,
        icon: <Timer className="h-5 w-5" />,
      },
      {
        title: 'Total hours',
        value: formatNumber(hours, { maximumFractionDigits: 0 }),
        change: trend(series, (month) => month.hours),
        changeLabel: 'vs prior half',
        hint: `${formatNumber(source.length)} time entries`,
        icon: <Clock className="h-5 w-5" />,
        iconTone: 'info',
      },
      {
        title: 'Utilization',
        value: formatPercent(hours === 0 ? 0 : billableHours / hours),
        change: trend(series, (month) => month.utilization),
        changeLabel: 'vs prior half',
        hint: 'Billable share of recorded time',
        icon: <Gauge className="h-5 w-5" />,
        iconTone: 'success',
      },
      {
        title: 'Fees recorded',
        value: money(fees),
        change: trend(series, (month) => month.billing),
        changeLabel: 'vs prior half',
        hint: 'Value of time captured in the window',
        icon: <Banknote className="h-5 w-5" />,
        iconTone: 'accent',
      },
    ],
    chart: {
      kind: 'bar',
      points: series.map((month) => ({
        label: month.label,
        a: month.billableHours,
        b: month.hours - month.billableHours,
      })),
      aLabel: 'Billable',
      bLabel: 'Non-billable',
      format: (value) => `${formatNumber(value, { maximumFractionDigits: 0 })}h`,
    },
    table: {
      columns: ['Attorney', 'Hours', 'Billable', 'Fees', 'Share'],
      empty: 'No time recorded in this window.',
      rows: ranked.map(([attorney, bucket]) => ({
        cells: [
          attorney,
          formatNumber(bucket.hours, { maximumFractionDigits: 1 }),
          formatNumber(bucket.billable, { maximumFractionDigits: 1 }),
          money(bucket.fees),
        ],
        raw: [
          attorney,
          String(bucket.hours),
          String(bucket.billable),
          String(bucket.fees),
          formatPercent(fees === 0 ? 0 : bucket.fees / fees),
        ],
        share: fees === 0 ? 0 : bucket.fees / fees,
      })),
    },
  };
}

function buildAttorneys(range: RangeKey): TabData {
  const cutoff = cutoffFor(range);
  const periodEntries = MOCK_TIME_ENTRIES.filter(
    (entry) => new Date(entry.date).getTime() >= cutoff
  );
  const source = periodEntries.length > 0 ? periodEntries : MOCK_TIME_ENTRIES;

  const hoursByAttorney = new Map<string, number>();
  for (const entry of source) {
    hoursByAttorney.set(entry.attorney, (hoursByAttorney.get(entry.attorney) ?? 0) + entry.hours);
  }

  const totalHours = sum([...hoursByAttorney.values()], (value) => value);
  const headcount = MOCK_TEAM.length;
  const avgUtilization = average(MOCK_TEAM, (member) => member.utilization);
  const avgRate = average(MOCK_TEAM, (member) => member.hourlyRate);

  const rows = [...MOCK_TEAM]
    .sort((a, b) => (hoursByAttorney.get(b.name) ?? 0) - (hoursByAttorney.get(a.name) ?? 0))
    .map((member) => {
      const hours = hoursByAttorney.get(member.name) ?? member.hoursThisMonth;
      return {
        cells: [
          member.name,
          member.role,
          formatNumber(hours, { maximumFractionDigits: 1 }),
          formatPercent(member.utilization),
        ],
        raw: [
          member.name,
          member.role,
          String(hours),
          formatPercent(member.utilization),
          formatPercent(totalHours === 0 ? 0 : hours / totalHours),
        ],
        share: totalHours === 0 ? 0 : hours / totalHours,
      };
    });

  return {
    caption: `Timekeeper performance · ${RANGES.find((r) => r.key === range)?.label}`,
    kpis: [
      {
        title: 'Headcount',
        value: formatNumber(headcount),
        change: 0,
        changeLabel: 'snapshot',
        hint: `${MOCK_TEAM.filter((m) => m.status === 'active').length} active today`,
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: 'Avg utilization',
        value: formatPercent(avgUtilization),
        change: Math.round((avgUtilization - 0.75) * 1000) / 10,
        changeLabel: 'vs 75% target',
        hint: 'Mean billable target attainment',
        icon: <Gauge className="h-5 w-5" />,
        iconTone: 'success',
      },
      {
        title: 'Hours logged',
        value: formatNumber(totalHours, { maximumFractionDigits: 0 }),
        change: 0,
        changeLabel: 'in window',
        hint: `Across ${formatNumber(hoursByAttorney.size)} timekeepers`,
        icon: <Clock className="h-5 w-5" />,
        iconTone: 'info',
      },
      {
        title: 'Avg hourly rate',
        value: money(avgRate),
        change: pctChange(avgRate * 0.94, avgRate),
        changeLabel: 'vs last year',
        hint: 'Unweighted mean standard rate',
        icon: <Banknote className="h-5 w-5" />,
        iconTone: 'accent',
      },
    ],
    chart: {
      kind: 'bar',
      points: [...MOCK_TEAM]
        .sort((a, b) => b.utilization - a.utilization)
        .map((member) => ({
          label: member.name.split(' ').slice(-1)[0],
          a: member.utilization,
        })),
      aLabel: 'Utilization',
      format: (value) => formatPercent(value, { decimals: 0 }),
    },
    table: {
      columns: ['Attorney', 'Role', 'Hours', 'Utilization', 'Share'],
      empty: 'No timekeepers match this window.',
      rows,
    },
  };
}

function buildTab(tab: TabKey, range: RangeKey): TabData {
  switch (tab) {
    case 'billing':
      return buildBilling(range);
    case 'matters':
      return buildMatters(range);
    case 'clients':
      return buildClients(range);
    case 'time':
      return buildTime(range);
    case 'attorneys':
      return buildAttorneys(range);
  }
}

/* ── Chart renderer ──────────────────────────────────────────── */

const TOOLTIP_STYLE: React.CSSProperties = {
  background: 'var(--lg-surface)',
  border: '1px solid var(--lg-border)',
  borderRadius: 12,
  color: 'var(--lg-text)',
  fontSize: 12,
  boxShadow: 'var(--lg-shadow-md)',
};

const AXIS_TICK = { fill: 'var(--lg-text-muted)', fontSize: 11 };

function ReportChart({ spec }: { spec: ChartSpec }) {
  if (spec.kind === 'pie') {
    const total = spec.slices.reduce((sumValue, slice) => sumValue + slice.value, 0);

    return (
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="h-64 w-full lg:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={spec.slices}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={96}
                paddingAngle={2}
                stroke="var(--lg-surface)"
              >
                {spec.slices.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: 'var(--lg-text-muted)' }}
                formatter={(value: number) => [spec.format(value), 'Billed']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="w-full space-y-2 lg:w-1/2">
          {spec.slices.map((slice) => (
            <li key={slice.name} className="flex items-center gap-3 text-sm">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="min-w-0 flex-1 truncate text-[var(--lg-text-secondary)]">
                {slice.name}
              </span>
              <span className="shrink-0 font-medium tabular-nums text-[var(--lg-text)]">
                {spec.format(slice.value)}
              </span>
              <span className="w-14 shrink-0 text-right text-xs tabular-nums text-[var(--lg-text-muted)]">
                {formatPercent(total === 0 ? 0 : slice.value / total, { decimals: 0 })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (spec.kind === 'area') {
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spec.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="lgReportAreaA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc2626" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="lgReportAreaB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f172a" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#0f172a" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--lg-border)" vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v: number) => spec.format(v)} width={72} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: 'var(--lg-text-muted)' }}
              formatter={(value: number, name: string) => [
                spec.format(value),
                name === 'a' ? spec.aLabel : spec.bLabel,
              ]}
            />
            <Area
              type="monotone"
              dataKey="a"
              name="a"
              stroke="#dc2626"
              strokeWidth={2}
              fill="url(#lgReportAreaA)"
            />
            <Area
              type="monotone"
              dataKey="b"
              name="b"
              stroke="#64748b"
              strokeWidth={2}
              fill="url(#lgReportAreaB)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={spec.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--lg-border)" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v: number) => spec.format(v)} width={72} />
          <Tooltip
            cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: 'var(--lg-text-muted)' }}
            formatter={(value: number, name: string) => [
              spec.format(value),
              name === 'a' ? spec.aLabel : (spec.bLabel ?? spec.aLabel),
            ]}
          />
          <Bar dataKey="a" name="a" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={48} />
          {spec.bLabel && <Bar dataKey="b" name="b" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={48} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Table renderer ──────────────────────────────────────────── */

function SummaryTable({ spec }: { spec: TableSpec }) {
  if (spec.rows.length === 0) {
    return (
      <div className="lg-empty">
        <FileText className="h-8 w-8" aria-hidden="true" />
        <p className="lg-empty-title">Nothing to show</p>
        <p className="lg-empty-description">{spec.empty}</p>
      </div>
    );
  }

  return (
    <div className="lg-table-wrapper">
      <table className="lg-table lg-table-compact">
        <thead>
          <tr>
            {spec.columns.map((column, index) => (
              <th
                key={column}
                scope="col"
                className={cn(index > 0 && index < spec.columns.length - 1 && 'lg-table-align-right')}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spec.rows.map((row, rowIndex) => (
            <tr key={`${row.cells[0]}-${rowIndex}`}>
              {row.cells.map((cell, cellIndex) => (
                <td
                  key={`${cell}-${cellIndex}`}
                  className={cn(
                    cellIndex === 0 && 'lg-table-cell-primary',
                    cellIndex > 0 && 'lg-table-align-right tabular-nums'
                  )}
                >
                  {cell}
                </td>
              ))}
              <td>
                <div className="flex min-w-[9rem] items-center gap-3">
                  <div
                    className="lg-progress flex-1"
                    role="progressbar"
                    aria-valuenow={Math.round(row.share * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${spec.columns[spec.columns.length - 1]} share`}
                  >
                    <div
                      className="lg-progress-bar"
                      style={{ width: `${Math.max(row.share * 100, 1)}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-xs font-medium tabular-nums text-[var(--lg-text-muted)]">
                    {formatPercent(row.share, { decimals: 0 })}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── CSV export ──────────────────────────────────────────────── */

function exportCsv(spec: TableSpec, filename: string) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [
    spec.columns.map(escape).join(','),
    ...spec.rows.map((row) => row.raw.map(escape).join(',')),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/* ── Page ────────────────────────────────────────────────────── */

export default function ReportsPage() {
  const [tab, setTab] = useState<TabKey>('billing');
  const [range, setRange] = useState<RangeKey>('12m');
  const [showPrintBanner, setShowPrintBanner] = useState(true);

  const data = useMemo(() => buildTab(tab, range), [tab, range]);
  const activeTab = TABS.find((item) => item.key === tab);

  const handleExportCsv = () => {
    const filename = `legalos-${tab}-${range}.csv`;
    exportCsv(data.table, filename);
    toast.success(`Exported ${filename}`);
  };

  const handlePrint = () => {
    setShowPrintBanner(true);
    window.print();
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Print notice — hidden from the printed output. */}
      {showPrintBanner && (
        <div className="print:hidden mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <Printer className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Print dialog opened</p>
            <p className="mt-0.5 text-xs opacity-90">
              Choose <strong>Save as PDF</strong> as the destination. Tabs, filters and toolbars
              are excluded from the printed output.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPrintBanner(false)}
            aria-label="Dismiss print notice"
            className="rounded-lg p-1 transition-colors hover:bg-amber-500/15"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <header className="print:hidden mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-crimson-600/10 text-crimson-600">
              <FileBarChart className="h-5 w-5" aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--lg-text)]">
              Reports
            </h1>
            <Badge variant="lg" size="sm" className="ml-1">
              {MOCK_REPORTS.length} scheduled
            </Badge>
          </div>
          <p className="mt-1.5 text-sm text-[var(--lg-text-muted)]">
            Billing, matter, client, and timekeeper performance across the firm — filter by window,
            drill into the share breakdown, then export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Date range"
            className="flex items-center rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface-sunken)] p-1"
          >
            {RANGES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setRange(item.key)}
                aria-pressed={range === item.key}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  range === item.key
                    ? 'bg-[var(--lg-surface)] text-[var(--lg-text)] shadow-[var(--lg-shadow-sm)]'
                    : 'text-[var(--lg-text-muted)] hover:text-[var(--lg-text)]'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Button variant="secondary" size="sm" onClick={handleExportCsv} leftIcon={<Download className="h-4 w-4" />}>
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint} leftIcon={<Printer className="h-4 w-4" />}>
            Export PDF
          </Button>
        </div>
      </header>

      <Tabs variant="underline" value={tab} onValueChange={(next) => setTab(next as TabKey)}>
        <div className="print:hidden">
          <TabsList className="mb-2">
            {TABS.map((item) => (
              <TabsTrigger key={item.key} value={item.key} className="gap-2">
                {item.icon}
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={tab} className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[var(--lg-text)]">
                {activeTab?.label} report
              </h2>
              <p className="text-xs text-[var(--lg-text-muted)]">{data.caption}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" size="sm">
                {RANGES.find((item) => item.key === range)?.label}
              </Badge>
              <Badge variant="lg" size="sm">
                {formatDate(REF_DATE.getTime() - (RANGES.find((r) => r.key === range)?.days ?? 365) * DAY_MS)} – {formatDate(REF_DATE)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.kpis.map((kpi) => (
              <MetricCard
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                subvalue={kpi.subvalue}
                change={kpi.change}
                changeLabel={kpi.changeLabel}
                positiveIsGood={kpi.positiveIsGood}
                hint={kpi.hint}
                icon={kpi.icon}
                iconTone={kpi.iconTone}
              />
            ))}
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>{activeTab?.label} trend</CardTitle>
                <CardDescription>
                  {data.chart.kind === 'pie'
                    ? 'Revenue concentration across the top clients in this window'
                    : 'Bucketed across the selected window'}
                </CardDescription>
              </div>
              <Badge variant="outline" size="sm">
                {data.chart.kind === 'pie' ? 'Share of billing' : 'Period series'}
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              <ReportChart spec={data.chart} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Summary</CardTitle>
                <CardDescription>
                  Share bars are proportional to the row total for this window.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportCsv}
                leftIcon={<Download className="h-4 w-4" />}
              >
                CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <SummaryTable spec={data.table} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
