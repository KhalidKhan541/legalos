'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export type TabsVariant = 'pill' | 'underline';

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  variant: TabsVariant;
  idBase: string;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

function useTabsContext(): TabsContextValue {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a <Tabs> container');
  }
  return context;
}

export interface TabsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Initially selected tab (uncontrolled usage). */
  defaultValue?: string;
  /** Controlled selection. */
  value?: string;
  /** Fires whenever a tab is selected. */
  onValueChange?: (value: string) => void;
  /** `pill` — segmented control on a tinted track. `underline` — minimal tabs with a crimson underline. */
  variant?: TabsVariant;
  children?: React.ReactNode;
}

/**
 * Tab group with full ARIA wiring:
 * `role="tablist"` → `role="tab"` (`aria-selected` / `aria-controls`) →
 * `role="tabpanel"` (`aria-labelledby`), roving `tabIndex` (only the active
 * tab is tabbable) and Arrow/Home/End keyboard navigation.
 *
 * Supports both controlled (`value` + `onValueChange`) and uncontrolled
 * (`defaultValue`) usage.
 */
export function Tabs({
  defaultValue = '',
  value,
  onValueChange,
  variant = 'pill',
  className,
  children,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const idBase = React.useId();

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  const contextValue = React.useMemo<TabsContextValue>(
    () => ({
      value: isControlled ? value : internalValue,
      setValue,
      variant,
      idBase,
    }),
    [isControlled, value, internalValue, setValue, variant, idBase]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn('flex flex-col gap-4', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function TabsList({ className, children, ...props }: TabsListProps) {
  const { variant } = useTabsContext();

  return (
    <div
      role="tablist"
      className={cn(
        'flex flex-wrap items-center gap-1',
        variant === 'pill' &&
          'w-fit rounded-lg bg-[var(--lg-surface-sunken)] p-1',
        variant === 'underline' &&
          'border-b border-[var(--lg-border)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string;
  disabled?: boolean;
}

export function TabsTrigger({
  value,
  disabled,
  className,
  onClick,
  onKeyDown,
  children,
  ...props
}: TabsTriggerProps) {
  const { value: activeValue, setValue, variant, idBase } = useTabsContext();
  const active = activeValue === value;

  // Roving tabindex: arrows / Home / End move focus (and selection) between tabs.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    const list = event.currentTarget.closest('[role="tablist"]');
    if (!list) return;

    const tabs = Array.from(
      list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
    );
    const index = tabs.indexOf(event.currentTarget);
    if (index === -1 || tabs.length === 0) return;

    event.preventDefault();

    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (index + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else {
      next = tabs.length - 1;
    }

    const target = tabs[next];
    target.focus();
    const nextValue = target.getAttribute('data-tab-value');
    if (nextValue !== null) setValue(nextValue);
  };

  return (
    <button
      type="button"
      role="tab"
      id={`${idBase}-tab-${value}`}
      aria-selected={active}
      aria-controls={`${idBase}-panel-${value}`}
      tabIndex={active ? 0 : -1}
      disabled={disabled}
      data-tab-value={value}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lg-primary-ring)]',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'pill' &&
          cn(
            'px-3 py-1.5',
            active
              ? 'bg-[var(--lg-surface)] text-[var(--lg-text)] shadow-[var(--lg-shadow-sm)]'
              : 'text-[var(--lg-text-muted)] hover:text-[var(--lg-text)]'
          ),
        variant === 'underline' &&
          cn(
            '-mb-px border-b-2 px-3 py-2',
            active
              ? 'border-[#dc2626] text-[#dc2626]'
              : 'border-transparent text-[var(--lg-text-muted)] hover:text-[var(--lg-text)]'
          ),
        className
      )}
      onClick={(event) => {
        setValue(value);
        onClick?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        handleKeyDown(event);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children?: React.ReactNode;
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const { value: activeValue, idBase } = useTabsContext();

  if (activeValue !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`${idBase}-panel-${value}`}
      aria-labelledby={`${idBase}-tab-${value}`}
      tabIndex={0}
      className={cn('focus-visible:outline-none', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default Tabs;
