'use client';

import { Fragment, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronRight,
  Mail,
  Search,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import {
  MOCK_CLIENTS,
  MOCK_CONTACTS,
  MOCK_INVOICES,
  MOCK_MATTERS,
  type Client,
} from '@/lib/mock-data';
import { cn, formatCurrency, formatDate, formatPercent } from '@/lib/utils';

/* ────────────────────────────────────────────────────────────
   Presentational maps
   ──────────────────────────────────────────────────────────── */

const STATUS_VARIANT: Record<Client['status'], 'success' | 'secondary' | 'info'> = {
  active: 'success',
  inactive: 'secondary',
  prospect: 'info',
};

const STATUS_LABEL: Record<Client['status'], string> = {
  active: 'Active',
  inactive: 'Inactive',
  prospect: 'Prospect',
};

const RISK_VARIANT: Record<Client['risk'], 'success' | 'info' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
};

const RISK_LABEL: Record<Client['risk'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const DONUT_COLORS = ['#dc2626', '#f87171'];

const COLUMN_COUNT = 10;

/* ────────────────────────────────────────────────────────────
   Expandable detail — matters, contacts, billing history
   ──────────────────────────────────────────────────────────── */

function DetailPanel({ client }: { client: Client }) {
  const matters = MOCK_MATTERS.filter((matter) => matter.clientId === client.id);
  const contacts = MOCK_CONTACTS.filter((contact) => contact.linkedClientId === client.id);
  const invoices = MOCK_INVOICES.filter((invoice) => invoice.clientId === client.id).slice(0, 4);

  return (
    <div className="grid gap-5 border-l-2 border-crimson-500/40 bg-[var(--lg-surface-muted)] px-6 py-5 md:grid-cols-3">
      {/* Matters */}
      <section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
          Matters ({matters.length})
        </p>
        {matters.length === 0 ? (
          <p className="text-xs text-[var(--lg-text-muted)]">No matters linked to this client.</p>
        ) : (
          <ul className="space-y-2">
            {matters.map((matter) => (
              <li
                key={matter.id}
                className="rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-crimson-600 dark:text-crimson-400">
                    {matter.number}
                  </span>
                  <Badge
                    variant={
                      matter.status === 'trial'
                        ? 'danger'
                        : matter.status === 'closed'
                          ? 'secondary'
                          : matter.status === 'on_hold'
                            ? 'warning'
                            : 'info'
                    }
                    size="sm"
                  >
                    {matter.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-[var(--lg-text)]">
                  {matter.title}
                </p>
                <p className="mt-1 text-[11px] text-[var(--lg-text-muted)]">
                  {matter.nextDeadline
                    ? `Next: ${formatDate(matter.nextDeadline)} — ${matter.deadlineLabel ?? 'deadline'}`
                    : 'No upcoming deadline'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Contacts */}
      <section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
          Contacts ({contacts.length})
        </p>
        {contacts.length === 0 ? (
          <p className="text-xs text-[var(--lg-text-muted)]">No linked contacts on file.</p>
        ) : (
          <ul className="space-y-2">
            {contacts.map((contact) => (
              <li
                key={contact.id}
                className="flex items-start gap-3 rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface)] p-3"
              >
                <Avatar name={contact.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[var(--lg-text)]">
                    {contact.name}
                  </p>
                  <p className="truncate text-[11px] text-[var(--lg-text-muted)]">
                    {contact.title} · {contact.organization}
                  </p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="mt-0.5 block truncate text-[11px] text-crimson-600 hover:underline dark:text-crimson-400"
                  >
                    {contact.email}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Billing history */}
      <section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
          Billing history ({invoices.length})
        </p>
        {invoices.length === 0 ? (
          <p className="text-xs text-[var(--lg-text-muted)]">No invoices issued yet.</p>
        ) : (
          <ul className="space-y-2">
            {invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--lg-text)]">
                    {invoice.number}
                  </span>
                  <Badge
                    variant={
                      invoice.status === 'paid'
                        ? 'success'
                        : invoice.status === 'overdue'
                          ? 'danger'
                          : invoice.status === 'partial'
                            ? 'warning'
                            : 'secondary'
                    }
                    size="sm"
                  >
                    {invoice.status}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--lg-text-muted)]">
                  <span>Due {formatDate(invoice.dueDate)}</span>
                  <span
                    className={cn(
                      'font-semibold',
                      invoice.balance > 0
                        ? 'text-crimson-600 dark:text-crimson-400'
                        : 'text-[var(--lg-text-secondary)]'
                    )}
                  >
                    {formatCurrency(invoice.balance)} due
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Client profile */}
      <section className="md:col-span-3">
        <div className="grid gap-4 rounded-lg border border-[var(--lg-border)] bg-[var(--lg-surface)] p-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--lg-text-muted)]">
              Primary contact
            </p>
            <p className="mt-1 font-medium text-[var(--lg-text)]">
              {client.contact.name} — {client.contact.title}
            </p>
            <a
              href={`mailto:${client.contact.email}`}
              className="block truncate text-crimson-600 hover:underline dark:text-crimson-400"
            >
              {client.contact.email}
            </a>
            <p className="text-[var(--lg-text-secondary)]">{client.contact.phone}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--lg-text-muted)]">
              Billing
            </p>
            <p className="mt-1 text-[var(--lg-text-secondary)]">
              Terms: <span className="font-medium text-[var(--lg-text)]">{client.paymentTerms}</span>
            </p>
            <p className="truncate text-[var(--lg-text-secondary)]">
              Billing contact: <span className="font-medium text-[var(--lg-text)]">{client.billingEmail}</span>
            </p>
            <p className="text-[var(--lg-text-secondary)]">
              Utilization: <span className="font-medium text-[var(--lg-text)]">{formatPercent(client.utilization)}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--lg-text-muted)]">
              Address
            </p>
            <p className="mt-1 text-[var(--lg-text-secondary)]">
              {client.address.line1}, {client.address.city}, {client.address.state}{' '}
              {client.address.postalCode}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--lg-text-muted)]">
              Value &amp; activity
            </p>
            <p className="mt-1 text-[var(--lg-text-secondary)]">
              LTV:{' '}
              <span className="font-medium text-[var(--lg-text)]">
                {formatCurrency(client.lifetimeValue, { cents: false })}
              </span>
            </p>
            <p className="text-[var(--lg-text-secondary)]">
              Last activity {formatRelativeSafe(client.lastActivity)}
            </p>
          </div>
        </div>
        {client.notes && (
          <p className="mt-3 text-xs italic leading-relaxed text-[var(--lg-text-muted)]">
            “{client.notes}”
          </p>
        )}
      </section>
    </div>
  );
}

function formatRelativeSafe(value: string): string {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return '—';
  const diff = Date.now() - time;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return formatDate(value);
}

/* ────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────── */

export default function ClientsPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'individual' | 'corporate'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Client['status']>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_CLIENTS.filter((c) => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.contact.email.toLowerCase().includes(q) ||
        c.contact.name.toLowerCase().includes(q)
      );
    }).sort((a, b) => b.balance - a.balance);
  }, [query, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = MOCK_CLIENTS.length;
    const active = MOCK_CLIENTS.filter((c) => c.status === 'active').length;
    const prospects = MOCK_CLIENTS.filter((c) => c.status === 'prospect').length;
    const outstanding = MOCK_CLIENTS.reduce((s, c) => s + c.balance, 0);
    return { total, active, prospects, outstanding };
  }, []);

  const typeBreakdown = useMemo(() => {
    const corporate = MOCK_CLIENTS.filter((c) => c.type === 'corporate').length;
    const individual = MOCK_CLIENTS.filter((c) => c.type === 'individual').length;
    return [
      { name: 'Corporate', value: corporate },
      { name: 'Individual', value: individual },
    ];
  }, []);

  const selectCls =
    'lg-input lg-select h-9 w-auto text-sm';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-crimson-600 dark:text-crimson-400">
            Clients
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--lg-text)]">
            Client Portfolio
          </h1>
          <p className="mt-1 text-sm text-[var(--lg-text-muted)]">
            Relationships, balances and risk across the client book
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Users className="h-4 w-4" />}>
          New client
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total clients"
          value={stats.total}
          icon={<Users className="h-5 w-5" />}
          hint="All records on file"
        />
        <MetricCard
          title="Active"
          value={stats.active}
          icon={<UserCheck className="h-5 w-5" />}
          iconTone="success"
          hint={`${formatPercent(stats.active / Math.max(stats.total, 1), { decimals: 0 })} of the book`}
        />
        <MetricCard
          title="Prospects"
          value={stats.prospects}
          icon={<UserPlus className="h-5 w-5" />}
          iconTone="info"
          hint="In pipeline, not yet retained"
        />
        <MetricCard
          title="Outstanding balance"
          value={formatCurrency(stats.outstanding, { cents: false, compact: true })}
          icon={<Wallet className="h-5 w-5" />}
          iconTone="danger"
          hint="Accounts receivable across all clients"
          delta="Due now"
          deltaTone="danger"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Table */}
        <Card>
          <div className="flex flex-wrap items-center gap-3 border-b border-[var(--lg-border)] p-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-crimson-600" />
              All clients
              <span className="text-xs font-normal text-[var(--lg-text-muted)]">
                {rows.length} of {MOCK_CLIENTS.length}
              </span>
            </CardTitle>

            <div className="relative min-w-52 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lg-text-muted)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clients, industries, contacts…"
                aria-label="Search clients"
                className="lg-input h-9 w-full pl-9"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              aria-label="Filter by type"
              className={selectCls}
            >
              <option value="all">All types</option>
              <option value="individual">Individual</option>
              <option value="corporate">Corporate</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              aria-label="Filter by status"
              className={selectCls}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="lg-table w-full min-w-[960px]">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Industry</th>
                  <th>Contact</th>
                  <th className="lg-table-align-right">Open matters</th>
                  <th className="lg-table-align-right">Balance</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Client since</th>
                  <th aria-label="expand" />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const isOpen = expanded === c.id;
                  const due = c.balance > 0;
                  return (
                    <Fragment key={c.id}>
                      <tr
                        className={cn(
                          'cursor-pointer',
                          isOpen && 'bg-crimson-50/40 dark:bg-crimson-950/20'
                        )}
                        onClick={() => setExpanded(isOpen ? null : c.id)}
                      >
                        <td className="lg-table-cell-primary">
                          <div className="flex items-center gap-3">
                            <Avatar name={c.name} size="sm" />
                            <div className="min-w-0">
                              <div className="truncate font-medium text-[var(--lg-text)]">
                                {c.name}
                              </div>
                              <div className="truncate text-xs text-[var(--lg-text-muted)]">
                                {c.contact.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge
                            variant={c.type === 'corporate' ? 'lg' : 'outline'}
                            size="sm"
                          >
                            {c.type === 'corporate' ? 'Corporate' : 'Individual'}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap text-xs text-[var(--lg-text-secondary)]">
                          {c.industry}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--lg-text-muted)]" />
                            <a
                              href={`mailto:${c.contact.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="max-w-[13rem] truncate text-xs text-crimson-600 hover:underline dark:text-crimson-400"
                            >
                              {c.contact.email}
                            </a>
                          </div>
                        </td>
                        <td className="text-right tabular-nums">{c.openMatters}</td>
                        <td className="text-right">
                          <span
                            className={cn(
                              'tabular-nums font-semibold',
                              due
                                ? 'text-crimson-600 dark:text-crimson-400'
                                : 'text-[var(--lg-text-muted)]'
                            )}
                          >
                            {formatCurrency(c.balance)}
                          </span>
                          {due && (
                            <span className="block text-[10px] font-semibold uppercase tracking-wide text-crimson-600 dark:text-crimson-400">
                              Due
                            </span>
                          )}
                        </td>
                        <td>
                          <Badge variant={RISK_VARIANT[c.risk]} size="sm" dot={c.risk !== 'low'}>
                            {RISK_LABEL[c.risk]}
                          </Badge>
                        </td>
                        <td>
                          <Badge variant={STATUS_VARIANT[c.status]} size="sm">
                            {STATUS_LABEL[c.status]}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap text-xs text-[var(--lg-text-muted)]">
                          {formatDate(c.since)}
                        </td>
                        <td>
                          <span className="flex justify-end text-[var(--lg-text-muted)]">
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4 text-crimson-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </span>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={COLUMN_COUNT} className="!p-0">
                            <DetailPanel client={c} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={COLUMN_COUNT}>
                      <div className="lg-empty">
                        <p className="lg-empty-title">No clients match your filters</p>
                        <p className="lg-empty-description">
                          Try a different search term, or clear the type and status filters.
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
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Client type donut */}
        <Card className="h-fit">
          <div className="border-b border-[var(--lg-border)] p-4">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-crimson-600" />
              Client type split
            </CardTitle>
          </div>
          <div className="p-5">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {typeBreakdown.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} clients`, name]}
                    contentStyle={{
                      background: 'var(--lg-surface)',
                      border: '1px solid var(--lg-border)',
                      borderRadius: 10,
                      fontSize: 12,
                      color: 'var(--lg-text)',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <dl className="mt-4 space-y-2 border-t border-[var(--lg-border)] pt-4">
              {typeBreakdown.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between text-xs"
                >
                  <dt className="flex items-center gap-2 text-[var(--lg-text-secondary)]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          DONUT_COLORS[entry.name === 'Corporate' ? 0 : 1],
                      }}
                    />
                    {entry.name}
                  </dt>
                  <dd className="font-semibold text-[var(--lg-text)]">
                    {entry.value}{' '}
                    <span className="font-normal text-[var(--lg-text-muted)]">
                      (
                      {formatPercent(entry.value / Math.max(MOCK_CLIENTS.length, 1), {
                        decimals: 0,
                      })}
                      )
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Card>
      </div>
    </div>
  );
}
