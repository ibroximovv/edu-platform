import { useId, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  count?: number;
}

/** Underlined tabs with a sliding indicator. */
export function Tabs<T extends string>({ items, value, onChange, className }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; className?: string }) {
  const id = useId();
  return (
    <div className={cn('scroll-x -mb-px flex gap-1 border-b border-line', className)} role="tablist">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cn('relative flex shrink-0 items-center gap-2 px-3.5 pb-3 pt-1 text-[13px] font-semibold transition-colors [&_svg]:size-4', active ? 'text-brand-600 dark:text-brand-300' : 'text-muted hover:text-fg')}
          >
            {it.icon}
            {it.label}
            {it.count !== undefined && (
              <span className={cn('rounded-md px-1.5 text-[10.5px] font-bold', active ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200' : 'bg-panel text-muted')}>{it.count}</span>
            )}
            {active && <motion.span layoutId={`tab-${id}`} className="absolute inset-x-2 -bottom-px h-[2.5px] rounded-full bg-brand-600 dark:bg-brand-400" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
          </button>
        );
      })}
    </div>
  );
}

/** Pill-style segmented control. */
export function Segmented<T extends string>({ items, value, onChange, className, size = 'md' }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; className?: string; size?: 'sm' | 'md' }) {
  const id = useId();
  return (
    <div className={cn('scroll-x inline-flex max-w-full gap-1 rounded-2xl bg-panel p-1', className)} role="tablist">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cn('relative flex shrink-0 items-center gap-1.5 rounded-xl font-semibold transition-colors [&_svg]:size-4', size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-[13px]', active ? 'text-fg' : 'text-muted hover:text-fg')}
          >
            {active && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-xl bg-card shadow-soft ring-1 ring-line" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <span className="relative flex items-center gap-1.5">
              {it.icon}
              {it.label}
              {it.count !== undefined && <span className="text-[10.5px] font-bold text-muted">{it.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
