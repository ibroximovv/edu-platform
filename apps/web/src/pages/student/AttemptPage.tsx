import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CloudCheck, CloudUpload, Flag, Send, Timer } from 'lucide-react';
import type { PublicQuestion } from '@edu/shared';
import { cn } from '@/lib/cn';
import { fmtDuration } from '@/lib/format';
import { QUESTION_TYPE } from '@/lib/labels';
import { assessmentsApi, useAttempt, useFinishAttempt } from '@/api/queries/assessments';
import { useAttemptStore } from '@/stores/attempt.store';
import { useConfirm } from '@/contexts/ConfirmProvider';
import { LogoMark } from '@/components/layout/Logo';
import { Button, Input, PageLoader } from '@/components/ui';

const EMPTY: Record<string, string[]> = {};

export default function AttemptPage() {
  const { attemptId = '' } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { data, isLoading, error } = useAttempt(attemptId);
  const finish = useFinishAttempt();
  const answers = useAttemptStore((s) => s.answers[attemptId] ?? EMPTY);
  const flagged = useAttemptStore((s) => s.flagged[attemptId]);
  const setAnswer = useAttemptStore((s) => s.setAnswer);
  const toggleFlag = useAttemptStore((s) => s.toggleFlag);
  const hydrate = useAttemptStore((s) => s.hydrate);
  const clear = useAttemptStore((s) => s.clear);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const finishing = useRef(false);

  useEffect(() => {
    if (data?.result.answers) hydrate(attemptId, data.result.answers);
  }, [data, attemptId, hydrate]);

  // Result already finished → go to review
  useEffect(() => {
    if (data && data.result.status !== 'in_progress') navigate(`/student/tests/review/${attemptId}`, { replace: true });
  }, [data, attemptId, navigate]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Debounced autosave
  const pending = useRef<Record<string, string[]>>({});
  useEffect(() => {
    if (saveState !== 'dirty') return;
    const t = setTimeout(async () => {
      const batch = pending.current;
      pending.current = {};
      setSaveState('saving');
      try {
        await assessmentsApi.saveAnswers(attemptId, batch);
        setSaveState((s) => (s === 'saving' ? 'saved' : s));
      } catch {
        pending.current = { ...batch, ...pending.current };
        setSaveState('dirty');
      }
    }, 800);
    return () => clearTimeout(t);
  }, [saveState, answers, attemptId]);

  const answer = useCallback(
    (qid: string, value: string[]) => {
      setAnswer(attemptId, qid, value);
      pending.current[qid] = value;
      setSaveState('dirty');
    },
    [attemptId, setAnswer],
  );

  const doFinish = useCallback(
    async (auto = false) => {
      if (finishing.current) return;
      finishing.current = true;
      try {
        const review = await finish.mutateAsync({ id: attemptId, answers });
        clear(attemptId);
        if (auto) toast.info('Vaqt tugadi — test avtomatik yakunlandi');
        toast.success(`Natija: ${review.result.score} / ${review.assessment.maxScore}`);
        navigate(review.questions ? `/student/tests/review/${attemptId}` : '/student/tests', { replace: true });
      } catch {
        finishing.current = false;
      }
    },
    [answers, attemptId, clear, finish, navigate],
  );

  const deadline = data ? new Date(data.deadline).getTime() : 0;
  const left = Math.max(0, Math.floor((deadline - now) / 1000));
  useEffect(() => {
    if (data && data.result.status === 'in_progress' && left === 0) doFinish(true);
  }, [left, data, doFinish]);

  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBefore);
    return () => window.removeEventListener('beforeunload', onBefore);
  }, []);

  const questions = useMemo(() => data?.questions ?? [], [data]);
  const q = questions[index];
  const answeredCount = questions.filter((x) => answers[x.id]?.length && answers[x.id][0] !== '').length;

  // Keyboard navigation: ← → and 1-9 for options
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(questions.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      const n = Number(e.key);
      if (q && n >= 1 && n <= q.options.length) {
        const opt = q.options[n - 1].id;
        if (q.type === 'multiple') {
          const cur = answers[q.id] ?? [];
          answer(q.id, cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]);
        } else if (q.type !== 'short') answer(q.id, [opt]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, questions.length, answers, answer]);

  if (isLoading) return <PageLoader />;
  if (error || !data) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="text-sm text-muted">Urinish topilmadi yoki yakunlangan.</p>
          <Button className="mt-4" onClick={() => navigate('/student/tests')}>
            Testlarga qaytish
          </Button>
        </div>
      </div>
    );
  }

  const danger = left < 120;
  const total = data.assessment.durationMin * 60;

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <LogoMark className="size-9" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-bold text-fg">{data.assessment.title}</div>
            <div className="truncate text-xs text-muted">{data.assessment.courseTitle}</div>
          </div>
          <div className="hidden items-center gap-1.5 text-xs font-semibold text-muted sm:flex">
            {saveState === 'saved' ? <CloudCheck className="size-4 text-emerald-500" /> : <CloudUpload className="size-4 animate-pulse text-amber-500" />}
            {saveState === 'saved' ? 'Saqlandi' : 'Saqlanmoqda...'}
          </div>
          <motion.div animate={danger ? { scale: [1, 1.06, 1] } : {}} transition={{ repeat: Infinity, duration: 1 }} className={cn('flex items-center gap-2 rounded-2xl px-3.5 py-2 font-mono text-[15px] font-extrabold tabular-nums', danger ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-panel text-fg')}>
            <Timer className="size-4" />
            {fmtDuration(left)}
          </motion.div>
          <Button
            icon={<Send />}
            loading={finish.isPending}
            onClick={async () => {
              const unanswered = questions.length - answeredCount;
              if (await confirm({ title: 'Testni yakunlash', description: unanswered ? `${unanswered} ta savolga javob berilmagan. Baribir yakunlaysizmi?` : 'Barcha savollarga javob berdingiz. Yakunlaysizmi?', confirmText: 'Yakunlash', danger: unanswered > 0 })) doFinish();
            }}
          >
            Yakunlash
          </Button>
        </div>
        <div className="h-1 bg-panel">
          <motion.div className={cn('h-full', danger ? 'bg-rose-500' : 'bg-brand-600')} animate={{ width: `${(left / total) * 100}%` }} transition={{ duration: 1, ease: 'linear' }} />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <AnimatePresence mode="wait">
            {q && (
              <motion.div key={q.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="card p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted">
                    <span className="rounded-lg bg-brand-50 px-2 py-1 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      {index + 1} / {questions.length}
                    </span>
                    <span>{QUESTION_TYPE[q.type]}</span>
                    <span>· {q.points} ball</span>
                  </div>
                  <button onClick={() => toggleFlag(attemptId, q.id)} className={cn('flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition', flagged?.includes(q.id) ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : 'text-muted hover:bg-panel')}>
                    <Flag className="size-3.5" /> {flagged?.includes(q.id) ? 'Belgilangan' : 'Keyinroq qaytish'}
                  </button>
                </div>
                <h2 className="mt-5 text-[19px] font-bold leading-snug text-fg">{q.text}</h2>
                <div className="mt-6">
                  <QuestionInput q={q} value={answers[q.id] ?? []} onChange={(v) => answer(q.id, v)} />
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <Button variant="outline" icon={<ArrowLeft />} disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
                    Oldingi
                  </Button>
                  {index < questions.length - 1 ? (
                    <Button iconRight={<ArrowRight />} onClick={() => setIndex((i) => i + 1)}>
                      Keyingi
                    </Button>
                  ) : (
                    <span className="text-xs font-semibold text-muted">Oxirgi savol</span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="mt-4 text-center text-xs text-muted">
            Maslahat: <kbd className="font-semibold">←</kbd> <kbd className="font-semibold">→</kbd> bilan savollar orasida, <kbd className="font-semibold">1–4</kbd> bilan variant tanlang
          </p>
        </div>

        <aside className="card h-fit p-5 lg:sticky lg:top-24">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-bold text-fg">Savollar</span>
            <span className="text-xs font-semibold text-muted">
              {answeredCount}/{questions.length} javob
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((x, i) => {
              const done = !!answers[x.id]?.length && answers[x.id][0] !== '';
              const flag = flagged?.includes(x.id);
              return (
                <button
                  key={x.id}
                  onClick={() => setIndex(i)}
                  className={cn(
                    'relative grid aspect-square place-items-center rounded-xl text-[13px] font-bold transition',
                    i === index ? 'bg-brand-600 text-white shadow-brand' : done ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200' : 'bg-panel text-muted hover:text-fg',
                  )}
                >
                  {i + 1}
                  {flag && <span className="absolute -right-1 -top-1 size-3 rounded-full bg-amber-400 ring-2 ring-card" />}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1.5 text-[11px] text-muted">
            <Legend className="bg-brand-100 dark:bg-brand-500/20" label="Javob berilgan" />
            <Legend className="bg-panel ring-1 ring-line" label="Javobsiz" />
            <Legend className="bg-amber-400" label="Keyinroq qaytish" round />
          </div>
          {left < 300 && (
            <div className="mt-4 flex gap-2 rounded-2xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertTriangle className="size-4 shrink-0" /> Vaqt tugashiga oz qoldi. Javoblar avtomatik saqlanmoqda.
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

function Legend({ className, label, round }: { className: string; label: string; round?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('size-3', round ? 'rounded-full' : 'rounded', className)} />
      {label}
    </div>
  );
}

function QuestionInput({ q, value, onChange }: { q: PublicQuestion; value: string[]; onChange: (v: string[]) => void }) {
  if (q.type === 'short') {
    return <Input inputSize="lg" autoFocus value={value[0] ?? ''} onChange={(e) => onChange([e.target.value])} placeholder="Javobingizni yozing..." />;
  }
  const multi = q.type === 'multiple';
  return (
    <div className={cn('grid gap-3', q.type === 'truefalse' && 'sm:grid-cols-2')}>
      {q.options.map((o, i) => {
        const selected = value.includes(o.id);
        return (
          <motion.button
            key={o.id}
            whileTap={{ scale: 0.99 }}
            onClick={() => onChange(multi ? (selected ? value.filter((x) => x !== o.id) : [...value, o.id]) : [o.id])}
            className={cn('flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition', selected ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-line bg-card hover:border-brand-200 dark:hover:border-brand-500/30')}
          >
            <span className={cn('grid size-8 shrink-0 place-items-center text-[13px] font-extrabold transition', multi ? 'rounded-lg' : 'rounded-full', selected ? 'bg-brand-600 text-white' : 'bg-panel text-muted')}>
              {selected ? <Check className="size-4" strokeWidth={3} /> : String.fromCharCode(65 + i)}
            </span>
            <span className="text-[14.5px] font-medium text-fg">{o.text}</span>
          </motion.button>
        );
      })}
      {multi && <p className="text-xs text-muted">Bir nechta to'g'ri javob bo'lishi mumkin</p>}
    </div>
  );
}
