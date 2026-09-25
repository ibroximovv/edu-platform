import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, Info } from 'lucide-react';
import type { ScheduleItem } from '@edu/shared';
import { useGroups } from '@/api/queries/admin';
import { useCourses } from '@/api/queries/learning';
import { useDeleteSlot, useSchedule } from '@/api/queries/misc';
import { useConfirm } from '@/contexts/ConfirmProvider';
import { SlotFormModal } from '@/components/domain/AdminForms';
import { ScheduleGrid } from '@/components/domain/Schedule';
import { Badge, Card, Page, PageHeader, Select, Skeleton } from '@/components/ui';

export default function AdminSchedulePage() {
  const { data: groups } = useGroups();
  const [groupId, setGroupId] = useState('');
  const { data: items, isLoading } = useSchedule({ groupId }, !!groupId);
  const { data: courses } = useCourses({ as: 'admin' });
  const del = useDeleteSlot();
  const confirm = useConfirm();
  const [modal, setModal] = useState<{ open: boolean; cell?: { day: number; pair: number } | null; item?: ScheduleItem | null }>({ open: false });

  useEffect(() => {
    if (!groupId && groups?.length) setGroupId(groups[0].id);
  }, [groups, groupId]);

  const groupCourses = (courses ?? []).filter((c) => c.groupIds.includes(groupId));
  const scheduledCourseIds = new Set(items?.map((i) => i.courseId));
  const unscheduled = groupCourses.filter((c) => !scheduledCourseIds.has(c.id));

  return (
    <Page>
      <PageHeader
        title="Dars jadvali konstruktori"
        description="Bo'sh katakni bosib dars qo'shing. Guruh, o'qituvchi va xona bandligi avtomatik tekshiriladi."
        actions={<Select value={groupId} onChange={(e) => setGroupId(e.target.value)} options={(groups ?? []).map((g) => ({ value: g.id, label: `${g.name} · ${g.course}-kurs` }))} className="w-56" />}
      />
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="min-w-0 p-5">
          {isLoading || !items ? (
            <Skeleton className="h-[520px]" />
          ) : (
            <ScheduleGrid items={items} showTeacher onCellClick={(day, pair) => setModal({ open: true, cell: { day, pair } })} onItemClick={(item) => setModal({ open: true, item })} />
          )}
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-[15px] font-bold text-fg">
              <CalendarDays className="size-[18px] text-brand-600" /> Guruh fanlari
            </div>
            <ul className="mt-4 space-y-2">
              {groupCourses.map((c) => {
                const n = items?.filter((i) => i.courseId === c.id).length ?? 0;
                return (
                  <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl bg-panel px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] font-semibold text-fg">{c.subject.name}</div>
                      <div className="text-[10.5px] text-muted">
                        {c.teacher.lastName} {c.teacher.firstName.charAt(0)}.
                      </div>
                    </div>
                    <Badge tone={n ? 'green' : 'amber'}>{n} juft/hafta</Badge>
                  </li>
                );
              })}
            </ul>
            {unscheduled.length > 0 && (
              <div className="mt-4 flex gap-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                <AlertTriangle className="size-4 shrink-0" /> {unscheduled.length} ta fan hali jadvalga qo'yilmagan
              </div>
            )}
          </Card>
          <Card className="flex gap-3 p-5 text-xs text-muted">
            <Info className="size-4 shrink-0 text-brand-600" />
            <p>Mavjud darsni bosib tahrirlashingiz yoki o'chirishingiz mumkin. Toq/juft hafta darslari bir katakda birga turishi mumkin.</p>
          </Card>
        </div>
      </div>
      <SlotFormModal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        groupId={groupId}
        cell={modal.cell}
        initial={modal.item}
        courses={courses ?? []}
        onDelete={async (item) => {
          setModal({ open: false });
          if (await confirm({ title: "Darsni jadvaldan o'chirish", description: `${item.subject.name} · ${item.room}`, danger: true, confirmText: "O'chirish" })) del.mutate(item.id);
        }}
      />
    </Page>
  );
}
