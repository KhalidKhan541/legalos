import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'secondary'
  | 'lg'
  | 'outline';

export type BadgeSize = 'sm' | 'md' | 'lg';

const badgeVariants = cva(
  'inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full border font-medium',
  {
    variants: {
      variant: {
        default:
          'border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300',
        secondary:
          'border-slate-300 bg-slate-200/70 text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-300',
        success:
          'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300',
        warning:
          'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
        danger:
          'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300',
        info: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300',
        /** Brand — crimson `#dc2626`. */
        lg: 'border-crimson-600/30 bg-crimson-600/10 text-crimson-700 dark:border-crimson-500/40 dark:bg-crimson-500/20 dark:text-crimson-300',
        outline:
          'border-[var(--lg-border-strong)] bg-transparent text-[var(--lg-text-secondary)] dark:bg-transparent',
      },
      size: {
        sm: 'px-2 py-px text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>,
    VariantProps<typeof badgeVariants> {
  children?: React.ReactNode;
  /** Leading status dot (color follows the variant tone). */
  dot?: boolean;
  /** Optional leading node (icon, avatar, …). */
  icon?: React.ReactNode;
}

export function Badge({
  className,
  variant,
  size,
  dot,
  icon,
  children,
  ...props
}: BadgeProps) {
  // Callers may tone a badge through the `lg-badge-*` component classes from
  // globals.css. Those live in the components layer, so utility-based variant
  // tones would win the cascade and wash the intended color out — suppress the
  // variant tones (cva `null`) whenever such a class is supplied.
  const hasSnippetTone = /(?:^|\s)lg-badge-/.test(className ?? '');

  return (
    <span
      className={cn(
        badgeVariants({ variant: hasSnippetTone ? null : variant, size }),
        className
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70"
        />
      )}
      {icon}
      {children}
    </span>
  );
}

Badge.displayName = 'Badge';

export default Badge;
