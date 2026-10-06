'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BookMarked,
  FileSearch,
  Gauge,
  Landmark,
  Scale,
  Search,
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
import { cn, formatDate, formatNumber, formatPercent } from '@/lib/utils';
import {
  MOCK_MATTERS,
  MOCK_RESEARCH,
  type ResearchItem,
  type ResearchStatus,
} from '@/lib/mock-data';

/* -------------------------------------------------------------------------- *
 * Display metadata
 * -------------------------------------------------------------------------- */

const STATUS_META: Record<
  ResearchStatus,
  { label: string; badge: BadgeVariant; color: string }
> = {
  unreviewed: { label: 'In Progress', badge: 'warning', color: '#f59e0b' },
  reviewed: { label: 'Complete', badge: 'info', color: '#0ea5e9' },
  cited: { label: 'Cited', badge: 'success', color: '#10b981' },
  archived: { label: 'Archived', badge: 'default', color: '#94a3b8' },
};

const STATUS_OPTIONS: ResearchStatus[] = [
  'unreviewed',
  'reviewed',
  'cited',
  'archived',
];

const TREATMENT_META: Record<
  ResearchItem['treatment'],
  { label: string; badge: BadgeVariant }
> = {
  'good-law': { label: 'Good law', badge: 'success' },
  questioned: { label: 'Questioned', badge: 'warning' },
  overruled: { label: 'Overruled', badge: 'danger' },
  distinguished: { label: 'Distinguished', badge: 'secondary' },
};

type StatusFilter = ResearchStatus | 'all';

const matterNumber = (matterId: string | null) =>
  matterId ? (MOCK_MATTERS.find((m) => m.id === matterId)?.number ?? null) : null;

/** Compact, chart-friendly label for a legal issue. */
const shortLabel = (issue: string) =>
  issue.length > 34 ? `${issue.slice(0, 33).trimEnd()}…` : issue;

/* -------------------------------------------------------------------------- *
 * Page
 * -------------------------------------------------------------------------- */

export default function ResearchPage() {
  const [query, setQuery] = useState('');
  const [jurisdiction, setJurisdiction] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const records = MOCK_RESEARCH;

  const jurisdictions = useMemo(
    () => Array.from(new Set(records.map((r) => r.jurisdiction))).sort(),
    [records]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((item) => {
      if (jurisdiction !== 'all' && item.jurisdiction !== jurisdiction) return false;
      if (status !== 'all' && item.status !== status) return false;
      if (!q) return true;
      return [
        item.issue,
        item.citation,
        item.court,
        item.researcher,
        ...item.tags,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [records, query, jurisdiction, status]);

  const stats = useMemo(() => {
    const open = records.filter(
      (r) => r.status === 'unreviewed' || r.status === 'reviewed'
    ).length;
    const citedInMatters = records.filter(
      (r) => r.status === 'cited' && r.matterId !== null
    ).length;
    const jurisdictionCount = new Set(records.map((r) => r.jurisdiction)).size;
    const averageRelevance =
      records.reduce((sum, r) => sum + r.relevance, 0) / Math.max(records.length, 1);
    return { open, citedInMatters, jurisdictionCount, averageRelevance };
  }, [records]);

  const chartData = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => b.relevance - a.relevance)
        .map((item) => ({
          id: item.id,
          label: shortLabel(item.issue),
          relevance: item.relevance,
          color: STATUS_META[item.status].color,
          status: STATUS_META[item.status].label,
        })),
    [filtered]
  );

  return (
    <div className="space-y-6">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--lg-text)]">
            Legal Research
          </h1>
          <p className="mt-1 text-sm text-[var(--lg-text-muted)]">
            Saved authorities, statutes and regulations — scored for relevance and tracked to citation.
          </p>
        </div>
        <Button
          leftIcon={<Scale className="h-4 w-4" />}
          onClick={() =>
            toast.success('New research query opened — results will be scored automatically.')
          }
        >
          New research query
        </Button>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Open queries"
          value={formatNumber(stats.open)}
          hint="In progress or awaiting review"
          icon={<FileSearch className="h-5 w-5" />}
          iconTone="warning"
          delta={`${records.filter((r) => r.status === 'unreviewed').length} unreviewed`}
          deltaTone="warning"
        />
        <MetricCard
          title="Cited in matters"
          value={formatNumber(stats.citedInMatters)}
          hint="Authorities leaned on in a brief"
          icon={<BookMarked className="h-5 w-5" />}
          iconTone="success"
          change={14}
          changeLabel="vs last quarter"
        />
        <MetricCard
          title="Jurisdictions"
          value={formatNumber(stats.jurisdictionCount)}
          hint="Federal and state coverage"
          icon={<Landmark className="h-5 w-5" />}
        />
        <MetricCard
          title="Avg. relevance"
          value={formatPercent(stats.averageRelevance, { decimals: 0 })}
          hint="Score across saved authorities"
          icon={<Gauge className="h-5 w-5" />}
          iconTone="info"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ── Records table ────────────────────────────────────────────── */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Research records</CardTitle>
              <p className="mt-1 text-xs text-[var(--lg-text-muted)]">
                {filtered.length} of {records.length} authorities
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-52 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lg-text-muted)]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search issues, citations…"
                  aria-label="Search research records"
                  className="lg-input lg-input-sm pl-9"
                />
              </div>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                aria-label="Filter by jurisdiction"
                className="lg-input lg-input-sm lg-select w-auto"
              >
                <option value="all">All jurisdictions</option>
                {jurisdictions.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                aria-label="Filter by research status"
                className="lg-input lg-input-sm lg-select w-auto"
              >
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="lg-empty">
                <Scale className="h-8 w-8 opacity-60" />
                <p className="lg-empty-title">No research records match</p>
                <p className="lg-empty-description">
                  Try a broader keyword, or reset the jurisdiction and status filters.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery('');
                    setJurisdiction('all');
                    setStatus('all');
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
                      <th scope="col">Legal issue</th>
                      <th scope="col">Citation</th>
                      <th scope="col">Court / Year</th>
                      <th scope="col">Jurisdiction</th>
                      <th scope="col">Relevance</th>
                      <th scope="col">Status</th>
                      <th scope="col">Researcher</th>
                      <th scope="col">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const number = matterNumber(item.matterId);
                      return (
                        <tr key={item.id}>
                          <td className="max-w-[20rem] lg-table-cell-primary">
                            <p className="font-medium text-[var(--lg-text)]">{item.issue}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <Badge variant="outline" size="sm">
                                {item.authority}
                              </Badge>
                              {number && (
                                <Link
                                  href={`/dashboard/matters?matter=${item.matterId}`}
                                  className="lg-chip transition-colors hover:border-crimson-600/40 hover:text-crimson-600"
                                >
                                  {number}
                                </Link>
                              )}
                              {item.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="lg-chip">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="max-w-[16rem]">
                            <p className="font-medium italic leading-snug text-[var(--lg-text)]">
                              {item.citation}
                            </p>
                            <div className="mt-1">
                              <Badge
                                variant={TREATMENT_META[item.treatment].badge}
                                size="sm"
                              >
                                {TREATMENT_META[item.treatment].label}
                              </Badge>
                            </div>
                          </td>
                          <td className="max-w-[12rem]">
                            <p className="truncate text-[var(--lg-text-secondary)]">
                              {item.court}
                            </p>
                            <p className="text-xs text-[var(--lg-text-muted)] lg-tabular">
                              {item.year}
                            </p>
                          </td>
                          <td>
                            <Badge variant="secondary" size="sm">
                              {item.jurisdiction}
                            </Badge>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="lg-progress w-16">
                                <div
                                  className="lg-progress-bar"
                                  style={{
                                    width: `${Math.round(item.relevance * 100)}%`,
                                    backgroundColor: STATUS_META[item.status].color,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-[var(--lg-text)] lg-tabular">
                                {formatPercent(item.relevance, { decimals: 0 })}
                              </span>
                            </div>
                          </td>
                          <td>
                            <Badge variant={STATUS_META[item.status].badge} dot size="sm">
                              {STATUS_META[item.status].label}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap">{item.researcher}</td>
                          <td className="whitespace-nowrap">{formatDate(item.savedAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Relevance chart ──────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Relevance scores</CardTitle>
            <Badge variant="outline" size="sm">
              {chartData.length} shown
            </Badge>
          </CardHeader>
          <CardContent className="p-5">
            {chartData.length === 0 ? (
              <div className="lg-empty py-10">
                <Gauge className="h-7 w-7 opacity-60" />
                <p className="lg-empty-title">Nothing to chart</p>
                <p className="lg-empty-description">
                  Adjust the filters to bring authorities back into view.
                </p>
              </div>
            ) : (
              <div className="h-[26rem] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                    barSize={16}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="var(--lg-border)"
                    />
                    <XAxis
                      type="number"
                      domain={[0, 1]}
                      tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                      tick={{ fontSize: 11, fill: 'var(--lg-text-muted)' }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--lg-border)' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={158}
                      tick={{ fontSize: 11, fill: 'var(--lg-text-secondary)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--lg-surface-muted)' }}
                      formatter={(value, _name, entry) => [
                        formatPercent(Number(value), { decimals: 0 }),
                        String(entry?.payload?.status ?? 'Relevance'),
                      ]}
                      contentStyle={{
                        background: 'var(--lg-surface)',
                        border: '1px solid var(--lg-border)',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Bar dataKey="relevance" radius={[0, 6, 6, 0]}>
                      {chartData.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              {STATUS_OPTIONS.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_META[s].color }}
                  />
                  <span className={cn('text-[var(--lg-text-secondary)]')}>
                    {STATUS_META[s].label}
                  </span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
