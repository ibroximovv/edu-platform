import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { motion } from 'motion/react';
import { AlertTriangle, CalendarClock, CheckCircle2, MessageSquareQuote, Send, Undo2 } from 'lucide-react';
import type { FileRef } from '@edu/shared';
import { cn } from '@/lib/cn';
import { fmtDateTime, fmtRelative } from '@/lib/format';
import { ACCEPT_PRESETS } from '@/lib/files';
import { ASSIGNMENT_TYPE } from '@/lib/labels';
import { useAssignment, useSubmitAssignment, useWithdrawSubmission } from '@/api/queries/learning';
import { useConfirm } from '@/contexts/ConfirmProvider';
import { AssignmentStateBadge, assignmentState, Deadline } from '@/components/domain/Bits';
import { FileDropzone, FileList } from '@/components/domain/Files';
import { Badge, Button, Card, CardHeader, Page, PageHeader, RingProgress, Skeleton, Textarea } from '@/components/ui';

export default function StudentAssignmentDetailPage() {
  const { id } = useParams();
  const { data: a, isLoading } = useAssignment(id);
  const submit = useSubmitAssignment();
  const withdraw = useWithdrawSubmission();
  const confirm = useConfirm();
  const [text, setText] = useState('');
  const [files, setFiles] = useState<FileRef[]>([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const sub = a?.mySubmission;
  useEffect(() => {
    setText(sub?.text ?? '');
    setFiles(sub?.files ?? []);
  }, [sub?.id, sub?.attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !a) return <Skeleton className="h-96 rounded-3xl" />;

  const state = assignmentState(a);
  const late = new Date(a.deadline).getTime() < Date.now();
  const canSubmit = (state === 'pending' || state === 'overdue' || state === 'returned' || (state === 'submitted' && editing)) && !(late && !a.allowLate);
  const showForm = canSubmit && (!sub || editing || state === 'returned');

  const doSubmit = async () => {
    if (late && !(await confirm({ title: 'Muddat o‘tgan', description: `Kech topshirilgan ish uchun ${a.latePenalty}% jarima qo'llanilishi mumkin. Davom etasizmi?`, confirmText: 'Topshirish' }))) return;
    await submit.mutateAsync({ id: a.id, text: text.trim() || undefined, files });
    setEditing(false);
  };

  return (
    <Page>
      <PageHeader breadcrumbs={[{ label: 'Topshiriqlar', to: '/student/assignments' }, { label: a.course.title }]} title={a.title} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <AssignmentStateBadge state={state} />
              <Badge tone="violet">{ASSIGNMENT_TYPE[a.type]}</Badge>
              <Badge>{a.maxScore} ball</Badge>
              {a.allowLate ? <Badge tone="amber">Kech topshirish: −{a.latePenalty}%</Badge> : <Badge tone="red">Kech qabul qilinmaydi</Badge>}
            </div>
            <h2 className="mt-4 text-[15px] font-bold text-fg">Topshiriq sharti</h2>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-fg-soft">{a.description}</p>
            {a.attachments.length > 0 && (
              <div className="mt-5">
                <div className="label-caps mb-2">Ilova qilingan fayllar</div>
                <FileList files={a.attachments} />
              </div>
            )}
          </Card>

          {sub && !editing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <CardHeader
                  title="Mening javobim"
                  subtitle={`${sub.attempt}-urinish · ${fmtDateTime(sub.submittedAt)}${sub.late ? ' · kech topshirilgan' : ''}`}
                  action={
                    state === 'submitted' && (
                      <div className="flex gap-2">
                        {!late && (
                          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                            Tahrirlash
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Undo2 />}
                          onClick={async () => {
                            if (await confirm({ title: 'Javobni qaytarib olish', description: "Yuborilgan javob o'chiriladi.", danger: true, confirmText: 'Qaytarib olish' })) withdraw.mutate(sub.id);
                          }}
                        >
                          Qaytarib olish
                        </Button>
                      </div>
                    )
                  }
                />
                {sub.text && <p className="mb-4 whitespace-pre-line rounded-2xl bg-panel p-4 text-[13.5px] text-fg-soft">{sub.text}</p>}
                <FileList files={sub.files} />
              </Card>
            </motion.div>
          )}

          {showForm && (
            <Card className="p-6">
              <CardHeader title={sub ? 'Javobni yangilash' : 'Javob yuborish'} subtitle="Matn yozing va/yoki fayl biriktiring" />
              {state === 'returned' && sub?.feedback && (
                <div className="mb-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  <AlertTriangle className="size-5 shrink-0" />
                  <div>
                    <b>O'qituvchi izohi:</b> {sub.feedback}
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Javobingiz, izohlar yoki GitHub havolasi..." />
                <FileDropzone value={files} onChange={setFiles} accept={ACCEPT_PRESETS.submission} onBusyChange={setBusy} maxFiles={5} />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Deadline date={a.deadline} />
                  <div className="flex gap-2">
                    {editing && (
                      <Button variant="ghost" onClick={() => setEditing(false)}>
                        Bekor qilish
                      </Button>
                    )}
                    <Button onClick={doSubmit} loading={submit.isPending} disabled={busy || (!text.trim() && !files.length)} icon={<Send />}>
                      Yuborish
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {state === 'closed' && !sub && (
            <Card className="flex items-center gap-3 p-6 text-sm text-muted">
              <AlertTriangle className="size-5 text-rose-500" /> Topshirish muddati tugagan. Bu topshiriq kech qabul qilinmaydi.
            </Card>
          )}
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <CardHeader title="Muddat" icon={<CalendarClock />} />
            <div className="text-lg font-extrabold text-fg">{fmtDateTime(a.deadline)}</div>
            <Deadline date={a.deadline} className="mt-1" />
            <div className="mt-4 space-y-2 text-[13px]">
              <Row label="Fan" value={a.course.title} />
              <Row label="E'lon qilingan" value={fmtRelative(a.createdAt)} />
              <Row label="Maksimal ball" value={`${a.maxScore}`} />
            </div>
          </Card>

          {sub?.status === 'graded' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="relative overflow-hidden p-5">
                <div className="absolute -right-10 -top-10 size-32 rounded-full bg-emerald-400/20 blur-2xl" />
                <CardHeader title="Baho" icon={<CheckCircle2 className="text-emerald-500" />} />
                <div className="flex items-center gap-4">
                  <RingProgress value={((sub.score ?? 0) / a.maxScore) * 100} size={86} stroke={8} color="#10b981">
                    <div className="text-center leading-none">
                      <div className="text-xl font-extrabold text-fg">{sub.score}</div>
                      <div className="text-[10px] font-semibold text-muted">/ {a.maxScore}</div>
                    </div>
                  </RingProgress>
                  <div className="text-xs text-muted">Baholangan: {sub.gradedAt ? fmtRelative(sub.gradedAt) : '—'}</div>
                </div>
                {sub.feedback && (
                  <div className="mt-4 rounded-2xl bg-panel p-3.5">
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">
                      <MessageSquareQuote className="size-3.5" /> Izoh
                    </div>
                    <p className="text-[13px] text-fg-soft">{sub.feedback}</p>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          <Card className="p-5">
            <CardHeader title="Holat tarixi" />
            <ol className="space-y-3 text-[13px]">
              <Step done label="Topshiriq e'lon qilindi" at={a.createdAt} />
              <Step done={!!sub} label="Javob yuborildi" at={sub?.submittedAt} />
              <Step done={sub?.status === 'graded' || sub?.status === 'returned'} label={sub?.status === 'returned' ? 'Qayta ishlashga qaytarildi' : 'Baholandi'} at={sub?.gradedAt ?? undefined} />
            </ol>
          </Card>
        </aside>
      </div>
    </Page>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-right font-semibold text-fg">{value}</span>
    </div>
  );
}

function Step({ done, label, at }: { done: boolean; label: string; at?: string | null }) {
  return (
    <li className="flex items-start gap-3">
      <span className={cn('mt-0.5 grid size-5 place-items-center rounded-full', done ? 'bg-emerald-500 text-white' : 'bg-panel ring-1 ring-line')}>{done && <CheckCircle2 className="size-3.5" />}</span>
      <div>
        <div className={cn('font-semibold', done ? 'text-fg' : 'text-muted')}>{label}</div>
        {at && done && <div className="text-[11px] text-muted">{fmtDateTime(at)}</div>}
      </div>
    </li>
  );
}
