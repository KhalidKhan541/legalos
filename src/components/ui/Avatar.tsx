import * as React from 'react';

import { cn, getInitials } from '@/lib/utils';

export { getInitials };

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarPresence = 'online' | 'away' | 'busy' | 'offline';

const SIZE_STYLES: Record<
  AvatarSize,
  { root: string; text: string; dot: string }
> = {
  xs: {
    root: 'h-6 w-6',
    text: 'text-[9px]',
    dot: 'h-1.5 w-1.5 -bottom-0.5 -right-0.5 border',
  },
  sm: {
    root: 'h-8 w-8',
    text: 'text-[10px]',
    dot: 'h-2 w-2 -bottom-0.5 -right-0.5 border',
  },
  md: {
    root: 'h-10 w-10',
    text: 'text-xs',
    dot: 'h-2.5 w-2.5 -bottom-0.5 -right-0.5 border-[1.5px]',
  },
  lg: {
    root: 'h-12 w-12',
    text: 'text-sm',
    dot: 'h-3 w-3 -bottom-0.5 -right-0.5 border-2',
  },
  xl: {
    root: 'h-16 w-16',
    text: 'text-base',
    dot: 'h-3.5 w-3.5 -bottom-0.5 -right-0.5 border-2',
  },
};

/** Deterministic palette — the name hash picks the tone. */
const HASH_TONES = [
  'bg-crimson-600',
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-600',
  'bg-sky-600',
  'bg-violet-500',
  'bg-teal-600',
  'bg-orange-500',
  'bg-indigo-500',
  'bg-fuchsia-500',
] as const;

const PRESENCE_TONES: Record<AvatarPresence, string> = {
  online: 'bg-emerald-500',
  away: 'bg-amber-500',
  busy: 'bg-red-500',
  offline: 'bg-slate-400',
};

/** Stable string hash used to auto-color avatars. */
export function hashAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return HASH_TONES[Math.abs(hash) % HASH_TONES.length];
}

export interface AvatarProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Optional image URL; falls back to initials when absent or empty. */
  src?: string | null;
  /** Image alt text (also used as the accessible label). */
  alt?: string;
  /** Display name — drives initials and the automatic color hash. */
  name?: string;
  /** Explicit initials override. */
  fallback?: string;
  /** Explicit background color (hex/class). Skips the hash tone. */
  color?: string;
  size?: AvatarSize;
  /** Presence indicator shown in the bottom-right corner. */
  presence?: AvatarPresence;
}

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  (
    {
      src,
      alt,
      name,
      fallback,
      color,
      size = 'md',
      presence,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const sizeStyle = SIZE_STYLES[size];
    const initials = fallback ?? (name ? getInitials(name) : '?');
    const tone = hashAvatarColor(name || initials || 'legalos');
    const label = alt ?? name ?? initials;

    return (
      <span
        ref={ref}
        role="img"
        aria-label={label}
        title={label}
        className={cn(
          'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-white',
          color ? '' : tone,
          sizeStyle.root,
          sizeStyle.text,
          className
        )}
        style={color ? { backgroundColor: color, ...style } : style}
        {...props}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="relative z-10">{initials}</span>
        )}
        {presence && (
          <span
            aria-hidden="true"
            className={cn(
              'absolute z-20 rounded-full ring-white dark:ring-[var(--lg-bg)]',
              PRESENCE_TONES[presence],
              sizeStyle.dot
            )}
          />
        )}
      </span>
    );
  }
);
Avatar.displayName = 'Avatar';

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum avatars before collapsing into a `+N` chip. */
  max?: number;
  size?: AvatarSize;
  children?: React.ReactNode;
}

export function AvatarGroup({
  max = 4,
  size = 'sm',
  className,
  children,
  ...props
}: AvatarGroupProps) {
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const visible = items.slice(0, max);
  const overflow = items.length - visible.length;

  return (
    <div
      className={cn(
        'inline-flex items-center -space-x-2',
        '[&>*]:ring-2 [&>*]:ring-white dark:[&>*]:ring-[var(--lg-bg)]',
        className
      )}
      {...props}
    >
      {visible}
      {overflow > 0 && (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300',
            SIZE_STYLES[size].root,
            SIZE_STYLES[size].text
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
AvatarGroup.displayName = 'AvatarGroup';

export default Avatar;
