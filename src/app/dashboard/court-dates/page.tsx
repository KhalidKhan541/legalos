'use client';

import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarClock,
  Gavel,
  MapPin,
  Scale,
  Search,
  Video,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import {
  MOCK_COURT_DATES,
  type CourtDate,
  type HearingType,
} from '@/lib/mock-data';
import { cn, formatDate, formatRelative } from '@/lib/utils';

/* ────────────────────────────────────────────────────────────
   Presentational maps
   ──────────────────────────────────────────────────────────── */

const HEARING_META: Record<HearingType, { label: string; variant: 'danger' | 'lg' | 'info' | 'warning' }> = {
  hearing: { label: 'Hearing', variant: 'lg' },
  trial: { label: 'Trial', variant: 'danger' },
  deposition: { label: 'Deposition', variant: 'info' },
  arbitration: { label: 'Arbitration', variant: 'warning' },
};

const HEARING_COLORS: Record<HearingType, string> = {
  hearing: '#dc2626',
  trial: '#b91c1c',
  deposition: '#0ea5e9',
  arbitration: '#f59e0b',
};

type CourtStatus = CourtDate['status'];

const STATUS_META: Record<
  CourtStatus,
  { label: string; variant: 'info' | 'success' | 'warning' | 'default' | 'danger' }
> = {
  scheduled: { label: 'Scheduled', variant: 'info' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  continued: { label: 'Continued', variant: 'warning' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Vacated', variant: 'danger' },
};

const HEARING_FILTERS: HearingType[] = ['hearing', 'trial', 'deposition', 'arbitration'];
const STATUS_FILTERS: CourtStatus[] = ['scheduled', 'confirmed', 'continued', 'completed', 'cancelled'];

const MONTH_FORMAT = 'MMMM yyyy';

/* ────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────── */

function countdown(dateValue: string): {
  label: string;
  tone: 'overdue' | 'soon' | 'normal' | 'done';
  relative: string;
} {
  const target = new Date(dateValue).getTime();
  if (Number.isNaN(target)) {
    return { label: '—', tone: 'normal', relative: '' };
  }

  const diffMs = target - Date.now();
  const absDays = Math.floor(Math.abs(diffMs) / (24 * 60 * 60 * 1000));
  const absHours = Math.floor(Math.abs(diffMs) / (60 * 60 * 1000));

  if (diffMs < 0) {
    return {
      label: absDays >= 1 ? `${absDays}d ago` : `${absHours}h ago`,
      tone: 'overdue',
      relative: formatRelative(dateValue),
    };
  }

  return {
    label: absDays >= 1 ? `in ${absDays}d` : `in ${absHours}h`,
    tone: absDays <= 3 ? 'soon' : 'normal',
    relative: formatRelative(dateValue),
  };
}

function isThisWeek(dateValue: string): boolean {
  const target = new Date(dateValue).getTime();
  if (Number.isNaN(target)) return false;
  const diff = target - Date.now();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

/* ────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────── */

export default function CourtDatesPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | HearingType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CourtStatus>('all');

  const courtDates = MOCK_COURT_DATES;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return courtDates
      .filter((entry) => {
        if (typeFilter !== 'all' && entry.hearingType !== typeFilter) return false;
        if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
        if (!needle) return true;
        return (
          entry.case.toLowerCase().includes(needle) ||
          entry.caseNumber.toLowerCase().includes(needle) ||
          entry.court.toLowerCase().includes(needle) ||
          entry.judge.toLowerCase().includes(needle) ||
          entry.attorney.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  }, [courtDates, query, typeFilter, statusFilter]);

  const groups = useMemo(() => {
    const map = new Map<string, CourtDate[]>();
    filtered.forEach((entry) => {
      const key = Number.isNaN(new Date(entry.date).getTime())
        ? 'Undated'
        : formatDate(entry.date, MONTH_FORMAT);
      const bucket = map.get(key);
      if (bucket) bucket.push(entry);
      else map.set(key, [entry]);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const stats = useMemo(() => {
    const open = courtDates.filter(
      (entry) => entry.status === 'scheduled' || entry.status === 'confirmed'
    );
    const upcoming = open.filter((entry) => new Date(entry.date).getTime() >= Date.now());
    return {
      upcoming: upcoming.length,
      thisWeek: courtDates.filter(
        (entry) =>
          (entry.status === 'scheduled' || entry.status === 'confirmed') &&
          isThisWeek(entry.date)
      ).length,
      continuances: courtDates.filter((entry) => entry.status === 'continued').length,
      remote: courtDates.filter((entry) => entry.remote).length,
    };
  }, [courtDates]);

  const byType = useMemo(
    () =>
      HEARING_FILTERS.map((type) => ({
        type,
        name: HEARING_META[type].label,
        value: courtDates.filter((entry) => entry.hearingType === type).length,
        color: HEARING_COLORS[type],
      })),
    [courtDates]
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-crimson-600 dark:text-crimson-400">
            Court Calendar
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--lg-text)]">
            Court Dates
          </h1>
          <p className="mt-1 text-sm text-[var(--lg-text-muted)]">
            Hearings, trials, depositions and arbitration settings — grouped by month with live
            countdowns.
          </p>
        </div>
        <Button leftIcon={<CalendarDays className="h-4 w-4" />}>Add court date</Button>
      </header>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Upcoming"
          value={stats.upcoming}
          icon={<CalendarClock className="h-5 w-5" />}
          hint="Scheduled or confirmed, not yet held"
        />
        <MetricCard
          title="This week"
          value={stats.thisWeek}
          icon={<Gavel className="h-5 w-5" />}
          iconTone="warning"
          hint="Settings in the next 7 days"
          delta={stats.thisWeek > 0 ? 'Prep due' : 'Quiet'}
          deltaTone={stats.thisWeek > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          title="Continuances"
          value={stats.continuances}
          icon={<Scale className="h-5 w-5" />}
          iconTone="danger"
          hint="Settings pushed to a new date"
        />
        <MetricCard
          title="Remote hearings"
          value={stats.remote}
          icon={<Video className="h-5 w-5" />}
          iconTone="info"
          hint="Video appearances this docket"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Calendar list */}
        <Card>
          <CardHeader className="flex-col gap-3 sm:flex-row">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-crimson-600" />
              Docket
              <span className="ml-1 text-xs font-normal text-[var(--lg-text-muted)]">
                {filtered.length} of {courtDates.length}
              </span>
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lg-text-muted)]" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search case, judge…"
                  aria-label="Search court dates"
                  className="lg-input lg-input-sm w-52 pl-8"
                />
              </div>

              <select
                aria-label="Filter by hearing type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as 'all' | HearingType)}
                className="lg-input lg-select h-9 w-auto text-sm"
              >
                <option value="all">All types</option>
                {HEARING_FILTERS.map((type) => (
                  <option key={type} value={type}>
                    {HEARING_META[type].label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by court date status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | CourtStatus)
                }
                className="lg-input lg-select h-9 w-auto text-sm"
              >
                <option value="all">All statuses</option>
                {STATUS_FILTERS.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_META[status].label}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            {filtered.length === 0 ? (
              <div className="lg-empty">
                <p className="lg-empty-title">No court dates match these filters</p>
                <p className="lg-empty-description">
                  Try a different case name, judge, hearing type or status.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery('');
                    setTypeFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Reset filters
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {groups.map(([month, entries]) => (
                  <section key={month}>
                    <div className="mb-3 flex items-center gap-3">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
                        {month}
                      </h2>
                      <span className="h-px flex-1 bg-[var(--lg-border)]" />
                      <span className="rounded-full bg-[var(--lg-surface-sunken)] px-2 py-0.5 text-[11px] font-semibold text-[var(--lg-text-muted)]">
                        {entries.length}
                      </span>
                    </div>

                    <ol className="relative space-y-3 border-l border-[var(--lg-border)] pl-5">
                      {entries.map((entry) => {
                        const type = HEARING_META[entry.hearingType];
                        const status = STATUS_META[entry.status];
                        const cd = countdown(entry.date);
                        const past = cd.tone === 'overdue';

                        return (
                          <li key={entry.id} className="relative">
                            <span
                              aria-hidden="true"
                              className={cn(
                                'absolute -left-[1.9rem] top-5 h-3 w-3 rounded-full ring-4',
                                past
                                  ? 'bg-slate-400 ring-[var(--lg-surface-muted)]'
                                  : 'bg-crimson-600 ring-[var(--lg-surface-muted)]'
                              )}
                            />

                            <article
                              className={cn(
                                'rounded-xl border bg-[var(--lg-surface)] p-4 shadow-[var(--lg-shadow-sm)] transition-all hover:shadow-[var(--lg-shadow-md)]',
                                past
                                  ? 'border-[var(--lg-border)] opacity-80'
                                  : 'border-[var(--lg-border)] hover:border-crimson-500/40'
                              )}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant={type.variant} size="sm">
                                      {type.label}
                                    </Badge>
                                    <Badge variant={status.variant} size="sm" dot>
                                      {status.label}
                                    </Badge>
                                    {entry.remote && (
                                      <Badge variant="outline" size="sm">
                                        <Video className="h-3 w-3" /> Remote
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="mt-2 truncate text-sm font-semibold text-[var(--lg-text)]">
                                    {entry.case}
                                  </p>
                                  <p className="font-mono text-[11px] text-[var(--lg-text-muted)]">
                                    {entry.caseNumber}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p
                                    className={cn(
                                      'text-sm font-bold tabular-nums',
                                      cd.tone === 'overdue'
                                        ? 'text-red-600 dark:text-red-400'
                                        : cd.tone === 'soon'
                                          ? 'text-amber-600 dark:text-amber-400'
                                          : 'text-[var(--lg-text)]'
                                    )}
                                  >
                                    {entry.status === 'completed'
                                      ? 'Held'
                                      : entry.status === 'cancelled'
                                        ? 'Vacated'
                                        : cd.label}
                                  </p>
                                  <p className="text-[11px] text-[var(--lg-text-muted)]">
                                    {formatDate(entry.date, 'EEE, MMM d · h:mm a')}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 grid gap-x-6 gap-y-2 border-t border-[var(--lg-border-subtle)] pt-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--lg-text-muted)]">
                                    Court
                                  </p>
                                  <p className="flex items-center gap-1 text-[var(--lg-text-secondary)]">
                                    <Scale className="h-3.5 w-3.5 shrink-0 text-[var(--lg-text-muted)]" />
                                    <span className="truncate">{entry.court}</span>
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--lg-text-muted)]">
                                    Judge
                                  </p>
                                  <p className="truncate text-[var(--lg-text-secondary)]">
                                    {entry.judge}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--lg-text-muted)]">
                                    Courtroom
                                  </p>
                                  <p className="flex items-center gap-1 text-[var(--lg-text-secondary)]">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--lg-text-muted)]" />
                                    <span className="truncate">{entry.courtroom}</span>
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--lg-text-muted)]">
                                    Attorney
                                  </p>
                                  <p className="flex items-center gap-1.5">
                                    <Avatar name={entry.attorney} size="xs" />
                                    <span className="truncate text-[var(--lg-text-secondary)]">
                                      {entry.attorney}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </article>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hearings by type */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-crimson-600" />
              Hearings by type
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byType}
                  margin={{ top: 8, right: 8, bottom: 4, left: -18 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'var(--lg-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: 'var(--lg-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(220, 38, 38, 0.06)' }}
                    formatter={(value: number) => [`${value} settings`, 'Settings']}
                    contentStyle={{
                      background: 'var(--lg-surface)',
                      border: '1px solid var(--lg-border)',
                      borderRadius: 10,
                      fontSize: 12,
                      color: 'var(--lg-text)',
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={34}>
                    {byType.map((entry) => (
                      <Cell key={entry.type} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <dl className="mt-4 space-y-2 border-t border-[var(--lg-border)] pt-4">
              {byType.map((entry) => (
                <div key={entry.type} className="flex items-center justify-between text-xs">
                  <dt className="flex items-center gap-2 text-[var(--lg-text-secondary)]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    {entry.name}
                  </dt>
                  <dd className="font-semibold text-[var(--lg-text)]">{entry.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
