'use client';

import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { Card, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { MOCK_KPI, MOCK_MATTERS, MOCK_CLIENTS, MOCK_TEAM } from '@/lib/mock-data';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

const CRIMSON = '#dc2626';
const EMERALD = '#10b981';
const SLATE = '#64748b';
const AMBER = '#f59e0b';
const SKY = '#0ea5e9';
const PIE_COLORS = [CRIMSON, AMBER, SKY, SLATE, EMERALD];

const tooltipStyle = {
  background: 'var(--lg-surface, #fff)',
  border: '1px solid var(--lg-border, #e2e8f0)',
  borderRadius: 10,
  fontSize: 12,
} as const;

function KPIStrip() {
  const last = MOCK_KPI[MOCK_KPI.length - 1];
  const prev = MOCK_KPI[MOCK_KPI.length - 2];
  const billingDelta =
    prev && prev.billing > 0
      ? Math.round(((last.billing - prev.billing) / prev.billing) * 100)
      : 0;
  const collectedYTD = MOCK_KPI.reduce((s, k) => s + k.collections, 0);
  const billedYTD = MOCK_KPI.reduce((s, k) => s + k.billing, 0);
  const realization = billedYTD > 0 ? collectedYTD / billedYTD : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="YTD billing"
        value={formatCurrency(billedYTD, { compact: true })}
        icon={<span className="text-base">§</span>}
        change={billingDelta}
        changeLabel="MoM"
      />
      <MetricCard
        title="YTD collections"
        value={formatCurrency(collectedYTD, { compact: true })}
        icon={<span className="text-base">$</span>}
        hint={`collection rate ${formatPercent(realization)}`}
      />
      <MetricCard
        title="Avg utilization"
        value={formatPercent(
          MOCK_KPI.reduce((s, k) => s + k.utilization, 0) / MOCK_KPI.length
        )}
        icon={<span className="text-base">◔</span>}
        delta="target 65%"
        deltaTone="info"
      />
      <MetricCard
        title="Net new matters"
        value={formatNumber(MOCK_KPI.reduce((s, k) => s + k.newMatters, 0))}
        subvalue={`−${MOCK_KPI.reduce((s, k) => s + k.closedMatters, 0)} closed`}
        icon={<span className="text-base">⚖</span>}
      />
    </div>
  );
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState('overview');

  const billingData = useMemo(
    () =>
      MOCK_KPI.map((k) => ({
        label: k.label,
        billing: k.billing,
        collections: k.collections,
        writeOffs: k.writeOffs,
        realization: Math.round(k.realization * 100),
      })),
    []
  );

  const matterTypeData = useMemo(() => {
    const counts = new Map<string, number>();
    MOCK_MATTERS.forEach((m) => counts.set(m.type, (counts.get(m.type) ?? 0) + 1));
    return [...counts.entries()].map(([type, count]) => ({ type, count }));
  }, []);

  const statusData = useMemo(() => {
    const labels: Record<string, string> = {
      open: 'Open',
      discovery: 'Discovery',
      trial: 'Trial',
      on_hold: 'On Hold',
      closed: 'Closed',
    };
    const counts = new Map<string, number>();
    MOCK_MATTERS.forEach((m) =>
      counts.set(m.status, (counts.get(m.status) ?? 0) + 1)
    );
    return [...counts.entries()].map(([status, value]) => ({
      name: labels[status] ?? status,
      value,
    }));
  }, []);

  const clientRevenue = useMemo(
    () =>
      [...MOCK_CLIENTS]
        .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
        .slice(0, 8)
        .map((c) => ({
          name: c.name.length > 14 ? `${c.name.slice(0, 12)}…` : c.name,
          ltv: c.lifetimeValue,
          balance: c.balance,
        })),
    []
  );

  const utilizationData = useMemo(
    () =>
      MOCK_TEAM.map((t) => ({
        name: t.name.split(' ').slice(-1)[0],
        utilization: Math.round(t.utilization * 100),
        target: 65,
      })),
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Firm analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Revenue, realization, matter flow and people metrics across the firm
          </p>
        </div>
        <Badge variant="lg">12-month rolling window</Badge>
      </div>

      <Tabs value={tab} onValueChange={setTab} variant="underline">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="matters">Matters</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="overview" className="space-y-6 pt-6">
          <KPIStrip />

          <Card>
            <div className="p-5 pb-0">
              <CardTitle>Billing vs collections trend</CardTitle>
            </div>
            <div className="h-72 px-2 pb-4 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={billingData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="aBill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CRIMSON} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CRIMSON} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="aColl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={EMERALD} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={EMERALD} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: number, n: string) => [formatCurrency(v), n]} contentStyle={tooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="billing" stroke={CRIMSON} strokeWidth={2} fill="url(#aBill)" />
                  <Area type="monotone" dataKey="collections" stroke={EMERALD} strokeWidth={2} fill="url(#aColl)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <div className="p-5 pb-0">
                <CardTitle>Matter status distribution</CardTitle>
              </div>
              <div className="h-64 px-2 pb-4 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <div className="p-5 pb-0">
                <CardTitle>Attorney utilization vs target</CardTitle>
              </div>
              <div className="h-64 px-2 pb-4 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilizationData} margin={{ top: 4, right: 12, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} unit="%" />
                    <Tooltip formatter={(v: number) => `${v}%`} contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="utilization" fill={CRIMSON} radius={[5, 5, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="target" fill={SLATE} radius={[5, 5, 0, 0]} maxBarSize={30} opacity={0.4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="billing" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Realization (12m)" value={formatPercent(billingData.reduce((s, b) => s + b.realization, 0) / billingData.length)} hint="collected / billed" />
            <MetricCard title="Write-offs (12m)" value={formatCurrency(billingData.reduce((s, b) => s + b.writeOffs, 0), { compact: true })} deltaTone="danger" delta="discounts & write-downs" />
            <MetricCard title="Avg monthly billing" value={formatCurrency(billingData.reduce((s, b) => s + b.billing, 0) / billingData.length, { compact: true })} />
            <MetricCard title="Avg monthly collections" value={formatCurrency(billingData.reduce((s, b) => s + b.collections, 0) / billingData.length, { compact: true })} />
          </div>

          <Card>
            <div className="p-5 pb-0">
              <CardTitle>Realization rate</CardTitle>
            </div>
            <div className="h-64 px-2 pb-4 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={billingData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} />
                  <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} unit="%" />
                  <Tooltip formatter={(v: number) => `${v}%`} contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="realization" stroke={CRIMSON} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div className="p-5 pb-0">
              <CardTitle>Write-offs by month</CardTitle>
            </div>
            <div className="h-60 px-2 pb-4 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={billingData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} cursor={{ fill: 'rgba(220,38,38,0.06)' }} />
                  <Bar dataKey="writeOffs" fill={AMBER} radius={[5, 5, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="matters" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Total matters" value={formatNumber(MOCK_MATTERS.length)} />
            <MetricCard title="In litigation" value={formatNumber(MOCK_MATTERS.filter((m) => ['litigation'].includes(m.type)).length)} hint="by practice area" />
            <MetricCard title="Avg budget" value={formatCurrency(MOCK_MATTERS.reduce((s, m) => s + m.budget, 0) / MOCK_MATTERS.length, { compact: true })} />
            <MetricCard
              title="Budget consumed"
              value={formatPercent(
                MOCK_MATTERS.reduce((s, m) => s + m.spent, 0) /
                  Math.max(1, MOCK_MATTERS.reduce((s, m) => s + m.budget, 0)),
                { alreadyPercent: false }
              )}
              hint="spent vs budget, firm-wide"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <div className="p-5 pb-0">
                <CardTitle>Matters by practice type</CardTitle>
              </div>
              <div className="h-72 px-2 pb-4 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={matterTypeData} margin={{ top: 4, right: 12, bottom: 0, left: -24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                    <XAxis dataKey="type" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(220,38,38,0.06)' }} contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Matters']} />
                    <Bar dataKey="count" fill={CRIMSON} radius={[6, 6, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <div className="p-5 pb-0">
                <CardTitle>Monthly matter flow</CardTitle>
              </div>
              <div className="h-72 px-2 pb-4 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={MOCK_KPI.map((k) => ({ label: k.label, opened: k.newMatters, closed: k.closedMatters }))}
                    margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Area type="stepAfter" dataKey="opened" stroke={EMERALD} strokeWidth={2} fillOpacity={0.12} fill={EMERALD} />
                    <Area type="stepAfter" dataKey="closed" stroke={SLATE} strokeWidth={2} fillOpacity={0.12} fill={SLATE} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="clients" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Active clients" value={formatNumber(MOCK_CLIENTS.filter((c) => c.status === 'active').length)} subvalue={`${MOCK_CLIENTS.length} total`} />
            <MetricCard title="Corporate share" value={formatPercent(MOCK_CLIENTS.filter((c) => c.type === 'corporate').length / MOCK_CLIENTS.length)} hint="of client base" />
            <MetricCard title="High-risk clients" value={formatNumber(MOCK_CLIENTS.filter((c) => c.risk === 'high' || c.risk === 'critical').length)} deltaTone="warning" delta="watch list" />
            <MetricCard title="Top-8 LTV" value={formatCurrency(clientRevenue.reduce((s, c) => s + c.ltv, 0), { compact: true })} hint="concentration check" />
          </div>

          <Card>
            <div className="p-5 pb-0">
              <CardTitle>Client concentration — lifetime value</CardTitle>
            </div>
            <div className="h-80 px-2 pb-4 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientRevenue} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} interval={0} angle={-18} textAnchor="end" height={54} />
                  <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                  <Tooltip cursor={{ fill: 'rgba(220,38,38,0.06)' }} formatter={(v: number, n: string) => [formatCurrency(v), n === 'ltv' ? 'Lifetime value' : 'Open balance']} contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="ltv" fill={CRIMSON} radius={[6, 6, 0, 0]} maxBarSize={46} />
                  <Bar dataKey="balance" fill={AMBER} radius={[6, 6, 0, 0]} maxBarSize={46} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
