'use client';

/**
 * LegalOS — Firm dashboard
 * -----------------------------------------------------------------------------
 * The daily driver screen: headline KPIs, the 12-month hours-vs-cash curve,
 * matter status tiles, the stage funnel, the court calendar and the activity
 * feed.
 *
 * Everything derives from `@/lib/mock-data` at module scope so the server
 * prerender and the client hydration emit identical markup — no `Date.now()`
 * in render (see the deterministic `TODAY` constant below).
 *
 * The page sits inside `DashboardShell`, which already provides the page
 * padding/background, hence the plain `space-y-6` root.
 */

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  CalendarClock,
  Clock,
  FileText,
  Gavel,
  Receipt,
  Users,
  UsersRound,
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
import {
  MOCK_ACTIVITY,
  MOCK_COURT_DATES,
  MOCK_FIRM,
  MOCK_INVOICES,
  MOCK_INTAKE,
  MOCK_KPI,
  MOCK_MATTERS,
  MOCK_TIME_ENTRIES,
  type ActivityKind,
} from '@/lib/mock-data';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '@/lib/utils';

/* ========================================================================== *
 * Deterministic clock
 * ========================================================================== */

const DAY_MS = 86_400_000;

/**
 * A fixed "now" anchored to the newest timestamp in the mock corpus.
 *
 * `Date.now()` would let the prerendered HTML disagree with the first client
 * render (countdowns shift by minutes), which React reports as a hydration
 * mismatch. Anchoring to the data keeps both passes byte-identical.
 */
const TODAY = (() => {
  const stamps = [
    ...MOCK_ACTIVITY.map((a) => Date.parse(a.at)),
    ...MOCK_TIME_ENTRIES.map((e) => Date.parse(e.date)),
  ].filter((n) => Number.isFinite(n));
  return new Date(stamps.length ? Math.max(...stamps) : Date.UTC(2026, 9, 5));
})();

/** Whole-calendar-day difference between `TODAY` and `iso` (negative = past). */
function calendarDaysUntil(iso: string): number {
  const target = Date.parse(iso);
  if (!Number.isFinite(target)) return 0;
  const d = new Date(target);
  const from = Date.UTC(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
  const to = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((to - from) / DAY_MS);
}

/** Compact relative label anchored to `TODAY`: "today", "3d ago", "in 5d". */
function relativeFromToday(iso: string): string {
  const delta = calendarDaysUntil(iso);
  const abs = Math.abs(delta);
  const unit = abs >= 14 ? `${Math.round(abs / 7)}w` : `${abs}d`;
  if (delta === 0) return 'today';
  if (delta > 0) return `in ${unit}`;
  return `${unit} ago`;
}

/** Countdown tone: red inside 24h, amber inside 3 days, blue inside a week. */
function countdownTone(delta: number): BadgeVariant {
  if (delta < 0) return 'default';
  if (delta <= 1) return 'danger';
  if (delta <= 3) return 'warning';
  if (delta <= 7) return 'info';
  return 'secondary';
}

/* ========================================================================== *
 * Derived data
 * ========================================================================== */

/** Current month key from the deterministic clock ("2026-10"). */
const MONTH_KEY = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}`;

const currentKpi = MOCK_KPI.find((k) => k.month === MONTH_KEY) ?? MOCK_KPI[MOCK_KPI.length - 1];
const priorKpi = MOCK_KPI[MOCK_KPI.length - 2] ?? currentKpi;

/** Hours logged in the current month by the detail-level timesheets. */
const monthEntries = MOCK_TIME_ENTRIES.filter((e) => e.date.startsWith(MONTH_KEY));
const billableHoursLogged = monthEntries
  .filter((e) => e.billable)
  .reduce((sum, e) => sum + e.hours, 0);

/** Work not invoiced yet: billable entries that never reached an invoice. */
const unbilledEntries = MOCK_TIME_ENTRIES.filter((e) => e.billable && e.status !== 'billed');
const unbilledValue = unbilledEntries.reduce((sum, e) => sum + e.amount, 0);

const openMatters = MOCK_MATTERS.filter((m) => m.status !== 'closed');
const onHoldMatters = MOCK_MATTERS.filter((m) => m.status === 'on_hold').length;

const overdueInvoices = MOCK_INVOICES.filter((i) => i.status === 'overdue');
const overdueBalance = overdueInvoices.reduce((sum, i) => sum + i.balance, 0);
const oldestOverdueDays = overdueInvoices.reduce((max, i) => Math.max(max, i.daysOverdue), 0);

/** 12-month series: billable hours (left axis) vs collected revenue (right). */
const hoursRevenueSeries = MOCK_KPI.map((k) => ({
  label: k.label,
  hours: k.billableHours,
  revenue: k.collections,
}));

const SERIES_LEGEND = [
  { label: 'Billable hours', color: '#dc2626' },
  { label: 'Collected revenue', color: '#64748b' },
];

/* Matter status tiles — the four stages leadership tracks. */
const STATUS_TILES: Array<{
  status: 'open' | 'discovery' | 'trial' | 'closed';
  label: string;
  variant: BadgeVariant;
  color: string;
}> = [
  { status: 'open', label: 'Open', variant: 'info', color: '#0284c7' },
  { status: 'discovery', label: 'Discovery', variant: 'warning', color: '#d97706' },
  { status: 'trial', label: 'Trial', variant: 'danger', color: '#dc2626' },
  { status: 'closed', label: 'Closed', variant: 'success', color: '#16a34a' },
];

const statusCounts = STATUS_TILES.map((tile) => ({
  ...tile,
  count: MOCK_MATTERS.filter((m) => m.status === tile.status).length,
}));
const statusMax = Math.max(...statusCounts.map((s) => s.count), 1);
const statusTotal = MOCK_MATTERS.length;

/* Matter stage funnel: intake pipeline → lifecycle stages. */
const funnelStages = [
  {
    label: 'Intake pipeline',
    count: MOCK_INTAKE.filter((i) => i.status !== 'declined').length,
    color: '#f87171',
  },
  { label: 'Open', count: statusCounts[0].count, color: '#dc2626' },
  { label: 'Discovery', count: statusCounts[1].count, color: '#b91c1c' },
  { label: 'Trial', count: statusCounts[2].count, color: '#991b1b' },
  { label: 'Closed', count: statusCounts[3].count, color: '#450a0a' },
];
const funnelMax = Math.max(...funnelStages.map((s) => s.count), 1);
const funnelTotal =
  MOCK_MATTERS.length + MOCK_INTAKE.filter((i) => i.status !== 'declined').length;

/* Upcoming court dates — next six sittings, soonest first. */
const upcomingCourtDates = MOCK_COURT_DATES.filter((cd) => calendarDaysUntil(cd.date) >= 0)
  .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
  .slice(0, 6);

const hearingVariant: Record<string, BadgeVariant> = {
  trial: 'danger',
  hearing: 'info',
  deposition: 'warning',
  arbitration: 'secondary',
};

/* Activity feed — most recent first. */
const activityFeed = [...MOCK_ACTIVITY]
  .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  .slice(0, 6);

const activityMeta: Record<ActivityKind, { icon: typeof Gavel; variant: BadgeVariant }> = {
  matter: { icon: Gavel, variant: 'lg' },
  invoice: { icon: Receipt, variant: 'success' },
  document: { icon: FileText, variant: 'info' },
  client: { icon: Users, variant: 'secondary' },
  court: { icon: CalendarClock, variant: 'warning' },
  team: { icon: UsersRound, variant: 'default' },
};

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

/* ========================================================================== *
 * Page
 * ========================================================================== */

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--lg-text)]">
              Firm dashboard
            </h1>
            <Badge variant="lg" size="sm" dot>
              {MOCK_FIRM.shortName}
            </Badge>
            <Badge variant="outline" size="sm">
              {MOCK_FIRM.plan}
            </Badge>
          </div>
          <p className="mt-1.5 text-sm text-[var(--lg-text-muted)]">
            {MOCK_FIRM.name} · snapshot for {formatDate(TODAY, 'EEEE, MMMM d, yyyy')} ·
            deadlines, billing and matters in one view
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" size="sm">
            {MOCK_KPI.length}-month trend
          </Badge>
          <Badge variant="success" size="sm" dot>
            Collection rate {formatPercent(MOCK_FIRM.metrics.collectionRate)}
          </Badge>
        </div>
      </header>

      {/* ── Metric cards ───────────────────────────────────────────────── */}
      <section
        aria-label="Key performance indicators"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          title="Billable hours this month"
          value={formatNumber(currentKpi.billableHours)}
          icon={<Clock className="h-5 w-5" />}
          delta={`${formatPercent(
            currentKpi.billableHours / Math.max(priorKpi.billableHours, 1),
            { decimals: 0 }
          )} of ${priorKpi.label}`}
          deltaTone="info"
          hint={`${formatNumber(billableHoursLogged, { maximumFractionDigits: 1 })}h detailed in timesheets · ${currentKpi.headcount} timekeepers`}
        />

        <MetricCard
          title="Unbilled value"
          value={formatCurrency(unbilledValue, { cents: false })}
          icon={<Receipt className="h-5 w-5" />}
          delta={`${unbilledEntries.length} entries awaiting invoice`}
          deltaTone="warning"
          hint={`${unbilledEntries.filter((e) => e.status === 'draft').length} draft · ${unbilledEntries.filter((e) => e.status === 'submitted').length} submitted for review`}
        />

        <MetricCard
          title="Open matters"
          value={formatNumber(openMatters.length)}
          icon={<Gavel className="h-5 w-5" />}
          delta={`${statusTotal} total matters`}
          deltaTone="neutral"
          hint={`${statusCounts[1].count} in discovery · ${statusCounts[2].count} at trial · ${onHoldMatters} on hold`}
        />

        <MetricCard
          title="Overdue invoices"
          value={formatCurrency(overdueBalance, { cents: false })}
          icon={<AlertTriangle className="h-5 w-5" />}
          delta={`${overdueInvoices.length} past due · oldest ${oldestOverdueDays}d`}
          deltaTone="danger"
          hint={`${formatCurrency(MOCK_FIRM.metrics.outstandingReceivables, { cents: false })} total receivables`}
        />
      </section>

      {/* ── Hours vs revenue + court calendar ──────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Billable hours vs collected revenue</CardTitle>
              <CardDescription className="mt-1">
                Trailing {MOCK_KPI.length} months · {MOCK_KPI[0].label} {MOCK_KPI[0].year} —{' '}
                {currentKpi.label} {currentKpi.year}
              </CardDescription>
            </div>
            <ul className="flex flex-wrap items-center gap-4">
              {SERIES_LEGEND.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-1.5 text-xs text-[var(--lg-text-secondary)]"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: item.color }}
                    aria-hidden="true"
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          </CardHeader>

          <CardContent className="px-3 pb-4 pt-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={hoursRevenueSeries}
                  margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="dashHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="dashRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0.02} />
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
                    yAxisId="hours"
                    tickLine={false}
                    axisLine={false}
                    tick={axisTick}
                    width={44}
                    tickFormatter={(value: number) => formatNumber(value)}
                  />
                  <YAxis
                    yAxisId="revenue"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tick={axisTick}
                    width={58}
                    tickFormatter={(value: number) =>
                      formatCurrency(value, { cents: false, compact: true })
                    }
                  />
                  <Tooltip
                    cursor={{ stroke: 'var(--lg-border-strong)', strokeWidth: 1 }}
                    content={
                      <ChartTooltip
                        format={(value, key) =>
                          key === 'hours'
                            ? `${formatNumber(value)} h`
                            : formatCurrency(value, { cents: false })
                        }
                      />
                    }
                  />
                  <Area
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    name="Collected revenue"
                    stroke="#64748b"
                    strokeWidth={2}
                    fill="url(#dashRevenue)"
                  />
                  <Area
                    yAxisId="hours"
                    type="monotone"
                    dataKey="hours"
                    name="Billable hours"
                    stroke="#dc2626"
                    strokeWidth={2.5}
                    fill="url(#dashHours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Upcoming court dates</CardTitle>
              <CardDescription className="mt-1">
                Next {upcomingCourtDates.length} sittings · {upcomingCourtDates.filter((cd) => calendarDaysUntil(cd.date) <= 7).length} this week
              </CardDescription>
            </div>
            <Badge variant="lg" size="sm">
              {MOCK_COURT_DATES.length} on calendar
            </Badge>
          </CardHeader>

          <CardContent className="px-5 pb-5">
            {upcomingCourtDates.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--lg-text-muted)]">
                No hearings scheduled.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--lg-border)]">
                {upcomingCourtDates.map((cd) => {
                  const delta = calendarDaysUntil(cd.date);
                  return (
                    <li key={cd.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="w-14 shrink-0 rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface-muted)] py-1.5 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
                          {formatDate(cd.date, 'MMM')}
                        </p>
                        <p className="text-lg font-semibold leading-tight text-[var(--lg-text)] tabular-nums">
                          {formatDate(cd.date, 'd')}
                        </p>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--lg-text)]">
                          {cd.case}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[var(--lg-text-muted)]">
                          {cd.judge} · {cd.court}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge variant={hearingVariant[cd.hearingType] ?? 'default'} size="sm">
                            {cd.hearingType}
                          </Badge>
                          <Badge variant={countdownTone(delta)} size="sm" dot>
                            {relativeFromToday(cd.date)}
                          </Badge>
                          {cd.remote && (
                            <Badge variant="outline" size="sm">
                              Remote
                            </Badge>
                          )}
                        </div>
                      </div>

                      <time
                        dateTime={cd.date}
                        className="shrink-0 self-start text-right text-xs font-medium text-[var(--lg-text-secondary)]"
                      >
                        {formatDate(cd.date, 'EEE')}
                        <span className="block text-[var(--lg-text-muted)]">
                          {formatDate(cd.date, 'h:mm a')}
                        </span>
                      </time>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Status tiles + funnel + activity ───────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Matter status</CardTitle>
              <CardDescription className="mt-1">
                {statusTotal} matters across the firm
              </CardDescription>
            </div>
            <Badge variant="outline" size="sm">
              {formatPercent(openMatters.length / statusTotal, { decimals: 0 })} active
            </Badge>
          </CardHeader>

          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-2 gap-3">
              {statusCounts.map((tile) => (
                <div
                  key={tile.status}
                  className="rounded-xl border border-[var(--lg-border)] bg-[var(--lg-surface-muted)] p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
                      {tile.label}
                    </span>
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: tile.color }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <p className="text-2xl font-semibold tracking-tight text-[var(--lg-text)] tabular-nums">
                      {formatNumber(tile.count)}
                    </p>
                    <Badge variant={tile.variant} size="sm">
                      {formatPercent(tile.count / statusTotal, { decimals: 0 })}
                    </Badge>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--lg-surface-sunken)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((tile.count / statusMax) * 100)}%`,
                        background: tile.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-[var(--lg-text-muted)]">
              {onHoldMatters} matters are on hold and excluded from the tiles above.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Matter stage funnel</CardTitle>
              <CardDescription className="mt-1">
                Intake pipeline through resolution
              </CardDescription>
            </div>
            <Badge variant="lg" size="sm">
              {funnelTotal} tracked
            </Badge>
          </CardHeader>

          <CardContent className="space-y-3 px-5 pb-5 pt-4">
            {funnelStages.map((stage) => (
              <div key={stage.label}>
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="font-medium text-[var(--lg-text)]">{stage.label}</span>
                  <span className="text-[var(--lg-text-muted)] tabular-nums">
                    {stage.count} · {formatPercent(stage.count / Math.max(funnelTotal, 1), { decimals: 0 })}
                  </span>
                </div>
                <div className="mt-1.5 h-7 w-full overflow-hidden rounded-md bg-[var(--lg-surface-sunken)]">
                  <div
                    className="flex h-full min-w-fit items-center rounded-md px-2.5 text-xs font-semibold text-white transition-all"
                    style={{
                      width: `${Math.max((stage.count / funnelMax) * 100, 8)}%`,
                      background: stage.color,
                    }}
                  >
                    {stage.count}
                  </div>
                </div>
              </div>
            ))}

            <p className="pt-1 text-xs text-[var(--lg-text-muted)]">
              Conversion from intake to open matter:{' '}
              <span className="font-semibold text-[var(--lg-text-secondary)]">
                {formatPercent(statusCounts[0].count / Math.max(funnelStages[0].count, 1), {
                  decimals: 0,
                })}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription className="mt-1">
                Across matters, billing and filing
              </CardDescription>
            </div>
            <Badge variant="outline" size="sm">
              {MOCK_ACTIVITY.length} events
            </Badge>
          </CardHeader>

          <CardContent className="px-5 pb-5">
            <ul className="divide-y divide-[var(--lg-border)]">
              {activityFeed.map((item) => {
                const meta = activityMeta[item.kind];
                const Icon = meta.icon;
                return (
                  <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-crimson-600/10 text-crimson-600 dark:bg-crimson-500/20 dark:text-crimson-300"
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug text-[var(--lg-text)]">
                          {item.title}
                        </p>
                        <Badge variant={meta.variant} size="sm">
                          {item.kind}
                        </Badge>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-[var(--lg-text-muted)]">
                        {item.description}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--lg-text-muted)]">
                        <span className="font-medium text-[var(--lg-text-secondary)]">
                          {item.actor}
                        </span>{' '}
                        · {relativeFromToday(item.at)} · {formatDate(item.at, 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* ── Footer note ────────────────────────────────────────────────── */}
      <p className="text-center text-xs text-[var(--lg-text-muted)]">
        {MOCK_FIRM.name} · Trust balance{' '}
        {formatCurrency(MOCK_FIRM.metrics.trustBalance, { cents: false })} · Realization{' '}
        {formatPercent(MOCK_FIRM.metrics.realizationRate)} · Avg days to pay{' '}
        {MOCK_FIRM.metrics.averageDaysToPay}
      </p>
    </div>
  );
}
