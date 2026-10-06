'use client';

import { Fragment, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ChevronRight,
  Clock3,
  FilePlus2,
  FileText,
  FolderOpen,
  Layers,
  Search,
  Stamp,
  Upload,
} from 'lucide-react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import {
  MOCK_DOCUMENTS,
  type Document as LegalDocument,
  type DocumentStatus,
  type DocumentType,
} from '@/lib/mock-data';

/* -------------------------------------------------------------------------- *
 * Display metadata
 * -------------------------------------------------------------------------- */

const TYPE_META: Record<DocumentType, { label: string; badge: BadgeVariant }> = {
  pleading: { label: 'Pleading', badge: 'lg' },
  contract: { label: 'Contract', badge: 'info' },
  discovery: { label: 'Discovery', badge: 'warning' },
  memo: { label: 'Memo', badge: 'secondary' },
  exhibit: { label: 'Exhibit', badge: 'success' },
};

const STATUS_META: Record<DocumentStatus, { label: string; badge: BadgeVariant }> = {
  draft: { label: 'Draft', badge: 'secondary' },
  review: { label: 'Review', badge: 'warning' },
  final: { label: 'Final', badge: 'info' },
  filed: { label: 'Filed', badge: 'success' },
};

const TYPE_OPTIONS: DocumentType[] = ['pleading', 'contract', 'discovery', 'memo', 'exhibit'];
const STATUS_OPTIONS: DocumentStatus[] = ['draft', 'review', 'final', 'filed'];

const TYPE_COLORS: Record<DocumentType, string> = {
  pleading: '#dc2626',
  contract: '#0ea5e9',
  discovery: '#f59e0b',
  memo: '#64748b',
  exhibit: '#10b981',
};

const DONUT_COLORS = TYPE_OPTIONS.map((t) => TYPE_COLORS[t]);

type StatusFilter = DocumentStatus | 'all';
type TypeFilter = DocumentType | 'all';

/** "filed this month" — rolling 30-day window so the metric stays meaningful. */
function isFiledRecently(date: string): boolean {
  const stamp = new Date(date).getTime();
  if (Number.isNaN(stamp)) return false;
  return Date.now() - stamp <= 30 * 24 * 60 * 60 * 1000;
}

/* -------------------------------------------------------------------------- *
 * Page
 * -------------------------------------------------------------------------- */

export default function DocumentsPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const documents = MOCK_DOCUMENTS;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((doc) => {
      if (type !== 'all' && doc.type !== type) return false;
      if (status !== 'all' && doc.status !== status) return false;
      if (!q) return true;
      return [doc.name, doc.author, doc.matterNumber, doc.folder, ...doc.tags]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [documents, query, type, status]);

  const stats = useMemo(() => {
    const total = documents.length;
    const inReview = documents.filter((d) => d.status === 'review').length;
    const filedThisMonth = documents.filter(
      (d) => d.status === 'filed' && isFiledRecently(d.updatedAt)
    ).length;
    return { total, inReview, filedThisMonth };
  }, [documents]);

  const typeBreakdown = useMemo(
    () =>
      TYPE_OPTIONS.map((t) => ({
        name: TYPE_META[t].label,
        value: documents.filter((d) => d.type === t).length,
      })).filter((slice) => slice.value > 0),
    [documents]
  );

  const toggleRow = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-6">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--lg-text)]">
            Documents
          </h1>
          <p className="mt-1 text-sm text-[var(--lg-text-muted)]">
            Firm-wide repository for pleadings, contracts, discovery, memos and exhibits.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            leftIcon={<FilePlus2 className="h-4 w-4" />}
            onClick={() =>
              toast.success('New document created — draft saved as v1.0.')
            }
          >
            New document
          </Button>
          <Button
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() =>
              toast.success('Upload queued — 1 document added to “Filings / 2026”.')
            }
          >
            Upload document
          </Button>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Total documents"
          value={formatNumber(stats.total)}
          hint="Across every matter folder"
          icon={<FileText className="h-5 w-5" />}
          change={6.4}
          changeLabel="vs last month"
        />
        <MetricCard
          title="In review"
          value={formatNumber(stats.inReview)}
          hint="Awaiting partner sign-off"
          icon={<Stamp className="h-5 w-5" />}
          iconTone="warning"
          delta={`${formatNumber(
            Math.round((stats.inReview / Math.max(stats.total, 1)) * 100)
          )}% of library`}
          deltaTone="warning"
        />
        <MetricCard
          title="Filed this month"
          value={formatNumber(stats.filedThisMonth)}
          hint="Rolling 30-day window"
          icon={<Clock3 className="h-5 w-5" />}
          iconTone="success"
          change={12.5}
          changeLabel="vs prior 30 days"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ── Filters + table ──────────────────────────────────────────── */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Document library</CardTitle>
              <p className="mt-1 text-xs text-[var(--lg-text-muted)]">
                {filtered.length} of {documents.length} documents
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lg-text-muted)]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search documents…"
                  aria-label="Search documents"
                  className="lg-input lg-input-sm pl-9"
                />
              </div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TypeFilter)}
                aria-label="Filter by type"
                className="lg-input lg-input-sm lg-select w-auto"
              >
                <option value="all">All types</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_META[t].label}
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
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="lg-empty">
                <FileText className="h-8 w-8 opacity-60" />
                <p className="lg-empty-title">No documents match those filters</p>
                <p className="lg-empty-description">
                  Try a different search term, or clear the type and status filters.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery('');
                    setType('all');
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
                      <th scope="col">Document</th>
                      <th scope="col">Type</th>
                      <th scope="col">Matter</th>
                      <th scope="col">Author</th>
                      <th scope="col">Version</th>
                      <th scope="col">Status</th>
                      <th scope="col">Size</th>
                      <th scope="col">Tags</th>
                      <th scope="col">Modified</th>
                      <th scope="col" className="lg-table-align-right">
                        <span className="sr-only">Preview</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((doc) => {
                      const isOpen = expandedId === doc.id;
                      return (
                        <Fragment key={doc.id}>
                          <tr
                            onClick={() => toggleRow(doc.id)}
                            className={cn('cursor-pointer', isOpen && 'bg-[var(--lg-surface-muted)]')}
                          >
                            <td className="lg-table-cell-primary max-w-[16rem]">
                              <div className="flex items-start gap-2">
                                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-crimson-600" />
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-[var(--lg-text)]">
                                    {doc.name}
                                  </p>
                                  <p className="mt-0.5 truncate text-xs text-[var(--lg-text-muted)]">
                                    {doc.extension} · {doc.folder}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <Badge variant={TYPE_META[doc.type].badge} size="sm">
                                {TYPE_META[doc.type].label}
                              </Badge>
                            </td>
                            <td>
                              <Link
                                href={`/dashboard/matters?matter=${doc.matterId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-medium text-crimson-600 hover:underline dark:text-crimson-400"
                              >
                                {doc.matterNumber}
                              </Link>
                            </td>
                            <td className="whitespace-nowrap">{doc.author}</td>
                            <td className="whitespace-nowrap font-medium text-[var(--lg-text)]">
                              {doc.version}
                            </td>
                            <td>
                              <Badge variant={STATUS_META[doc.status].badge} dot size="sm">
                                {STATUS_META[doc.status].label}
                              </Badge>
                            </td>
                            <td className="whitespace-nowrap lg-tabular">{doc.size}</td>
                            <td>
                              <div className="flex max-w-[13rem] flex-wrap gap-1">
                                {doc.tags.slice(0, 2).map((tag) => (
                                  <span key={tag} className="lg-chip">
                                    {tag}
                                  </span>
                                ))}
                                {doc.tags.length > 2 && (
                                  <span className="lg-chip">+{doc.tags.length - 2}</span>
                                )}
                              </div>
                            </td>
                            <td className="whitespace-nowrap">
                              {formatDate(doc.updatedAt)}
                            </td>
                            <td className="lg-table-align-right">
                              <button
                                type="button"
                                aria-expanded={isOpen}
                                aria-label={`${isOpen ? 'Collapse' : 'Expand'} preview for ${doc.name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRow(doc.id);
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
                              <td colSpan={10} className="!p-0">
                                <DocumentPreview doc={doc} />
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

        {/* ── Type donut ───────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Documents by type</CardTitle>
            <Badge variant="outline" size="sm">
              {documents.length} total
            </Badge>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={86}
                    paddingAngle={3}
                    strokeWidth={2}
                    stroke="var(--lg-surface)"
                  >
                    {typeBreakdown.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      `${formatNumber(Number(value))} docs`,
                      name,
                    ]}
                  />
                  <Legend iconType="circle" iconSize={9} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-2">
              {typeBreakdown.map((slice, index) => (
                <div key={slice.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                  />
                  <span className="flex-1 text-[var(--lg-text-secondary)]">{slice.name}</span>
                  <span className="font-semibold text-[var(--lg-text)] lg-tabular">
                    {slice.value}
                  </span>
                  <span className="w-10 text-right text-[var(--lg-text-muted)] lg-tabular">
                    {Math.round((slice.value / Math.max(documents.length, 1)) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- *
 * Expandable preview panel
 * -------------------------------------------------------------------------- */

function DocumentPreview({ doc }: { doc: LegalDocument }) {
  return (
    <div className="grid gap-6 border-t border-[var(--lg-border)] p-5 md:grid-cols-3">
      <div className="md:col-span-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={TYPE_META[doc.type].badge} size="sm">
            {TYPE_META[doc.type].label}
          </Badge>
          <Badge variant={STATUS_META[doc.status].badge} size="sm">
            {STATUS_META[doc.status].label}
          </Badge>
          <span className="lg-chip">{doc.version}</span>
          <span className="lg-chip">{doc.pages} pages</span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[var(--lg-text-secondary)]">
          {doc.description}
        </p>

        {/* Faux page thumbnail */}
        <div className="mt-4 rounded-xl border border-[var(--lg-border)] bg-[var(--lg-surface)] p-4 shadow-[var(--lg-shadow-sm)]">
          <div className="space-y-2">
            <div className="h-2.5 w-1/3 rounded-full bg-crimson-600/25" />
            <div className="h-2 w-full rounded-full bg-[var(--lg-surface-sunken)]" />
            <div className="h-2 w-11/12 rounded-full bg-[var(--lg-surface-sunken)]" />
            <div className="h-2 w-4/5 rounded-full bg-[var(--lg-surface-sunken)]" />
            <div className="h-2 w-2/3 rounded-full bg-[var(--lg-surface-sunken)]" />
            <div className="pt-2">
              <div className="h-2 w-10/12 rounded-full bg-[var(--lg-surface-sunken)]" />
              <div className="mt-2 h-2 w-full rounded-full bg-[var(--lg-surface-sunken)]" />
            </div>
          </div>
          <p className="mt-3 text-2xs uppercase tracking-wider text-[var(--lg-text-muted)]">
            {doc.extension} · {doc.size} · page 1 of {doc.pages}
          </p>
        </div>
      </div>

      <dl className="space-y-3 text-sm">
        <PreviewField label="Matter">
          <Link
            href={`/dashboard/matters?matter=${doc.matterId}`}
            className="font-medium text-crimson-600 hover:underline dark:text-crimson-400"
          >
            {doc.matterNumber}
          </Link>
        </PreviewField>
        <PreviewField label="Author">{doc.author}</PreviewField>
        <PreviewField label="Folder">
          <span className="inline-flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            {doc.folder}
          </span>
        </PreviewField>
        <PreviewField label="Version">{doc.version}</PreviewField>
        <PreviewField label="Size">
          {doc.size} · {doc.pages} pages
        </PreviewField>
        <PreviewField label="Last modified">{formatDate(doc.updatedAt, 'MMMM d, yyyy')}</PreviewField>
        <PreviewField label="Tags">
          <span className="flex flex-wrap gap-1">
            {doc.tags.map((tag) => (
              <span key={tag} className="lg-chip">
                {tag}
              </span>
            ))}
          </span>
        </PreviewField>
        <div className="flex items-center gap-2 pt-1">
          <Layers className="h-4 w-4 text-crimson-600" />
          <span className="text-xs text-[var(--lg-text-muted)]">
            {doc.version} · {doc.starred ? 'Starred' : 'Not starred'}
          </span>
        </div>
      </dl>
    </div>
  );
}

function PreviewField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-xs uppercase tracking-wider text-[var(--lg-text-muted)]">
        {label}
      </dt>
      <dd className="text-right text-[var(--lg-text-secondary)]">{children}</dd>
    </div>
  );
}
