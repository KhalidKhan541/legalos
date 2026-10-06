'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  CalendarClock,
  Scale,
  Video,
  MapPin,
  Gavel,
  AlertTriangle,
} from 'lucide-react';

import { Card, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

import { MOCK_COURT_DATES, type CourtDate } from '@/lib/mock-data';
import { cn, formatDate } from '@/lib/utils';

const TYPE_VARIANT: Record<CourtDate['hearingType'], BadgeVariant> = {
  hearing: 'info',
  trial: 'danger',
  deposition: 'warning',
  arbitration: 'secondary',
};

const STATUS_VARIANT: Record<CourtDate['status'], BadgeVariant> = {
  scheduled: 'info',
  confirmed: 'success',
  continued: 'warning',
  completed: 'secondary',
  cancelled: 'secondary',
};

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

export default function CourtDatesPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CourtDate['hearingType']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CourtDate['status']>('all');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_COURT_DATES.filter((d) => {
      if (typeFilter !== 'all' && d.hearingType !== typeFilter) return false;
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (!q) return true;
      return (
        d.case.toLowerCase().includes(q) ||
        d.court.toLowerCase().includes(q) ||
        d.judge.toLowerCase().includes(q) ||
        d.attorney.toLowerCase().includes(q)
      );
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [query, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const upcoming = MOCK_COURT_DATES.filter(
      (d) => new Date(d.date).getTime() >= Date.now() && d.status !== 'cancelled'
    );
    const week = upcoming.filter((d) => daysUntil(d.date) <= 7);
    return {
      upcoming: upcoming.length,
      week: week.length,
      trials: upcoming.filter((d) => d.hearingType === 'trial').length,
      remote: upcoming.filter((d) => d.remote).length,
    };
  }, []);

  const selectCls =
    'h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-crimson-400 focus:ring-2 focus:ring-crimson-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Court Dates</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Hearings, trials, depositions and arbitrations — with countdowns
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => toast.success('Hearing added to court calendar')}>
          <CalendarClock className="h-4 w-4" /> Add hearing
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Upcoming hearings" value={stats.upcoming} icon={<CalendarClock className="h-5 w-5" />} />
        <MetricCard title="Next 7 days" value={stats.week} icon={<AlertTriangle className="h-5 w-5" />} deltaTone={stats.week > 2 ? 'warning' : 'success'} delta={stats.week > 2 ? 'busy week' : 'manageable'} />
        <MetricCard title="Trials scheduled" value={stats.trials} icon={<Gavel className="h-5 w-5" />} hint="final hearings ahead" />
        <MetricCard title="Remote hearings" value={stats.remote} icon={<Video className="h-5 w-5" />} hint="video link attached" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cases, judges, courts…"
              aria-label="Search court dates"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-crimson-400 focus:bg-white focus:ring-2 focus:ring-crimson-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} aria-label="Filter by type" className={selectCls}>
            <option value="all">All types</option>
            <option value="hearing">Hearing</option>
            <option value="trial">Trial</option>
            <option value="deposition">Deposition</option>
            <option value="arbitration">Arbitration</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} aria-label="Filter by status" className={selectCls}>
            <option value="all">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="continued">Continued</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="text-xs font-medium text-slate-400">{rows.length} of {MOCK_COURT_DATES.length}</span>
        </div>

        <ul className="divide-y divide-slate-100 dark:divide-slate-800/70">
          {rows.map((d) => {
            const days = daysUntil(d.date);
            const past = days < 0;
            return (
              <li key={d.id} className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                <div
                  className={cn(
                    'flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border',
                    past
                      ? 'border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900'
                      : days <= 3
                        ? 'border-crimson-300 bg-crimson-50 text-crimson-700 dark:border-crimson-800 dark:bg-crimson-950/60 dark:text-crimson-300'
                        : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                  )}
                >
                  <span className="text-[10px] font-semibold uppercase leading-none">{formatDate(d.date, 'MMM')}</span>
                  <span className="text-xl font-bold leading-tight">{formatDate(d.date, 'd')}</span>
                  <span className="text-[10px] leading-none text-slate-400">{formatDate(d.date, 'yyyy')}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{d.case}</span>
                    <Badge variant={TYPE_VARIANT[d.hearingType]} size="sm">{d.hearingType}</Badge>
                    <Badge variant={STATUS_VARIANT[d.status]} size="sm">{d.status}</Badge>
                    {d.remote && <Badge variant="info" size="sm"><Video className="mr-1 h-3 w-3" />remote</Badge>}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1"><Scale className="h-3 w-3" />{d.court} · {d.courtroom}</span>
                    <span>Judge {d.judge}</span>
                    <span>Attorney {d.attorney}</span>
                    {d.caseNumber && <span className="font-mono">{d.caseNumber}</span>}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {formatDate(d.date, 'EEE, MMM d · h:mm a')} {d.endDate && `– ${formatDate(d.endDate, 'h:mm a')}`} · {d.timezone}
                    {d.remote ? ` · ${d.linkOrAddress}` : ` · ${d.linkOrAddress}`}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge variant={past ? 'secondary' : days <= 3 ? 'danger' : days <= 14 ? 'warning' : 'secondary'} size="md">
                    {past ? 'Passed' : days === 0 ? 'Today' : `in ${days}d`}
                  </Badge>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => toast.success('Reminder set — 48h before hearing')}>
                      Remind
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toast('Marked confirmed', { icon: '✓' })}>
                      Confirm
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
          {rows.length === 0 && (
            <li className="py-12 text-center text-sm text-slate-400">No hearings match your filters</li>
          )}
        </ul>
      </Card>

      <Card>
        <div className="p-5 pb-0">
          <CardTitle>Location notes</CardTitle>
        </div>
        <div className="grid gap-3 p-5 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.slice(0, 6).map((d) => (
            <div key={d.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{d.case}</p>
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                {d.remote ? <Video className="h-3 w-3 shrink-0" /> : <MapPin className="h-3 w-3 shrink-0" />}
                {d.linkOrAddress}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
