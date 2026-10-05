import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Card surface variants:
 * - `default`    — bordered surface with the standard soft shadow
 * - `outlined`   — no fill/shadow, emphasis on the border
 * - `elevated`   — floating surface with a deeper shadow
 * - `interactive`— hover lift for clickable surfaces
 * - `gradient`   — crimson gradient panel; overrides the border/text CSS
 *   variables locally so header/footer/dividers adapt automatically.
 *
 * The body (`CardContent`) is intentionally **un-padded** — pages wrap their
 * content in `p-5` (or whatever density the layout needs).
 */
export const cardVariants = cva(
  'relative rounded-2xl border bg-[var(--lg-surface)] text-[var(--lg-text)]',
  {
    variants: {
      variant: {
        default: 'border-[var(--lg-border)] shadow-[var(--lg-shadow-sm)]',
        outlined:
          'border-[var(--lg-border-strong)] bg-transparent shadow-none dark:bg-transparent',
        elevated: 'border-transparent shadow-[var(--lg-shadow-lg)]',
        interactive:
          'cursor-pointer border-[var(--lg-border)] shadow-[var(--lg-shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--lg-border-strong)] hover:shadow-[var(--lg-shadow-md)]',
        gradient:
          'border-transparent bg-gradient-to-br from-[#dc2626] via-[#b91c1c] to-[#7f1d1d] text-white shadow-[var(--lg-shadow-lg)] [--lg-border:rgba(255,255,255,0.22)] [--lg-border-strong:rgba(255,255,255,0.32)] [--lg-text:rgba(255,255,255,0.96)] [--lg-text-muted:rgba(255,255,255,0.78)] [--lg-surface:transparent]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, children, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props}>
      {children}
    </div>
  )
);
Card.displayName = 'Card';

export const CardHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-wrap items-center justify-between gap-4 border-b border-[var(--lg-border)] px-5 py-4',
      className
    )}
    {...props}
  />
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn('text-sm font-semibold tracking-tight', className)}
    {...props}
  />
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn('text-xs text-[var(--lg-text-muted)]', className)}
    {...props}
  />
);
CardDescription.displayName = 'CardDescription';

/** Un-padded body — add `p-5` (or similar) at the page level. */
export const CardContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={className} {...props} />
);
CardContent.displayName = 'CardContent';

export const CardFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-wrap items-center justify-between gap-4 border-t border-[var(--lg-border)] px-5 py-3',
      className
    )}
    {...props}
  />
);
CardFooter.displayName = 'CardFooter';

export default Card;
