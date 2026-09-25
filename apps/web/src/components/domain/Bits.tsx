import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Clock, Hourglass, RotateCcw, XCircle } from 'lucide-react';
import { GRADE_LABELS, type AssessmentView, type AssignmentView, type DeadlineItem, type Submission } from '@edu/shared';
import { cn } from '@/lib/cn';
import { GRADE_TONE } from '@/lib/labels';
import { fmtTimeLeft } from '@/lib/format';
import { Badge } from '@/components/ui';
import { Hero3D } from '@/components/three';

export function GradeBadge({ grade, showLabel = true, className }: { grade: number; showLabel?: boolean; className?: string }) {
  return (
    <Badge tone={GRADE_TONE[grade] ?? 'gray'} className={className}>
      <b className="text-[12px]">{grade}</b>
      {showLabel && <span className="font-medium">· {GRADE_LABELS[grade]}</span>}
    </Badge>
  );
}

export function scoreTone(percent: number) {
  return percent >= 86 ? 'text-emerald-600 dark:text-emerald-400' : percent >= 71 ? 'text-sky-600 dark:text-sky-400' : percent >= 55 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
}

export type AssignmentState = 'pending' | 'submitted' | 'graded' | 'returned' | 'overdue' | 'closed';

export function assignmentState(a: Pick<AssignmentView, 'deadline' | 'allowLate'> & { mySubmission?: Submission | null }): AssignmentState {
  const s = a.mySubmission;
  if (s?.status === 'graded') return 'graded';
  if (s?.status === 'returned') return 'returned';
  if (s) return 'submitted';
  if (new Date(a.deadline).getTime() < Date.now()) return a.allowLate ? 'overdue' : 'closed';
  return 'pending';
}

const STATE_META: Record<AssignmentState, { label: string; tone: 'gray' | 'brand' | 'green' | 'amber' | 'red' | 'sky'; icon: ReactNode }> = {
  pending: { label: 'Bajarilmagan', tone: 'amber', icon: <Hourglass /> },
  submitted: { label: 'Tekshirilmoqda', tone: 'sky', icon: <Clock /> },
  graded: { label: 'Baholangan', tone: 'green', icon: <CheckCircle2 /> },
  returned: { label: 'Qaytarilgan', tone: 'red', icon: <RotateCcw /> },
  overdue: { label: "Muddati o'tgan", tone: 'red', icon: <AlertCircle /> },
  closed: { label: 'Yopilgan', tone: 'gray', icon: <XCircle /> },
};

export function AssignmentStateBadge({ state }: { state: AssignmentState }) {
  const m = STATE_META[state];
  return (
    <Badge tone={m.tone} icon={m.icon}>
      {m.label}
    </Badge>
  );
}

export type AssessmentState = 'upcoming' | 'open' | 'in_progress' | 'done' | 'missed' | 'closed';

export function assessmentState(a: AssessmentView): AssessmentState {
  const now = Date.now();
  const start = new Date(a.startsAt).getTime();
  const end = new Date(a.endsAt).getTime();
  if (a.myResult?.status === 'in_progress' && now <= end) return 'in_progress';
  if (a.myResult && a.myResult.status !== 'in_progress') return 'done';
  if (now < start) return 'upcoming';
  if (now <= end) return a.format === 'test' ? 'open' : 'closed';
  return a.format === 'test' ? 'missed' : 'closed';
}

const ASSESS_META: Record<AssessmentState, { label: string; tone: 'gray' | 'brand' | 'green' | 'amber' | 'red' | 'sky' }> = {
  upcoming: { label: 'Kutilmoqda', tone: 'gray' },
  open: { label: 'Ochiq', tone: 'brand' },
  in_progress: { label: 'Davom etmoqda', tone: 'amber' },
  done: { label: 'Topshirilgan', tone: 'green' },
  missed: { label: "O'tkazib yuborilgan", tone: 'red' },
  closed: { label: 'Auditoriyada', tone: 'sky' },
};

export function AssessmentStateBadge({ state }: { state: AssessmentState }) {
  const m = ASSESS_META[state];
  return (
    <Badge tone={m.tone} dot={state === 'open' || state === 'in_progress'}>
      {m.label}
    </Badge>
  );
}

export function Deadline({ date, className }: { date: string; className?: string }) {
  const left = fmtTimeLeft(date);
  const hours = (new Date(date).getTime() - Date.now()) / 3_600_000;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', !left ? 'text-rose-500' : hours < 24 ? 'text-rose-500' : hours < 72 ? 'text-amber-600' : 'text-muted', className)}>
      <Clock className="size-3.5" />
      {left ? `${left} qoldi` : 'Muddat tugagan'}
    </span>
  );
}

export function deadlineStatusBadge(d: DeadlineItem) {
  if (d.status === 'overdue') return <Badge tone="red">Muddati o'tgan</Badge>;
  if (d.status === 'submitted') return <Badge tone="sky">Yuborilgan</Badge>;
  return d.kind === 'assessment' ? <Badge tone="brand">Test</Badge> : <Badge tone="amber">Topshiriq</Badge>;
}

/** Gradient welcome banner with 3D sparkles (echoes the design reference). */
export function HeroBanner({ eyebrow, title, subtitle, actions, className }: { eyebrow: string; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; className?: string }) {
  const fallback = (
    <div className="absolute inset-0">
      {[
        'right-[12%] top-[18%] size-24',
        'right-[34%] top-[8%] size-10',
        'right-[6%] bottom-[14%] size-12',
      ].map((c, i) => (
        <svg key={i} viewBox="0 0 24 24" className={cn('absolute animate-float text-white/70', c)} style={{ animationDelay: `${i * 0.8}s` }} fill="currentColor">
          <path d="M12 0c.9 7.2 4.8 11.1 12 12-7.2.9-11.1 4.8-12 12-.9-7.2-4.8-11.1-12-12C7.2 11.1 11.1 7.2 12 0Z" />
        </svg>
      ))}
    </div>
  );
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className={cn('relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-500 via-brand-600 to-[#5b3fd6] px-7 py-8 text-white shadow-brand sm:px-9', className)}>
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background:radial-gradient(60%_80%_at_85%_20%,rgba(255,255,255,.35),transparent_60%)]" />
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 size-72 rounded-[40%] border-[28px] border-white/10" />
      <div className="pointer-events-none absolute -bottom-32 right-40 -z-10 size-72 rounded-full border-[24px] border-white/5" />
      <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[46%] md:block">
        <Hero3D fallback={fallback} />
      </div>
      <div className="relative max-w-xl">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">{eyebrow}</div>
        <h1 className="mt-3 text-[26px] font-extrabold leading-[1.15] tracking-tight sm:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-md text-[13.5px] text-white/80">{subtitle}</p>}
        {actions && <div className="mt-6 flex flex-wrap gap-2.5">{actions}</div>}
      </div>
    </motion.section>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[17px] font-extrabold tracking-tight text-fg">{children}</h2>
      {action}
    </div>
  );
}
