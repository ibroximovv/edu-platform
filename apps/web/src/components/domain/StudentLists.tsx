import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, CalendarClock, FileCheck2, Hourglass, ListChecks, Paperclip, PlayCircle, RotateCw, Timer } from 'lucide-react';
import type { AssessmentView, AssignmentView } from '@edu/shared';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS } from '@/lib/colors';
import { fmtDateTime } from '@/lib/format';
import { ASSIGNMENT_TYPE, CATEGORY, FORMAT } from '@/lib/labels';
import { useStartAttempt } from '@/api/queries/assessments';
import { Badge, Button } from '@/components/ui';
import { AssessmentStateBadge, assessmentState, AssignmentStateBadge, assignmentState, Deadline } from './Bits';

export function AssignmentItem({ a, index = 0 }: { a: AssignmentView; index?: number }) {
  const state = assignmentState(a);
  const c = SUBJECT_COLORS[a.course.color];
  const sub = a.mySubmission;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.4) }}>
      <Link to={`/student/assignments/${a.id}`} className="card group flex flex-col gap-4 p-4 transition hover:shadow-lift sm:flex-row sm:items-center">
        <div className={cn('grid size-12 shrink-0 place-items-center rounded-2xl', c.soft, c.text)}>
          <FileCheck2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <AssignmentStateBadge state={state} />
            <Badge>{ASSIGNMENT_TYPE[a.type]}</Badge>
            {a.attachments.length > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted">
                <Paperclip className="size-3" /> {a.attachments.length}
              </span>
            )}
          </div>
          <div className="mt-1.5 truncate text-[14.5px] font-bold text-fg group-hover:text-brand-600">{a.title}</div>
          <div className="mt-0.5 truncate text-xs text-muted">{a.course.title}</div>
        </div>
        <div className="flex items-center gap-5 sm:text-right">
          <div>
            <div className="text-[12.5px] font-semibold text-fg">{fmtDateTime(a.deadline)}</div>
            {state === 'pending' || state === 'overdue' ? <Deadline date={a.deadline} /> : <span className="text-[11px] text-muted">muddat</span>}
          </div>
          <div className="min-w-[64px] text-center">
            {sub?.status === 'graded' ? (
              <div className="rounded-xl bg-emerald-50 px-3 py-1.5 dark:bg-emerald-500/10">
                <div className="text-lg font-extrabold leading-none text-emerald-600 tabular-nums">{sub.score}</div>
                <div className="text-[10px] font-semibold text-emerald-700/70 dark:text-emerald-300/70">/ {a.maxScore}</div>
              </div>
            ) : (
              <div className="rounded-xl bg-panel px-3 py-1.5">
                <div className="text-lg font-extrabold leading-none text-muted tabular-nums">—</div>
                <div className="text-[10px] font-semibold text-muted">/ {a.maxScore}</div>
              </div>
            )}
          </div>
          <ArrowRight className="hidden size-5 text-muted transition group-hover:translate-x-1 group-hover:text-brand-600 sm:block" />
        </div>
      </Link>
    </motion.div>
  );
}

export function AssessmentItem({ a, index = 0 }: { a: AssessmentView; index?: number }) {
  const navigate = useNavigate();
  const start = useStartAttempt();
  const state = assessmentState(a);
  const c = SUBJECT_COLORS[a.course.color];
  const r = a.myResult;
  const attemptsLeft = a.attempts - (a.attemptsUsed ?? 0);
  const begin = async () => {
    const attempt = await start.mutateAsync(a.id);
    navigate(`/student/tests/attempt/${attempt.result.id}`);
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.4) }} className={cn('card relative flex flex-col gap-4 overflow-hidden p-4 sm:flex-row sm:items-center', (state === 'open' || state === 'in_progress') && 'ring-2 ring-brand-500/40')}>
      {(state === 'open' || state === 'in_progress') && <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-400 to-brand-700" />}
      <div className={cn('grid size-12 shrink-0 place-items-center rounded-2xl', c.soft, c.text)}>
        <ListChecks className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <AssessmentStateBadge state={state} />
          <Badge tone={a.category === 'final' ? 'red' : a.category === 'midterm' ? 'amber' : 'violet'}>{CATEGORY[a.category]}</Badge>
          <Badge>{FORMAT[a.format]}</Badge>
        </div>
        <div className="mt-1.5 truncate text-[14.5px] font-bold text-fg">{a.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span>{a.course.title}</span>
          <span className="flex items-center gap-1">
            <CalendarClock className="size-3.5" /> {fmtDateTime(a.startsAt)} — {fmtDateTime(a.endsAt)}
          </span>
          {a.format === 'test' && (
            <>
              <span className="flex items-center gap-1">
                <Timer className="size-3.5" /> {a.durationMin} daqiqa
              </span>
              <span>{a.questionCount} savol</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {r?.score != null && r.status !== 'in_progress' && (
          <div className="rounded-xl bg-emerald-50 px-3 py-1.5 text-center dark:bg-emerald-500/10">
            <div className="text-lg font-extrabold leading-none text-emerald-600 tabular-nums">{r.score}</div>
            <div className="text-[10px] font-semibold text-emerald-700/70 dark:text-emerald-300/70">/ {a.maxScore}</div>
          </div>
        )}
        {state === 'open' && (
          <Button onClick={begin} loading={start.isPending} icon={<PlayCircle />}>
            Boshlash
          </Button>
        )}
        {state === 'in_progress' && r && (
          <Button onClick={() => navigate(`/student/tests/attempt/${r.id}`)} variant="soft" icon={<Hourglass />}>
            Davom ettirish
          </Button>
        )}
        {state === 'done' && a.format === 'test' && r && (
          <div className="flex gap-2">
            {attemptsLeft > 0 && new Date(a.endsAt).getTime() > Date.now() && (
              <Button variant="outline" size="sm" onClick={begin} loading={start.isPending} icon={<RotateCw />}>
                Qayta ({attemptsLeft})
              </Button>
            )}
            {a.showResults && (
              <Button variant="soft" size="sm" onClick={() => navigate(`/student/tests/review/${r.id}`)}>
                Natija
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
