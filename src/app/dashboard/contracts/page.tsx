'use client';

import { Fragment, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { differenceInCalendarDays } from 'date-fns';
import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  FileSignature,
  Handshake,
  PenLine,
  Scale,
  Search,
  ShieldAlert,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import {
  cn,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from '@/lib/utils';
import {
  MOCK_CONTRACTS,
  type Contract,
  type ContractStatus,
  type RiskLevel,
} from '@/lib/mock-data';

/* -------------------------------------------------------------------------- *
 * Display metadata
 * -------------------------------------------------------------------------- */

const STATUS_META: Record<
  ContractStatus,
  { label: string; badge: BadgeVariant; color: string }
> = {
  drafting: { label: 'Drafting', badge: 'secondary', color: '#64748b' },
  negotiating: { label: 'Negotiating', badge: 'warning', color: '#f59e0b' },
  executed: { label: 'Executed', badge: 'success', color: '#10b981' },
  expired: { label: 'Expired', badge: 'default', color: '#94a3b8' },
};

const RISK_META: Record<RiskLevel, { label: string; badge: BadgeVariant }> = {
  low: { label: 'Low', badge: 'success' },
  medium: { label: 'Medium', badge: 'warning' },
  high: { label: 'High', badge: 'danger' },
  critical: { label: 'Critical', badge: 'lg' },
};

const STATUS_OPTIONS: ContractStatus[] = ['drafting', 'negotiating', 'executed', 'expired'];
const RISK_OPTIONS: RiskLevel[] = ['low', 'medium', 'high', 'critical'];

const RENEWAL_WINDOW_DAYS = 90;

/* -------------------------------------------------------------------------- *
 * Date helpers (local-timezone safe for `YYYY-MM-DD` fixtures)
 * -------------------------------------------------------------------------- */

const parseDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

type Countdown = {
  label: string;
  days: number | null;
  tone: 'none' | 'past' | 'soon' | 'far';
};

/** Countdown to the renewal date, falling back to expiry for evergreen terms. */
function renewalCountdown(contract: Contract): Countdown {
  const target = contract.renewal ?? contract.expiry;
  if (!target) return { label: '—', days: null, tone: 'none' };

  const days = differenceInCalendarDays(parseDate(target), new Date());
  if (days < 0) return { label: `${Math.abs(days)}d ago`, days, tone: 'past' };
  if (days === 0) return { label: 'today', days, tone: 'soon' };
  return {
    label: `in ${days}d`,
    days,
    tone: days <= RENEWAL_WINDOW_DAYS ? 'soon' : 'far',
  };
}

const COUNTDOWN_TEXT: Record<Countdown['tone'], string> = {
  none: 'text-[var(--lg-text-muted)]',
  past: 'text-red-600 dark:text-red-400',
  soon: 'text-amber-600 dark:text-amber-400',
  far: 'text-[var(--lg-text-secondary)]',
};

type StatusFilter = ContractStatus | 'all';
type RiskFilter = RiskLevel | 'all';

/* -------------------------------------------------------------------------- *
 * Page
 * -------------------------------------------------------------------------- */

export default function ContractsPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [risk, setRisk] = useState<RiskFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const contracts = MOCK_CONTRACTS;

  const typeOptions = useMemo(
    () => Array.from(new Set(contracts.map((c) => c.type))).sort(),
    [contracts]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contracts.filter((contract) => {
      if (type !== 'all' && contract.type !== type) return false;
      if (status !== 'all' && contract.status !== status) return false;
      if (risk !== 'all' && contract.risk !== risk) return false;
      if (!q) return true;
      return [contract.title, contract.counterparty, contract.owner, contract.governingLaw]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [contracts, query, type, status, risk]);

  const stats = useMemo(() => {
    const activeValue = contracts
      .filter((c) => c.status !== 'expired')
      .reduce((sum, c) => sum + c.value, 0);
    const pendingSignature = contracts.filter(
      (c) => c.status === 'drafting' || c.status === 'negotiating'
    ).length;
    const renewingSoon = contracts.filter((c) => {
      const countdown = renewalCountdown(c);
      return countdown.days !== null && countdown.days >= 0 && countdown.days <= RENEWAL_WINDOW_DAYS;
    }).length;
    const highRisk = contracts.filter(
      (c) => c.risk === 'high' || c.risk === 'critical'
    ).length;
    return { activeValue, pendingSignature, renewingSoon, highRisk };
  }, [contracts]);

  const statusBreakdown = useMemo(
    () =>
      STATUS_OPTIONS.map((s) => ({
        name: STATUS_META[s].label,
        value: contracts.filter((c) => c.status === s).length,
        color: STATUS_META[s].color,
      })),
    [contracts]
  );

  const toggleRow = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-6">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--lg-text)]">
            Contracts
          </h1>
          <p className="mt-1 text-sm text-[var(--lg-text-muted)]">
            Track counterparty agreements from first draft through execution and renewal.
          </p>
        </div>
        <Button
          leftIcon={<FileSignature className="h-4 w-4" />}
          onClick={() =>
            toast.success('New contract started — draft added to the pipeline.')
          }
        >
          New contract
        </Button>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active contract value"
          value={formatCurrency(stats.activeValue, { cents: false, compact: true })}
          hint="Drafting, negotiating and executed"
          icon={<Handshake className="h-5 w-5" />}
          change={8.2}
          changeLabel="vs last quarter"
        />
        <MetricCard
          title="Pending signature"
          value={formatNumber(stats.pendingSignature)}
          hint="Not yet executed"
          icon={<PenLine className="h-5 w-5" />}
          iconTone="warning"
          delta={`${contracts.filter((c) => c.status === 'negotiating').length} in negotiation`}
          deltaTone="warning"
        />
        <MetricCard
          title="Renewing soon"
          value={formatNumber(stats.renewingSoon)}
          hint={`Next ${RENEWAL_WINDOW_DAYS} days`}
          icon={<CalendarClock className="h-5 w-5" />}
          iconTone="info"
          delta="Check notice periods"
          deltaTone="info"
        />
        <MetricCard
          title="High risk"
          value={formatNumber(stats.highRisk)}
          hint="High or critical exposure"
          icon={<ShieldAlert className="h-5 w-5" />}
          iconTone="danger"
          delta={`${formatPercent(stats.highRisk / Math.max(contracts.length, 1), {
            decimals: 0,
          })} of portfolio`}
          deltaTone="danger"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ── Table ────────────────────────────────────────────────────── */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Contract pipeline</CardTitle>
              <p className="mt-1 text-xs text-[var(--lg-text-muted)]">
                {filtered.length} of {contracts.length} contracts
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-52 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lg-text-muted)]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search contracts…"
                  aria-label="Search contracts"
                  className="lg-input lg-input-sm pl-9"
                />
              </div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                aria-label="Filter by contract type"
                className="lg-input lg-input-sm lg-select w-auto"
              >
                <option value="all">All types</option>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                aria-label="Filter by status"
                className="lg-input lg-input-sm lg-select w-auto"
              >
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
              <select
                value={risk}
                onChange={(e) => setRisk(e.target.value as RiskFilter)}
                aria-label="Filter by risk level"
                className="lg-input lg-input-sm lg-select w-auto"
              >
                <option value="all">All risk levels</option>
                {RISK_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {RISK_META[r].label}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="lg-empty">
                <Scale className="h-8 w-8 opacity-60" />
                <p className="lg-empty-title">No contracts match those filters</p>
                <p className="lg-empty-description">
                  Widen the search, or reset the type, status and risk filters.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery('');
                    setType('all');
                    setStatus('all');
                    setRisk('all');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="lg-table-wrapper !rounded-none !border-0">
                <table className="lg-table">
                  <thead>
                    <tr>
                      <th scope="col">Contract</th>
                      <th scope="col">Counterparty</th>
                      <th scope="col">Type</th>
                      <th scope="col" className="lg-table-align-right">
                        Value
                      </th>
                      <th scope="col">Status</th>
                      <th scope="col">Risk</th>
                      <th scope="col">Renewal</th>
                      <th scope="col">Owner</th>
                      <th scope="col" className="lg-table-align-right">
                        <span className="sr-only">Clause review</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((contract) => {
                      const isOpen = expandedId === contract.id;
                      const countdown = renewalCountdown(contract);
                      return (
                        <Fragment key={contract.id}>
                          <tr
                            onClick={() => toggleRow(contract.id)}
                            className={cn('cursor-pointer', isOpen && 'bg-[var(--lg-surface-muted)]')}
                          >
                            <td className="lg-table-cell-primary max-w-[17rem]">
                              <div className="flex items-start gap-2">
                                <FileSignature className="mt-0.5 h-4 w-4 shrink-0 text-crimson-600" />
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-[var(--lg-text)]">
                                    {contract.title}
                                  </p>
                                  <p className="mt-0.5 truncate text-xs text-[var(--lg-text-muted)]">
                                    {contract.governingLaw} law
                                    {contract.autoRenew ? ' · auto-renews' : ''}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="max-w-[12rem] truncate">{contract.counterparty}</td>
                            <td>
                              <Badge variant="secondary" size="sm">
                                {contract.type}
                              </Badge>
                            </td>
                            <td className="whitespace-nowrap text-right font-medium text-[var(--lg-text)] lg-tabular">
                              {contract.value > 0
                                ? formatCurrency(contract.value, {
                                    currency: contract.currency,
                                    cents: false,
                                    compact: contract.value >= 1_000_000,
                                  })
                                : '—'}
                            </td>
                            <td>
                              <Badge variant={STATUS_META[contract.status].badge} dot size="sm">
                                {STATUS_META[contract.status].label}
                              </Badge>
                            </td>
                            <td>
                              <Badge variant={RISK_META[contract.risk].badge} size="sm">
                                {RISK_META[contract.risk].label}
                              </Badge>
                            </td>
                            <td className={cn('whitespace-nowrap lg-tabular', COUNTDOWN_TEXT[countdown.tone])}>
                              {countdown.label}
                            </td>
                            <td className="whitespace-nowrap">{contract.owner}</td>
                            <td className="lg-table-align-right">
                              <button
                                type="button"
                                aria-expanded={isOpen}
                                aria-label={`${isOpen ? 'Collapse' : 'Expand'} clause review for ${contract.title}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRow(contract.id);
                                }}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--lg-text-muted)] transition-colors hover:bg-[var(--lg-surface-sunken)] hover:text-[var(--lg-text)]"
                              >
                                <ChevronRight
                                  className={cn(
                                    'h-4 w-4 transition-transform duration-200',
                                    isOpen && 'rotate-90 text-crimson-600'
                                  )}
                                />
                              </button>
                            </td>
                          </tr>

                          {isOpen && (
                            <tr className="bg-[var(--lg-surface-muted)]">
                              <td colSpan={9} className="!p-0">
                                <ClauseReview contract={contract} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Status bar chart ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by status</CardTitle>
            <Badge variant="outline" size="sm">
              {contracts.length} total
            </Badge>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusBreakdown}
                  margin={{ top: 8, right: 8, left: -18, bottom: 4 }}
                  barSize={34}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--lg-border)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'var(--lg-text-muted)' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--lg-border)' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: 'var(--lg-text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--lg-surface-muted)' }}
                    contentStyle={{
                      background: 'var(--lg-surface)',
                      border: '1px solid var(--lg-border)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" name="Contracts" radius={[6, 6, 0, 0]}>
                    {statusBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-3">
              {statusBreakdown.map((entry) => {
                const share = entry.value / Math.max(contracts.length, 1);
                return (
                  <div key={entry.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--lg-text-secondary)]">{entry.name}</span>
                      <span className="font-semibold text-[var(--lg-text)] lg-tabular">
                        {entry.value} · {formatPercent(share, { decimals: 0 })}
                      </span>
                    </div>
                    <div className="lg-progress">
                      <div
                        className="lg-progress-bar"
                        style={{ width: `${Math.round(share * 100)}%`, backgroundColor: entry.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- *
 * Expandable clause-review panel
 * -------------------------------------------------------------------------- */

function ClauseReview({ contract }: { contract: Contract }) {
  const countdown = renewalCountdown(contract);

  return (
    <div className="grid gap-6 border-t border-[var(--lg-border)] p-5 md:grid-cols-3">
      {/* Review progress */}
      <div className="md:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_META[contract.status].badge} size="sm">
              {STATUS_META[contract.status].label}
            </Badge>
            <Badge variant={RISK_META[contract.risk].badge} size="sm">
              {RISK_META[contract.risk].label} risk
            </Badge>
            <Badge variant="outline" size="sm">
              {contract.type}
            </Badge>
          </div>
          <span className="text-xs text-[var(--lg-text-muted)]">
            Last reviewed {formatDate(contract.lastReviewed)}
          </span>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--lg-text-secondary)]">
              Clause review progress
            </span>
            <span className="font-semibold text-[var(--lg-text)] lg-tabular">
              {contract.progress}%
            </span>
          </div>
          <div className="lg-progress">
            <div
              className="lg-progress-bar"
              style={{ width: `${contract.progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Detail label="Open clauses" value={`${contract.openClauses} open`} />
          <Detail
            label="Governing law"
            value={contract.governingLaw}
          />
          <Detail
            label="Notice period"
            value={contract.noticePeriodDays > 0 ? `${contract.noticePeriodDays} days` : 'None'}
          />
          <Detail
            label="Auto-renewal"
            value={contract.autoRenew ? 'Yes' : 'No'}
          />
        </div>

        <div className="mt-4 rounded-xl border border-[var(--lg-border)] bg-[var(--lg-surface)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
            Reviewer notes
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--lg-text-secondary)]">
            {contract.notes}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() =>
              toast.success(`Clause review started — “${contract.title}”.`)
            }
          >
            Start clause review
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              toast.success(`Reminder set — ${contract.noticePeriodDays || 30}-day notice window.`)
            }
          >
            Set renewal reminder
          </Button>
        </div>
      </div>

      {/* Key dates */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
          Key dates
        </p>
        <Detail label="Started" value={formatDate(contract.started)} />
        <Detail
          label="Executed"
          value={contract.executed ? formatDate(contract.executed) : 'Not executed'}
        />
        <Detail
          label={contract.renewal ? 'Renewal' : 'Expires'}
          value={
            contract.renewal || contract.expiry
              ? `${formatDate(contract.renewal ?? contract.expiry)} · ${countdown.label}`
              : '—'
          }
          tone={COUNTDOWN_TEXT[countdown.tone]}
        />
        <Detail
          label="Expiry"
          value={contract.expiry ? formatDate(contract.expiry) : 'Rolling'}
        />
        <Detail
          label="Contract value"
          value={
            contract.value > 0
              ? formatCurrency(contract.value, { currency: contract.currency, cents: false })
              : '—'
          }
        />
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {contract.noticePeriodDays > 0
              ? `Non-renewal notice due ${contract.noticePeriodDays} days before the renewal date.`
              : 'No notice period — agreement rolls to expiry.'}
          </span>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-xs uppercase tracking-wider text-[var(--lg-text-muted)]">
        {label}
      </span>
      <span className={cn('text-right text-[var(--lg-text-secondary)]', tone)}>{value}</span>
    </div>
  );
}
