'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRightCircle,
  CalendarClock,
  ClipboardList,
  Flame,
  Search,
  Sparkles,
  Target,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
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
  MOCK_INTAKE,
  type IntakeRecord,
  type IntakeStatus,
  type Priority,
} from '@/lib/mock-data';
import { cn, formatCurrency, formatDate, formatRelative } from '@/lib/utils';

/* ────────────────────────────────────────────────────────────
   Presentational maps
   ──────────────────────────────────────────────────────────── */

const STATUS_META: Record<
  IntakeStatus,
  { label: string; column: string; variant: 'info' | 'warning' | 'success' | 'default' }
> = {
  new: { label: 'New', column: 'New', variant: 'info' },
  consulting: { label: 'Consulting', column: 'Consulting', variant: 'warning' },
  retained: { label: 'Retained', column: 'Retained', variant: 'success' },
  declined: { label: 'Declined', column: 'Declined', variant: 'default' },
};

const PRIORITY_META: Record<Priority, { label: string; variant: 'danger' | 'warning' | 'info' | 'default' }> = {
  critical: { label: 'Critical', variant: 'danger' },
  high: { label: 'High', variant: 'danger' },
  medium: { label: 'Medium', variant: 'info' },
  low: { label: 'Low', variant: 'default' },
};

const COLUMNS: IntakeStatus[] = ['new', 'consulting', 'retained', 'declined'];

const SOURCE_COLORS = [
  '#dc2626',
  '#f87171',
  '#f59e0b',
  '#0ea5e9',
  '#10b981',
  '#8b5cf6',
  '#64748b',
  '#e11d48',
];

/* ────────────────────────────────────────────────────────────
   Card
   ──────────────────────────────────────────────────────────── */

function IntakeCard({
  record,
  onConvert,
}: {
  record: IntakeRecord;
  onConvert: (record: IntakeRecord) => void;
}) {
  const status = STATUS_META[record.status];
  const priority = PRIORITY_META[record.priority];
  const convertable = record.status === 'new' || record.status === 'consulting';

  return (
    <article className="rounded-xl border border-[var(--lg-border)] bg-[var(--lg-surface)] p-4 shadow-[var(--lg-shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-[var(--lg-border-strong)] hover:shadow-[var(--lg-shadow-md)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--lg-text)]">{record.name}</p>
          <p className="mt-0.5 font-mono text-[11px] text-[var(--lg-text-muted)]">
            {record.reference}
          </p>
        </div>
        <Badge variant={priority.variant} size="sm">
          {priority.label}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant="lg" size="sm">
          {record.matterType}
        </Badge>
        <Badge variant="outline" size="sm">
          {record.source}
        </Badge>
        <Badge variant={status.variant} size="sm" dot>
          {status.label}
        </Badge>
      </div>

      <dl className="mt-3 space-y-1.5 border-t border-[var(--lg-border-subtle)] pt-3 text-[11px]">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-[var(--lg-text-muted)]">Received</dt>
          <dd className="font-medium text-[var(--lg-text-secondary)]">
            {formatDate(record.submittedAt)} · {formatRelative(record.submittedAt)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-[var(--lg-text-muted)]">Est. value</dt>
          <dd className="font-semibold text-[var(--lg-text)]">
            {formatCurrency(record.estimatedValue, { cents: false })}
          </dd>
        </div>
        {record.consultAt && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[var(--lg-text-muted)]">Consult</dt>
            <dd className="font-medium text-[var(--lg-text-secondary)]">
              {formatDate(record.consultAt, 'MMM d, h:mm a')}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--lg-border-subtle)] pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={record.assignedTo} size="xs" />
          <span className="truncate text-[11px] text-[var(--lg-text-muted)]">
            {record.assignedTo}
          </span>
        </div>
        <Button
          size="sm"
          variant={convertable ? 'primary' : 'secondary'}
          disabled={!convertable}
          onClick={() => onConvert(record)}
          rightIcon={<ArrowRightCircle className="h-3.5 w-3.5" />}
        >
          {record.status === 'retained' ? 'Retained' : convertable ? 'Convert' : 'Declined'}
        </Button>
      </div>
    </article>
  );
}

/* ────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────── */

export default function IntakePage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | IntakeStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [converted, setConverted] = useState<Record<string, boolean>>({});

  const records = MOCK_INTAKE;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records
      .filter((record) => {
        if (statusFilter !== 'all' && record.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && record.priority !== priorityFilter) return false;
        if (!needle) return true;
        return (
          record.name.toLowerCase().includes(needle) ||
          record.reference.toLowerCase().includes(needle) ||
          record.email.toLowerCase().includes(needle) ||
          record.matterType.toLowerCase().includes(needle) ||
          record.source.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));
  }, [records, query, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newThisWeek = records.filter(
      (record) => +new Date(record.submittedAt) >= weekAgo
    ).length;
    const retained = records.filter((record) => record.status === 'retained').length;
    const decided = records.filter(
      (record) => record.status === 'retained' || record.status === 'declined'
    ).length;
    const conversion = decided > 0 ? retained / decided : 0;
    return { newThisWeek, retained, conversion, decided };
  }, [records]);

  const bySource = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach((record) => {
      counts.set(record.source, (counts.get(record.source) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [records]);

  const handleConvert = (record: IntakeRecord) => {
    if (converted[record.id]) return;
    setConverted((prev) => ({ ...prev, [record.id]: true }));
    toast.success(`${record.name} converted to a client — matter intake opened.`);
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-crimson-600 dark:text-crimson-400">
            Intake
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--lg-text)]">
            Intake Pipeline
          </h1>
          <p className="mt-1 text-sm text-[var(--lg-text-muted)]">
            From first enquiry to signed engagement — every lead with source, priority and owner.
          </p>
        </div>
        <Button leftIcon={<Sparkles className="h-4 w-4" />}>New intake</Button>
      </header>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="New this week"
          value={stats.newThisWeek}
          icon={<ClipboardList className="h-5 w-5" />}
          hint="Leads submitted in the last 7 days"
          change="+18%"
          changeLabel="vs prior week"
        />
        <MetricCard
          title="Conversion rate"
          value={`${(stats.conversion * 100).toFixed(0)}%`}
          icon={<Target className="h-5 w-5" />}
          iconTone="success"
          hint={`${stats.retained} retained of ${stats.decided} decided`}
          change="+4.2%"
          changeLabel="vs last month"
        />
        <MetricCard
          title="Retained"
          value={stats.retained}
          icon={<UserCheck className="h-5 w-5" />}
          iconTone="info"
          hint="Leads that became paying clients"
        />
        <MetricCard
          title="Hot leads"
          value={records.filter((r) => r.priority === 'critical' || r.priority === 'high').length}
          icon={<Flame className="h-5 w-5" />}
          iconTone="warning"
          hint="High & critical priority enquiries"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Pipeline */}
        <Card>
          <CardHeader className="flex-col gap-3 sm:flex-row">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-crimson-600" />
              Pipeline board
              <span className="ml-1 text-xs font-normal text-[var(--lg-text-muted)]">
                {filtered.length} of {records.length}
              </span>
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lg-text-muted)]" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search leads…"
                  aria-label="Search intake records"
                  className="lg-input lg-input-sm w-48 pl-8"
                />
              </div>

              <select
                aria-label="Filter by intake status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | IntakeStatus)
                }
                className="lg-input lg-select h-9 w-auto text-sm"
              >
                <option value="all">All statuses</option>
                {COLUMNS.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_META[status].label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by priority"
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(event.target.value as 'all' | Priority)
                }
                className="lg-input lg-select h-9 w-auto text-sm"
              >
                <option value="all">All priorities</option>
                {(['critical', 'high', 'medium', 'low'] as Priority[]).map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_META[priority].label}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {COLUMNS.map((column) => {
                const columnRecords = filtered.filter(
                  (record) => record.status === column
                );
                const meta = STATUS_META[column];

                return (
                  <section
                    key={column}
                    className="flex min-w-0 flex-col rounded-xl border border-[var(--lg-border)] bg-[var(--lg-surface-muted)] p-3"
                  >
                    <header className="mb-3 flex items-center justify-between gap-2 px-1">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--lg-text-secondary)]">
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            column === 'new' && 'bg-sky-500',
                            column === 'consulting' && 'bg-amber-500',
                            column === 'retained' && 'bg-emerald-500',
                            column === 'declined' && 'bg-slate-400'
                          )}
                        />
                        {meta.column}
                      </span>
                      <span className="rounded-full bg-[var(--lg-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--lg-text-muted)]">
                        {columnRecords.length}
                      </span>
                    </header>

                    <div className="flex flex-col gap-3">
                      {columnRecords.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-[var(--lg-border)] px-3 py-6 text-center text-[11px] text-[var(--lg-text-muted)]">
                          Nothing in this stage
                        </p>
                      ) : (
                        columnRecords.map((record) => (
                          <IntakeCard
                            key={record.id}
                            record={record}
                            onConvert={handleConvert}
                          />
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="lg-empty">
                <p className="lg-empty-title">No leads match these filters</p>
                <p className="lg-empty-description">
                  Clear the search box or reset the status and priority filters to see the full
                  pipeline.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                  }}
                >
                  Reset filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Source chart */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-crimson-600" />
              Leads by source
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bySource}
                  layout="vertical"
                  margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
                >
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={104}
                    tick={{ fontSize: 11, fill: 'var(--lg-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(220, 38, 38, 0.06)' }}
                    formatter={(value: number) => [`${value} leads`, 'Leads']}
                    contentStyle={{
                      background: 'var(--lg-surface)',
                      border: '1px solid var(--lg-border)',
                      borderRadius: 10,
                      fontSize: 12,
                      color: 'var(--lg-text)',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                    {bySource.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={SOURCE_COLORS[index % SOURCE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <dl className="mt-4 space-y-2 border-t border-[var(--lg-border)] pt-4">
              {bySource.slice(0, 4).map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <dt className="text-[var(--lg-text-secondary)]">{entry.name}</dt>
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
