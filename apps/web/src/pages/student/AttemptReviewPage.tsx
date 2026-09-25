import { useParams } from 'react-router';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, Lock, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { fmtDateTime, fmtDuration } from '@/lib/format';
import { useAttemptReview } from '@/api/queries/assessments';
import { ButtonLink, Card, Page, PageHeader, RingProgress, Skeleton } from '@/components/ui';

export default function AttemptReviewPage() {
  const { attemptId } = useParams();
  const { data, isLoading } = useAttemptReview(attemptId);
  if (isLoading || !data) return <Skeleton className="h-96 rounded-3xl" />;
  const { result, assessment, questions } = data;
  const pct = assessment.maxScore ? ((result.score ?? 0) / assessment.maxScore) * 100 : 0;
  const correct = questions?.filter((q) => q.earned >= q.points).length ?? 0;
  const spent = result.startedAt && result.finishedAt ? (new Date(result.finishedAt).getTime() - new Date(result.startedAt).getTime()) / 1000 : 0;
  const color = pct >= 86 ? '#10b981' : pct >= 71 ? '#0ea5e9' : pct >= 55 ? '#f59e0b' : '#f43f5e';

  return (
    <Page className="mx-auto max-w-4xl">
      <PageHeader breadcrumbs={[{ label: 'Testlar', to: '/student/tests' }, { label: 'Natija' }]} title={assessment.title} description={assessment.course.title} actions={<ButtonLink to="/student/tests" variant="outline">Testlarga qaytish</ButtonLink>} />

      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 size-56 rounded-full opacity-20 blur-3xl" style={{ background: color }} />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row">
          <motion.div initial={{ scale: 0.6, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}>
            <RingProgress value={pct} size={150} stroke={12} color={color}>
              <div className="text-center leading-none">
                <div className="text-4xl font-black text-fg tabular-nums">{result.score}</div>
                <div className="mt-1 text-xs font-semibold text-muted">/ {assessment.maxScore} ball</div>
              </div>
            </RingProgress>
          </motion.div>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric icon={<CheckCircle2 className="text-emerald-500" />} label="To'g'ri javoblar" value={questions ? `${correct} / ${questions.length}` : '—'} />
            <Metric icon={<Clock className="text-sky-500" />} label="Sarflangan vaqt" value={spent ? fmtDuration(spent) : '—'} />
            <Metric icon={<CheckCircle2 className="text-brand-500" />} label="Natija" value={`${Math.round(pct)}%`} />
            <div className="col-span-2 text-xs text-muted sm:col-span-3">
              {result.attempt}-urinish · yakunlangan: {result.finishedAt ? fmtDateTime(result.finishedAt) : '—'}
            </div>
          </div>
        </div>
      </Card>

      {questions ? (
        <div className="space-y-4">
          {questions.map((q, i) => {
            const mine = result.answers?.[q.id] ?? [];
            const ok = q.earned >= q.points;
            const partial = !ok && q.earned > 0;
            return (
              <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.5) }}>
                <Card className={cn('border-l-4 p-5', ok ? 'border-l-emerald-500' : partial ? 'border-l-amber-500' : 'border-l-rose-500')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      {ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" /> : <XCircle className={cn('mt-0.5 size-5 shrink-0', partial ? 'text-amber-500' : 'text-rose-500')} />}
                      <div className="text-[14.5px] font-bold text-fg">
                        {i + 1}. {q.text}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-muted">
                      {q.earned}/{q.points}
                    </span>
                  </div>
                  {q.type === 'short' ? (
                    <div className="mt-3 space-y-1 pl-8 text-[13px]">
                      <div>
                        Sizning javobingiz: <b className={ok ? 'text-emerald-600' : 'text-rose-600'}>{mine[0] || '—'}</b>
                      </div>
                      <div className="text-muted">To'g'ri javob: {q.correct.join(' / ')}</div>
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-2 pl-8 sm:grid-cols-2">
                      {q.options.map((o) => {
                        const isCorrect = q.correct.includes(o.id);
                        const chosen = mine.includes(o.id);
                        return (
                          <div key={o.id} className={cn('flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px]', isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200' : chosen ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200' : 'border-line text-fg-soft')}>
                            {isCorrect ? <CheckCircle2 className="size-4" /> : chosen ? <XCircle className="size-4" /> : <span className="size-4" />}
                            {o.text}
                            {chosen && <span className="ml-auto text-[10px] font-bold uppercase opacity-70">tanlangan</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {q.explanation && <p className="mt-3 pl-8 text-xs text-muted">💡 {q.explanation}</p>}
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="flex items-center gap-3 p-6 text-sm text-muted">
          <Lock className="size-5" /> O'qituvchi javoblar tahlilini yopiq qilgan. Faqat umumiy ball ko'rsatiladi.
        </Card>
      )}
    </Page>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="panel p-3.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted [&_svg]:size-4">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-lg font-extrabold text-fg tabular-nums">{value}</div>
    </div>
  );
}
