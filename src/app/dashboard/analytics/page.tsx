'use client';

/**
 * LegalOS — Firm analytics
 * -----------------------------------------------------------------------------
 * Four tabbed views over the same mock corpus:
 *
 *  - Overview : revenue vs realization (dual-axis AreaChart) + attorney table
 *  - Billing  : fees by matter type (BarChart) + collection rate (LineChart)
 *  - Matters  : duration distribution (PieChart) + status/age breakdowns
 *  - Clients  : concentration bar + top-client table
 *
 * All series are derived once at module scope from `@/lib/mock-data`, so the
 * server prerender and the client hydration render identical markup (no
 * `Date.now()` in render).
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  Building2,
  Gauge,
  Scale,
  TrendingUp,
  Users,
} from 'lucide-react';

import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  MOCK_CLIENTS,
  MOCK_FIRM,
  MOCK_KPI,
  MOCK_MATTERS,
  MOCK_TEAM,
} from '@/lib/mock-data';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '@/lib/utils';

const CRIMSON = '#dc2626';
const CRIMSON_SOFT = '#f87171';
const SLATE = '#64748b';
const AMBER = '#f59e0b';

/** Collection-rate target used by the LineChart reference line. */
const COLLECTION_TARGET = 95;

/* ========================================================================== *
 * Deterministic clock (see dashboard/page.tsx for the rationale)
 * ========================================================================== */

const TODAY = (() => {
  const stamps = [
    ...MOCK_KPI.map((k) => Date.parse(`${k.month}-01`)),
    ...MOCK_MATTERS.map((m) => Date.parse(m.opened)),
  ].filter((n) => Number.isFinite(n));
  return new Date(stamps.length ? Math.max(...stamps) : Date.UTC(2026, 9, 1));
})();

/** Whole months elapsed since `iso`, floored at 0. */
function monthsSince(iso: string): number {
  const start = Date.parse(iso);
  if (!Number.isFinite(start)) return 0;
  const d = new Date(start);
  const months =
    (TODAY.getFullYear() - d.getFullYear()) * 12 + (TODAY.getMonth() - d.getMonth());
  return Math.max(months, 0);
}

/* ========================================================================== *
 * Series
 * ========================================================================== */

const ytdYear = TODAY.getFullYear();

const totalBilling = MOCK_KPI.reduce((sum, k) => sum + k.billing, 0);
const totalCollections = MOCK_KPI.reduce((sum, k) => sum + k.collections, 0);
const totalWriteOffs = MOCK_KPI.reduce((sum, k) => sum + k.writeOffs, 0);
const ytdBilling = MOCK_KPI.filter((k) => k.year === ytdYear).reduce(
  (sum, k) => sum + k.billing,
  0
);
const ytdCollections = MOCK_KPI.filter((k) => k.year === ytdYear).reduce(
  (sum, k) => sum + k.collections,
  0
);

const currentKpi = MOCK_KPI[MOCK_KPI.length - 1];
const priorKpi = MOCK_KPI[MOCK_KPI.length - 2] ?? currentKpi;

/** Revenue (collected) against realization (%) — dual axis AreaChart. */
const revenueRealization = MOCK_KPI.map((k) => ({
  label: k.label,
  revenue: k.collections,
  billing: k.billing,
  realization: Math.round(k.realization * 100),
}));

/** Collection rate per month: collections ÷ billing, as a percentage. */
const collectionRate = MOCK_KPI.map((k) => ({
  label: k.label,
  rate: Math.round((k.collections / Math.max(k.billing, 1)) * 1000) / 10,
}));

/** Fees recorded against each matter, grouped by matter type. */
const billingByType = Object.entries(
  MOCK_MATTERS.reduce<Record<string, number>>((acc, m) => {
    acc[m.type] = (acc[m.type] ?? 0) + m.spent;
    return acc;
  }, {})
)
  .map(([type, billing]) => ({ type, billing }))
  .sort((a, b) => b.billing - a.billing);

/** Matter duration buckets (months from open date to the deterministic clock). */
const DURATION_BUCKETS = [
  { name: '0–3 months', min: 0, max: 3, color: CRIMSON },
  { name: '3–6 months', min: 3, max: 6, color: CRIMSON_SOFT },
  { name: '6–12 months', min: 6, max: 12, color: AMBER },
  { name: '12–24 months', min: 12, max: 24, color: SLATE },
  { name: '24 months +', min: 24, max: Number.POSITIVE_INFINITY, color: '#334155' },
];

const durationData = DURATION_BUCKETS.map((bucket) => ({
  name: bucket.name,
  color: bucket.color,
  value: MOCK_MATTERS.filter((m) => {
    const age = monthsSince(m.opened);
    return age >= bucket.min && age < bucket.max;
  }).length,
}));

const durationTotal = durationData.reduce((sum, d) => sum + d.value, 0) || 1;

/** Matter status snapshot for the Matters tab. */
const STATUS_ROWS: Array<{
  status: 'open' | 'discovery' | 'trial' | 'on_hold' | 'closed';
  label: string;
  variant: BadgeVariant;
}> = [
  { status: 'open', label: 'Open', variant: 'info' },
  { status: 'discovery', label: 'Discovery', variant: 'warning' },
  { status: 'trial', label: 'Trial', variant: 'danger' },
  { status: 'on_hold', label: 'On hold', variant: 'secondary' },
  { status: 'closed', label: 'Closed', variant: 'success' },
];

const statusRows = STATUS_ROWS.map((row) => ({
  ...row,
  count: MOCK_MATTERS.filter((m) => m.status === row.status).length,
  budget: MOCK_MATTERS.filter((m) => m.status === row.status).reduce(
    (sum, m) => sum + m.budget,
    0
  ),
}));
const matterTotal = MOCK_MATTERS.length;

/** Client concentration: top eight accounts by lifetime value. */
const clientsByLtv = [...MOCK_CLIENTS].sort((a, b) => b.lifetimeValue - a.lifetimeValue);
const totalLtv = clientsByLtv.reduce((sum, c) => sum + c.lifetimeValue, 0);
const top5Share = clientsByLtv
  .slice(0, 5)
  .reduce((sum, c) => sum + c.lifetimeValue, 0) / Math.max(totalLtv, 1);

const clientConcentration = clientsByLtv.slice(0, 8).map((c) => ({
  name: c.name.length > 22 ? `${c.name.slice(0, 20)}…` : c.name,
  ltv: c.lifetimeValue,
  balance: c.balance,
}));

const topClients = clientsByLtv.slice(0, 8);

/** Attorney utilization table rows. */
const utilizationRows = [...MOCK_TEAM].sort((a, b) => b.utilization - a.utilization);

function utilizationTone(utilization: number): BadgeVariant {
  if (utilization >= 0.85) return 'success';
  if (utilization >= 0.7) return 'info';
  if (utilization >= 0.65) return 'warning';
  return 'danger';
}

/* ========================================================================== *
 * Chart tooltip
 * ========================================================================== */

type TooltipEntry = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
};

function ChartTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  format?: (value: number, dataKey: string) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface)] px-3 py-2 shadow-[var(--lg-shadow-md)]">
      <p className="mb-1.5 text-xs font-semibold text-[var(--lg-text)]">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const key = String(entry.dataKey ?? '');
          const numeric = Number(entry.value ?? 0);
          return (
            <p
              key={`${key}-${index}`}
              className="flex items-center gap-2 text-xs text-[var(--lg-text-secondary)]"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: entry.color }}
                aria-hidden="true"
              />
              <span>{entry.name}</span>
              <span className="ml-auto font-semibold tabular-nums text-[var(--lg-text)]">
                {format ? format(numeric, key) : formatNumber(numeric)}
              </span>
            </p>
          );
        })}
      </div>
    </div>
  );
}

const axisTick = { fill: 'var(--lg-text-muted)', fontSize: 11 } as const;

function LegendChip({ label, color }: { label: string; color: string }) {
  return (
    <li className="flex items-center gap-1.5 text-xs text-[var(--lg-text-secondary)]">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden="true" />
      {label}
    </li>
  );
}

/* ========================================================================== *
 * Page
 * ========================================================================== */

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--lg-text)]">
              Firm analytics
            </h1>
            <Badge variant="lg" size="sm" dot>
              {MOCK_FIRM.shortName}
            </Badge>
          </div>
          <p className="mt-1.5 text-sm text-[var(--lg-text-muted)]">
            Revenue, realization, matter flow and people metrics · data through{' '}
            {formatDate(TODAY, 'MMMM d, yyyy')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" size="sm">
            {MOCK_KPI.length}-month rolling window
          </Badge>
          <Badge variant="success" size="sm">
            Realization {formatPercent(currentKpi.realization)}
          </Badge>
        </div>
      </header>

      <Tabs defaultValue="overview" variant="underline">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="matters">
            Matters <Badge variant="outline" size="sm">{matterTotal}</Badge>
          </TabsTrigger>
          <TabsTrigger value="clients">
            Clients <Badge variant="outline" size="sm">{MOCK_CLIENTS.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ══ Overview ═══════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-6 pt-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Billing YTD"
              value={formatCurrency(ytdBilling, { cents: false, compact: true })}
              icon={<TrendingUp className="h-5 w-5" />}
              change={
                priorKpi.billing > 0
                  ? Math.round(((currentKpi.billing - priorKpi.billing) / priorKpi.billing) * 1000) /
                    10
                  : 0
              }
              changeLabel={`vs ${priorKpi.label}`}
            />
            <MetricCard
              title="Collections YTD"
              value={formatCurrency(ytdCollections, { cents: false, compact: true })}
              icon={<Scale className="h-5 w-5" />}
              delta={`${formatPercent(ytdCollections / Math.max(ytdBilling, 1))} of billing`}
              deltaTone="info"
            />
            <MetricCard
              title="Realization rate"
              value={formatPercent(currentKpi.realization)}
              icon={<Gauge className="h-5 w-5" />}
              change={Math.round((currentKpi.realization - priorKpi.realization) * 1000) / 10}
              changeLabel="pts vs prior month"
            />
            <MetricCard
              title="Utilization"
              value={formatPercent(currentKpi.utilization)}
              icon={<Users className="h-5 w-5" />}
              delta={`${currentKpi.headcount} timekeepers`}
              deltaTone="neutral"
            />
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Revenue vs realization</CardTitle>
                <CardDescription className="mt-1">
                  Collected revenue (left) against realization rate (right) ·{' '}
                  {MOCK_KPI[0].label} {MOCK_KPI[0].year} — {currentKpi.label} {currentKpi.year}
                </CardDescription>
              </div>
              <ul className="flex flex-wrap items-center gap-4">
                <LegendChip label="Collected revenue" color={CRIMSON} />
                <LegendChip label="Realization %" color={SLATE} />
              </ul>
            </CardHeader>

            <CardContent className="px-3 pb-4 pt-2">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueRealization}
                    margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="anaRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CRIMSON} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={CRIMSON} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="anaRealization" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SLATE} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={SLATE} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--lg-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={axisTick}
                      interval="preserveStartEnd"
                      minTickGap={8}
                    />
                    <YAxis
                      yAxisId="money"
                      tickLine={false}
                      axisLine={false}
                      tick={axisTick}
                      width={58}
                      tickFormatter={(value: number) =>
                        formatCurrency(value, { cents: false, compact: true })
                      }
                    />
                    <YAxis
                      yAxisId="pct"
                      orientation="right"
                      domain={[60, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={axisTick}
                      width={44}
                      tickFormatter={(value: number) => `${value}%`}
                    />
                    <Tooltip
                      cursor={{ stroke: 'var(--lg-border-strong)', strokeWidth: 1 }}
                      content={
                        <ChartTooltip
                          format={(value, key) =>
                            key === 'realization'
                              ? formatPercent(value, { decimals: 0 })
                              : formatCurrency(value, { cents: false })
                          }
                        />
                      }
                    />
                    <Area
                      yAxisId="money"
                      type="monotone"
                      dataKey="revenue"
                      name="Collected revenue"
                      stroke={CRIMSON}
                      strokeWidth={2.5}
                      fill="url(#anaRevenue)"
                    />
                    <Area
                      yAxisId="pct"
                      type="monotone"
                      dataKey="realization"
                      name="Realization %"
                      stroke={SLATE}
                      strokeWidth={2}
                      strokeDasharray="5 3"
                      fill="url(#anaRealization)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Attorney utilization</CardTitle>
                <CardDescription className="mt-1">
                  Hours logged against billable target this month · {utilizationRows.length}{' '}
                  timekeepers
                </CardDescription>
              </div>
              <Badge variant="outline" size="sm">
                Firm avg{' '}
                {formatPercent(
                  utilizationRows.reduce((s, t) => s + t.utilization, 0) /
                    Math.max(utilizationRows.length, 1)
                )}
              </Badge>
            </CardHeader>

            <CardContent className="px-5 pb-5">
              <div className="lg-table-wrapper">
                <table className="lg-table">
                  <thead>
                    <tr>
                      <th>Attorney</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th className="lg-table-align-right">Matters</th>
                      <th className="lg-table-align-right">Hours</th>
                      <th className="lg-table-align-right">Target</th>
                      <th>Utilization</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilizationRows.map((person) => (
                      <tr key={person.id}>
                        <td className="lg-table-cell-primary">
                          <span className="flex items-center gap-2.5">
                            <span
                              aria-hidden="true"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-crimson-600/10 text-[11px] font-semibold text-crimson-700 dark:bg-crimson-500/20 dark:text-crimson-300"
                            >
                              {person.initials}
                            </span>
                            {person.name}
                          </span>
                        </td>
                        <td>{person.role}</td>
                        <td>{person.department}</td>
                        <td className="lg-table-align-right tabular-nums">
                          {formatNumber(person.matters)}
                        </td>
                        <td className="lg-table-align-right tabular-nums">
                          {formatNumber(person.hoursThisMonth, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="lg-table-align-right tabular-nums text-[var(--lg-text-muted)]">
                          {formatNumber(person.billableTarget, { maximumFractionDigits: 0 })}
                        </td>
                        <td>
                          <span className="flex items-center gap-2">
                            <span className="lg-progress w-24">
                              <span
                                className="lg-progress-bar block"
                                style={{
                                  width: `${Math.min(Math.round(person.utilization * 100), 100)}%`,
                                  background:
                                    person.utilization >= 0.7 ? CRIMSON : AMBER,
                                }}
                              />
                            </span>
                            <span className="tabular-nums text-xs font-semibold text-[var(--lg-text)]">
                              {formatPercent(person.utilization, { decimals: 0 })}
                            </span>
                          </span>
                        </td>
                        <td>
                          <Badge variant={utilizationTone(person.utilization)} size="sm">
                            {person.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ Billing ════════════════════════════════════════════════════ */}
        <TabsContent value="billing" className="space-y-6 pt-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Billed (12 mo)"
              value={formatCurrency(totalBilling, { cents: false, compact: true })}
              icon={<TrendingUp className="h-5 w-5" />}
              hint={`${formatCurrency(totalBilling / MOCK_KPI.length, { cents: false, compact: true })} average month`}
            />
            <MetricCard
              title="Collected (12 mo)"
              value={formatCurrency(totalCollections, { cents: false, compact: true })}
              icon={<Scale className="h-5 w-5" />}
              delta={`${formatPercent(totalCollections / Math.max(totalBilling, 1))} collection rate`}
              deltaTone="success"
            />
            <MetricCard
              title="Write-offs (12 mo)"
              value={formatCurrency(totalWriteOffs, { cents: false, compact: true })}
              icon={<BarChart3 className="h-5 w-5" />}
              delta={`${formatPercent(totalWriteOffs / Math.max(totalBilling, 1))} of billing`}
              deltaTone="warning"
            />
            <MetricCard
              title="Average days to pay"
              value={formatNumber(MOCK_FIRM.metrics.averageDaysToPay)}
              icon={<Gauge className="h-5 w-5" />}
              delta="net 30 terms"
              deltaTone="neutral"
            />
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Billing by matter type</CardTitle>
                <CardDescription className="mt-1">
                  Fees recorded against matters, grouped by practice type
                </CardDescription>
              </div>
              <Badge variant="lg" size="sm">
                {billingByType.length} types
              </Badge>
            </CardHeader>

            <CardContent className="px-3 pb-4 pt-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={billingByType}
                    margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--lg-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="type"
                      tickLine={false}
                      axisLine={false}
                      tick={axisTick}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={56}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={axisTick}
                      width={58}
                      tickFormatter={(value: number) =>
                        formatCurrency(value, { cents: false, compact: true })
                      }
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(220, 38, 38, 0.06)' }}
                      content={
                        <ChartTooltip
                          format={(value) => formatCurrency(value, { cents: false })}
                        />
                      }
                    />
                    <Bar
                      dataKey="billing"
                      name="Billed"
                      fill={CRIMSON}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={56}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Collection rate</CardTitle>
                <CardDescription className="mt-1">
                  Cash collected as a share of billed fees · dashed line marks the{' '}
                  {COLLECTION_TARGET}% target
                </CardDescription>
              </div>
              <Badge variant="success" size="sm">
                {formatPercent(collectionRate[collectionRate.length - 1].rate, {
                  decimals: 1,
                  alreadyPercent: true,
                })}{' '}
                latest
              </Badge>
            </CardHeader>

            <CardContent className="px-3 pb-4 pt-2">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={collectionRate}
                    margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--lg-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={axisTick}
                      interval="preserveStartEnd"
                      minTickGap={8}
                    />
                    <YAxis
                      domain={[60, 110]}
                      tickLine={false}
                      axisLine={false}
                      tick={axisTick}
                      width={44}
                      tickFormatter={(value: number) => `${value}%`}
                    />
                    <Tooltip
                      cursor={{ stroke: 'var(--lg-border-strong)', strokeWidth: 1 }}
                      content={
                        <ChartTooltip
                          format={(value) =>
                            formatPercent(value, { decimals: 1, alreadyPercent: true })
                          }
                        />
                      }
                    />
                    <ReferenceLine
                      y={COLLECTION_TARGET}
                      stroke={SLATE}
                      strokeDasharray="5 4"
                      label={{
                        value: `${COLLECTION_TARGET}% target`,
                        position: 'insideTopRight',
                        fill: 'var(--lg-text-muted)',
                        fontSize: 11,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      name="Collection rate"
                      stroke={CRIMSON}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: CRIMSON }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ Matters ════════════════════════════════════════════════════ */}
        <TabsContent value="matters" className="space-y-6 pt-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total matters"
              value={formatNumber(matterTotal)}
              icon={<Scale className="h-5 w-5" />}
              delta={`${statusRows[4].count} closed`}
              deltaTone="neutral"
            />
            <MetricCard
              title="Avg matter age"
              value={`${formatNumber(
                MOCK_MATTERS.reduce((sum, m) => sum + monthsSince(m.opened), 0) /
                  Math.max(matterTotal, 1),
                { maximumFractionDigits: 0 }
              )} mo`}
              icon={<Gauge className="h-5 w-5" />}
              delta="open to today"
              deltaTone="info"
            />
            <MetricCard
              title="Avg budget"
              value={formatCurrency(
                MOCK_MATTERS.reduce((sum, m) => sum + m.budget, 0) / Math.max(matterTotal, 1),
                { cents: false, compact: true }
              )}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <MetricCard
              title="Budget consumed"
              value={formatPercent(
                MOCK_MATTERS.reduce((sum, m) => sum + m.spent, 0) /
                  Math.max(MOCK_MATTERS.reduce((sum, m) => sum + m.budget, 1), 1)
              )}
              icon={<BarChart3 className="h-5 w-5" />}
              delta="spent vs budget, firm-wide"
              deltaTone="warning"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Matter duration distribution</CardTitle>
                  <CardDescription className="mt-1">
                    Matters bucketed by months from open date
                  </CardDescription>
                </div>
                <Badge variant="outline" size="sm">
                  {durationTotal} matters
                </Badge>
              </CardHeader>

              <CardContent className="px-5 pb-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={durationData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={58}
                          outerRadius={92}
                          paddingAngle={3}
                          stroke="var(--lg-surface)"
                        >
                          {durationData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={
                            <ChartTooltip
                              format={(value, key) =>
                                key === 'value'
                                  ? `${formatNumber(value)} matters`
                                  : formatNumber(value)
                              }
                            />
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <ul className="space-y-2.5 self-center">
                    {durationData.map((entry) => (
                      <li key={entry.name}>
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="flex items-center gap-2 text-[var(--lg-text-secondary)]">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: entry.color }}
                              aria-hidden="true"
                            />
                            {entry.name}
                          </span>
                          <span className="font-semibold text-[var(--lg-text)] tabular-nums">
                            {entry.value}{' '}
                            <span className="font-normal text-[var(--lg-text-muted)]">
                              · {formatPercent(entry.value / durationTotal, { decimals: 0 })}
                            </span>
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--lg-surface-sunken)]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round((entry.value / Math.max(...durationData.map((d) => d.value), 1)) * 100)}%`,
                              background: entry.color,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Matters by status</CardTitle>
                  <CardDescription className="mt-1">
                    Headcount and committed budget per stage
                  </CardDescription>
                </div>
                <Badge variant="lg" size="sm">
                  {formatNumber(matterTotal)} total
                </Badge>
              </CardHeader>

              <CardContent className="px-5 pb-5">
                <ul className="divide-y divide-[var(--lg-border)]">
                  {statusRows.map((row) => (
                    <li
                      key={row.status}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--lg-text)]">
                            {row.label}
                          </span>
                          <Badge variant={row.variant} size="sm">
                            {formatPercent(row.count / Math.max(matterTotal, 1), {
                              decimals: 0,
                            })}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--lg-text-muted)]">
                          {formatCurrency(row.budget, { cents: false, compact: true })} committed
                          budget
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-[var(--lg-surface-sunken)] sm:block">
                          <div
                            className="h-full rounded-full bg-crimson-600"
                            style={{
                              width: `${Math.round((row.count / Math.max(...statusRows.map((s) => s.count), 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-lg font-semibold text-[var(--lg-text)] tabular-nums">
                          {row.count}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 rounded-xl border border-[var(--lg-border)] bg-[var(--lg-surface-muted)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
                    Litigation-heavy mix
                  </p>
                  <p className="mt-1 text-xs text-[var(--lg-text-secondary)]">
                    {MOCK_MATTERS.filter((m) => m.type === 'litigation').length} litigation{' '}
                    {MOCK_MATTERS.filter((m) => m.type === 'litigation').length === 1
                      ? 'matter'
                      : 'matters'}{' '}
                    represent{' '}
                    {formatCurrency(
                      MOCK_MATTERS.filter((m) => m.type === 'litigation').reduce(
                        (s, m) => s + m.spent,
                        0
                      ),
                      { cents: false, compact: true }
                    )}{' '}
                    of fees recorded.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══ Clients ════════════════════════════════════════════════════ */}
        <TabsContent value="clients" className="space-y-6 pt-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Active clients"
              value={formatNumber(MOCK_CLIENTS.filter((c) => c.status === 'active').length)}
              icon={<Users className="h-5 w-5" />}
              subvalue={`${MOCK_CLIENTS.length} total`}
            />
            <MetricCard
              title="Corporate share"
              value={formatPercent(
                MOCK_CLIENTS.filter((c) => c.type === 'corporate').length /
                  Math.max(MOCK_CLIENTS.length, 1)
              )}
              icon={<Building2 className="h-5 w-5" />}
              delta="of client base"
              deltaTone="neutral"
            />
            <MetricCard
              title="Top-5 concentration"
              value={formatPercent(top5Share, { decimals: 0 })}
              icon={<BarChart3 className="h-5 w-5" />}
              delta={top5Share > 0.5 ? 'high dependency' : 'healthy spread'}
              deltaTone={top5Share > 0.5 ? 'danger' : 'success'}
            />
            <MetricCard
              title="Lifetime value"
              value={formatCurrency(totalLtv, { cents: false, compact: true })}
              icon={<TrendingUp className="h-5 w-5" />}
              hint={`${formatCurrency(totalLtv / Math.max(MOCK_CLIENTS.length, 1), {
                cents: false,
                compact: true,
              })} average per client`}
            />
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Client concentration</CardTitle>
                <CardDescription className="mt-1">
                  Top 8 accounts by lifetime value vs open balance
                </CardDescription>
              </div>
              <ul className="flex flex-wrap items-center gap-4">
                <LegendChip label="Lifetime value" color={CRIMSON} />
                <LegendChip label="Open balance" color={AMBER} />
              </ul>
            </CardHeader>

            <CardContent className="px-3 pb-4 pt-2">
              <div className="h-[360px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={clientConcentration}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--lg-border)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tick={axisTick}
                      tickFormatter={(value: number) =>
                        formatCurrency(value, { cents: false, compact: true })
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={axisTick}
                      width={168}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(220, 38, 38, 0.06)' }}
                      content={
                        <ChartTooltip
                          format={(value) => formatCurrency(value, { cents: false })}
                        />
                      }
                    />
                    <Bar
                      dataKey="ltv"
                      name="Lifetime value"
                      fill={CRIMSON}
                      radius={[0, 6, 6, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      dataKey="balance"
                      name="Open balance"
                      fill={AMBER}
                      radius={[0, 6, 6, 0]}
                      maxBarSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Top clients</CardTitle>
                <CardDescription className="mt-1">
                  Ranked by lifetime value · {formatPercent(top5Share, { decimals: 0 })} of revenue
                  sits with the top five
                </CardDescription>
              </div>
              <Badge variant="lg" size="sm">
                {topClients.length} accounts
              </Badge>
            </CardHeader>

            <CardContent className="px-5 pb-5">
              <div className="lg-table-wrapper">
                <table className="lg-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Industry</th>
                      <th>Risk</th>
                      <th className="lg-table-align-right">Open matters</th>
                      <th className="lg-table-align-right">Balance</th>
                      <th className="lg-table-align-right">Lifetime value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClients.map((client) => (
                      <tr key={client.id}>
                        <td className="lg-table-cell-primary">{client.name}</td>
                        <td>{client.industry}</td>
                        <td>
                          <Badge
                            variant={
                              client.risk === 'critical' || client.risk === 'high'
                                ? 'danger'
                                : client.risk === 'medium'
                                  ? 'warning'
                                  : 'success'
                            }
                            size="sm"
                          >
                            {client.risk}
                          </Badge>
                        </td>
                        <td className="lg-table-align-right tabular-nums">
                          {formatNumber(client.openMatters)}
                        </td>
                        <td className="lg-table-align-right tabular-nums">
                          {formatCurrency(client.balance, { cents: false })}
                        </td>
                        <td className="lg-table-align-right tabular-nums">
                          {formatCurrency(client.lifetimeValue, { cents: false })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
