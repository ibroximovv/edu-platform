import { Link } from 'react-router';
import { APP_NAME } from '@/config/app';
import { cn } from '@/lib/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn('relative grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800 shadow-brand', className)}>
      <svg viewBox="0 0 24 24" className="size-5 text-white" fill="currentColor" aria-hidden>
        <path d="M12 2.5c.6 4.3 2.7 6.4 7 7-4.3.6-6.4 2.7-7 7-.6-4.3-2.7-6.4-7-7 4.3-.6 6.4-2.7 7-7Z" />
        <circle cx="18.5" cy="18.5" r="1.8" opacity=".75" />
      </svg>
      <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/25" />
    </span>
  );
}

export function Logo({ compact, className, to = '/' }: { compact?: boolean; className?: string; to?: string }) {
  return (
    <Link to={to} className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      {!compact && <span className="text-[19px] font-extrabold tracking-tight text-fg">{APP_NAME}</span>}
    </Link>
  );
}
