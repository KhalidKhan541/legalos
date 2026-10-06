'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Gavel,
  AlertOctagon,
  CalendarClock,
  Wallet,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { Card, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { MOCK_MATTERS, type Matter } from '@/lib/mock-data';
import { cn, formatCurrency, formatDate, formatNumber, formatPercent } from '@/lib/utils';

const STATUS_VARIANT: Record<Matter['status'], BadgeVariant> = {
  open: 'info',
  discovery: 'warning',
  trial: 'danger',
  closed: 'secondary',
  on_hold: 'secondary',
};

const PRIORITY_VARIANT: Record<Matter['priority'], BadgeVariant> = {
  low: 'secondary',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
};

const TYPE_LABEL: Record<Matter['type'], string> = {
  litigation: 'Litigation',
  transactional: 'Transactional',
  'M&A': 'M&A',
  IP: 'IP',
  employment: 'Employment',
  'real estate': 'Real Estate',
};

export default function MattersPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | Matter['type']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Matter['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Matter['priority']>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_MATTERS.filter((m) => {
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && m.priority !== priorityFilter) return false;
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        m.number.toLowerCase().includes(q) ||
        m.clientName.toLowerCase().includes(q) ||
        m.leadAttorney.toLowerCase().includes(q)
      );
    });
  }, [query, typeFilter, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
    const active = MOCK_MATTERS.filter((m) => m.status !== 'closed');
    const now = Date.now();
    const overdueDeadlines = active.filter(
      (m) => m.nextDeadline && new Date(m.nextDeadline).getTime() < now
    ).length;
    const totalBudget = MOCK_MATTERS.reduce((s, m) => s + m.budget, 0);
    const totalSpent = MOCK_MATTERS.reduce((s, m) => s + m.spent, 0);
    return {
      active: active.length,
      trial: MOCK_MATTERS.filter((m) => m.status === 'trial').length,
      overdue: overdueDeadlines,
      budget: totalBudget,
      consumed: totalBudget > 0 ? totalSpent / totalBudget : 0,
      hours: MOCK_MATTERS.reduce((s, m) => s + m.billableHours, 0),
    };
  }, []);

  const byType = useMemo(() => {
    const counts = new Map<string, number>();
    MOCK_MATTERS.forEach((m) => counts.set(m.type, (counts.get(m.type) ?? 0) + 1));
    return [...counts.entries()].map(([type, count]) => ({
      type: TYPE_LABEL[type as Matter['type']] ?? type,
      count,
    }));
  }, []);

  const selectCls =
    'h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-crimson-400 focus:ring-2 focus:ring-crimson-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Matters</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Every engagement — deadlines, budgets and teams in one docket
          </p>
        </div>
        <Button variant="primary" size="sm">
          <Plus className="h-4 w-4" /> New matter
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Active matters" value={stats.active} icon={<Gavel className="h-5 w-5" />} subvalue={`${stats.trial} at trial`} />
        <MetricCard title="Overdue deadlines" value={stats.overdue} icon={<CalendarClock className="h-5 w-5" />} deltaTone={stats.overdue > 0 ? 'danger' : 'success'} delta={stats.overdue > 0 ? 'needs attention' : 'all clear'} />
        <MetricCard title="Budget consumed" value={formatPercent(stats.consumed)} icon={<Wallet className="h-5 w-5" />} hint={`${formatCurrency(stats.budget, { compact: true })} total budget`} />
        <MetricCard title="Billable hours" value={formatNumber(stats.hours)} icon={<AlertOctagon className="h-5 w-5" />} hint="logged across matters" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search matters, numbers, clients…"
              aria-label="Search matters"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-crimson-400 focus:bg-white focus:ring-2 focus:ring-crimson-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} aria-label="Filter by type" className={selectCls}>
            <option value="all">All types</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} aria-label="Filter by status" className={selectCls}>
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="discovery">Discovery</option>
            <option value="trial">Trial</option>
            <option value="on_hold">On Hold</option>
            <option value="closed">Closed</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)} aria-label="Filter by priority" className={selectCls}>
            <option value="all">All priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <span className="text-xs font-medium text-slate-400">{rows.length} of {MOCK_MATTERS.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="lg-table w-full min-w-[1040px]">
            <thead>
              <tr>
                <th>Matter</th>
                <th>Type</th>
                <th>Client</th>
                <th>Lead</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Next deadline</th>
                <th>Budget</th>
                <th aria-label="expand" />
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const isOpen = expanded === m.id;
                const overdue = m.nextDeadline !== null && new Date(m.nextDeadline).getTime() < Date.now();
                const pct = m.budget > 0 ? Math.min(100, (m.spent / m.budget) * 100) : 0;
                return (
                  <RowGroup key={m.id}>
                    <tr
                      className={cn('cursor-pointer', isOpen && 'bg-crimson-50/40 dark:bg-crimson-950/20')}
                      onClick={() => setExpanded(isOpen ? null : m.id)}
                    >
                      <td>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-800 dark:text-slate-100">{m.title}</div>
                          <div className="truncate text-xs text-slate-500">{m.number} · {m.practiceArea}</div>
                        </div>
                      </td>
                      <td>
                        <Badge variant="secondary" size="sm">{TYPE_LABEL[m.type]}</Badge>
                      </td>
                      <td className="text-slate-600 dark:text-slate-300">{m.clientName}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={m.leadAttorney} size="xs" />
                          <span className="whitespace-nowrap text-slate-600 dark:text-slate-300">{m.leadAttorney}</span>
                        </div>
                      </td>
                      <td><Badge variant={STATUS_VARIANT[m.status]} size="sm">{m.status === 'on_hold' ? 'On Hold' : titleCaseSafe(m.status)}</Badge></td>
                      <td><Badge variant={PRIORITY_VARIANT[m.priority]} size="sm">{m.priority}</Badge></td>
                      <td className="whitespace-nowrap">
                        {m.nextDeadline ? (
                          <span className={cn('text-sm font-medium', overdue ? 'text-crimson-600 dark:text-crimson-400' : 'text-slate-600 dark:text-slate-300')}>
                            {formatDate(m.nextDeadline, 'MMM d')}
                            <span className="ml-1 text-[10px] font-normal text-slate-400">{m.deadlineLabel}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td>
                        <div className="w-32">
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>{formatCurrency(m.spent, { compact: true })}</span>
                            <span>{Math.round(pct)}%</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={cn('h-full rounded-full', pct > 90 ? 'bg-crimson-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500')}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', isOpen && 'rotate-180 text-crimson-500')} />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={9} className="bg-slate-50/70 px-6 py-5 dark:bg-slate-900/50">
                          <div className="grid gap-6 md:grid-cols-4">
                            <div>
                              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Matter</h4>
                              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{m.description}</p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {m.tags.map((t) => (
                                  <span key={t} className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{t}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Team & venue</h4>
                              <p className="text-xs text-slate-600 dark:text-slate-300">Lead: <span className="font-medium">{m.leadAttorney}</span></p>
                              <p className="text-xs text-slate-600 dark:text-slate-300">Paralegal: <span className="font-medium">{m.paralegal}</span></p>
                              <p className="text-xs text-slate-600 dark:text-slate-300">Court: <span className="font-medium">{m.court ?? '—'}</span></p>
                              <p className="text-xs text-slate-600 dark:text-slate-300">Docket: <span className="font-medium">{m.docketNumber ?? '—'}</span></p>
                            </div>
                            <div>
                              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Money</h4>
                              <p className="text-xs text-slate-600 dark:text-slate-300">Budget: <span className="font-medium">{formatCurrency(m.budget)}</span></p>
                              <p className="text-xs text-slate-600 dark:text-slate-300">Spent: <span className="font-medium">{formatCurrency(m.spent)}</span></p>
                              <p className="text-xs text-slate-600 dark:text-slate-300">Retainer left: <span className={cn('font-medium', m.retainerRemaining < 5000 && 'text-crimson-600')}>{formatCurrency(m.retainerRemaining)}</span></p>
                              <p className="text-xs text-slate-600 dark:text-slate-300">Rate: <span className="font-medium">{formatCurrency(m.billingRate)}/hr</span></p>
                            </div>
                            <div>
                              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Opposing</h4>
                              <p className="text-xs text-slate-600 dark:text-slate-300">Party: <span className="font-medium">{m.opposingParty ?? '—'}</span></p>
                              <p className="text-xs text-slate-600 dark:text-slate-300">Counsel: <span className="font-medium">{m.opposingCounsel ?? '—'}</span></p>
                              <p className="mt-2 text-[11px] text-slate-400">Opened {formatDate(m.opened)} · last activity {formatDate(m.lastActivity)}</p>
                              <Link href="/dashboard/documents" className="mt-2 inline-block text-xs font-medium text-crimson-600 hover:underline dark:text-crimson-400">
                                View documents →
                              </Link>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </RowGroup>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-slate-400">No matters match your filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="p-5 pb-0"><CardTitle>Matters by practice type</CardTitle></div>
        <div className="h-60 px-2 pb-4 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byType} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
              <XAxis dataKey="type" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(220,38,38,0.06)' }} formatter={(v: number) => [v, 'Matters']} contentStyle={{ background: 'var(--lg-surface, #fff)', border: '1px solid var(--lg-border, #e2e8f0)', borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="count" fill="#dc2626" radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function titleCaseSafe(v: string) {
  return v.charAt(0).toUpperCase() + v.slice(1).replace('_', ' ');
}

/** Groups an expandable row with its detail row so React keys stay valid. */
function RowGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
