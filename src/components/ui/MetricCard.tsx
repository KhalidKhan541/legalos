import * as React from 'react';

import { cn } from '@/lib/utils';

import { Card } from './Card';

/** Semantic tone for the change pill and the icon tile. */
export type MetricTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

const TONE_TEXT: Record<MetricTone, string> = {
  success: 'text-emerald-600 dark:text-emerald-300',
  danger: 'text-red-600 dark:text-red-300',
  warning: 'text-amber-600 dark:text-amber-300',
  info: 'text-sky-600 dark:text-sky-300',
  neutral: 'text-slate-600 dark:text-slate-300',
};

const TONE_BG: Record<MetricTone, string> = {
  success: 'bg-emerald-500/10',
  danger: 'bg-red-500/10',
  warning: 'bg-amber-500/10',
  info: 'bg-sky-500/10',
  neutral: 'bg-slate-500/10',
};

/** Crimson is the default icon tile tone (matches the brand accent). */
const ACCENT_BG = 'bg-crimson-600/10';
const ACCENT_TEXT = 'text-crimson-600';

export interface MetricCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'value'> {
  /** Small uppercase headline above the value. */
  title?: string;
  /** Alias for `title` (either may be supplied). */
  label?: string;
  /** The big number / formatted value. */
  value: React.ReactNode;
  /** Optional secondary line rendered directly under the value. */
  subvalue?: React.ReactNode;
  /** Muted supporting copy at the bottom of the card. */
  hint?: string;
  /** Icon slot — any node (usually `<Icon className="h-5 w-5" />`). */
  icon?: React.ReactNode;
  /** Tone of the icon tile. Defaults to the crimson accent. */
  iconTone?: MetricTone | 'accent';
  /** Pill text shown next to the value, e.g. "12% vs last week". */
  delta?: string;
  /** Explicit tone for the pill. */
  deltaTone?: MetricTone;
  /** Alternative pill payload — a number becomes a signed percentage. */
  change?: string | number;
  /** Leading caption inside the pill, e.g. "vs prior 7 days". */
  changeLabel?: string;
  /**
   * Whether an increase is a good thing (default `true`).
   * Drives the pill tone when only a numeric `change` is supplied:
   * `+12%` with `positiveIsGood` → green, with `positiveIsGood={false}` → red.
   */
  positiveIsGood?: boolean;
  /** Extra content pinned below the hint (chart, links, meta…). */
  footer?: React.ReactNode;
  /** Renders shimmer placeholders (`lg-skeleton`) instead of the content. */
  loading?: boolean;
}

function formatChange(change: string | number): string {
  if (typeof change === 'number') {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(Math.abs(change) % 1 === 0 ? 0 : 1)}%`;
  }
  return change;
}

/** Resolves the pill tone from whichever props the caller supplied. */
function resolveTone({
  deltaTone,
  change,
  positiveIsGood = true,
}: {
  deltaTone?: MetricTone;
  change?: string | number;
  positiveIsGood?: boolean;
}): MetricTone {
  if (deltaTone) return deltaTone;
  if (typeof change === 'number') {
    if (change === 0) return 'neutral';
    const good = change > 0 ? positiveIsGood : !positiveIsGood;
    return good ? 'success' : 'danger';
  }
  return 'neutral';
}

/** Shimmer placeholder built from the `lg-skeleton` primitives. */
function Skeleton({ className }: { className?: string }) {
  return (
    <span className={cn('lg-skeleton block', className)} aria-hidden="true" />
  );
}

export function MetricCard({
  title,
  label,
  value,
  subvalue,
  hint,
  icon,
  iconTone = 'accent',
  delta,
  deltaTone,
  change,
  changeLabel,
  positiveIsGood = true,
  footer,
  loading = false,
  className,
  ...props
}: MetricCardProps) {
  const headline = title ?? label;
  const pillText = change !== undefined ? formatChange(change) : delta;
  const pillTone = resolveTone({ deltaTone, change, positiveIsGood });

  const isAccent = iconTone === 'accent';
  const toneKey: MetricTone = iconTone === 'accent' ? 'neutral' : iconTone;

  return (
    <Card className={cn('p-5', className)} {...props}>
      {loading ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {headline && (
                <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-[var(--lg-text-muted)]">
                  {headline}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <p className="text-2xl font-semibold tracking-tight text-[var(--lg-text)]">
                  {value}
                </p>
                {subvalue && (
                  <span className="text-xs font-medium text-[var(--lg-text-secondary)]">
                    {subvalue}
                  </span>
                )}
              </div>
            </div>

            {icon && (
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  isAccent ? ACCENT_BG : TONE_BG[toneKey],
                  isAccent ? ACCENT_TEXT : TONE_TEXT[toneKey]
                )}
              >
                {icon}
              </span>
            )}
          </div>

          {pillText !== undefined && pillText !== null && pillText !== '' && (
            <div className="mt-3">
              <span
                className={cn(
                  'inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                  TONE_BG[pillTone],
                  TONE_TEXT[pillTone]
                )}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                {changeLabel && (
                  <span className="truncate font-medium opacity-80">
                    {changeLabel}
                  </span>
                )}
                <span className="truncate">{pillText}</span>
              </span>
            </div>
          )}

          {hint && (
            <p className="mt-2 text-xs text-[var(--lg-text-muted)]">{hint}</p>
          )}

          {footer && <div className="mt-3">{footer}</div>}
        </>
      )}
    </Card>
  );
}

MetricCard.displayName = 'MetricCard';

export default MetricCard;
