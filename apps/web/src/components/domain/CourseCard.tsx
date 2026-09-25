import { useId, type MouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Bookmark, ClipboardCheck, FileStack, Users } from 'lucide-react';
import type { CourseView, Subject } from '@edu/shared';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS } from '@/lib/colors';
import { subjectIcon } from '@/lib/subjectIcon';
import { Avatar, Progress } from '@/components/ui';

/** Gradient cover with a big glassy subject icon — replaces stock photos. */
export function SubjectCover({ subject, className, children, size = 'md' }: { subject: Pick<Subject, 'name' | 'code' | 'color'>; className?: string; children?: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  const color = SUBJECT_COLORS[subject.color];
  const Icon = subjectIcon(subject.name);
  const pid = useId().replace(/:/g, '');
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br', color.gradient, className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.35),transparent_45%)]" />
      <div className="absolute -bottom-10 -left-8 size-36 rounded-full bg-white/15 blur-sm" />
      <div className="absolute -right-6 -top-10 size-32 rounded-full border-[18px] border-white/15" />
      <svg className="absolute inset-0 size-full opacity-[0.12]" aria-hidden>
        <defs>
          <pattern id={`dots-${pid}`} width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dots-${pid})`} />
      </svg>
      <span className={cn('absolute font-black tracking-tighter text-white/20', size === 'lg' ? 'bottom-2 left-5 text-6xl' : 'bottom-1 left-4 text-4xl')}>{subject.code}</span>
      <div className={cn('absolute grid place-items-center rounded-3xl border border-white/40 bg-white/20 text-white shadow-[0_20px_40px_-15px_rgba(0,0,0,.35)] backdrop-blur-md', size === 'lg' ? 'right-8 top-1/2 size-24 -translate-y-1/2 [&_svg]:size-11' : size === 'sm' ? 'right-3 top-3 size-10 rounded-2xl [&_svg]:size-5' : 'right-5 top-1/2 size-16 -translate-y-1/2 rotate-6 [&_svg]:size-7')}>
        <Icon strokeWidth={2} />
      </div>
      {children}
    </div>
  );
}

function useTilt() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), { stiffness: 250, damping: 20 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-9, 9]), { stiffness: 250, damping: 20 });
  const onMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };
  return { style: { rotateX: rx, rotateY: ry, transformPerspective: 900 }, onMove, onLeave };
}

export function CourseCard({ course, to, variant = 'student' }: { course: CourseView; to: string; variant?: 'student' | 'teacher' }) {
  const tilt = useTilt();
  const color = SUBJECT_COLORS[course.subject.color];
  const progress = variant === 'student' ? course.myProgress ?? 0 : course.stats.topicsTotal ? Math.round((course.stats.topicsDone / course.stats.topicsTotal) * 100) : 0;
  return (
    <motion.div style={tilt.style} onMouseMove={tilt.onMove} onMouseLeave={tilt.onLeave} whileHover={{ y: -4 }} className="group">
      <Link to={to} className="card block overflow-hidden p-3 transition-shadow hover:shadow-lift">
        <SubjectCover subject={course.subject} className="h-36 rounded-2xl">
          <span className="absolute right-3 top-3 hidden size-8 place-items-center rounded-full bg-white/25 text-white backdrop-blur group-hover:grid">
            <Bookmark className="size-4" />
          </span>
        </SubjectCover>
        <div className="px-1.5 pb-1 pt-3.5">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className={cn('inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide', color.soft, color.text)}>{course.subject.code}</span>
            {course.groups.map((g) => (
              <span key={g.id} className="rounded-lg bg-panel px-2 py-0.5 text-[10.5px] font-bold text-muted">
                {g.name}
              </span>
            ))}
          </div>
          <h3 className="line-clamp-2 min-h-[2.6em] text-[14.5px] font-bold leading-snug text-fg">{course.subject.name}</h3>
          <div className="mt-3 flex items-center gap-2">
            <Progress value={progress} size="sm" className="flex-1" barClassName={cn('bg-gradient-to-r', color.gradient)} />
            <span className="text-[11px] font-bold tabular-nums text-muted">{progress}%</span>
          </div>
          {variant === 'student' ? (
            <div className="mt-3.5 flex items-center gap-2.5 border-t border-line pt-3">
              <Avatar user={course.teacher} size="sm" />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12.5px] font-bold text-fg">
                  {course.teacher.firstName} {course.teacher.lastName}
                </div>
                <div className="text-[11px] text-muted">O'qituvchi</div>
              </div>
              {course.myTotal !== undefined && (
                <div className="text-right leading-tight">
                  <div className="text-sm font-extrabold text-fg tabular-nums">{course.myTotal}%</div>
                  <div className="text-[10px] text-muted">o'zlashtirish</div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
              <Stat icon={<Users />} value={course.stats.students} label="talaba" />
              <Stat icon={<FileStack />} value={course.stats.materials} label="material" />
              <Stat icon={<ClipboardCheck />} value={course.stats.pendingReviews} label="tekshirish" highlight={course.stats.pendingReviews > 0} />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function Stat({ icon, value, label, highlight }: { icon: ReactNode; value: number; label: string; highlight?: boolean }) {
  return (
    <div className={cn('rounded-xl py-1.5', highlight && 'bg-amber-50 dark:bg-amber-500/10')}>
      <div className={cn('flex items-center justify-center gap-1 text-sm font-extrabold text-fg [&_svg]:size-3.5 [&_svg]:text-muted', highlight && 'text-amber-600')}>
        {icon}
        {value}
      </div>
      <div className="text-[10px] font-medium text-muted">{label}</div>
    </div>
  );
}
