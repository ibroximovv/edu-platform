import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className={cn('space-y-6', className)}>
      {children}
    </motion.div>
  );
}

export function PageHeader({ title, description, actions, breadcrumbs, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; breadcrumbs?: { label: string; to?: string }[]; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {breadcrumbs && (
          <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-xs font-medium text-muted">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3" />}
                {b.to ? (
                  <Link to={b.to} className="hover:text-brand-600">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-fg-soft">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {title && <h1 className="text-2xl font-extrabold tracking-tight text-fg sm:text-[26px]">{title}</h1>}
        {description && <p className="mt-1 text-[13.5px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Staggered list animation helpers */
export const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.05 } } },
  item: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } },
};
