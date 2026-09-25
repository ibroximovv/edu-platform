import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, RotateCcw, Sparkles } from 'lucide-react';
import type { AssignmentView, SubmissionView } from '@edu/shared';
import { cn } from '@/lib/cn';
import { fmtDateTime, fmtRelative } from '@/lib/format';
import { useCourseStudents, useGradeSubmission, useSubmissions } from '@/api/queries/learning';
import { Avatar, Badge, Button, Drawer, Field, Input, Textarea } from '@/components/ui';
import { FileList } from './Files';

/** All submissions of one assignment + who hasn't submitted yet. */
export function SubmissionsDrawer({ assignment, onClose }: { assignment: AssignmentView | null; onClose: () => void }) {
  const { data: subs } = useSubmissions({ assignmentId: assignment?.id }, !!assignment);
  const { data: students } = useCourseStudents(assignment?.courseId);
  const [active, setActive] = useState<string | null>(null);
  const current = subs?.find((s) => s.id === active) ?? null;
  const submittedIds = new Set(subs?.map((s) => s.studentId));
  const missing = (students ?? []).filter((s) => !submittedIds.has(s.id));
  return (
    <>
      <Drawer
        open={!!assignment && !current}
        onClose={onClose}
        title={assignment?.title}
        description={assignment && `${assignment.course.title} · muddat ${fmtDateTime(assignment.deadline)}`}
      >
        {assignment && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              <MiniStat label="Topshirgan" value={subs?.length ?? 0} />
              <MiniStat label="Baholangan" value={subs?.filter((s) => s.status === 'graded').length ?? 0} />
              <MiniStat label="Topshirmagan" value={missing.length} warn={missing.length > 0} />
            </div>
            <div className="space-y-1.5">
              {subs?.map((s) => (
                <button key={s.id} onClick={() => setActive(s.id)} className="flex w-full items-center gap-3 rounded-2xl border border-line p-2.5 text-left transition hover:border-brand-300">
                  <Avatar user={s.student} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-fg">
                      {s.student.lastName} {s.student.firstName}
                    </div>
                    <div className="text-[11px] text-muted">
                      {fmtRelative(s.submittedAt)} {s.late && <span className="text-rose-500">· kech</span>}
                    </div>
                  </div>
                  {s.status === 'graded' ? <Badge tone="green">{s.score}/{assignment.maxScore}</Badge> : s.status === 'returned' ? <Badge tone="red">Qaytarilgan</Badge> : <Badge tone="amber">Tekshirish</Badge>}
                </button>
              ))}
            </div>
            {missing.length > 0 && (
              <div>
                <div className="label-caps mb-2">Topshirmaganlar</div>
                <div className="flex flex-wrap gap-2">
                  {missing.map((s) => (
                    <span key={s.id} className="flex items-center gap-1.5 rounded-full bg-panel py-1 pl-1 pr-3 text-xs font-medium text-fg-soft">
                      <Avatar user={s} size="xs" /> {s.lastName} {s.firstName.charAt(0)}.
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
      <ReviewDrawer submission={current} onClose={() => setActive(null)} />
    </>
  );
}

function MiniStat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="panel p-3 text-center">
      <div className={cn('text-xl font-extrabold tabular-nums', warn ? 'text-amber-600' : 'text-fg')}>{value}</div>
      <div className="text-[10.5px] font-semibold text-muted">{label}</div>
    </div>
  );
}

const QUICK_FEEDBACK =["A'lo! Barcha talablar bajarilgan.", 'Yaxshi ish, lekin xulosani kengaytiring.', "Kodda izohlar yetarli emas.", "Hisobot formatiga e'tibor bering.", 'Manbalar keltirilmagan.'];

/** Side panel for grading a single submission; `queue` enables "save & next". */
export function ReviewDrawer({ submission, onClose, onNext }: { submission: SubmissionView | null; onClose: () => void; onNext?: () => void }) {
  const grade = useGradeSubmission();
  const [score, setScore] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const s = submission;

  useEffect(() => {
    setScore(s?.score != null ? String(s.score) : '');
    setFeedback(s?.feedback ?? '');
  }, [s?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!s) return <Drawer open={false} onClose={onClose} />;
  const max = s.assignment.maxScore;
  const num = Number(score);
  const invalid = score === '' || Number.isNaN(num) || num < 0 || num > max;

  const submit = async (status: 'graded' | 'returned') => {
    await grade.mutateAsync({ id: s.id, status, score: status === 'graded' ? num : null, feedback: feedback.trim() || undefined });
    if (onNext) onNext();
    else onClose();
  };

  return (
    <Drawer
      open={!!s}
      onClose={onClose}
      title="Javobni tekshirish"
      description={
        <span>
          {s.assignment.title} · {s.courseTitle}
        </span>
      }
      footer={
        <>
          <Button variant="outline" icon={<RotateCcw />} onClick={() => submit('returned')} loading={grade.isPending} disabled={!feedback.trim()} title={!feedback.trim() ? 'Qaytarish uchun izoh yozing' : undefined}>
            Qaytarish
          </Button>
          <Button icon={<CheckCircle2 />} onClick={() => submit('graded')} loading={grade.isPending} disabled={invalid}>
            {onNext ? 'Baholash va keyingisi' : 'Baholash'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-2xl bg-panel p-3.5">
          <Avatar user={s.student} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold text-fg">
              {s.student.lastName} {s.student.firstName}
            </div>
            <div className="text-xs text-muted">
              {s.student.groupName} · {s.student.email}
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="font-semibold text-fg">{fmtDateTime(s.submittedAt)}</div>
            <div className="text-muted">{fmtRelative(s.submittedAt)}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {s.late ? <Badge tone="red" icon={<Clock />}>Kech topshirilgan</Badge> : <Badge tone="green">O'z vaqtida</Badge>}
          <Badge>{s.attempt}-urinish</Badge>
          <Badge tone="violet">Muddat: {fmtDateTime(s.assignment.deadline)}</Badge>
          {s.status === 'graded' && <Badge tone="green">Baholangan: {s.score}</Badge>}
        </div>

        {s.text && (
          <div>
            <div className="label-caps mb-2">Talaba javobi</div>
            <p className="whitespace-pre-line rounded-2xl border border-line bg-card p-4 text-[13.5px] text-fg-soft">{s.text}</p>
          </div>
        )}
        {s.files.length > 0 && (
          <div>
            <div className="label-caps mb-2">Fayllar</div>
            <FileList files={s.files} />
          </div>
        )}

        <div className="rounded-3xl border border-line p-4">
          <Field label={`Ball (0 – ${max})`} error={score !== '' && invalid ? `0 dan ${max} gacha` : undefined}>
            <div className="flex items-center gap-3">
              <Input type="number" min={0} max={max} step="0.5" value={score} onChange={(e) => setScore(e.target.value)} className="w-28 text-lg font-bold" autoFocus />
              <div className="flex flex-wrap gap-1.5">
                {[max, Math.round(max * 0.8), Math.round(max * 0.6), Math.round(max * 0.4)].map((v) => (
                  <button key={v} onClick={() => setScore(String(v))} className={cn('h-9 min-w-9 rounded-xl px-2.5 text-[13px] font-bold transition', Number(score) === v ? 'bg-brand-600 text-white' : 'bg-panel text-fg-soft hover:bg-brand-50 hover:text-brand-600')}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </Field>
          {s.late && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
              <Clock className="size-3.5" /> Kechikish jarimasini hisobga oling
            </p>
          )}
          <Field label="Izoh (talabaga ko'rinadi)" className="mt-4">
            <Textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Ish bo'yicha fikr-mulohaza..." />
          </Field>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_FEEDBACK.map((f) => (
              <motion.button whileTap={{ scale: 0.95 }} key={f} onClick={() => setFeedback((x) => (x ? `${x} ${f}` : f))} className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-muted transition hover:border-brand-300 hover:text-brand-600">
                <Sparkles className="size-3" /> {f}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
