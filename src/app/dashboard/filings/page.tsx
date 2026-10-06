'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  FileCheck2,
  Stamp,
  CircleDollarSign,
  FileWarning,
  Plus,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { Card, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

import { MOCK_FILINGS, type Filing } from '@/lib/mock-data';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

const STATUS_VARIANT: Record<Filing['status'], BadgeVariant> = {
  draft: 'secondary',
  filed: 'info',
  served: 'warning',
  accepted: 'success',
  rejected: 'danger',
};

const STATUS_LABEL: Record<Filing['status'], string> = {
  draft: 'Draft',
  filed: 'Filed',
  served: 'Served',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export default function FilingsPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Filing['status']>('all');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_FILINGS.filter((f) => {
      if (statusFilter !== 'all' && f.status !== statusFilter) return false;
      if (!q) return true;
      return (
        f.title.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        f.court.toLowerCase().includes(q) ||
        f.matterNumber.toLowerCase().includes(q)
      );
    }).sort((a, b) => (b.filedDate ?? '').localeCompare(a.filedDate ?? ''));
  }, [query, statusFilter]);

  const stats = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    return {
      filedThisMonth: MOCK_FILINGS.filter((f) => f.filedDate?.slice(0, 7) === thisMonth).length,
      pending: MOCK_FILINGS.filter((f) => f.status === 'draft' || f.status === 'filed').length,
      rejected: MOCK_FILINGS.filter((f) => f.status === 'rejected').length,
      fees: MOCK_FILINGS.reduce((s, f) => s + (f.feePaid ? f.fee : 0), 0),
    };
  }, []);

  const byType = useMemo(() => {
    const counts = new Map<string, number>();
    MOCK_FILINGS.forEach((f) => counts.set(f.type, (counts.get(f.type) ?? 0) + 1));
    return [...counts.entries()].map(([type, count]) => ({ type, count }));
  }, []);

  const selectCls =
    'h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-crimson-400 focus:ring-2 focus:ring-crimson-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Filings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            E-filing tracker with fees, confirmations and service of process
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => toast.success('Draft filing created')}>
          <Plus className="h-4 w-4" /> New filing
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Filed this month" value={stats.filedThisMonth} icon={<FileCheck2 className="h-5 w-5" />} />
        <MetricCard title="In progress" value={stats.pending} icon={<Stamp className="h-5 w-5" />} hint="draft or awaiting clerk" />
        <MetricCard title="Rejected" value={stats.rejected} icon={<FileWarning className="h-5 w-5" />} deltaTone={stats.rejected ? 'danger' : 'success'} delta={stats.rejected ? 'refile required' : 'clean record'} />
        <MetricCard title="Fees paid" value={formatCurrency(stats.fees)} icon={<CircleDollarSign className="h-5 w-5" />} hint="court costs, YTD" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
            <div className="relative min-w-52 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search filings…"
                aria-label="Search filings"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-crimson-400 focus:bg-white focus:ring-2 focus:ring-crimson-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} aria-label="Filter by status" className={selectCls}>
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="filed">Filed</option>
              <option value="served">Served</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            <span className="text-xs font-medium text-slate-400">{rows.length} of {MOCK_FILINGS.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="lg-table w-full min-w-[840px]">
              <thead>
                <tr>
                  <th>Filing</th>
                  <th>Type</th>
                  <th>Court</th>
                  <th>Filed</th>
                  <th>Status</th>
                  <th>Fee</th>
                  <th>Confirmation</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-800 dark:text-slate-100">{f.title}</div>
                        <div className="truncate text-xs text-slate-500">{f.matterNumber} · {f.pages} pages · {f.serviceMethod ?? 'no service'}</div>
                      </div>
                    </td>
                    <td><Badge variant="secondary" size="sm">{f.type}</Badge></td>
                    <td className="text-slate-600 dark:text-slate-300">{f.court}</td>
                    <td className="whitespace-nowrap text-slate-500">{f.filedDate ? formatDate(f.filedDate) : <span className="text-slate-400">not filed</span>}</td>
                    <td>
                      <Badge variant={STATUS_VARIANT[f.status]} size="sm">{STATUS_LABEL[f.status]}</Badge>
                      {f.deadline && f.status === 'draft' && (
                        <span className="ml-1 text-[10px] font-medium text-crimson-600 dark:text-crimson-400">due {formatDate(f.deadline, 'MMM d')}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      <span className={cn('tabular-nums', f.feePaid ? 'text-slate-600 dark:text-slate-300' : 'text-crimson-600 dark:text-crimson-400')}>
                        {formatCurrency(f.fee)}
                      </span>
                      <span className={cn('ml-1.5 text-[10px] font-medium', f.feePaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')}>
                        {f.feePaid ? 'paid' : 'unpaid'}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-500">{f.confirmationNumber ?? '—'}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-slate-400">No filings match your filters</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="p-5 pb-0"><CardTitle>Filings by type</CardTitle></div>
            <div className="h-60 px-2 pb-4 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byType} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} width={90} />
                  <Tooltip cursor={{ fill: 'rgba(220,38,38,0.06)' }} formatter={(v: number) => [v, 'Filings']} contentStyle={{ background: 'var(--lg-surface, #fff)', border: '1px solid var(--lg-border, #e2e8f0)', borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#dc2626" radius={[0, 5, 5, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div className="p-5 pb-0"><CardTitle>Clerk workflow</CardTitle></div>
            <ul className="space-y-3 p-5 pt-4 text-sm">
              {[
                { step: 'Draft prepared', done: true },
                { step: 'Attorney review', done: true },
                { step: 'E-filed with court', done: stats.pending > 0 },
                { step: 'Clerk acceptance', done: MOCK_FILINGS.some((f) => f.status === 'accepted') },
                { step: 'Service on parties', done: MOCK_FILINGS.some((f) => f.status === 'served') },
              ].map((s) => (
                <li key={s.step} className="flex items-center gap-3">
                  <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold', s.done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800')}>
                    {s.done ? '✓' : '·'}
                  </span>
                  <span className={s.done ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}>{s.step}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
