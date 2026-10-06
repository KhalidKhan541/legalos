'use client';

import { Fragment, useMemo, useState } from 'react';
import {
  CalendarClock,
  ChevronDown,
  ChevronRight,
  FileText,
  Gavel,
  Scale,
  Search,
  Timer,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
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
  MOCK_DOCUMENTS,
  MOCK_MATTERS,
  type Matter,
  type MatterStatus,
  type MatterType,
  type Priority,
} from '@/lib/mock-data';
import { cn, formatCurrency, formatDate, formatDuration } from '@/lib/utils';

/* ────────────────────────────────────────────────────────────
   Presentational maps
   ──────────────────────────────────────────────────────────── */

const STATUS_META: Record<
  MatterStatus,
  { label: string; variant: 'lg' | 'info' | 'danger' | 'default' | 'warning' }
> = {
  open: { label: 'Open', variant: 'lg' },
  discovery: { label: 'Discovery', variant: 'info' },
  trial: { label: 'Trial', variant: 'danger' },
  closed: { label: 'Closed', variant: 'default' },
  on_hold: { label: 'On Hold', variant: 'warning' },
};

const TYPE_META: Record<
  MatterType,
  { label: string; variant: 'danger' | 'info' | 'lg' | 'success' | 'warning' | 'secondary' }
> = {
  litigation: { label: 'Litigation', variant: 'danger' },
  transactional: { label: 'Transactional', variant: 'info' },
  'M&A': { label: 'M&A', variant: 'lg' },
  IP: { label: 'IP', variant: 'success' },
  employment: { label: 'Employment', variant: 'warning' },
  'real estate': { label: 'Real Estate', variant: 'secondary' },
};

const PRIORITY_META: Record<Priority, { label: string; variant: 'danger' | 'warning' | 'info' | 'default' }> = {
  critical: { label: 'Critical', variant: 'danger' },
  high: { label: 'High', variant: 'danger' },
  medium: { label: 'Medium', variant: 'info' },
  low: { label: 'Low', variant: 'default' },
};

const FUNNEL_STAGES: { status: MatterStatus; label: string; color: string }[] = [
  { status: 'open', label: 'Open', color: '#dc2626' },
  { status: 'discovery', label: 'Discovery', color: '#f59e0b' },
  { status: 'trial', label: 'Trial', color: '#b91c1c' },
  { status: 'on_hold', label: 'On Hold', color: '#64748b' },
  { status: 'closed', label: 'Closed', color: '#94a3b8' },
];

const COLUMN_COUNT = 9;
const TODAY = new Date();

/* ────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────── */

function daysUntil(value: string | null): number | null {
  if (!value) return null;
  const target = new Date(`${value}T23:59:59`);
  if (Number.isNaN(target.getTime())) return null;
  const diff = target.getTime() - TODAY.getTime();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

function retainerMeta(matter: Matter): { label: string; variant: 'success' | 'warning' | 'danger' | 'default' } {
  if (matter.retainer === 0) return { label: 'None', variant: 'default' };
  if (matter.retainerRemaining <= 0) return { label: 'Depleted', variant: 'danger' };
  if (matter.retainerRemaining < 5_000) return { label: 'Low', variant: 'warning' };
  return { label: 'Healthy', variant: 'success' };
}

function BudgetBar({ matter }: { matter: Matter }) {
  const pct = matter.budget > 0 ? Math.min(matter.spent / matter.budget, 1) : 0;
  const hoursBudget = matter.billingRate > 0 ? matter.budget / matter.billingRate : 0;
  const tone =
    pct >= 1 ? 'bg-red-500' : pct >= 0.85 ? 'bg-amber-500' : 'bg-crimson-600';

  return (
    <div className="min-w-[9rem]">
      <div className="flex items-baseline justify-between gap-2 text-[11px]">
        <span
          className={cn(
            'font-semibold tabular-nums',
            pct >= 0.85 ? 'text-crimson-600 dark:text-crimson-400' : 'text-[var(--lg-text)]'
          )}
        >
          {formatDuration(matter.billableHours)}
        </span>
        <span className="text-[var(--lg-text-muted)]">
          of {hoursBudget > 0 ? Math.round(hoursBudget) : 0}h
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--lg-surface-sunken)]">
        <div
          className={cn('h-full rounded-full transition-all', tone)}
          style={{ width: `${Math.round(pct * 100)}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-[var(--lg-text-muted)]">
        {formatCurrency(matter.spent, { cents: false })} /{' '}
        {formatCurrency(matter.budget, { cents: false })}
      </p>
    </div>
  );
}

function DeadlineCell({ matter }: { matter: Matter }) {
  const days = daysUntil(matter.nextDeadline);

  if (days === null) {
    return (
      <span className="text-xs text-[var(--lg-text-muted)]">—</span>
    );
  }

  const overdue = days < 0;
  const soon = days >= 0 && days <= 7;

  return (
    <div className="whitespace-nowrap">
      <p
        className={cn(
          'text-xs font-semibold tabular-nums',
          overdue
            ? 'text-red-600 dark:text-red-400'
            : soon
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-[var(--lg-text)]'
        )}
      >
        {overdue
          ? `${Math.abs(days)}d overdue`
          : days === 0
            ? 'Today'
            : `in ${days}d`}
      </p>
      <p className="text-[10px] text-[var(--lg-text-muted)]">
        {formatDate(matter.nextDeadline)}
      </p>
    </div>
  );
}

function DetailPanel({ matter }: { matter: Matter }) {
  const documents = MOCK_DOCUMENTS.filter((doc) => doc.matterId === matter.id).slice(0, 4);
  const retainer = retainerMeta(matter);

  return (
    <div className="grid gap-5 border-l-2 border-crimson-500/40 bg-[var(--lg-surface-muted)] px-5 py-5 md:grid-cols-3">
      {/* Team */}
      <section>
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
          <Users className="h-3.5 w-3.5" /> Team
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface)] p-3">
            <Avatar name={matter.leadAttorney} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[var(--lg-text)]">
                {matter.leadAttorney}
              </p>
              <p className="text-[11px] text-[var(--lg-text-muted)]">Lead attorney</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface)] p-3">
            <Avatar name={matter.paralegal} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[var(--lg-text)]">
                {matter.paralegal}
              </p>
              <p className="text-[11px] text-[var(--lg-text-muted)]">Paralegal</p>
            </div>
          </div>
          {matter.opposingCounsel && (
            <div className="rounded-lg border border-dashed border-[var(--lg-border)] p-3">
              <p className="text-[11px] uppercase tracking-wide text-[var(--lg-text-muted)]">
                Opposing counsel
              </p>
              <p className="mt-0.5 text-xs font-medium text-[var(--lg-text-secondary)]">
                {matter.opposingCounsel}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Key dates */}
      <section>
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
          <CalendarClock className="h-3.5 w-3.5" /> Key dates
        </p>
        <dl className="space-y-2 rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface)] p-3 text-xs">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[var(--lg-text-muted)]">Opened</dt>
            <dd className="font-medium text-[var(--lg-text)]">{formatDate(matter.opened)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[var(--lg-text-muted)]">Next deadline</dt>
            <dd className="font-medium text-[var(--lg-text)]">
              {matter.nextDeadline ? formatDate(matter.nextDeadline) : '—'}
            </dd>
          </div>
          {matter.deadlineLabel && (
            <div className="flex items-start justify-between gap-3">
              <dt className="text-[var(--lg-text-muted)]">Milestone</dt>
              <dd className="text-right font-medium text-[var(--lg-text-secondary)]">
                {matter.deadlineLabel}
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[var(--lg-text-muted)]">Last activity</dt>
            <dd className="font-medium text-[var(--lg-text)]">
              {formatDate(matter.lastActivity, 'MMM d, yyyy')}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[var(--lg-border-subtle)] pt-2">
            <dt className="text-[var(--lg-text-muted)]">Retainer</dt>
            <dd>
              <Badge variant={retainer.variant} size="sm">
                {retainer.label} · {formatCurrency(matter.retainerRemaining, { cents: false })}
              </Badge>
            </dd>
          </div>
        </dl>
        {matter.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {matter.tags.map((tag) => (
              <span key={tag} className="lg-chip">
                {tag}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Documents */}
      <section>
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
          <FileText className="h-3.5 w-3.5" /> Documents
        </p>
        {documents.length === 0 ? (
          <p className="text-xs text-[var(--lg-text-muted)]">No documents attached yet.</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-[var(--lg-text)]">
                    {doc.name}.{doc.extension.toLowerCase()}
                  </span>
                  <Badge
                    variant={
                      doc.status === 'filed'
                        ? 'lg'
                        : doc.status === 'final'
                          ? 'success'
                          : doc.status === 'review'
                            ? 'warning'
                            : 'default'
                    }
                    size="sm"
                  >
                    {doc.status}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-[var(--lg-text-muted)]">
                  {doc.author} · {doc.version} · {doc.size} · updated{' '}
                  {formatDate(doc.updatedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────── */

export default function MattersPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MatterType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | MatterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const matters = MOCK_MATTERS;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return matters.filter((matter) => {
      if (typeFilter !== 'all' && matter.type !== typeFilter) return false;
      if (statusFilter !== 'all' && matter.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && matter.priority !== priorityFilter) return false;
      if (!needle) return true;
      return (
        matter.number.toLowerCase().includes(needle) ||
        matter.title.toLowerCase().includes(needle) ||
        matter.clientName.toLowerCase().includes(needle) ||
        matter.leadAttorney.toLowerCase().includes(needle) ||
        (matter.practiceArea ?? '').toLowerCase().includes(needle)
      );
    });
  }, [matters, query, typeFilter, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
    const active = matters.filter(
      (matter) => matter.status === 'open' || matter.status === 'discovery'
    );
    const inTrial = matters.filter((matter) => matter.status === 'trial');
    const overdue = matters.filter((matter) => {
      const days = daysUntil(matter.nextDeadline);
      return matter.status !== 'closed' && days !== null && days < 0;
    });
    const totalBudget = matters.reduce((sum, matter) => sum + matter.budget, 0);
    return {
      open: active.length,
      inTrial: inTrial.length,
      overdue: overdue.length,
      totalBudget,
    };
  }, [matters]);

  const funnel = useMemo(
    () =>
      FUNNEL_STAGES.map((stage) => ({
        ...stage,
        value: matters.filter((matter) => matter.status === stage.status).length,
      })),
    [matters]
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-crimson-600 dark:text-crimson-400">
            Matters
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--lg-text)]">
            Matter Ledger
          </h1>
          <p className="mt-1 text-sm text-[var(--lg-text-muted)]">
            Every engagement with its stage, next deadline, budget burn and retainer position.
          </p>
        </div>
        <Button leftIcon={<Gavel className="h-4 w-4" />}>New matter</Button>
      </header>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Open matters"
          value={stats.open}
          icon={<Scale className="h-5 w-5" />}
          hint="Open + discovery stages"
        />
        <MetricCard
          title="In trial"
          value={stats.inTrial}
          icon={<Gavel className="h-5 w-5" />}
          iconTone="danger"
          hint="Actively before a tribunal"
        />
        <MetricCard
          title="Overdue deadlines"
          value={stats.overdue}
          icon={<CalendarClock className="h-5 w-5" />}
          iconTone={stats.overdue > 0 ? 'danger' : 'success'}
          hint="Past their next deadline"
          delta={stats.overdue > 0 ? 'Action needed' : 'All clear'}
          deltaTone={stats.overdue > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          title="Total budget"
          value={formatCurrency(stats.totalBudget, { cents: false, compact: true })}
          icon={<Wallet className="h-5 w-5" />}
          iconTone="info"
          hint="Combined matter budgets"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Table */}
        <Card>
          <CardHeader className="flex-col gap-3 sm:flex-row">
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-crimson-600" />
              All matters
              <span className="ml-1 text-xs font-normal text-[var(--lg-text-muted)]">
                {filtered.length} of {matters.length}
              </span>
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lg-text-muted)]" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search matter, client…"
                  aria-label="Search matters"
                  className="lg-input lg-input-sm w-52 pl-8"
                />
              </div>

              <select
                aria-label="Filter by matter type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as 'all' | MatterType)}
                className="lg-input lg-select h-9 w-auto text-sm"
              >
                <option value="all">All types</option>
                {(Object.keys(TYPE_META) as MatterType[]).map((type) => (
                  <option key={type} value={type}>
                    {TYPE_META[type].label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by matter status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | MatterStatus)
                }
                className="lg-input lg-select h-9 w-auto text-sm"
              >
                <option value="all">All statuses</option>
                {(Object.keys(STATUS_META) as MatterStatus[]).map((status) => (
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

          <CardContent>
            <div className="lg-table-wrapper">
              <table className="lg-table">
                <thead>
                  <tr>
                    <th scope="col">Matter</th>
                    <th scope="col">Type</th>
                    <th scope="col">Client</th>
                    <th scope="col">Lead</th>
                    <th scope="col">Status</th>
                    <th scope="col">Priority</th>
                    <th scope="col">Next deadline</th>
                    <th scope="col">Hours vs budget</th>
                    <th scope="col">Retainer</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={COLUMN_COUNT}>
                        <div className="lg-empty">
                          <p className="lg-empty-title">No matters match these filters</p>
                          <p className="lg-empty-description">
                            Try a broader search, or reset the type, status and priority
                            filters.
                          </p>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setQuery('');
                              setTypeFilter('all');
                              setStatusFilter('all');
                              setPriorityFilter('all');
                            }}
                          >
                            Reset filters
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {filtered.map((matter) => {
                    const expanded = expandedId === matter.id;
                    const status = STATUS_META[matter.status];
                    const type = TYPE_META[matter.type];
                    const priority = PRIORITY_META[matter.priority];
                    const retainer = retainerMeta(matter);

                    return (
                      <Fragment key={matter.id}>
                        <tr
                          className="cursor-pointer"
                          onClick={() => setExpandedId(expanded ? null : matter.id)}
                        >
                          <td className="lg-table-cell-primary">
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 text-[var(--lg-text-muted)]" aria-hidden="true">
                                {expanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </span>
                              <div className="min-w-0">
                                <p className="font-mono text-[11px] text-crimson-600 dark:text-crimson-400">
                                  {matter.number}
                                </p>
                                <p className="max-w-[22rem] truncate font-medium text-[var(--lg-text)]">
                                  {matter.title}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge variant={type.variant} size="sm">
                              {type.label}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap text-xs">
                            {matter.clientName}
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <Avatar name={matter.leadAttorney} size="xs" />
                              <span className="whitespace-nowrap text-xs">
                                {matter.leadAttorney.split(' ').slice(-1)[0]}
                              </span>
                            </div>
                          </td>
                          <td>
                            <Badge variant={status.variant} size="sm">
                              {status.label}
                            </Badge>
                          </td>
                          <td>
                            <Badge variant={priority.variant} size="sm" dot={matter.priority !== 'low'}>
                              {priority.label}
                            </Badge>
                          </td>
                          <td>
                            <DeadlineCell matter={matter} />
                          </td>
                          <td>
                            <BudgetBar matter={matter} />
                          </td>
                          <td>
                            <Badge variant={retainer.variant} size="sm">
                              {retainer.label}
                            </Badge>
                          </td>
                        </tr>

                        {expanded && (
                          <tr>
                            <td colSpan={COLUMN_COUNT} className="!p-0">
                              <DetailPanel matter={matter} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Stage funnel */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-crimson-600" />
              Stage funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={funnel}
                  layout="vertical"
                  margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
                >
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={80}
                    tick={{ fontSize: 11, fill: 'var(--lg-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(220, 38, 38, 0.06)' }}
                    formatter={(value: number) => [`${value} matters`, 'Matters']}
                    contentStyle={{
                      background: 'var(--lg-surface)',
                      border: '1px solid var(--lg-border)',
                      borderRadius: 10,
                      fontSize: 12,
                      color: 'var(--lg-text)',
                    }}
                  />
                  <ReferenceLine x={0} stroke="var(--lg-border)" />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                    {funnel.map((stage) => (
                      <Cell key={stage.status} fill={stage.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <ol className="mt-4 space-y-2 border-t border-[var(--lg-border)] pt-4">
              {funnel.map((stage, index) => (
                <li key={stage.status} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-[var(--lg-text-secondary)]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="tabular-nums text-[var(--lg-text-muted)]">
                      {index + 1}.
                    </span>
                    {stage.label}
                  </span>
                  <span className="font-semibold text-[var(--lg-text)]">{stage.value}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
