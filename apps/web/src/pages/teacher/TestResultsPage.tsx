import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { CalendarClock, CheckCircle2, Download, Pencil, Save, Timer, Users, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { downloadCsv } from '@/lib/csv';
import { fmtDateTime, fmtDuration } from '@/lib/format';
import { CATEGORY, FORMAT } from '@/lib/labels';
import { useAssessment, useAssessmentResults, useAttemptReview, useSaveScores, type ResultRow } from '@/api/queries/assessments';
import { BarChart } from '@/components/charts';
import { Avatar, Badge, Button, ButtonLink, Card, CardHeader, DataTable, Drawer, Page, PageHeader, Skeleton, StatCard, type Column } from '@/components/ui';

export default function TestResultsPage() {
  const { id = '' } = useParams();
  const { data: a } = useAssessment(id);
  const { data: rows, isLoading } = useAssessmentResults(id);
  const save = useSaveScores();
  const [edits, setEdits] = useState<Record<string, number | null>>({});
  const [reviewId, setReviewId] = useState<string | null>(null);
  const manual = a && a.format !== 'test';

  const scores = useMemo(() => (rows ?? []).map((r) => r.result?.score).filter((s): s is number => s != null), [rows]);
  const avg = scores.length ? scores.reduce((x, y) => x + y, 0) / scores.length : 0;
  const hist = useMemo(() => {
    if (!a) return [];
    const buckets = [0, 0, 0, 0, 0];
    for (const s of scores) buckets[Math.min(4, Math.floor((s / a.maxScore) * 5))]++;
    return ['0–20%', '20–40%', '40–60%', '60–80%', '80–100%'].map((label, i) => ({ label, value: buckets[i] }));
  }, [scores, a]);

  if (!a) return <Skeleton className="h-96 rounded-3xl" />;

  const columns: Column<ResultRow>[] = [
    {
      key: 'student',
      header: 'Talaba',
      sortValue: (r) => r.student.lastName,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar user={r.student} size="md" />
          <div>
            <div className="font-bold text-fg">
              {r.student.lastName} {r.student.firstName}
            </div>
            <div className="text-[11px] text-muted">{r.student.groupName}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Holat',
      sortValue: (r) => r.result?.status ?? '',
      cell: (r) => (!r.result ? <Badge>Topshirmagan</Badge> : r.result.status === 'in_progress' ? <Badge tone="amber" dot>Yechmoqda</Badge> : <Badge tone="green">Yakunlangan</Badge>),
    },
    ...(!manual
      ? [
          { key: 'attempts', header: 'Urinish', align: 'center' as const, sortValue: (r: ResultRow) => r.attempts, cell: (r: ResultRow) => r.attempts || '—' },
          {
            key: 'time',
            header: 'Vaqt',
            cell: (r: ResultRow) =>
              r.result?.startedAt && r.result.finishedAt ? (
                <div className="text-[12px]">
                  <div className="font-semibold text-fg">{fmtDuration((new Date(r.result.finishedAt).getTime() - new Date(r.result.startedAt).getTime()) / 1000)}</div>
                  <div className="text-muted">{fmtDateTime(r.result.finishedAt)}</div>
                </div>
              ) : (
                '—'
              ),
          },
        ]
      : []),
    {
      key: 'score',
      header: 'Ball',
      align: 'right',
      sortValue: (r) => r.result?.score ?? -1,
      cell: (r) => {
        if (manual) {
          const v = edits[r.student.id] !== undefined ? edits[r.student.id] : r.result?.score ?? null;
          return (
            <input
              type="number"
              min={0}
              max={a.maxScore}
              value={v ?? ''}
              placeholder="—"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEdits((x) => ({ ...x, [r.student.id]: e.target.value === '' ? null : Math.min(a.maxScore, Math.max(0, Number(e.target.value))) }))}
              className={cn('h-9 w-20 rounded-xl border bg-transparent text-center text-[14px] font-bold outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20', edits[r.student.id] !== undefined ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10' : 'border-line')}
            />
          );
        }
        return r.result?.score != null ? (
          <span className="text-[15px] font-extrabold text-fg tabular-nums">
            {r.result.score}
            <span className="text-xs font-semibold text-muted">/{a.maxScore}</span>
          </span>
        ) : (
          <span className="text-muted">—</span>
        );
      },
    },
  ];

  return (
    <Page>
      <PageHeader
        breadcrumbs={[{ label: 'Test va nazoratlar', to: '/teacher/tests' }, { label: a.course.title }]}
        title={a.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={a.category === 'final' ? 'red' : a.category === 'midterm' ? 'amber' : 'violet'}>{CATEGORY[a.category]}</Badge>
            <Badge>{FORMAT[a.format]}</Badge>
            {a.status === 'draft' && <Badge tone="amber">Qoralama</Badge>}
            <span className="flex items-center gap-1 text-xs">
              <CalendarClock className="size-3.5" /> {fmtDateTime(a.startsAt)} — {fmtDateTime(a.endsAt)}
            </span>
          </span>
        }
        actions={
          <>
            <Button
              variant="outline"
              icon={<Download />}
              onClick={() => downloadCsv(`natijalar-${a.title}`, [['Talaba', 'Guruh', 'Ball', 'Maks'], ...(rows ?? []).map((r) => [`${r.student.lastName} ${r.student.firstName}`, r.student.groupName, r.result?.score ?? '', a.maxScore])])}
            >
              CSV
            </Button>
            <ButtonLink to={`/teacher/tests/${a.id}/edit`} variant="outline" icon={<Pencil className="size-4" />}>
              Tahrirlash
            </ButtonLink>
            {manual && Object.keys(edits).length > 0 && (
              <Button
                icon={<Save />}
                loading={save.isPending}
                onClick={async () => {
                  await save.mutateAsync({ id: a.id, scores: edits });
                  setEdits({});
                }}
              >
                Saqlash ({Object.keys(edits).length})
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Users />} label="Topshirganlar" value={scores.length} tone="violet" hint={`${rows?.length ?? 0} talabadan`} />
        <StatCard icon={<CheckCircle2 />} label="O'rtacha ball" value={avg} decimals={1} tone="emerald" hint={`maks. ${a.maxScore}`} />
        <StatCard icon={<Timer />} label="Eng yuqori" value={scores.length ? Math.max(...scores) : 0} decimals={1} tone="sky" />
        <StatCard icon={<XCircle />} label="Eng past" value={scores.length ? Math.min(...scores) : 0} decimals={1} tone="rose" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="min-w-0 overflow-hidden">
          <DataTable columns={columns} rows={rows} loading={isLoading} rowKey={(r) => r.student.id} pageSize={20} onRowClick={!manual ? (r) => r.result && r.result.status !== 'in_progress' && setReviewId(r.result.id) : undefined} />
        </Card>
        <Card className="h-fit p-5">
          <CardHeader title="Natijalar taqsimoti" subtitle="Talabalar soni" />
          <BarChart data={hist} height={170} highlight={[3, 4]} />
          {manual && <p className="mt-4 rounded-2xl bg-panel p-3 text-xs text-muted">Yozma/og'zaki nazorat: ballarni jadvalga kiriting va «Saqlash» tugmasini bosing. Talabalarga bildirishnoma yuboriladi.</p>}
        </Card>
      </div>
      <AttemptDrawer id={reviewId} onClose={() => setReviewId(null)} />
    </Page>
  );
}

function AttemptDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data } = useAttemptReview(id ?? undefined);
  return (
    <Drawer open={!!id} onClose={onClose} title="Urinish tahlili" description={data ? `Ball: ${data.result.score} / ${data.assessment.maxScore}` : ''}>
      {!data ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-3">
          {data.questions?.map((q, i) => {
            const mine = data.result.answers?.[q.id] ?? [];
            const ok = q.earned >= q.points;
            return (
              <div key={q.id} className={cn('rounded-2xl border-l-4 bg-panel/60 p-4', ok ? 'border-l-emerald-500' : q.earned > 0 ? 'border-l-amber-500' : 'border-l-rose-500')}>
                <div className="flex justify-between gap-2 text-[13px] font-bold text-fg">
                  <span>
                    {i + 1}. {q.text}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted">
                    {q.earned}/{q.points}
                  </span>
                </div>
                <div className="mt-2 text-[12.5px] text-fg-soft">
                  Javob: <b>{q.type === 'short' ? mine[0] || '—' : q.options.filter((o) => mine.includes(o.id)).map((o) => o.text).join(', ') || '—'}</b>
                </div>
                {!ok && <div className="text-[12px] text-emerald-600">To'g'ri: {q.type === 'short' ? q.correct.join(' / ') : q.options.filter((o) => q.correct.includes(o.id)).map((o) => o.text).join(', ')}</div>}
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}
