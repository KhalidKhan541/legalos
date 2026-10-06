'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Landmark,
  Scale,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';

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
  MOCK_INVOICES,
  MOCK_MATTERS,
  MOCK_SETTINGS,
  MOCK_TRUST_ACCOUNTS,
  type TrustAccount,
} from '@/lib/mock-data';
import { cn, formatCurrency, formatDate, formatRelative } from '@/lib/utils';

/* ── date helpers (fixture-safe, local timezone) ───────────────── */

const DAY_MS = 86_400_000;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

/** Parse `YYYY-MM-DD` as a local date (avoids the UTC-midnight shift). */
const parseDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/* ── ledger model ──────────────────────────────────────────────── */

type LedgerType = 'deposit' | 'withdrawal' | 'disbursement';

type LedgerRow = {
  id: string;
  date: string;
  type: LedgerType;
  description: string;
  amount: number;
  /** Running balance *after* this row (computed oldest → newest). */
  running: number;
};

const LEDGER_META: Record<LedgerType, { label: string; variant: BadgeVariant }> = {
  deposit: { label: 'Deposit', variant: 'success' },
  withdrawal: { label: 'Withdrawal', variant: 'warning' },
  disbursement: { label: 'Disbursement', variant: 'info' },
};

/**
 * Derives a client ledger from the account fixture: retainer receipts become
 * deposits, invoices carrying `trustApplied` become disbursements and the
 * remaining drawdown (`retainerUsed`) is the fee withdrawal. The running
 * balance always lands on `account.balance`.
 */
function buildLedger(account: TrustAccount): LedgerRow[] {
  const deposits: LedgerRow[] = account.retainers.map((retainer) => ({
    id: retainer.id,
    date: retainer.depositedAt,
    type: 'deposit' as const,
    description: retainer.label,
    amount: retainer.amount,
    running: 0,
  }));

  const disbursements: LedgerRow[] = MOCK_INVOICES.filter(
    (invoice) => invoice.matterId === account.matterId && invoice.trustApplied > 0
  ).map((invoice) => ({
    id: `${account.id}-${invoice.id}`,
    date: invoice.dueDate,
    type: 'disbursement' as const,
    description: `Applied to invoice ${invoice.number}`,
    amount: invoice.trustApplied,
    running: 0,
  }));

  const applied = disbursements.reduce((sum, row) => sum + row.amount, 0);
  const withdrawal = round2(account.retainerUsed - applied);
  const rows: LedgerRow[] = [...deposits, ...disbursements];

  if (withdrawal > 0) {
    rows.push({
      id: `${account.id}-wd`,
      date: account.lastActivity.slice(0, 10),
      type: 'withdrawal',
      description: 'Earned fees & advanced costs released to operating',
      amount: withdrawal,
      running: 0,
    });
  }

  // Oldest → newest while accumulating the running balance.
  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  let balance = 0;
  rows.forEach((row) => {
    balance = round2(balance + (row.type === 'deposit' ? row.amount : -row.amount));
    row.running = balance;
  });

  return rows.reverse();
}

function ChartTooltip(props: any) {
  const { active, payload, label } = props ?? {};
  if (!active || !payload?.length) return null;
  const currency = payload[0]?.payload?.currency ?? 'USD';

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
          {item.name}: {formatCurrency(Number(item.value), { currency })}
        </p>
      ))}
    </div>
  );
}

export default function TrustPage() {
  const [accounts, setAccounts] = useState<TrustAccount[]>(MOCK_TRUST_ACCOUNTS);
  const [query, setQuery] = useState('');
  const [reconFilter, setReconFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const todayIso = toIso(today);

  /* ── derived stats ─────────────────────────────────────────── */

  const usdBalance = accounts
    .filter((account) => account.currency === 'USD')
    .reduce((sum, account) => sum + account.balance, 0);
  const foreignAccounts = accounts.filter((account) => account.currency !== 'USD');
  const foreignBalance = foreignAccounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );
  const foreignCurrency = foreignAccounts[0]?.currency ?? 'USD';

  const activeRetainers = accounts.reduce(
    (sum, account) => sum + account.retainers.filter((r) => !r.appliedTo).length,
    0
  );
  const retainersValue = accounts.reduce(
    (sum, account) =>
      sum + account.retainers.filter((r) => !r.appliedTo).reduce((s, r) => s + r.amount, 0),
    0
  );

  const pendingAccounts = accounts.filter((account) => account.status === 'pending');
  const pendingValue = pendingAccounts.reduce((sum, account) => sum + account.balance, 0);

  const outOfBalance = accounts.filter((account) => !account.reconciled);
  const reconciledCount = accounts.length - outOfBalance.length;

  /* ── trust balance trend (6 months, derived from the fixture) ─ */

  const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    const cutoff =
      index === 5
        ? today.getTime()
        : new Date(
            today.getFullYear(),
            today.getMonth() - (5 - index) + 1,
            0
          ).getTime();

    const balance = accounts.reduce((sum, account) => {
      const depositTimes = account.retainers.map((r) => parseDate(r.depositedAt).getTime());
      const firstDeposit = depositTimes.length ? Math.min(...depositTimes) : cutoff;
      const lastActivity = new Date(account.lastActivity).getTime() || cutoff;
      const span = Math.max(DAY_MS, lastActivity - firstDeposit);

      const deposits = account.retainers
        .filter((r) => parseDate(r.depositedAt).getTime() <= cutoff)
        .reduce((s, r) => s + r.amount, 0);
      const elapsed = Math.min(1, Math.max(0, (cutoff - firstDeposit) / span));
      const drawdown = account.retainerUsed * elapsed;

      return sum + Math.max(0, deposits - drawdown);
    }, 0);

    return {
      month: formatDate(monthDate, 'MMM'),
      balance: round2(balance),
      currency: 'USD',
    };
  });

  /* ── reconciliation checklist ──────────────────────────────── */

  const cycleStart = new Date(today.getFullYear(), today.getMonth(), 1); // 1st of this month
  const previousCycleEnd = new Date(today.getFullYear(), today.getMonth(), 0); // last day of prev month
  const statementCutoff = previousCycleEnd.getTime();

  // Firm policy: reconcile by the configured day of the month.
  let nextDue = new Date(
    today.getFullYear(),
    today.getMonth(),
    MOCK_SETTINGS.trust.reconciliationDayOfMonth
  );
  if (nextDue.getTime() < today.getTime()) {
    nextDue = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      MOCK_SETTINGS.trust.reconciliationDayOfMonth
    );
  }

  const checklist = [
    {
      label: 'Bank statements obtained through the last cycle',
      done: accounts.filter(
        (account) => parseDate(account.lastReconciled).getTime() >= statementCutoff
      ).length,
      total: accounts.length,
      note: `Through ${formatDate(previousCycleEnd)}`,
    },
    {
      label: 'Book balance agrees to the bank statement',
      done: reconciledCount,
      total: accounts.length,
      note: 'Ledger ↔ bank tie-out',
    },
    {
      label: 'Three-way match signed off (bank ↔ book ↔ client ledger)',
      done: accounts.filter(
        (account) =>
          account.reconciled && parseDate(account.lastReconciled).getTime() >= statementCutoff
      ).length,
      total: accounts.length,
      note: MOCK_SETTINGS.trust.threeWayMatch ? 'Required by firm policy' : 'Optional',
    },
    {
      label: 'Pending deposits cleared before release',
      done: accounts.length - pendingAccounts.length,
      total: accounts.length,
      note: `${pendingAccounts.length} awaiting bank clearance`,
    },
    {
      label: 'IOLTA-eligible ledgers reviewed this cycle',
      done: accounts.filter((a) => a.ioltaEligible && a.reconciled).length,
      total: accounts.filter((a) => a.ioltaEligible).length,
      note: MOCK_SETTINGS.trust.ioltaEnabled ? 'IOLTA enabled' : 'IOLTA disabled',
    },
  ];

  /* ── filtering ─────────────────────────────────────────────── */

  const filtered = accounts
    .filter((account) => {
      const needle = query.trim().toLowerCase();
      if (needle) {
        const haystack = [
          account.accountName,
          account.clientName,
          account.matterNumber,
          account.bank,
          account.notes,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (reconFilter === 'reconciled' && !account.reconciled) return false;
      if (reconFilter === 'out' && account.reconciled) return false;
      if (healthFilter !== 'all' && account.status !== healthFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.reconciled !== b.reconciled) return a.reconciled ? 1 : -1;
      return b.balance - a.balance;
    });

  const hasFilters =
    query.trim() !== '' || reconFilter !== 'all' || healthFilter !== 'all';

  const clearFilters = () => {
    setQuery('');
    setReconFilter('all');
    setHealthFilter('all');
  };

  const reconcile = (account: TrustAccount) => {
    setAccounts((prev) =>
      prev.map((row) =>
        row.id === account.id ? { ...row, reconciled: true, lastReconciled: todayIso } : row
      )
    );
    toast.success(
      `Three-way reconciliation recorded for ${account.accountName} — bank, book and client ledger now match.`
    );
  };

  const HEALTH_META: Record<TrustAccount['status'], { label: string; variant: BadgeVariant }> =
    {
      healthy: { label: 'Healthy', variant: 'success' },
      low: { label: 'Low balance', variant: 'warning' },
      depleted: { label: 'Depleted', variant: 'danger' },
      pending: { label: 'Pending', variant: 'info' },
    };

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--lg-text)]">
            Trust accounting
          </h1>
          <p className="mt-1 text-sm text-[var(--lg-text-muted)]">
            Client retainers, IOLTA ledgers and the monthly three-way reconciliation.
          </p>
        </div>

        <Badge variant={outOfBalance.length > 0 ? 'danger' : 'success'} size="lg" dot>
          {outOfBalance.length > 0
            ? `${outOfBalance.length} out of balance`
            : 'All ledgers reconciled'}
        </Badge>
      </div>

      {/* ── Compliance banner ─────────────────────────────────── */}
      <Card variant="gradient" className="p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-base font-semibold tracking-tight">
                IOLTA &amp; client trust rules
              </h2>
            </div>
            <ul className="mt-3 grid gap-2 text-sm text-white/85 sm:grid-cols-2">
              <li className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/70" />
                Client funds stay in segregated trust/IOLTA ledgers — never commingled
                with operating cash.
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/70" />
                Three-way reconciliation due by the{' '}
                {MOCK_SETTINGS.trust.reconciliationDayOfMonth}
                {MOCK_SETTINGS.trust.reconciliationDayOfMonth === 1 ? 'st' : 'th'} of
                every month ({formatDate(cycleStart, 'MMMM yyyy')} cycle).
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/70" />
                No withdrawal until fees are earned — unearned retainers remain in
                trust until billed.
              </li>
              <li className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/70" />
                Low-balance alerts fire below{' '}
                {formatCurrency(MOCK_SETTINGS.trust.lowBalanceThreshold, { cents: false })};
                overdraft monitoring is{' '}
                {MOCK_SETTINGS.trust.overdraftAlerts ? 'on' : 'off'}.
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-white/25 bg-white/10 p-4 lg:min-w-[18rem]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/75">
              Compliance status
            </p>
            {outOfBalance.length > 0 ? (
              <p className="mt-1.5 flex items-start gap-2 text-sm text-white">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {outOfBalance.map((account) => account.accountName).join(', ')}{' '}
                  {outOfBalance.length === 1 ? 'is' : 'are'} out of balance — last
                  reconciled{' '}
                  {formatDate(
                    outOfBalance.reduce((oldest, account) =>
                      account.lastReconciled < oldest.lastReconciled ? account : oldest
                    ).lastReconciled
                  )}
                  .
                </span>
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-white">
                Every ledger ties out to bank and book this cycle.
              </p>
            )}
            <p className="mt-2 text-xs text-white/70">
              Next reconciliation due {formatDate(nextDue, 'MMM d, yyyy')} ·{' '}
              {reconciledCount}/{accounts.length} ledgers signed off
            </p>
          </div>
        </div>
      </Card>

      {/* ── Stat cards ────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total trust balance"
          value={formatCurrency(usdBalance)}
          subvalue={
            foreignBalance > 0
              ? `+ ${formatCurrency(foreignBalance, { currency: foreignCurrency })}`
              : undefined
          }
          hint={`${accounts.length} client ledgers held across ${new Set(accounts.map((a) => a.bank)).size} banks`}
          icon={<Landmark className="h-5 w-5" />}
        />
        <MetricCard
          title="Retainers held"
          value={formatCurrency(retainersValue)}
          hint={`${activeRetainers} unapplied retainer deposits on file`}
          iconTone="success"
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          title="Pending withdrawals"
          value={formatCurrency(pendingValue)}
          hint={`${pendingAccounts.length} account${
            pendingAccounts.length === 1 ? '' : 's'
          } awaiting bank clearance before release`}
          iconTone={pendingAccounts.length > 0 ? 'warning' : 'neutral'}
          icon={<Scale className="h-5 w-5" />}
        />
        <MetricCard
          title="Trust accounts"
          value={String(accounts.length)}
          subvalue={`${reconciledCount}/${accounts.length} reconciled`}
          hint={`Reconciliation runs on the ${MOCK_SETTINGS.trust.reconciliationDayOfMonth}th`}
          iconTone={outOfBalance.length > 0 ? 'danger' : 'success'}
          icon={<ShieldCheck className="h-5 w-5" />}
        />
      </div>

      {/* ── Filters + table ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Trust ledgers</CardTitle>
            <CardDescription className="mt-1">
              {filtered.length} of {accounts.length} accounts shown
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
                aria-label="Search trust accounts"
                className="lg-input lg-input-sm pl-9"
                placeholder="Search client, account, matter…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <select
              aria-label="Filter by reconciliation status"
              className="lg-input lg-select lg-input-sm"
              value={reconFilter}
              onChange={(event) => setReconFilter(event.target.value)}
            >
              <option value="all">All reconciliation states</option>
              <option value="reconciled">Reconciled</option>
              <option value="out">Out of balance</option>
            </select>

            <select
              aria-label="Filter by account health"
              className="lg-input lg-select lg-input-sm"
              value={healthFilter}
              onChange={(event) => setHealthFilter(event.target.value)}
            >
              <option value="all">All health states</option>
              <option value="healthy">Healthy</option>
              <option value="low">Low balance</option>
              <option value="depleted">Depleted</option>
              <option value="pending">Pending</option>
            </select>

            <div className="flex items-center text-xs text-[var(--lg-text-muted)]">
              {outOfBalance.length > 0 ? (
                <span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {outOfBalance.length} ledger
                    {outOfBalance.length === 1 ? '' : 's'} out of balance
                  </span>{' '}
                  — three-way match required
                </span>
              ) : (
                <span>Three-way match clean across every ledger.</span>
              )}
            </div>
          </div>

          <div className="lg-table-wrapper">
            <table className="lg-table">
              <thead>
                <tr>
                  <th aria-label="Expand" />
                  <th>Account / client</th>
                  <th>Matter</th>
                  <th className="lg-table-align-right">Trust balance</th>
                  <th className="lg-table-align-right">Active retainers</th>
                  <th>Last activity</th>
                  <th>Three-way match</th>
                  <th className="lg-table-align-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((account) => {
                  const expanded = expandedId === account.id;
                  const matter = MOCK_MATTERS.find((m) => m.id === account.matterId);
                  const health = HEALTH_META[account.status];
                  const active = account.retainers.filter((r) => !r.appliedTo);
                  const ledger = expanded ? buildLedger(account) : [];

                  return [
                    <tr
                      key={account.id}
                      className={cn(expanded && 'bg-[var(--lg-surface-muted)]')}
                    >
                      <td className="w-8 pr-0">
                        <button
                          type="button"
                          aria-label={expanded ? 'Collapse ledger' : 'Expand ledger'}
                          aria-expanded={expanded}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--lg-text-muted)] transition-colors hover:bg-[var(--lg-surface-sunken)] hover:text-[var(--lg-text)]"
                          onClick={() => setExpandedId(expanded ? null : account.id)}
                        >
                          {expanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td>
                        <p className="text-[var(--lg-text)]">{account.accountName}</p>
                        <p className="text-xs text-[var(--lg-text-muted)]">
                          {account.clientName} · {account.bank}
                        </p>
                      </td>
                      <td>
                        <p className="font-mono text-[11px] text-[var(--lg-text-muted)]">
                          {account.matterNumber}
                        </p>
                        <p className="max-w-[16rem] truncate text-[var(--lg-text)]">
                          {matter?.title ?? 'Linked matter'}
                        </p>
                      </td>
                      <td className="whitespace-nowrap text-right font-medium tabular-nums text-[var(--lg-text)]">
                        {formatCurrency(account.balance, { currency: account.currency })}
                        <p className="text-[11px] font-normal text-[var(--lg-text-muted)]">
                          {account.currency}
                        </p>
                      </td>
                      <td className="whitespace-nowrap text-right tabular-nums">
                        <span className="text-[var(--lg-text)]">{active.length}</span>
                        <p className="text-[11px] text-[var(--lg-text-muted)]">
                          {formatCurrency(
                            active.reduce((sum, r) => sum + r.amount, 0),
                            { currency: account.currency, cents: false }
                          )}
                        </p>
                      </td>
                      <td className="whitespace-nowrap">
                        <p className="text-[var(--lg-text)]">
                          {formatDate(account.lastActivity)}
                        </p>
                        <p className="text-[11px] text-[var(--lg-text-muted)]">
                          {formatRelative(account.lastActivity)}
                        </p>
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant={account.reconciled ? 'success' : 'danger'}
                            size="sm"
                            dot
                          >
                            {account.reconciled ? 'Reconciled' : 'Out of Balance'}
                          </Badge>
                          <Badge variant={health.variant} size="sm">
                            {health.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="text-right">
                        {account.reconciled ? (
                          <span className="text-xs text-[var(--lg-text-muted)]">
                            {formatDate(account.lastReconciled)}
                          </span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => reconcile(account)}
                          >
                            Reconcile
                          </Button>
                        )}
                      </td>
                    </tr>,

                    expanded ? (
                      <tr key={`${account.id}-ledger`} className="bg-[var(--lg-surface-muted)]">
                        <td colSpan={8} className="!py-4">
                          <div className="rounded-xl border border-[var(--lg-border)] bg-[var(--lg-surface)] p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-[var(--lg-text)]">
                                  Client ledger — {account.accountName}
                                </p>
                                <p className="text-xs text-[var(--lg-text-muted)]">
                                  Last reconciled {formatDate(account.lastReconciled)} ·{' '}
                                  {account.notes || 'No reconciliation notes on file.'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[var(--lg-text-muted)]">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                  Deposit
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                                  Withdrawal
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                                  Disbursement
                                </span>
                              </div>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="lg-table lg-table-compact">
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th className="lg-table-align-right">Amount</th>
                                    <th className="lg-table-align-right">
                                      Running balance
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ledger.map((row) => (
                                    <tr key={row.id}>
                                      <td className="whitespace-nowrap">
                                        {formatDate(row.date)}
                                      </td>
                                      <td>
                                        <Badge
                                          variant={LEDGER_META[row.type].variant}
                                          size="sm"
                                        >
                                          {LEDGER_META[row.type].label}
                                        </Badge>
                                      </td>
                                      <td className="lg-table-cell-primary">
                                        {row.description}
                                      </td>
                                      <td
                                        className={cn(
                                          'whitespace-nowrap text-right tabular-nums font-medium',
                                          row.type === 'deposit'
                                            ? 'text-emerald-600 dark:text-emerald-300'
                                            : 'text-[var(--lg-text)]'
                                        )}
                                      >
                                        {row.type === 'deposit' ? '+' : '−'}
                                        {formatCurrency(row.amount, {
                                          currency: account.currency,
                                        })}
                                      </td>
                                      <td className="whitespace-nowrap text-right tabular-nums text-[var(--lg-text)]">
                                        {formatCurrency(row.running, {
                                          currency: account.currency,
                                        })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr>
                                    <td
                                      colSpan={4}
                                      className="text-right text-xs uppercase tracking-wider text-[var(--lg-text-muted)]"
                                    >
                                      Ledger balance (three-way match)
                                    </td>
                                    <td className="whitespace-nowrap text-right font-semibold tabular-nums text-[var(--lg-text)]">
                                      {formatCurrency(account.balance, {
                                        currency: account.currency,
                                      })}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null,
                  ];
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="lg-empty">
                        <p className="lg-empty-title">No trust accounts match</p>
                        <p className="lg-empty-description">
                          Clear the search, reconciliation or health filter to see all{' '}
                          {accounts.length} client ledgers.
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

      {/* ── Trend + checklist ─────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Trust balance</CardTitle>
              <CardDescription className="mt-1">
                Aggregate client funds — last 6 months, derived from deposit and
                drawdown history
              </CardDescription>
            </div>
            <Badge variant="lg" size="sm" dot>
              {formatCurrency(usdBalance + foreignBalance, { compact: true })}
            </Badge>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyTrend}
                  margin={{ top: 8, right: 12, bottom: 0, left: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--lg-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'var(--lg-text-muted)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--lg-border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--lg-text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={64}
                    tickFormatter={(value: number) =>
                      value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
                    }
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Trust balance"
                    stroke="#dc2626"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#dc2626', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#b91c1c' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Reconciliation checklist</CardTitle>
              <CardDescription className="mt-1">
                Three-way match for the{' '}
                {formatDate(previousCycleEnd, 'MMM d, yyyy')} cycle
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {checklist.map((item) => {
              const complete = item.total > 0 && item.done >= item.total;
              const pct = item.total > 0 ? Math.round((item.done / item.total) * 100) : 0;

              return (
                <div key={item.label}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--lg-text)]">{item.label}</p>
                      <p className="text-[11px] text-[var(--lg-text-muted)]">
                        {item.note}
                      </p>
                    </div>
                    <Badge variant={complete ? 'success' : 'warning'} size="sm">
                      {item.done}/{item.total}
                    </Badge>
                  </div>
                  <div className="lg-progress mt-2">
                    <div
                      className={cn(
                        'lg-progress-bar',
                        complete ? 'bg-emerald-500' : 'bg-crimson-600'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="rounded-xl border border-[var(--lg-border)] bg-[var(--lg-surface-muted)] p-3">
              <p className="text-xs text-[var(--lg-text-secondary)]">
                Ledgers out of balance:{' '}
                <span className="font-medium text-[var(--lg-text)]">
                  {outOfBalance.length > 0
                    ? outOfBalance.map((account) => account.matterNumber).join(', ')
                    : 'none'}
                </span>
              </p>
              <p className="mt-1 text-[11px] text-[var(--lg-text-muted)]">
                Re-run the three-way match after every trust deposit, invoice
                application or cost advance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
