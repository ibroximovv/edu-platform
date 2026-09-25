import { useState } from 'react';
import { CalendarPlus, Trash2 } from 'lucide-react';
import type { AttendanceSession, AttendanceStatus, Topic } from '@edu/shared';
import { cn } from '@/lib/cn';
import { fmtDay, toInputDate } from '@/lib/format';
import { ATTENDANCE } from '@/lib/labels';
import { useAttendance, useCreateAttendance, useDeleteAttendance, useUpdateAttendance } from '@/api/queries/learning';
import { useConfirm } from '@/contexts/ConfirmProvider';
import { Avatar, Button, EmptyState, Field, Input, Modal, Select, Skeleton } from '@/components/ui';

const ORDER: AttendanceStatus[] = ['present', 'late', 'absent', 'excused'];

export function AttendanceBoard({ courseId, topics }: { courseId: string; topics: Topic[] }) {
  const { data, isLoading } = useAttendance(courseId);
  const update = useUpdateAttendance();
  const create = useCreateAttendance();
  const remove = useDeleteAttendance();
  const confirm = useConfirm();
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState(toInputDate(new Date()));
  const [topicId, setTopicId] = useState('');
  const [local, setLocal] = useState<Record<string, AttendanceSession['records']>>({});

  if (isLoading || !data) return <Skeleton className="m-5 h-64" />;
  const sessions = data.sessions.slice(-14);

  const cycle = (s: AttendanceSession, studentId: string) => {
    const cur = local[s.id]?.[studentId] ?? s.records[studentId] ?? 'present';
    const next = ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length];
    setLocal((x) => ({ ...x, [s.id]: { ...x[s.id], [studentId]: next } }));
    update.mutate({ id: s.id, records: { [studentId]: next } });
  };

  const rate = (studentId: string) => {
    let t = 0;
    let ok = 0;
    for (const s of data.sessions) {
      const st = local[s.id]?.[studentId] ?? s.records[studentId];
      if (!st) continue;
      t++;
      if (st !== 'absent') ok++;
    }
    return t ? Math.round((ok / t) * 100) : 100;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
        <div className="flex flex-wrap gap-2">
          {ORDER.map((s) => (
            <span key={s} className={cn('rounded-lg px-2 py-1 text-[11px] font-bold', ATTENDANCE[s].tone)}>
              {ATTENDANCE[s].short} — {ATTENDANCE[s].label}
            </span>
          ))}
        </div>
        <Button icon={<CalendarPlus />} onClick={() => setAdding(true)}>
          Dars qo'shish
        </Button>
      </div>
      {sessions.length ? (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[12.5px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-[220px] border-b border-r border-line bg-panel px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-muted">Talaba</th>
                {sessions.map((s) => (
                  <th key={s.id} className="group min-w-[58px] border-b border-line bg-panel px-1 py-2 text-center">
                    <div className="text-[11px] font-bold text-fg">{fmtDay(s.date)}</div>
                    <button
                      onClick={async () => {
                        if (await confirm({ title: "Darsni o'chirish", description: `${fmtDay(s.date)} sanadagi davomat o'chiriladi`, danger: true, confirmText: "O'chirish" })) remove.mutate(s.id);
                      }}
                      className="mx-auto mt-0.5 hidden text-muted hover:text-rose-500 group-hover:block"
                      aria-label="O'chirish"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </th>
                ))}
                <th className="min-w-[70px] border-b border-l border-line bg-panel px-2 text-center text-[11px] font-bold uppercase text-muted">%</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((st) => {
                const r = rate(st.id);
                return (
                  <tr key={st.id} className="group">
                    <td className="sticky left-0 z-10 border-b border-r border-line bg-card px-4 py-1.5 group-hover:bg-panel">
                      <div className="flex items-center gap-2.5">
                        <Avatar user={st} size="xs" />
                        <span className="truncate font-semibold text-fg">
                          {st.lastName} {st.firstName.charAt(0)}.
                        </span>
                      </div>
                    </td>
                    {sessions.map((s) => {
                      const status = local[s.id]?.[st.id] ?? s.records[st.id];
                      return (
                        <td key={s.id} className="border-b border-line p-1 text-center group-hover:bg-panel/50">
                          <button onClick={() => cycle(s, st.id)} className={cn('h-8 w-11 rounded-lg text-[11px] font-extrabold transition active:scale-90', status ? ATTENDANCE[status].tone : 'bg-panel text-muted')} title={status ? ATTENDANCE[status].label : "Belgilanmagan"}>
                            {status ? ATTENDANCE[status].short : '·'}
                          </button>
                        </td>
                      );
                    })}
                    <td className={cn('border-b border-l border-line text-center font-bold tabular-nums group-hover:bg-panel/50', r < 75 ? 'text-rose-500' : 'text-emerald-600')}>{r}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Davomat hali qayd etilmagan" description="Yangi dars qo'shib, talabalar davomatini belgilang" />
      )}
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        icon={<CalendarPlus />}
        title="Yangi dars"
        description="Barcha talabalar avtomatik 'Keldi' deb belgilanadi — keyin o'zgartirishingiz mumkin"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Bekor qilish
            </Button>
            <Button
              loading={create.isPending}
              onClick={async () => {
                await create.mutateAsync({ courseId, date: new Date(date).toISOString(), topicId: topicId || null });
                setAdding(false);
              }}
            >
              Qo'shish
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Sana">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Mavzu" hint="Tanlangan mavzu 'o'tildi' deb belgilanadi">
            <Select value={topicId} onChange={(e) => setTopicId(e.target.value)} placeholder="— Tanlanmagan —" options={topics.map((t) => ({ value: t.id, label: `${t.order}. ${t.title}` }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
