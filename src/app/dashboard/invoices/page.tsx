'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  ChevronRight,
  Clock,
  Search,
  Send,
  Wallet,
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
import { MOCK_INVOICES, type Invoice, type InvoiceStatus } from '@/lib/mock-data';
import { cn, formatCurrency, formatDate, formatPercent } from '@/lib/utils';

/* ── date helpers (fixture-safe, local timezone) ───────────────── */

const DAY_MS = 86_400_000;

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

const diffDays = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / DAY_MS);

const STATUS_META: Record<InvoiceStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'outline' },
  sent: { label: 'Sent', variant: 'info' },
  paid: { label: 'Paid', variant: 'success' },
  overdue: { label: 'Overdue', variant: 'danger' },
  partial: { label: 'Partial', variant: 'warning' },
};

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: '#94a3b8',
  sent: '#dc2626',
  paid: '#16a34a',
  overdue: '#7f1d1d',
  partial: '#f59e0b',
};

const STATUS_ORDER: InvoiceStatus[] = ['draft', 'sent', 'partial', 'overdue', 'paid'];

function ChartTooltip(props: any) {
  const { active, payload, label } = props ?? {};
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface)] px-3 py-2 text-xs shadow-[var(--lg-shadow-md)]">
      <p className="mb-1 font-semibold text-[var(--lg-text)]">{label ?? payload[0]?.name}</p>
      {payload.map((item: any, index: number) => (
        <p
          key={item.dataKey ?? index}
          className="flex items-center gap-2 text-[var(--lg-text-secondary)]"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color ?? item.fill }}
          />
          {item.name}: {formatCurrency(Number(item.value))}
        </p>
      ))}
    </div>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const today = startOfDay(new Date());

  /** Days until the due date — negative when past due. */
  const dueIn = (invoice: Invoice) => diffDays(today, parseDate(invoice.dueDate));

  /** Overdue age in days for anything with an open balance. */
  const overdueDays = (invoice: Invoice) => {
    if (invoice.status === 'paid' || invoice.balance <= 0) return 0;
    return Math.max(0, -dueIn(invoice));
  };

  const isOverdue = (invoice: Invoice) =>
    invoice.status !== 'paid' && invoice.balance > 0 && dueIn(invoice) < 0;

  /* ── derived stats ─────────────────────────────────────────── */

  const openInvoices = invoices.filter((invoice) =>
    ['sent', 'partial', 'overdue'].includes(invoice.status)
  );
  const outstanding = openInvoices.reduce((sum, invoice) => sum + invoice.balance, 0);

  const overdueInvoices = invoices.filter(isOverdue);
  const overdueTotal = overdueInvoices.reduce((sum, invoice) => sum + invoice.balance, 0);

  const windowStart = addDays(today, -30);
  const collected = invoices.reduce((sum, invoice) => {
    if (!invoice.paidDate) return sum;
    const paid = parseDate(invoice.paidDate);
    return paid.getTime() >= windowStart.getTime() && paid.getTime() <= today.getTime()
      ? sum + invoice.paidAmount
      : sum;
  }, 0);

  const paidDurations = invoices
    .filter((invoice) => invoice.paidDate)
    .map((invoice) => diffDays(parseDate(invoice.issueDate), parseDate(invoice.paidDate!)));
  const avgDaysToPay =
    paidDurations.length > 0
      ? Math.round(paidDurations.reduce((sum, days) => sum + days, 0) / paidDurations.length)
      : 0;

  /* ── aging buckets ─────────────────────────────────────────── */

  const bucketFor = (days: number) => {
    if (days === 0) return 0;
    if (days <= 30) return 1;
    if (days <= 60) return 2;
    if (days <= 90) return 3;
    return 4;
  };

  const agingBuckets = [
    { label: 'Current', value: 0 },
    { label: '1–30', value: 0 },
    { label: '31–60', value: 0 },
    { label: '61–90', value: 0 },
    { label: '90+', value: 0 },
  ];
  const AGING_COLORS = ['#16a34a', '#f59e0b', '#f97316', '#ef4444', '#7f1d1d'];

  invoices.forEach((invoice) => {
    if (invoice.status === 'paid' || invoice.balance <= 0) return;
    agingBuckets[bucketFor(overdueDays(invoice))].value += invoice.balance;
  });
  agingBuckets.forEach((bucket) => {
    bucket.value = Math.round(bucket.value * 100) / 100;
  });

  /* ── status donut ──────────────────────────────────────────── */

  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_META[status].label,
    value: invoices.filter((invoice) => invoice.status === status).length,
    color: STATUS_COLORS[status],
  })).filter((slice) => slice.value > 0);
  const totalInvoices = statusCounts.reduce((sum, slice) => sum + slice.value, 0);

  /* ── filtering ─────────────────────────────────────────────── */

  const filtered = invoices
    .filter((invoice) => {
      const needle = query.trim().toLowerCase();
      if (needle) {
        const haystack = [
          invoice.number,
          invoice.clientName,
          invoice.matterNumber ?? '',
          invoice.terms,
          invoice.notes,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (statusFilter === 'overdue') return isOverdue(invoice);
      if (statusFilter !== 'all' && invoice.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => (a.dueDate < b.dueDate ? 1 : a.dueDate > b.dueDate ? -1 : 0));

  const hasFilters = query.trim() !== '' || statusFilter !== 'all';

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('all');
  };

  /* ── row actions ───────────────────────────────────────────── */

  const patch = (id: string, changes: Partial<Invoice>) =>
    setInvoices((prev) =>
      prev.map((invoice) => (invoice.id === id ? { ...invoice, ...changes } : invoice))
    );

  const sendInvoice = (invoice: Invoice) => {
    patch(invoice.id, { status: 'sent' });
    toast.success(`Invoice ${invoice.number} emailed to ${invoice.clientName}.`);
  };

  const sendReminder = (invoice: Invoice) => {
    toast.success(
      `Reminder sent to ${invoice.clientName} — ${formatCurrency(invoice.balance)} outstanding on ${invoice.number}.`
    );
  };

  const markPaid = (invoice: Invoice) => {
    patch(invoice.id, {
      status: 'paid',
      paidAmount: invoice.amount,
      balance: 0,
      paidDate: toIso(today),
      daysOverdue: 0,
    });
    toast.success(
      `${invoice.number} marked paid — ${formatCurrency(invoice.amount)} recorded.`
    );
  };

  /* ── due-date countdown ────────────────────────────────────── */

  const countdown = (invoice: Invoice) => {
    if (invoice.status === 'paid' || invoice.balance <= 0) {
      return { text: 'Paid', className: 'text-emerald-600 dark:text-emerald-300' };
    }
    const days = dueIn(invoice);
    if (days < 0) {
      return {
        text: `${Math.abs(days)}d overdue`,
        className: 'font-semibold text-red-600 dark:text-red-400',
      };
    }
    if (days === 0) {
      return { text: 'Due today', className: 'font-semibold text-amber-600 dark:text-amber-300' };
    }
    if (days <= 3) {
      return { text: `Due in ${days}d`, className: 'text-amber-600 dark:text-amber-300' };
    }
    return { text: `Due in ${days}d`, className: 'text-[var(--lg-text-muted)]' };
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--lg-text)]">
            Invoices
          </h1>
          <p className="mt-1 text-sm text-[var(--lg-text-muted)]">
            Issue invoices, chase balances and track realization across the firm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Bell className="h-4 w-4" />}
            onClick={() =>
              toast(
                `${overdueInvoices.length} overdue invoices — ${formatCurrency(overdueTotal)} needs a follow-up today.`
              )
            }
          >
            Run dunning
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Send className="h-4 w-4" />}
            onClick={() =>
              toast.success(
                `Draft invoice created — complete billing details to send it.`
              )
            }
          >
            New invoice
          </Button>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Outstanding"
          value={formatCurrency(outstanding)}
          hint={`${openInvoices.length} issued invoices awaiting payment`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <MetricCard
          title="Overdue"
          value={formatCurrency(overdueTotal)}
          hint={`${overdueInvoices.length} invoices past their due date`}
          iconTone="danger"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <MetricCard
          title="Collected this month"
          value={formatCurrency(collected)}
          hint="Rolling 30-day collections against issued work"
          iconTone="success"
          icon={<Wallet className="h-5 w-5" />}
        />
        <MetricCard
          title="Avg days to pay"
          value={`${avgDaysToPay} days`}
          hint={`Across ${paidDurations.length} paid invoices`}
          iconTone="info"
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* ── Filters + table ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>All invoices</CardTitle>
            <CardDescription className="mt-1">
              {filtered.length} of {invoices.length} invoices shown
            </CardDescription>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-5">
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lg-text-muted)]" />
              <input
                aria-label="Search invoices"
                className="lg-input lg-input-sm pl-9"
                placeholder="Search number, client, matter…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <select
              aria-label="Filter by status"
              className="lg-input lg-select lg-input-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </select>

            <div className="flex items-center text-xs text-[var(--lg-text-muted)]">
              {overdueInvoices.length > 0 ? (
                <span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {overdueInvoices.length} overdue
                  </span>{' '}
                  · {formatCurrency(overdueTotal)} at risk
                </span>
              ) : (
                <span>Nothing past due — every balance is within terms.</span>
              )}
            </div>
          </div>

          <div className="lg-table-wrapper">
            <table className="lg-table">
              <thead>
                <tr>
                  <th aria-label="Expand" />
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th className="lg-table-align-right">Amount</th>
                  <th className="lg-table-align-right">Paid</th>
                  <th className="lg-table-align-right">Balance</th>
                  <th>Status</th>
                  <th className="lg-table-align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice) => {
                  const meta = STATUS_META[invoice.status];
                  const due = countdown(invoice);
                  const overdue = isOverdue(invoice);
                  const expanded = expandedId === invoice.id;
                  const lineItemHours = invoice.lineItems
                    .filter((item) => item.unit === 'hours')
                    .reduce((sum, item) => sum + item.quantity, 0);

                  return [
                    <tr key={invoice.id} className={cn(expanded && 'bg-[var(--lg-surface-muted)]')}>
                      <td className="w-8 pr-0">
                        <button
                          type="button"
                          aria-label={expanded ? 'Collapse line items' : 'Expand line items'}
                          aria-expanded={expanded}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--lg-text-muted)] transition-colors hover:bg-[var(--lg-surface-sunken)] hover:text-[var(--lg-text)]"
                          onClick={() => setExpandedId(expanded ? null : invoice.id)}
                        >
                          {expanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="lg-table-cell-primary whitespace-nowrap font-mono text-xs">
                        {invoice.number}
                        <span className="ml-2 font-sans text-[11px] font-normal text-[var(--lg-text-muted)]">
                          {invoice.terms}
                        </span>
                      </td>
                      <td>
                        <p className="text-[var(--lg-text)]">{invoice.clientName}</p>
                        {invoice.matterNumber && (
                          <p className="font-mono text-[11px] text-[var(--lg-text-muted)]">
                            {invoice.matterNumber}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap">{formatDate(invoice.issueDate)}</td>
                      <td className="whitespace-nowrap">
                        <p className={cn(overdue && 'text-red-600 dark:text-red-400')}>
                          {formatDate(invoice.dueDate)}
                        </p>
                        <p className={cn('text-[11px]', due.className)}>{due.text}</p>
                      </td>
                      <td className="whitespace-nowrap text-right tabular-nums text-[var(--lg-text)]">
                        {formatCurrency(invoice.amount, { currency: invoice.currency })}
                      </td>
                      <td className="whitespace-nowrap text-right tabular-nums">
                        {formatCurrency(invoice.paidAmount, { currency: invoice.currency })}
                      </td>
                      <td className="whitespace-nowrap text-right font-medium tabular-nums text-[var(--lg-text)]">
                        {formatCurrency(invoice.balance, { currency: invoice.currency })}
                      </td>
                      <td>
                        <Badge variant={meta.variant} size="sm" dot>
                          {overdue && invoice.status === 'sent' ? 'Overdue' : meta.label}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          {invoice.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Send className="h-3.5 w-3.5" />}
                              onClick={() => sendInvoice(invoice)}
                            >
                              Send
                            </Button>
                          )}
                          {invoice.status !== 'draft' && invoice.status !== 'paid' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<Bell className="h-3.5 w-3.5" />}
                              onClick={() => sendReminder(invoice)}
                            >
                              Remind
                            </Button>
                          )}
                          {invoice.status !== 'paid' ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => markPaid(invoice)}
                            >
                              Mark paid
                            </Button>
                          ) : (
                            <Badge variant="success" size="sm">
                              Settled
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>,

                    expanded ? (
                      <tr key={`${invoice.id}-detail`} className="bg-[var(--lg-surface-muted)]">
                        <td colSpan={10} className="!py-4">
                          <div className="rounded-xl border border-[var(--lg-border)] bg-[var(--lg-surface)] p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-[var(--lg-text)]">
                                  Line items
                                </p>
                                <p className="text-xs text-[var(--lg-text-muted)]">
                                  {invoice.lineItems.length} items ·{' '}
                                  {lineItemHours > 0
                                    ? `${lineItemHours} billable hours`
                                    : 'expense-only billing'}
                                </p>
                              </div>
                              <p className="text-xs text-[var(--lg-text-muted)]">
                                {invoice.notes}
                              </p>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="lg-table lg-table-compact">
                                <thead>
                                  <tr>
                                    <th>Description</th>
                                    <th>Timekeeper</th>
                                    <th>Date</th>
                                    <th className="lg-table-align-right">Hours</th>
                                    <th className="lg-table-align-right">Rate</th>
                                    <th className="lg-table-align-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {invoice.lineItems.map((item) => (
                                    <tr key={item.id}>
                                      <td className="lg-table-cell-primary">
                                        {item.description}
                                        {item.unit !== 'hours' && (
                                          <span className="ml-2">
                                            <Badge variant="default" size="sm">
                                              {item.unit}
                                            </Badge>
                                          </span>
                                        )}
                                      </td>
                                      <td className="whitespace-nowrap">
                                        {item.timekeeper ?? '—'}
                                      </td>
                                      <td className="whitespace-nowrap">
                                        {formatDate(item.date)}
                                      </td>
                                      <td className="whitespace-nowrap text-right tabular-nums">
                                        {item.unit === 'hours'
                                          ? `${item.quantity}`
                                          : '—'}
                                      </td>
                                      <td className="whitespace-nowrap text-right tabular-nums">
                                        {formatCurrency(item.rate, {
                                          currency: invoice.currency,
                                        })}
                                      </td>
                                      <td className="whitespace-nowrap text-right font-medium tabular-nums text-[var(--lg-text)]">
                                        {formatCurrency(item.amount, {
                                          currency: invoice.currency,
                                        })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr>
                                    <td
                                      colSpan={5}
                                      className="text-right text-xs uppercase tracking-wider text-[var(--lg-text-muted)]"
                                    >
                                      Invoice total
                                    </td>
                                    <td className="whitespace-nowrap text-right font-semibold tabular-nums text-[var(--lg-text)]">
                                      {formatCurrency(invoice.amount, {
                                        currency: invoice.currency,
                                      })}
                                    </td>
                                  </tr>
                                  {invoice.trustApplied > 0 && (
                                    <tr>
                                      <td
                                        colSpan={5}
                                        className="text-right text-xs uppercase tracking-wider text-[var(--lg-text-muted)]"
                                      >
                                        Applied from trust
                                      </td>
                                      <td className="whitespace-nowrap text-right tabular-nums text-emerald-600 dark:text-emerald-300">
                                        −{formatCurrency(invoice.trustApplied, { currency: invoice.currency })}
                                      </td>
                                    </tr>
                                  )}
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
                    <td colSpan={10}>
                      <div className="lg-empty">
                        <p className="lg-empty-title">No invoices match</p>
                        <p className="lg-empty-description">
                          Adjust the search or status filter — {invoices.length} invoices
                          are on file for this period.
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

      {/* ── Charts ────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>AR aging</CardTitle>
              <CardDescription className="mt-1">
                Open balances bucketed by days past due
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={agingBuckets}
                  margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
                >
                  <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--lg-border)"
                  vertical={false}
                />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'var(--lg-text-muted)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--lg-border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--lg-text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                    tickFormatter={(value: number) =>
                      value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
                    }
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: 'var(--lg-surface-muted)' }}
                  />
                  <Bar dataKey="value" name="Open balance" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    {agingBuckets.map((bucket, index) => (
                      <Cell key={bucket.label} fill={AGING_COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Invoice status mix</CardTitle>
              <CardDescription className="mt-1">
                {totalInvoices} invoices across every stage of the billing cycle
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-6">
              <div className="h-56 w-56 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusCounts}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={54}
                      outerRadius={84}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {statusCounts.map((slice) => (
                        <Cell key={slice.status} fill={slice.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <ul className="min-w-[12rem] flex-1 space-y-2">
                {statusCounts.map((slice) => (
                  <li
                    key={slice.status}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="inline-flex items-center gap-2 text-[var(--lg-text-secondary)]">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: slice.color }}
                      />
                      {slice.label}
                    </span>
                    <span className="tabular-nums text-[var(--lg-text)]">
                      {slice.value}
                      <span className="ml-2 text-xs text-[var(--lg-text-muted)]">
                        {formatPercent(slice.value / totalInvoices, { decimals: 0 })}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
