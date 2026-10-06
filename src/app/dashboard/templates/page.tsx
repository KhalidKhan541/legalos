'use client';

import { useMemo, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import {
  Crown,
  Eye,
  Hash,
  LayoutTemplate,
  Search,
  Wand2,
} from 'lucide-react';

import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate, getInitials, formatNumber } from '@/lib/utils';
import {
  MOCK_TEMPLATES,
  type DocumentType,
  type Template,
} from '@/lib/mock-data';

/* -------------------------------------------------------------------------- *
 * Display metadata
 * -------------------------------------------------------------------------- */

const TYPE_BADGE: Record<DocumentType, BadgeVariant> = {
  pleading: 'lg',
  contract: 'info',
  discovery: 'warning',
  memo: 'secondary',
  exhibit: 'success',
};

const TYPE_LABEL: Record<DocumentType, string> = {
  pleading: 'Pleading',
  contract: 'Contract',
  discovery: 'Discovery',
  memo: 'Memo',
  exhibit: 'Exhibit',
};

const ACCENT_BY_TYPE: Record<DocumentType, string> = {
  pleading: '#dc2626',
  contract: '#0ea5e9',
  discovery: '#f59e0b',
  memo: '#64748b',
  exhibit: '#10b981',
};

export default function TemplatesPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const templates = MOCK_TEMPLATES;

  const categories = useMemo(
    () => Array.from(new Set(templates.map((t) => t.category))).sort(),
    [templates]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((tpl) => {
      if (category !== 'all' && tpl.category !== category) return false;
      if (!q) return true;
      return [tpl.name, tpl.description, tpl.author, tpl.jurisdiction, ...tpl.tags]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [templates, query, category]);

  const totalUses = useMemo(
    () => templates.reduce((sum, tpl) => sum + tpl.uses, 0),
    [templates]
  );

  const useTemplate = (tpl: Template) =>
    toast.success(`“${tpl.name}” instantiated — new draft created from ${tpl.version}.`);

  const previewTemplate = (tpl: Template) =>
    toast(`Previewing ${tpl.name} · ${tpl.fields.length} merge fields`, {
      icon: '👁️',
    });

  return (
    <div className="space-y-6">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--lg-text)]">
            Templates
          </h1>
          <p className="mt-1 text-sm text-[var(--lg-text-muted)]">
            Reusable firm forms with merge fields — drop one into a matter and fill the blanks.
          </p>
        </div>
        <Button
          leftIcon={<Wand2 className="h-4 w-4" />}
          onClick={() => toast.success('Template builder opened — blank template created.')}
        >
          New template
        </Button>
      </div>

      {/* ── Summary + filters ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-[var(--lg-border)] bg-[var(--lg-surface)] px-5 py-3.5 text-sm shadow-[var(--lg-shadow-sm)]">
        <SummaryItem icon={<LayoutTemplate className="h-4 w-4" />} label="Templates" value={formatNumber(templates.length)} />
        <SummaryItem
          icon={<Hash className="h-4 w-4" />}
          label="Times used"
          value={formatNumber(totalUses)}
        />
        <SummaryItem
          icon={<Crown className="h-4 w-4" />}
          label="Most used"
          value={
            templates.reduce((best, tpl) => (tpl.uses > best.uses ? tpl : best), templates[0])
              ?.name ?? '—'
          }
          truncate
        />

        <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-60 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lg-text-muted)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates…"
              aria-label="Search templates"
              className="lg-input lg-input-sm pl-9"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="lg-input lg-input-sm lg-select w-auto"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Gallery ────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="lg-empty">
            <LayoutTemplate className="h-8 w-8 opacity-60" />
            <p className="lg-empty-title">No templates match that search</p>
            <p className="lg-empty-description">
              Try another keyword, or switch back to all categories.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setQuery('');
                setCategory('all');
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tpl) => (
            <Card key={tpl.id} className="flex flex-col">
              <CardHeader className="flex-col items-start gap-2 border-b-0 px-5 pb-0 pt-5">
                <div className="flex w-full items-start justify-between gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${ACCENT_BY_TYPE[tpl.type]}1a`,
                      color: ACCENT_BY_TYPE[tpl.type],
                    }}
                  >
                    <LayoutTemplate className="h-5 w-5" />
                  </span>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Badge variant={TYPE_BADGE[tpl.type]} size="sm">
                      {TYPE_LABEL[tpl.type]}
                    </Badge>
                    {tpl.premium && (
                      <Badge variant="warning" size="sm" icon={<Crown className="h-3 w-3" />}>
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-1 w-full">
                  <CardTitle className="text-base leading-snug">{tpl.name}</CardTitle>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[var(--lg-text-muted)]">
                    {tpl.description}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col px-5 pb-5 pt-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="lg-chip">{tpl.category}</span>
                  <span className="lg-chip">{tpl.jurisdiction}</span>
                  {tpl.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="lg-chip">
                      {tag}
                    </span>
                  ))}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                  <Meta label="Used" value={`${formatNumber(tpl.uses)}×`} />
                  <Meta label="Version" value={tpl.version} />
                  <Meta label="Updated" value={formatDate(tpl.updatedAt)} />
                  <Meta label="Last used" value={tpl.lastUsed ? formatDate(tpl.lastUsed) : 'Never'} />
                </dl>

                <div className="mt-4 flex items-center gap-2 border-t border-[var(--lg-border)] pt-4">
                  <span className="lg-avatar lg-avatar-sm" aria-hidden="true">
                    {getInitials(tpl.author)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-[var(--lg-text-secondary)]">
                    {tpl.author}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" className="flex-1" onClick={() => useTemplate(tpl)}>
                    Use template
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Eye className="h-4 w-4" />}
                    onClick={() => previewTemplate(tpl)}
                  >
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-[var(--lg-text-muted)]">
        Showing {filtered.length} of {templates.length} templates ·{' '}
        {formatNumber(totalUses)} lifetime uses
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- *
 * Small helpers
 * -------------------------------------------------------------------------- */

function SummaryItem({
  icon,
  label,
  value,
  truncate = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  truncate?: boolean;
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
        <p
          className={`truncate text-sm font-semibold text-[var(--lg-text)] ${
            truncate ? 'max-w-[14rem]' : ''
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-[var(--lg-text-secondary)]">{value}</dd>
    </div>
  );
}
