import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Button variant vocabulary (crimson-first, matching `--lg-primary`):
 * - `primary`  — crimson `#dc2626`, the default call-to-action
 * - `secondary`— neutral bordered surface button
 * - `ghost`    — transparent, for toolbars and dense UIs
 * - `danger`   — destructive actions (deeper crimson)
 * - `outline`  — crimson border on a transparent fill
 * - `gradient` — crimson gradient, for hero moments
 */
export const buttonVariants = cva(
  [
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium',
    'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lg-primary-ring)]',
    'disabled:pointer-events-none disabled:opacity-50 active:translate-y-px',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-[#dc2626] text-white shadow-[0_1px_2px_rgba(220,38,38,0.35)] hover:bg-[#b91c1c]',
        secondary:
          'border border-[var(--lg-border-strong)] bg-[var(--lg-surface)] text-[var(--lg-text)] shadow-[var(--lg-shadow-sm)] hover:bg-[var(--lg-surface-muted)] hover:border-[var(--lg-text-muted)]',
        ghost:
          'bg-transparent text-[var(--lg-text-secondary)] hover:bg-[var(--lg-surface-muted)] hover:text-[var(--lg-text)]',
        danger:
          'bg-red-600 text-white shadow-[0_1px_2px_rgba(220,38,38,0.35)] hover:bg-red-700',
        outline:
          'border border-[#dc2626] bg-transparent text-[#dc2626] hover:bg-red-500/10 dark:hover:bg-red-500/15',
        gradient:
          'bg-gradient-to-r from-[#dc2626] via-[#e11d48] to-[#f43f5e] text-white shadow-[0_2px_10px_-2px_rgba(220,38,38,0.55)] hover:brightness-110',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
        xl: 'h-12 px-8 text-lg',
      },
      /** Square icon-only button — pair with `size` for the hit area. */
      icon: {
        true: 'aspect-square p-0',
      },
    },
    compoundVariants: [
      { size: 'sm', icon: true, class: 'h-8 w-8 px-0' },
      { size: 'md', icon: true, class: 'h-9 w-9 px-0' },
      { size: 'lg', icon: true, class: 'h-11 w-11 px-0' },
      { size: 'xl', icon: true, class: 'h-12 w-12 px-0' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Renders a spinner and blocks interaction. */
  loading?: boolean;
  /** Node rendered before the label (hidden while loading). */
  leftIcon?: React.ReactNode;
  /** Node rendered after the label (hidden while loading). */
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      type,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cn(buttonVariants({ variant, size, icon }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-90"
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  )
);
Button.displayName = 'Button';

export default Button;
