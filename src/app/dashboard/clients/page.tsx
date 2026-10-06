'use client';

import { useMemo, useState } from 'react';
import { Search, Users, Building2, AlertTriangle, Plus, ChevronDown } from 'lucide-react';

import { Card, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { MOCK_CLIENTS, MOCK_MATTERS, type Client } from '@/lib/mock-data';
import { cn, formatCurrency, formatDate, formatPercent, getInitials } from '@/lib/utils';

const STATUS_VARIANT: Record<Client['status'], BadgeVariant> = {
  active: 'success',
  inactive: 'secondary',
  prospect: 'info',
};

const RISK_VARIANT: Record<Client['risk'], BadgeVariant> = {
  low: 'secondary',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
};

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
    const totalBalance = MOCK_CLIENTS.reduce((s, c) => s + c.balance, 0);
    return {
      total: MOCK_CLIENTS.length,
      active: MOCK_CLIENTS.filter((c) => c.status === 'active').length,
      prospects: MOCK_CLIENTS.filter((c) => c.status === 'prospect').length,
      balance: totalBalance,
      ltv: MOCK_CLIENTS.reduce((s, c) => s + c.lifetimeValue, 0),
    };
  }, []);

  const selectCls =
    'h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-crimson-400 focus:ring-2 focus:ring-crimson-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Clients
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Relationships, balances and risk across the client book
          </p>
        </div>
        <Button variant="primary" size="sm">
          <Plus className="h-4 w-4" /> New client
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total clients" value={stats.total} icon={<Users className="h-5 w-5" />} />
        <MetricCard title="Active" value={stats.active} icon={<Building2 className="h-5 w-5" />} hint={`${stats.prospects} prospects in pipeline`} />
        <MetricCard title="Outstanding balances" value={formatCurrency(stats.balance, { compact: true })} icon={<AlertTriangle className="h-5 w-5" />} hint="across all clients" deltaTone="warning" delta="collections follow-up" />
        <MetricCard title="Lifetime value" value={formatCurrency(stats.ltv, { compact: true })} icon={<Users className="h-5 w-5" />} hint="book-wide LTV" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients, industries, contacts…"
              aria-label="Search clients"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-crimson-400 focus:bg-white focus:ring-2 focus:ring-crimson-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} aria-label="Filter by type" className={selectCls}>
            <option value="all">All types</option>
            <option value="individual">Individual</option>
            <option value="corporate">Corporate</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} aria-label="Filter by status" className={selectCls}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="prospect">Prospect</option>
          </select>
          <span className="text-xs font-medium text-slate-400">
            {rows.length} of {MOCK_CLIENTS.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="lg-table w-full min-w-[880px]">
            <thead>
              <tr>
                <th>Client</th>
                <th>Type</th>
                <th>Industry</th>
                <th>Open matters</th>
                <th>Balance</th>
                <th>LTV</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Client since</th>
                <th aria-label="expand" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const isOpen = expanded === c.id;
                const matters = MOCK_MATTERS.filter((m) => m.clientId === c.id);
                return (
                  <>
                    <tr
                      key={c.id}
                      className={cn('cursor-pointer', isOpen && 'bg-crimson-50/40 dark:bg-crimson-950/20')}
                      onClick={() => setExpanded(isOpen ? null : c.id)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate font-medium text-slate-800 dark:text-slate-100">{c.name}</div>
                            <div className="truncate text-xs text-slate-500">{c.contact.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={c.type === 'corporate' ? 'info' : 'secondary'} size="sm">
                          {c.type === 'corporate' ? 'Corporate' : 'Individual'}
                        </Badge>
                      </td>
                      <td className="text-slate-600 dark:text-slate-300">{c.industry}</td>
                      <td className="tabular-nums">{c.openMatters}</td>
                      <td className={cn('tabular-nums font-medium', c.balance > 0 ? 'text-crimson-600 dark:text-crimson-400' : 'text-slate-400')}>
                        {formatCurrency(c.balance)}
                      </td>
                      <td className="tabular-nums text-slate-600 dark:text-slate-300">{formatCurrency(c.lifetimeValue, { compact: true })}</td>
                      <td>
                        <Badge variant={RISK_VARIANT[c.risk]} size="sm">{c.risk}</Badge>
                      </td>
                      <td>
                        <Badge variant={STATUS_VARIANT[c.status]} size="sm">{c.status}</Badge>
                      </td>
                      <td className="whitespace-nowrap text-slate-500">{formatDate(c.since)}</td>
                      <td>
                        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', isOpen && 'rotate-180 text-crimson-500')} />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${c.id}-detail`}>
                        <td colSpan={10} className="bg-slate-50/70 px-6 py-5 dark:bg-slate-900/50">
                          <div className="grid gap-6 md:grid-cols-3">
                            <div>
                              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Primary contact</h4>
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{c.contact.name} — {c.contact.title}</p>
                              <p className="text-xs text-slate-500">{c.contact.email}</p>
                              <p className="text-xs text-slate-500">{c.contact.phone}</p>
                              <p className="mt-2 text-xs text-slate-500">
                                {c.address.line1}, {c.address.city}, {c.address.state} {c.address.postalCode}
                              </p>
                            </div>
                            <div>
                              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Billing</h4>
                              <p className="text-sm text-slate-700 dark:text-slate-200">Terms: <span className="font-medium">{c.paymentTerms}</span></p>
                              <p className="text-sm text-slate-700 dark:text-slate-200">Billing contact: <span className="font-medium">{c.billingEmail}</span></p>
                              <p className="text-sm text-slate-700 dark:text-slate-200">Utilization: <span className="font-medium">{formatPercent(c.utilization)}</span></p>
                              <p className="text-xs text-slate-500">Last activity {formatDate(c.lastActivity)}</p>
                            </div>
                            <div>
                              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Open matters ({matters.length})</h4>
                              <ul className="space-y-1.5">
                                {matters.slice(0, 4).map((m) => (
                                  <li key={m.id} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="truncate text-slate-700 dark:text-slate-200">{m.number} · {m.title}</span>
                                    <Badge variant={m.status === 'trial' ? 'danger' : m.status === 'closed' ? 'secondary' : 'info'} size="sm">{m.status}</Badge>
                                  </li>
                                ))}
                                {matters.length === 0 && <li className="text-xs text-slate-400">No matters linked</li>}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm text-slate-400">
                    No clients match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
