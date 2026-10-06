'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BookOpen,
  BookmarkPlus,
  Building2,
  CalendarDays,
  Gavel,
  Link2,
  Search,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate, formatNumber } from '@/lib/utils';
import { MOCK_MATTERS, MOCK_PRECEDENTS, type Precedent } from '@/lib/mock-data';

/* -------------------------------------------------------------------------- *
 * Display metadata
 * -------------------------------------------------------------------------- */

const FAVOR_META: Record<
  Precedent['favorability'],
  { label: string; badge: BadgeVariant; color: string }
> = {
  favorable: { label: 'Favorable', badge: 'success', color: '#10b981' },
  neutral: { label: 'Neutral', badge: 'secondary', color: '#64748b' },
  adverse: { label: 'Unfavorable', badge: 'danger', color: '#dc2626' },
};

/**
 * Precedents are linked to matters through the shared practice-area vocabulary —
 * the same value drives matter filters across the rest of the dashboard.
 */
const linkedMatters = (practiceArea: string) =>
  MOCK_MATTERS.filter((m) => m.practiceArea === practiceArea);

export default function PrecedentsPage() {
  const [query, setQuery] = useState('');
  const [practiceArea, setPracticeArea] = useState('all');

  const precedents = MOCK_PRECEDENTS;

  const practiceAreas = useMemo(
    () => Array.from(new Set(precedents.map((p) => p.practiceArea))).sort(),
    [precedents]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return precedents.filter((item) => {
      if (practiceArea !== 'all' && item.practiceArea !== practiceArea) return false;
      if (!q) return true;
      return [
        item.title,
        item.citation,
        item.court,
        item.jurisdiction,
        item.holding,
        item.summary,
        ...item.tags,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [precedents, query, practiceArea]);

  const byYear = useMemo(() => {
    const counts = new Map<number, number>();
    precedents.forEach((p) => counts.set(p.year, (counts.get(p.year) ?? 0) + 1));
    return [...counts.entries()]
      .sort(([a], [b]) => a - b)
      .map(([year, count]) => ({ year: String(year), count }));
  }, [precedents]);

  const totalLinkedMatters = useMemo(
    () => new Set(precedents.flatMap((p) => linkedMatters(p.practiceArea).map((m) => m.id))).size,
    [precedents]
  );

  return (
    <div className="space-y-6">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--lg-text)]">
            Precedents
          </h1>
          <p className="mt-1 text-sm text-[var(--lg-text-muted)]">
            Case law the firm relies on — holdings, treatment and how they map to live matters.
          </p>
        </div>
        <Button
          leftIcon={<BookmarkPlus className="h-4 w-4" />}
          onClick={() =>
            toast.success('Precedent saved — added to the firm knowledge library.')
          }
        >
          Save precedent
        </Button>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-[var(--lg-border)] bg-[var(--lg-surface)] px-5 py-3.5 shadow-[var(--lg-shadow-sm)]">
        <SummaryItem
          icon={<BookOpen className="h-4 w-4" />}
          label="Precedents"
          value={formatNumber(precedents.length)}
        />
        <SummaryItem
          icon={<Link2 className="h-4 w-4" />}
          label="Linked matters"
          value={formatNumber(totalLinkedMatters)}
        />
        <SummaryItem
          icon={<Gavel className="h-4 w-4" />}
          label="Favorable"
          value={formatNumber(
            precedents.filter((p) => p.favorability === 'favorable').length
          )}
        />

        <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-60 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lg-text-muted)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cases, citations, holdings…"
              aria-label="Search precedents"
              className="lg-input lg-input-sm pl-9"
            />
          </div>
          <select
            value={practiceArea}
            onChange={(e) => setPracticeArea(e.target.value)}
            aria-label="Filter by practice area"
            className="lg-input lg-input-sm lg-select w-auto"
          >
            <option value="all">All practice areas</option>
            {practiceAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ── Precedent cards ──────────────────────────────────────────── */}
        <div className="space-y-5 xl:col-span-2">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="lg-empty">
                <BookOpen className="h-8 w-8 opacity-60" />
                <p className="lg-empty-title">No precedents match</p>
                <p className="lg-empty-description">
                  Try another case name or citation, or switch back to all practice areas.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery('');
                    setPracticeArea('all');
                  }}
                >
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            filtered.map((item) => {
              const matters = linkedMatters(item.practiceArea);
              const favor = FAVOR_META[item.favorability];

              return (
                <Card key={item.id}>
                  <CardHeader className="items-start">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base leading-snug">
                        {item.title}
                      </CardTitle>
                      <p className="mt-1 font-medium italic text-[var(--lg-text-secondary)]">
                        {item.citation}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--lg-text-muted)]">
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          {item.court}
                        </span>
                        <span className="inline-flex items-center gap-1.5 lg-tabular">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {item.year}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Gavel className="h-3.5 w-3.5" />
                          {item.jurisdiction}
                        </span>
                      </p>
                    </div>
                    <Badge variant={favor.badge} dot size="md">
                      {favor.label}
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-4 p-5 pt-4">
                    <div>
                      <p className="text-sm leading-relaxed text-[var(--lg-text-secondary)]">
                        {item.summary}
                      </p>
                      <div className="mt-3 rounded-xl border border-[var(--lg-border)] bg-[var(--lg-surface-muted)] p-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
                          Holding
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--lg-text)]">
                          {item.holding}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
                        Why it matters
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--lg-text-secondary)]">
                        {item.whyItMatters}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="lg" size="sm">
                        {item.practiceArea}
                      </Badge>
                      {item.tags.map((tag) => (
                        <span key={tag} className="lg-chip">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--lg-border)] pt-4 text-xs text-[var(--lg-text-muted)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Link2 className="h-3.5 w-3.5" />
                        <Link
                          href={`/dashboard/matters?practiceArea=${encodeURIComponent(
                            item.practiceArea
                          )}`}
                          className="font-medium text-crimson-600 hover:underline dark:text-crimson-400"
                        >
                          {matters.length} linked matter{matters.length === 1 ? '' : 's'}
                        </Link>
                      </span>
                      <span className="lg-tabular">
                        Reused {item.reused}× · saved by {item.savedBy} on{' '}
                        {formatDate(item.savedAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* ── Citations by year ────────────────────────────────────────── */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Citations by year</CardTitle>
              <Badge variant="outline" size="sm">
                {byYear.length} years
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={byYear}
                    margin={{ top: 8, right: 8, left: -20, bottom: 4 }}
                    barSize={30}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--lg-border)"
                    />
                    <XAxis
                      dataKey="year"
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
                      formatter={(value) => [formatNumber(Number(value)), 'Authorities']}
                      contentStyle={{
                        background: 'var(--lg-surface)',
                        border: '1px solid var(--lg-border)',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" name="Citations" radius={[6, 6, 0, 0]}>
                      {byYear.map((entry) => (
                        <Cell key={entry.year} fill="#dc2626" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-2">
                {(() => {
                  const maxCount = Math.max(...byYear.map((y) => y.count), 1);
                  return byYear.map((entry) => (
                    <div key={entry.year} className="flex items-center gap-2 text-xs">
                      <span className="w-10 font-medium text-[var(--lg-text-secondary)] lg-tabular">
                        {entry.year}
                      </span>
                      <div className="lg-progress flex-1">
                        <div
                          className="lg-progress-bar"
                          style={{
                            width: `${Math.round((entry.count / maxCount) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-5 text-right font-semibold text-[var(--lg-text)] lg-tabular">
                        {entry.count}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Favorability mix */}
          <Card>
            <CardHeader>
              <CardTitle>Favorability mix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              {(['favorable', 'neutral', 'adverse'] as const).map((key) => {
                const count = precedents.filter((p) => p.favorability === key).length;
                const share = Math.round((count / Math.max(precedents.length, 1)) * 100);
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-[var(--lg-text-secondary)]">
                        {FAVOR_META[key].label}
                      </span>
                      <span className="font-semibold text-[var(--lg-text)] lg-tabular">
                        {count} · {share}%
                      </span>
                    </div>
                    <div className="lg-progress">
                      <div
                        className="lg-progress-bar"
                        style={{
                          width: `${share}%`,
                          backgroundColor: FAVOR_META[key].color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-crimson-600/10 text-crimson-600">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-[var(--lg-text)]">{value}</p>
      </div>
    </div>
  );
}
