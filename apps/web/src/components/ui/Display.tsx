import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { animate, motion, useInView } from 'motion/react';
import { Inbox, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { generatedAvatar } from '@/lib/avatar';
import { useFileUrl } from '@/api/files';

/* ───────────── Card ───────────── */

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon, className }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-panel text-brand-600 dark:text-brand-300 [&_svg]:size-[18px]">{icon}</span>}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-bold text-fg">{title}</h3>
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ───────────── Badge ───────────── */

export type BadgeTone = 'gray' | 'brand' | 'green' | 'amber' | 'red' | 'sky' | 'pink' | 'violet';
const TONES: Record<BadgeTone, string> = {
  gray: 'bg-panel text-fg-soft ring-line',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200/60 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/20',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200/60 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-200/60 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/20',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200/60 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/20',
  pink: 'bg-pink-50 text-pink-700 ring-pink-200/60 dark:bg-pink-500/15 dark:text-pink-300 dark:ring-pink-500/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200/60 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/20',
};

export function Badge({ tone = 'gray', children, className, icon, dot }: { tone?: BadgeTone; children: ReactNode; className?: string; icon?: ReactNode; dot?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset [&_svg]:size-3', TONES[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {icon}
      {children}
    </span>
  );
}

/* ───────────── Avatar ───────────── */

export interface AvatarUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

const AVATAR_SIZES = { xs: 'size-6', sm: 'size-8', md: 'size-10', lg: 'size-12', xl: 'size-16', '2xl': 'size-24' };

export function Avatar({ user, size = 'md', className, ring, online }: { user?: AvatarUser | null; size?: keyof typeof AVATAR_SIZES; className?: string; ring?: boolean; online?: boolean }) {
  const uploaded = useFileUrl(user?.avatarUrl);
  const src = uploaded ?? generatedAvatar(user?.id ?? 'anon');
  return (
    <span className={cn('relative inline-block shrink-0', AVATAR_SIZES[size], className)}>
      <img src={src} alt={user ? `${user.firstName} ${user.lastName}` : ''} loading="lazy" className={cn('size-full rounded-full bg-panel object-cover', ring && 'ring-2 ring-card')} />
      {online && <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />}
    </span>
  );
}

export function AvatarGroup({ users, max = 4, size = 'sm' }: { users: AvatarUser[]; max?: number; size?: keyof typeof AVATAR_SIZES }) {
  const rest = users.length - max;
  return (
    <div className="flex -space-x-2">
      {users.slice(0, max).map((u) => (
        <Avatar key={u.id} user={u} size={size} ring />
      ))}
      {rest > 0 && <span className={cn('grid place-items-center rounded-full bg-panel text-[10px] font-bold text-fg-soft ring-2 ring-card', AVATAR_SIZES[size])}>+{rest}</span>}
    </div>
  );
}

/* ───────────── Progress ───────────── */

export function Progress({ value, className, barClassName, size = 'md' }: { value: number; className?: string; barClassName?: string; size?: 'sm' | 'md' }) {
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-panel', size === 'sm' ? 'h-1.5' : 'h-2', className)}>
      <motion.div className={cn('h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600', barClassName)} initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  );
}

export function RingProgress({ value, size = 64, stroke = 6, children, color = '#6a58e6', track, className }: { value: number; size?: number; stroke?: number; children?: ReactNode; color?: string; track?: string; className?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={track ?? 'stroke-panel'} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (v / 100) * c }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/* ───────────── Loading / empty ───────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4', className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-brand-600', className)} />;
}

export function PageLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative size-12">
          <span className="absolute inset-0 animate-ping rounded-2xl bg-brand-500/30" />
          <span className="relative grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-brand">
            <Loader2 className="size-5 animate-spin" />
          </span>
        </div>
        <span className="text-xs font-medium text-muted">Yuklanmoqda...</span>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="relative mb-4">
        <div className="absolute inset-0 scale-150 rounded-full bg-brand-500/10 blur-2xl" />
        <div className="relative grid size-16 place-items-center rounded-3xl border border-line bg-gradient-to-br from-card to-panel text-brand-500 shadow-soft [&_svg]:size-7">{icon ?? <Inbox />}</div>
      </div>
      <h3 className="text-[15px] font-bold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ───────────── Numbers ───────────── */

export function AnimatedNumber({ value, decimals = 0, className, suffix = '' }: { value: number; decimals?: number; className?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);
  const current = useRef(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(current.current, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        current.current = v;
        setDisplay(v);
      },
    });
    return () => controls.stop();
  }, [value, inView]);
  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md border border-line bg-panel px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted">{children}</kbd>;
}

/* ───────────── Stat card ───────────── */

const STAT_TONES = {
  violet: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
  pink: 'bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300',
  sky: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  rose: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
};

export function StatCard({ icon, label, value, decimals = 0, suffix, tone = 'violet', hint, className, onClick }: { icon: ReactNode; label: ReactNode; value: number; decimals?: number; suffix?: string; tone?: keyof typeof STAT_TONES; hint?: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={cn('card flex items-center gap-3.5 p-4', onClick && 'cursor-pointer', className)}
    >
      <div className={cn('grid size-12 shrink-0 place-items-center rounded-2xl [&_svg]:size-5', STAT_TONES[tone])}>{icon}</div>
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-muted">{label}</div>
        <div className="text-xl font-extrabold tracking-tight text-fg">
          <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
        </div>
        {hint && <div className="truncate text-[11px] text-muted">{hint}</div>}
      </div>
    </motion.div>
  );
}
