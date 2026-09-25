import { useState } from 'react';
import { motion } from 'motion/react';
import { CalendarRange, CheckCircle2, Pencil, Plus, Trash2, Zap } from 'lucide-react';
import type { Semester } from '@edu/shared';
import { cn } from '@/lib/cn';
import { fmtDate, toInputDate } from '@/lib/format';
import { useAcademicYears, useActivateSemester, useCreateYear, useDeleteYear, useUpdateSemester } from '@/api/queries/admin';
import { useConfirm } from '@/contexts/ConfirmProvider';
import { Badge, Button, Card, Field, Input, Modal, Page, PageHeader, Skeleton } from '@/components/ui';

export default function AcademicYearsPage() {
  const { data, isLoading } = useAcademicYears();
  const create = useCreateYear();
  const del = useDeleteYear();
  const activate = useActivateSemester();
  const confirm = useConfirm();
  const [adding, setAdding] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear() + 1);
  const [editing, setEditing] = useState<Semester | null>(null);

  return (
    <Page>
      <PageHeader title="O'quv yillari" description="O'quv yillari va semestrlar. Joriy semestr barcha bo'limlarda standart hisoblanadi." actions={<Button icon={<Plus />} onClick={() => setAdding(true)}>Yangi o'quv yili</Button>} />
      {isLoading ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : (
        <div className="space-y-5">
          {data?.map((y, i) => (
            <motion.div key={y.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className={cn('p-6', y.isCurrent && 'ring-2 ring-brand-500/40')}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={cn('grid size-12 place-items-center rounded-2xl', y.isCurrent ? 'bg-brand-600 text-white shadow-brand' : 'bg-panel text-muted')}>
                    <CalendarRange className="size-5" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xl font-extrabold text-fg">
                      {y.name} {y.isCurrent && <Badge tone="brand" dot>Joriy</Badge>}
                    </div>
                    <div className="text-xs text-muted">
                      {fmtDate(y.startDate)} — {fmtDate(y.endDate)}
                    </div>
                  </div>
                  {!y.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 />}
                      onClick={async () => {
                        if (await confirm({ title: "O'quv yilini o'chirish", description: y.name, danger: true, confirmText: "O'chirish" })) del.mutate(y.id);
                      }}
                    >
                      O'chirish
                    </Button>
                  )}
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {y.semesters.map((s) => {
                    const now = Date.now();
                    const progress = Math.min(100, Math.max(0, ((now - new Date(s.startDate).getTime()) / (new Date(s.endDate).getTime() - new Date(s.startDate).getTime())) * 100));
                    return (
                      <div key={s.id} className={cn('rounded-2xl border p-4', s.isCurrent ? 'border-brand-300 bg-brand-50/60 dark:border-brand-500/40 dark:bg-brand-500/10' : 'border-line')}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 font-bold text-fg">
                              {s.number}-semestr {s.isCurrent && <CheckCircle2 className="size-4 text-brand-600" />}
                            </div>
                            <div className="text-xs text-muted">
                              {fmtDate(s.startDate)} — {fmtDate(s.endDate)}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon-sm" variant="ghost" onClick={() => setEditing(s)} aria-label="Tahrirlash">
                              <Pencil />
                            </Button>
                            {!s.isCurrent && (
                              <Button size="xs" variant="soft" icon={<Zap />} loading={activate.isPending && activate.variables === s.id} onClick={() => activate.mutate(s.id)}>
                                Joriy qilish
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel">
                            <div className="h-full rounded-full bg-brand-500" style={{ width: `${progress}%` }} />
                          </div>
                          {Math.round(progress)}%
                        </div>
                        <div className="mt-2 text-xs font-semibold text-fg-soft">{s.courseCount} ta kurs</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        size="sm"
        icon={<CalendarRange />}
        title="Yangi o'quv yili"
        description="Ikki semestr avtomatik yaratiladi (sentabr–yanvar, fevral–iyun)"
        footer={
          <Button
            loading={create.isPending}
            onClick={async () => {
              await create.mutateAsync(year);
              setAdding(false);
            }}
          >
            Yaratish
          </Button>
        }
      >
        <Field label="Boshlanish yili" hint={`${year}-${year + 1} o'quv yili`}>
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </Field>
      </Modal>
      <SemesterModal semester={editing} onClose={() => setEditing(null)} />
    </Page>
  );
}

function SemesterModal({ semester, onClose }: { semester: Semester | null; onClose: () => void }) {
  const update = useUpdateSemester();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [prev, setPrev] = useState<string | null>(null);
  if (semester && semester.id !== prev) {
    setPrev(semester.id);
    setStart(toInputDate(semester.startDate));
    setEnd(toInputDate(semester.endDate));
  }
  return (
    <Modal
      open={!!semester}
      onClose={onClose}
      size="sm"
      title={semester?.name}
      footer={
        <Button
          loading={update.isPending}
          onClick={async () => {
            await update.mutateAsync({ id: semester!.id, startDate: new Date(start).toISOString(), endDate: new Date(end).toISOString() });
            onClose();
          }}
        >
          Saqlash
        </Button>
      }
    >
      <div className="grid gap-4">
        <Field label="Boshlanish">
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Tugash">
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
