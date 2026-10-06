'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Clock, Percent, Play, Search, Square, Wallet } from 'lucide-react';

import { Avatar } from '@/components/ui/Avatar';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import {
  MOCK_MATTERS,
  MOCK_TIME_ENTRIES,
  type TimeEntry,
  type TimeEntryStatus,
} from '@/lib/mock-data';
import {
  cn,
  formatCurrency,
  formatDate,
  formatDuration,
  formatPercent,
} from '@/lib/utils';

/* ── date helpers (fixture-safe, local timezone) ───────────────── */

const DAY_MS = 86_400_000;
const CURRENT_USER = 'Margaret Halloran';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Parse `YYYY-MM-DD` as a local date (avoids the UTC-midnight shift). */
const parseDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

/** Monday-based start of week. */
const startOfWeek = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));

const round2 = (n: number) => Math.round(n * 100) / 100;

const sumHours = (entries: TimeEntry[]) =>
  round2(entries.reduce((sum, entry) => sum + entry.hours, 0));

/* ── status vocabulary ─────────────────────────────────────────── */

const STATUS_META: Record<TimeEntryStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'outline' },
  submitted: { label: 'Submitted', variant: 'info' },
  billed: { label: 'Billed', variant: 'success' },
};

type TimerState = { startedAt: number } | null;

function ChartTooltip(props: any) {
  const { active, payload, label } = props ?? {};
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface)] px-3 py-2 text-xs shadow-[var(--lg-shadow-md)]">
      <p className="mb-1 font-semibold text-[var(--lg-text)]">{label}</p>
      {payload.map((item: any, index: number) => (
        <p
          key={item.dataKey ?? index}
          className="flex items-center gap-2 text-[var(--lg-text-secondary)]"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color ?? item.fill }}
          />
          {item.name}: {formatDuration(Number(item.value))}
        </p>
      ))}
    </div>
  );
}

export default function TimePage() {
  const [entries, setEntries] = useState<TimeEntry[]>(MOCK_TIME_ENTRIES);
  const [query, setQuery] = useState('');
  const [attorneyFilter, setAttorneyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [billableFilter, setBillableFilter] = useState('all');

  // Live timer
  const [timer, setTimer] = useState<TimerState>(null);
  const [elapsed, setElapsed] = useState(0);
  const [timerMatterId, setTimerMatterId] = useState(MOCK_MATTERS[0]?.id ?? '');
  const [timerTask, setTimerTask] = useState('');

  useEffect(() => {
    if (!timer) return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - timer.startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timer]);

  const today = startOfDay(new Date());
  const todayIso = toIso(today);
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const lastWeekStart = addDays(weekStart, -7);
  const lastWeekEnd = addDays(weekStart, -1);

  const inRange = (entry: TimeEntry, from: Date, to: Date) => {
    const date = parseDate(entry.date);
    return date.getTime() >= from.getTime() && date.getTime() <= to.getTime();
  };

  const hoursToday = sumHours(entries.filter((entry) => entry.date === todayIso));
  const weekEntries = entries.filter((entry) => inRange(entry, weekStart, weekEnd));
  const hoursWeek = sumHours(weekEntries);
  const hoursLastWeek = sumHours(
    entries.filter((entry) => inRange(entry, lastWeekStart, lastWeekEnd))
  );
  const billableWeekHours = sumHours(weekEntries.filter((entry) => entry.billable));
  const billableRatio = hoursWeek > 0 ? billableWeekHours / hoursWeek : 0;

  const unbilledEntries = entries.filter(
    (entry) => entry.billable && entry.status !== 'billed'
  );
  const unbilledValue = unbilledEntries.reduce((sum, entry) => sum + entry.amount, 0);

  const weekDelta =
    hoursLastWeek > 0
      ? Math.round(((hoursWeek - hoursLastWeek) / hoursLastWeek) * 100)
      : undefined;

  const attorneys = Array.from(new Set(entries.map((entry) => entry.attorney))).sort();

  const filtered = entries
    .filter((entry) => {
      const needle = query.trim().toLowerCase();
      if (needle) {
        const haystack = [
          entry.task,
          entry.narrative,
          entry.activity,
          entry.matterNumber,
          entry.matterTitle,
          entry.clientName,
          entry.attorney,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (attorneyFilter !== 'all' && entry.attorney !== attorneyFilter) return false;
      if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
      if (billableFilter === 'billable' && !entry.billable) return false;
      if (billableFilter === 'non-billable' && entry.billable) return false;
      return true;
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  // Hours by day — trailing 7 days
  const chartData = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    const iso = toIso(date);
    const dayEntries = entries.filter((entry) => entry.date === iso);
    const billable = sumHours(dayEntries.filter((entry) => entry.billable));
    const nonBillable = round2(
      dayEntries.filter((entry) => !entry.billable).reduce((s, e) => s + e.hours, 0)
    );
    return { day: formatDate(iso, 'EEE d'), billable, nonBillable };
  });

  // Weekly utilization by attorney
  const utilization = Array.from(
    weekEntries.reduce<Map<string, { hours: number; billable: number; value: number }>>(
      (map, entry) => {
        const row = map.get(entry.attorney) ?? { hours: 0, billable: 0, value: 0 };
        row.hours = round2(row.hours + entry.hours);
        if (entry.billable) {
          row.billable = round2(row.billable + entry.hours);
          row.value = round2(row.value + entry.amount);
        }
        map.set(entry.attorney, row);
        return map;
      },
      new Map()
    )
  )
    .map(([attorney, stats]) => ({
      attorney,
      ...stats,
      utilization: stats.hours > 0 ? stats.billable / stats.hours : 0,
    }))
    .sort((a, b) => b.hours - a.hours);

  const hasFilters =
    query.trim() !== '' ||
    attorneyFilter !== 'all' ||
    statusFilter !== 'all' ||
    billableFilter !== 'all';

  const clearFilters = () => {
    setQuery('');
    setAttorneyFilter('all');
    setStatusFilter('all');
    setBillableFilter('all');
  };

  /* ── timer actions ───────────────────────────────────────────── */

  const timerMatter = MOCK_MATTERS.find((matter) => matter.id === timerMatterId);
  const clock = `${String(Math.floor(elapsed / 3600)).padStart(2, '0')}:${String(
    Math.floor((elapsed % 3600) / 60)
  ).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  const startTimer = () => {
    if (!timerMatter) {
      toast.error('Select a matter before starting the timer.');
      return;
    }
    setElapsed(0);
    setTimer({ startedAt: Date.now() });
    toast.success(`Timer started on ${timerMatter.number}`);
  };

  const stopTimer = () => {
    if (!timer || !timerMatter) return;

    const seconds = Math.max(elapsed, 1);
    const hours = Math.max(round2(seconds / 3600), 0.01);
    const started = new Date(timer.startedAt);
    const entry: TimeEntry = {
      id: `te_${Date.now()}`,
      attorney: CURRENT_USER,
      matterId: timerMatter.id,
      matterNumber: timerMatter.number,
      matterTitle: timerMatter.title,
      clientName: timerMatter.clientName,
      task: timerTask.trim() || 'Timer session',
      activity: 'Other',
      hours,
      rate: timerMatter.billingRate,
      amount: round2(hours * timerMatter.billingRate),
      billable: true,
      date: todayIso,
      status: 'draft',
      invoiceNumber: null,
      narrative: `Live timer started at ${started.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })} and stopped after ${clock}.`,
    };

    setEntries((prev) => [entry, ...prev]);
    setTimer(null);
    setElapsed(0);
    setTimerTask('');
    toast.success(
      `Timer stopped — ${formatDuration(hours)} logged as a draft on ${timerMatter.number}`
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--lg-text)]">
            Time entries
          </h1>
          <p className="mt-1 text-sm text-[var(--lg-text-muted)]">
            Capture billable work, review weekly utilization and push approved time to
            billing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {timer && (
            <span className="inline-flex items-center gap-2 rounded-lg border border-crimson-600/30 bg-crimson-600/10 px-3 py-2 font-mono text-sm font-semibold tabular-nums text-crimson-700 dark:border-crimson-500/40 dark:bg-crimson-500/15 dark:text-crimson-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-crimson-600 dark:bg-crimson-400" />
              {clock}
            </span>
          )}

          {timer ? (
            <Button variant="danger" leftIcon={<Square className="h-4 w-4" />} onClick={stopTimer}>
              Stop timer
            </Button>
          ) : (
            <Button
              variant="primary"
              leftIcon={<Play className="h-4 w-4" />}
              onClick={startTimer}
            >
              Start timer
            </Button>
          )}
        </div>
      </div>

      {/* ── Timer bar ─────────────────────────────────────────── */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[14rem] flex-1">
            <label className="lg-label" htmlFor="timer-matter">
              Matter
            </label>
            <select
              id="timer-matter"
              className="lg-input lg-select lg-input-sm"
              value={timerMatterId}
              onChange={(event) => setTimerMatterId(event.target.value)}
            >
              {MOCK_MATTERS.map((matter) => (
                <option key={matter.id} value={matter.id}>
                  {matter.number} — {matter.title}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[16rem] flex-1">
            <label className="lg-label" htmlFor="timer-task">
              Task description
            </label>
            <input
              id="timer-task"
              className="lg-input lg-input-sm"
              placeholder="e.g. Draft motion to compel"
              value={timerTask}
              onChange={(event) => setTimerTask(event.target.value)}
            />
          </div>

          <div className="text-xs text-[var(--lg-text-muted)]">
            {timer ? (
              <span>
                Running at{' '}
                <span className="font-medium text-[var(--lg-text-secondary)]">
                  {formatCurrency(timerMatter?.billingRate ?? 0, { cents: false })}
                </span>
                /hr — logs as a draft entry when stopped.
              </span>
            ) : (
              <span>
                Stopped timers save a draft entry for{' '}
                {formatCurrency(timerMatter?.billingRate ?? 0, { cents: false })}/hr.
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* ── Stat cards ────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Hours today"
          value={formatDuration(hoursToday)}
          hint={
            hoursToday > 0
              ? `${unbilledEntries.filter((e) => e.date === todayIso).length} entries logged ${formatDate(todayIso)}`
              : `No entries yet — last log ${formatDate(
                  entries.reduce((latest, e) => (e.date > latest ? e.date : latest), entries[0]?.date ?? todayIso)
                )}`
          }
          icon={<Clock className="h-5 w-5" />}
        />
        <MetricCard
          title="Hours this week"
          value={formatDuration(hoursWeek)}
          change={weekDelta}
          changeLabel="vs prior week"
          hint={`Week of ${formatDate(weekStart)} — ${weekEntries.length} entries`}
          icon={<Percent className="h-5 w-5" />}
        />
        <MetricCard
          title="Billable %"
          value={formatPercent(billableRatio)}
          hint={`${formatDuration(billableWeekHours)} of ${formatDuration(hoursWeek)} billable this week`}
          iconTone="success"
          icon={<Percent className="h-5 w-5" />}
        />
        <MetricCard
          title="Unbilled value"
          value={formatCurrency(unbilledValue)}
          hint={`${unbilledEntries.length} draft/submitted entries awaiting billing`}
          icon={<Wallet className="h-5 w-5" />}
        />
      </div>

      {/* ── Filters + table ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>All time entries</CardTitle>
            <CardDescription className="mt-1">
              {filtered.length} of {entries.length} entries shown
            </CardDescription>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-5">
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lg-text-muted)]" />
              <input
                aria-label="Search time entries"
                className="lg-input lg-input-sm pl-9"
                placeholder="Search task, matter, client…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <select
              aria-label="Filter by attorney"
              className="lg-input lg-select lg-input-sm"
              value={attorneyFilter}
              onChange={(event) => setAttorneyFilter(event.target.value)}
            >
              <option value="all">All attorneys</option>
              {attorneys.map((attorney) => (
                <option key={attorney} value={attorney}>
                  {attorney}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by status"
              className="lg-input lg-select lg-input-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="billed">Billed</option>
            </select>

            <select
              aria-label="Filter by billable"
              className="lg-input lg-select lg-input-sm"
              value={billableFilter}
              onChange={(event) => setBillableFilter(event.target.value)}
            >
              <option value="all">Billable &amp; non-billable</option>
              <option value="billable">Billable only</option>
              <option value="non-billable">Non-billable only</option>
            </select>
          </div>

          <div className="lg-table-wrapper">
            <table className="lg-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Attorney</th>
                  <th>Matter</th>
                  <th>Task</th>
                  <th className="lg-table-align-right">Hours</th>
                  <th className="lg-table-align-right">Rate</th>
                  <th className="lg-table-align-right">Amount</th>
                  <th>Billable</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => {
                  const status = STATUS_META[entry.status];
                  return (
                    <tr key={entry.id}>
                      <td className="whitespace-nowrap text-[var(--lg-text-secondary)]">
                        {formatDate(entry.date)}
                      </td>
                      <td>
                        <span className="flex items-center gap-2">
                          <Avatar name={entry.attorney} size="xs" />
                          <span className="whitespace-nowrap text-[var(--lg-text)]">
                            {entry.attorney}
                          </span>
                        </span>
                      </td>
                      <td>
                        <p className="font-mono text-[11px] text-[var(--lg-text-muted)]">
                          {entry.matterNumber}
                        </p>
                        <p className="max-w-[18rem] truncate text-[var(--lg-text)]">
                          {entry.matterTitle}
                        </p>
                        <p className="max-w-[18rem] truncate text-xs text-[var(--lg-text-muted)]">
                          {entry.clientName}
                        </p>
                      </td>
                      <td>
                        <p className="text-[var(--lg-text)]">{entry.task}</p>
                        <p className="text-xs text-[var(--lg-text-muted)]">
                          {entry.activity}
                        </p>
                      </td>
                      <td className="whitespace-nowrap text-right font-medium tabular-nums text-[var(--lg-text)]">
                        {formatDuration(entry.hours)}
                      </td>
                      <td className="whitespace-nowrap text-right tabular-nums">
                        {formatCurrency(entry.rate, { cents: false })}/hr
                      </td>
                      <td className="whitespace-nowrap text-right font-medium tabular-nums text-[var(--lg-text)]">
                        {formatCurrency(entry.amount)}
                      </td>
                      <td>
                        <Badge
                          variant={entry.billable ? 'lg' : 'default'}
                          size="sm"
                          dot
                        >
                          {entry.billable ? 'Billable' : 'No charge'}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={status.variant} size="sm">
                          {status.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9}>
                      <div className="lg-empty">
                        <p className="lg-empty-title">No time entries match</p>
                        <p className="lg-empty-description">
                          Try a different search, or clear the attorney, status and
                          billable filters to see all {entries.length} entries.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Charts + utilization ──────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Hours by day</CardTitle>
              <CardDescription className="mt-1">
                Trailing 7 days — billable vs non-billable
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--lg-text-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#dc2626]" />
                Billable
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#fca5a5]" />
                Non-billable
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--lg-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: 'var(--lg-text-muted)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--lg-border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--lg-text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--lg-surface-muted)' }} />
                  <Bar
                    dataKey="billable"
                    name="Billable"
                    stackId="hours"
                    fill="#dc2626"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={44}
                  />
                  <Bar
                    dataKey="nonBillable"
                    name="Non-billable"
                    stackId="hours"
                    fill="#fca5a5"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Weekly utilization</CardTitle>
              <CardDescription className="mt-1">
                Week of {formatDate(weekStart)}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-0 rounded-none lg-table-wrapper">
              <table className="lg-table lg-table-compact lg-table-align-right">
                <thead>
                  <tr>
                    <th>Attorney</th>
                    <th>Hours</th>
                    <th>Util.</th>
                    <th>Billable</th>
                  </tr>
                </thead>
                <tbody>
                  {utilization.map((row) => (
                    <tr key={row.attorney}>
                      <td className="lg-table-cell-primary">
                        <span className="flex items-center gap-2">
                          <Avatar name={row.attorney} size="xs" />
                          <span className="max-w-[7.5rem] truncate">{row.attorney}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap tabular-nums">
                        {formatDuration(row.hours)}
                      </td>
                      <td className="whitespace-nowrap tabular-nums">
                        <span
                          className={cn(
                            'font-medium',
                            row.utilization >= 0.75
                              ? 'text-emerald-600 dark:text-emerald-300'
                              : row.utilization >= 0.5
                                ? 'text-amber-600 dark:text-amber-300'
                                : 'text-red-600 dark:text-red-300'
                          )}
                        >
                          {formatPercent(row.utilization, { decimals: 0 })}
                        </span>
                      </td>
                      <td className="whitespace-nowrap tabular-nums">
                        {formatCurrency(row.value, { cents: false })}
                      </td>
                    </tr>
                  ))}

                  {utilization.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <div className="lg-empty !py-8">
                          <p className="lg-empty-title">No hours this week</p>
                          <p className="lg-empty-description">
                            Start a timer to begin logging time for the week of{' '}
                            {formatDate(weekStart)}.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
