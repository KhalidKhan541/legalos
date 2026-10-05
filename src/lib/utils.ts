import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  format,
  formatDistanceToNow,
  isValid,
  parseISO,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from 'date-fns';

/**
 * Merge Tailwind-compatible class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with compact notation when appropriate.
 * formatNumber(1234) -> "1,234"
 * formatNumber(15400, { compact: true }) -> "15.4K"
 */
export function formatNumber(
  value: number | null | undefined,
  options: Intl.NumberFormatOptions & { compact?: boolean } = {}
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';

  const { compact, ...rest } = options;

  if (compact) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
      ...rest,
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    ...rest,
  }).format(value);
}

/**
 * Format a number as USD currency.
 * formatCurrency(1500) -> "$1,500.00"
 */
export function formatCurrency(
  value: number | null | undefined,
  options: {
    currency?: string;
    cents?: boolean;
    compact?: boolean;
    signed?: boolean;
  } = {}
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';

  const { currency = 'USD', cents = true, compact = false, signed = false } = options;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
    notation: compact ? 'compact' : 'standard',
    signDisplay: signed ? 'exceptZero' : 'auto',
  }).format(value);

  return formatted;
}

/**
 * Format a ratio or raw number as a percentage.
 * formatPercent(0.1234) -> "12.3%"
 * formatPercent(87.5, { alreadyPercent: true }) -> "87.5%"
 */
export function formatPercent(
  value: number | null | undefined,
  options: {
    decimals?: number;
    alreadyPercent?: boolean;
    signed?: boolean;
  } = {}
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';

  const { decimals = 1, alreadyPercent = false, signed = false } = options;
  const ratio = alreadyPercent ? value / 100 : value;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: signed ? 'exceptZero' : 'auto',
  }).format(ratio);

  return formatted;
}

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;

  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'number') {
    date = new Date(value);
  } else {
    const parsed = parseISO(value);
    date = isValid(parsed) ? parsed : new Date(value);
  }

  return isValid(date) ? date : null;
}

/**
 * Nullable-safe date formatting.
 * formatDate(null) -> "—"
 * formatDate("2026-10-05") -> "Oct 5, 2026"
 */
export function formatDate(
  value: Date | string | number | null | undefined,
  pattern = 'MMM d, yyyy',
  fallback = '—'
): string {
  const date = toDate(value);
  if (!date) return fallback;
  try {
    return format(date, pattern);
  } catch {
    return fallback;
  }
}

/**
 * Format a date with a relative descriptor.
 * formatRelative(-3 days) -> "3 days ago"
 */
export function formatRelative(
  value: Date | string | number | null | undefined,
  fallback = '—'
): string {
  const date = toDate(value);
  if (!date) return fallback;

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);

  // Under a minute → just now
  if (absMs < 60_000) return 'just now';

  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return fallback;
  }
}

/**
 * Returns a stable, unique-ish id. Uses crypto when available.
 */
export function generateId(prefix = 'lg'): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  return `${prefix}_${random}`;
}

/**
 * Extract initials from a full name.
 * getInitials("Ada Lovelace") -> "AL"
 */
export function getInitials(name: string | null | undefined, max = 2): string {
  if (!name || !name.trim()) return '—';

  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, max).toUpperCase();

  return parts
    .slice(0, max)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/**
 * Format a decimal-hour duration into "6h 30m".
 * formatDuration(6.5) -> "6h 30m"
 * formatDuration(45)   -> "45m"
 */
export function formatDuration(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || Number.isNaN(hours)) return '—';

  const totalMinutes = Math.round(Math.abs(hours) * 60);
  const sign = hours < 0 ? '-' : '';

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0 && m === 0) return `${sign}0h`;
  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
}

/**
 * Human-friendly time distance in days/hours/minutes.
 * formatDurationFromDates(start, end)
 */
export function formatDurationFromDates(
  start: Date | string | number | null | undefined,
  end: Date | string | number | null | undefined = new Date()
): string {
  const a = toDate(start);
  const b = toDate(end);
  if (!a || !b) return '—';

  const days = differenceInDays(b, a);
  if (Math.abs(days) >= 1) return `${Math.abs(days)}d`;

  const hours = differenceInHours(b, a);
  if (Math.abs(hours) >= 1) return `${Math.abs(hours)}h`;

  const minutes = differenceInMinutes(b, a);
  return `${Math.abs(minutes)}m`;
}

/**
 * Truncate text with an ellipsis.
 */
export function truncate(
  text: string | null | undefined,
  maxLength = 80,
  suffix = '…'
): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}${suffix}`;
}

/**
 * Title-case a string.
 */
export function titleCase(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/(^|\s|_)(\w)/g, (_m, pre, chr) => `${pre}${chr.toUpperCase()}`);
}

/**
 * Replace underscores/hyphens with spaces.
 */
export function humanize(value: string | null | undefined): string {
  if (!value) return '';
  return titleCase(value.replace(/[_-]+/g, ' '));
}
