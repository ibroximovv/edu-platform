import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { BookOpenCheck, Clock, Layers, Users } from 'lucide-react';
import type { CourseScore, CourseView } from '@edu/shared';
import { CATEGORY_SHORT } from '@/lib/labels';
import { Avatar, Skeleton } from '@/components/ui';
import { SubjectCover } from './CourseCard';
import { GradeBadge } from './Bits';

export function CourseHero({ course, right }: { course?: CourseView; right?: ReactNode }) {
  if (!course) return <Skeleton className="h-56 rounded-[28px]" />;
  const s = course.subject;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <SubjectCover subject={s} size="lg" className="rounded-[28px] px-7 py-7 text-white sm:px-9">
        <div className="relative max-w-2xl pr-28">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/80">
            <span className="rounded-lg bg-white/20 px-2 py-0.5 backdrop-blur">{s.code}</span>
            <span>{s.credits} kredit</span>
            {course.semester && <span>· {course.semester.name}</span>}
          </div>
          <h1 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight sm:text-[30px]">{s.name}</h1>
          {s.description && <p className="mt-2 max-w-xl text-[13.5px] text-white/85">{s.description}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] font-semibold">
            <span className="flex items-center gap-2">
              <Avatar user={course.teacher} size="sm" className="ring-2 ring-white/50 rounded-full" />
              {course.teacher.firstName} {course.teacher.lastName}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-4" /> {course.groups.map((g) => g.name).join(', ')} · {course.stats.students} talaba
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="size-4" /> {course.stats.topicsDone}/{course.stats.topicsTotal} mavzu
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" /> {s.hours.lecture + s.hours.practice + s.hours.lab} soat
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpenCheck className="size-4" /> JN {course.grading.current} · ON {course.grading.midterm} · YN {course.grading.final}
            </span>
          </div>
          {right && <div className="mt-5">{right}</div>}
        </div>
      </SubjectCover>
    </motion.div>
  );
}

export function ScoreBreakdown({ score, grading }: { score: CourseScore; grading: CourseView['grading'] }) {
  const parts = [
    { key: 'current' as const, value: score.current, max: grading.current, color: 'from-violet-400 to-violet-600' },
    { key: 'midterm' as const, value: score.midterm, max: grading.midterm, color: 'from-sky-400 to-sky-600' },
    { key: 'final' as const, value: score.final, max: grading.final, color: 'from-pink-400 to-pink-600' },
  ];
  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs font-semibold text-muted">Jami ball</div>
          <div className="text-3xl font-extrabold tracking-tight text-fg tabular-nums">
            {score.total}
            <span className="text-base font-bold text-muted">/100</span>
          </div>
        </div>
        <div className="text-right">
          <GradeBadge grade={score.grade} />
          <div className="mt-1 text-[11px] text-muted">o'zlashtirish {score.percent}%</div>
        </div>
      </div>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-panel">
        {parts.map((p, i) => (
          <motion.div key={p.key} className={`h-full bg-gradient-to-r ${p.color}`} initial={{ width: 0 }} animate={{ width: `${p.value}%` }} transition={{ duration: 0.9, delay: i * 0.15 }} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {parts.map((p) => (
          <div key={p.key} className="panel p-3 text-center">
            <div className="text-[11px] font-bold text-muted">{CATEGORY_SHORT[p.key]}</div>
            <div className="text-lg font-extrabold text-fg tabular-nums">
              {p.value}
              <span className="text-xs font-semibold text-muted">/{p.max}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
