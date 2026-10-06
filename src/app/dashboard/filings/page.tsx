'use client';

import { Fragment, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Gavel,
  Search,
  Stamp,
  XCircle,
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
import { MOCK_FILINGS, type FilingStatus } from '@/lib/mock-data';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
/* ────────────────────────────────────────────────────────────
   Presentational maps
   ──────────────────────────────────────────────────────────── */

const STATUS_META: Record<
  FilingStatus,
  { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }
> = {
  draft: { label: 'Draft', variant: 'default' },
  filed: { label: 'Filed', variant: 'info' },
  served: { label: 'Served', variant: 'warning' },
  accepted: { label: 'Accepted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
};

const STATUS_ORDER: FilingStatus[] = ['draft', 'filed', 'served', 'accepted', 'rejected'];

const STATUS_COLORS: Record<FilingStatus, string> = {
  draft: '#94a3b8',
  filed: '#0ea5e9',
  served: '#f59e0b',
  accepted: '#16a34a',
  rejected: '#dc2626',
};

/** Filing type → chip tone. Unknown types fall back to `outline`. */
const TYPE_VARIANT: Record<string, 'lg' | 'info' | 'success' | 'warning' | 'danger'> = {
  Complaint: 'danger',
  Pleading: 'danger',
  Motion: 'lg',
  Subpoena: 'warning',
  'Trial Brief': 'lg',
  Notice: 'info',
  Petition: 'info',
  'Discovery Response': 'info',
  'Regulatory Response': 'warning',
  'Bankruptcy Filing': 'success',
  'USPTO Filing': 'success',
};

const COLUMN_COUNT = 9;

/* ────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────── */

/** Row + optional detail row, keyed at the fragment level. */
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <Fragment>{children}</Fragment>;
}

/** Expandable panel: service, clerk receipt, notes and deadline. */
function FilingDetail({ filingId }: { filingId: string }) {
  const filing = MOCK_FILINGS.find((entry) => entry.id === filingId);
  if (!filing) return null;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'Docket number', value: filing.docketNumber ?? '—' },
    { label: 'Pages', value: filing.pages },
    {
      label: 'Service method',
      value: filing.serviceMethod ?? '—',
    },
    {
      label: 'Fee',
      value: `${formatCurrency(filing.fee, { cents: false })} · ${filing.feePaid ? 'Paid' : 'Unpaid'}`,
    },
    {
      label: 'Clerk confirmation',
      value: filing.confirmationNumber ?? 'Pending',
    },
    {
      label: 'Filed date',
      value: filing.filedDate ? formatDate(filing.filedDate) : 'Not yet filed',
    },
    {
      label: 'Deadline',
      value: filing.deadline ? formatDate(filing.deadline) : '—',
    },
  ];

  return (
    <div className="grid gap-5 border-l-2 border-crimson-500/40 bg-[var(--lg-surface-muted)] px-5 py-5 md:grid-cols-3">
      <section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
          Filing details
        </p>
        <dl className="space-y-2 rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface)] p-3 text-xs">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3"
            >
              <dt className="text-[var(--lg-text-muted)]">{row.label}</dt>
              <dd className="truncate font-medium text-[var(--lg-text)]">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
          Court
        </p>
        <div className="rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface)] p-3 text-xs">
          <p className="font-medium text-[var(--lg-text)]">{filing.court}</p>
          <p className="mt-1 text-[var(--lg-text-muted)]">{filing.title}</p>
          <p className="mt-2 flex items-center gap-2 text-[var(--lg-text-secondary)]">
            <Avatar name={filing.filedBy} size="xs" />
            Filed by {filing.filedBy}
          </p>
        </div>
      </section>

      <section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
          Clerk notes
        </p>
        <p className="rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface)] p-3 text-xs leading-relaxed text-[var(--lg-text-secondary)]">
          {filing.notes || 'No notes recorded for this filing.'}
        </p>
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────── */

export default function FilingsPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FilingStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filings = MOCK_FILINGS;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return filings
      .filter((filing) => {
        if (statusFilter !== 'all' && filing.status !== statusFilter) return false;
        if (!needle) return true;
        return (
          filing.title.toLowerCase().includes(needle) ||
          filing.type.toLowerCase().includes(needle) ||
          filing.matterNumber.toLowerCase().includes(needle) ||
          filing.court.toLowerCase().includes(needle) ||
          (filing.docketNumber ?? '').toLowerCase().includes(needle) ||
          (filing.confirmationNumber ?? '').toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => {
        const aTime = a.filedDate ? +new Date(a.filedDate) : Number.MAX_SAFE_INTEGER;
        const bTime = b.filedDate ? +new Date(b.filedDate) : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });
  }, [filings, query, statusFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const filedThisMonth = filings.filter((filing) => {
      if (!filing.filedDate) return false;
      const date = new Date(filing.filedDate);
      return (
        date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      );
    }).length;
    const pending = filings.filter(
      (filing) => filing.status === 'draft' || filing.status === 'filed'
    ).length;
    const rejected = filings.filter((filing) => filing.status === 'rejected').length;
    const fees = filings
      .filter((filing) => filing.feePaid)
      .reduce((sum, filing) => sum + filing.fee, 0);
    return { filedThisMonth, pending, rejected, fees };
  }, [filings]);

  const byStatus = useMemo(
    () =>
      STATUS_ORDER.map((status) => ({
        status,
        name: STATUS_META[status].label,
        value: filings.filter((filing) => filing.status === status).length,
        color: STATUS_COLORS[status],
      })),
    [filings]
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-crimson-600 dark:text-crimson-400">
            Filings
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--lg-text)]">
            Filing Register
          </h1>
          <p className="mt-1 text-sm text-[var(--lg-text-muted)]">
            Every pleading, motion and subpoena with its court, fee, service status and clerk
            confirmation.
          </p>
        </div>
        <Button leftIcon={<FileCheck2 className="h-4 w-4" />}>New filing</Button>
      </header>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Filed this month"
          value={stats.filedThisMonth}
          icon={<FileCheck2 className="h-5 w-5" />}
          hint="Accepted into the record in the current month"
        />
        <MetricCard
          title="Pending"
          value={stats.pending}
          icon={<FileText className="h-5 w-5" />}
          iconTone="warning"
          hint="Drafts awaiting signature or e-file"
          delta="In progress"
          deltaTone="warning"
        />
        <MetricCard
          title="Rejected"
          value={stats.rejected}
          icon={<XCircle className="h-5 w-5" />}
          iconTone={stats.rejected > 0 ? 'danger' : 'success'}
          hint="Rejected by the clerk — refile required"
          delta={stats.rejected > 0 ? 'Needs action' : 'All clear'}
          deltaTone={stats.rejected > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          title="E-filing fees paid"
          value={formatCurrency(stats.fees, { cents: false })}
          icon={<CircleDollarSign className="h-5 w-5" />}
          iconTone="info"
          hint="Fees settled across the register"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Table */}
        <Card>
          <CardHeader className="flex-col gap-3 sm:flex-row">
            <CardTitle className="flex items-center gap-2">
              <Stamp className="h-4 w-4 text-crimson-600" />
              Filings
              <span className="ml-1 text-xs font-normal text-[var(--lg-text-muted)]">
                {filtered.length} of {filings.length}
              </span>
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lg-text-muted)]" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search filing, docket…"
                  aria-label="Search filings"
                  className="lg-input lg-input-sm w-56 pl-8"
                />
              </div>

              <select
                aria-label="Filter by filing status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | FilingStatus)
                }
                className="lg-input lg-select h-9 w-auto text-sm"
              >
                <option value="all">All statuses</option>
                {STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_META[status].label}
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
                    <th scope="col">Filing #</th>
                    <th scope="col">Matter</th>
                    <th scope="col">Type</th>
                    <th scope="col">Court</th>
                    <th scope="col">Filed</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="lg-table-align-right">
                      Fee
                    </th>
                    <th scope="col">Clerk confirmation</th>
                    <th scope="col">Filed by</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={COLUMN_COUNT}>
                        <div className="lg-empty">
                          <p className="lg-empty-title">No filings match these filters</p>
                          <p className="lg-empty-description">
                            Search by filing title, matter number, docket or clerk confirmation,
                            or reset the status filter.
                          </p>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setQuery('');
                              setStatusFilter('all');
                            }}
                          >
                            Reset filters
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {filtered.map((filing) => {
                    const expanded = expandedId === filing.id;
                    const status = STATUS_META[filing.status];
                    const typeVariant = TYPE_VARIANT[filing.type] ?? 'outline';
                    const filingRef = filing.id.replace(/^fl_/, 'FL-');
                    const overdue =
                      filing.deadline &&
                      filing.status !== 'accepted' &&
                      filing.status !== 'served' &&
                      new Date(filing.deadline).getTime() < Date.now();

                    return (
                      <FragmentRow key={filing.id}>
                        <tr
                          className="cursor-pointer"
                          onClick={() => setExpandedId(expanded ? null : filing.id)}
                        >
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--lg-text-muted)]" aria-hidden="true">
                                {expanded ? '▾' : '▸'}
                              </span>
                              <span className="font-mono text-xs font-semibold text-crimson-600 dark:text-crimson-400">
                                {filingRef}
                              </span>
                            </div>
                          </td>
                          <td>
                            <p className="font-mono text-[11px] text-[var(--lg-text-muted)]">
                              {filing.matterNumber}
                            </p>
                            <p className="max-w-[18rem] truncate text-xs font-medium text-[var(--lg-text)]">
                              {filing.title}
                            </p>
                          </td>
                          <td>
                            <Badge variant={typeVariant} size="sm">
                              {filing.type}
                            </Badge>
                          </td>
                          <td>
                            <p className="max-w-[14rem] truncate text-xs">{filing.court}</p>
                            {filing.docketNumber && (
                              <p className="truncate font-mono text-[11px] text-[var(--lg-text-muted)]">
                                {filing.docketNumber}
                              </p>
                            )}
                          </td>
                          <td className="whitespace-nowrap text-xs">
                            {filing.filedDate ? (
                              formatDate(filing.filedDate)
                            ) : (
                              <span className="text-[var(--lg-text-muted)]">
                                {filing.deadline
                                  ? `due ${formatDate(filing.deadline)}`
                                  : '—'}
                              </span>
                            )}
                            {overdue && (
                              <span className="block text-[10px] font-semibold uppercase text-red-600 dark:text-red-400">
                                Deadline passed
                              </span>
                            )}
                          </td>
                          <td>
                            <Badge variant={status.variant} size="sm" dot>
                              {status.label}
                            </Badge>
                          </td>
                          <td className="text-right">
                            <span className="font-semibold tabular-nums text-[var(--lg-text)]">
                              {filing.fee > 0 ? formatCurrency(filing.fee, { cents: false }) : '—'}
                            </span>
                            <span
                              className={cn(
                                'block text-[10px] font-medium',
                                filing.feePaid
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-[var(--lg-text-muted)]'
                              )}
                            >
                              {filing.fee > 0 ? (filing.feePaid ? 'Paid' : 'Unpaid') : ''}
                            </span>
                          </td>
                          <td>
                            {filing.confirmationNumber ? (
                              <span className="flex items-center gap-1.5 text-xs text-[var(--lg-text-secondary)]">
                                <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                                <span className="font-mono">{filing.confirmationNumber}</span>
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--lg-text-muted)]">
                                Pending
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <Avatar name={filing.filedBy} size="xs" />
                              <span className="whitespace-nowrap text-xs">
                                {filing.filedBy.split(' ').slice(-1)[0]}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {expanded && (
                          <tr>
                            <td colSpan={COLUMN_COUNT} className="!p-0">
                              <FilingDetail filingId={filing.id} />
                            </td>
                          </tr>
                        )}
                      </FragmentRow>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Status chart */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-crimson-600" />
              Status breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byStatus}
                  layout="vertical"
                  margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
                >
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={76}
                    tick={{ fontSize: 11, fill: 'var(--lg-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(220, 38, 38, 0.06)' }}
                    formatter={(value: number) => [`${value} filings`, 'Filings']}
                    contentStyle={{
                      background: 'var(--lg-surface)',
                      border: '1px solid var(--lg-border)',
                      borderRadius: 10,
                      fontSize: 12,
                      color: 'var(--lg-text)',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                    {byStatus.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <dl className="mt-4 space-y-2 border-t border-[var(--lg-border)] pt-4">
              {byStatus.map((entry) => (
                <div key={entry.status} className="flex items-center justify-between text-xs">
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
