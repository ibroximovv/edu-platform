import { useState } from 'react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import type { CourseView } from '@edu/shared';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS } from '@/lib/colors';
import { useGroups, useSemesters, useTeachers } from '@/api/queries/admin';
import { useCourses, useDeleteCourse } from '@/api/queries/learning';
import { useConfirm } from '@/contexts/ConfirmProvider';
import { CourseFormModal } from '@/components/domain/AdminForms';
import { Avatar, Badge, Button, Card, DataTable, Dropdown, Page, PageHeader, Progress, SearchInput, Select, type Column } from '@/components/ui';

export default function AdminCoursesPage() {
  const [semesterId, setSemesterId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [q, setQ] = useState('');
  const { data, isLoading } = useCourses({ as: 'admin', semesterId: semesterId || undefined, teacherId: teacherId || undefined, groupId: groupId || undefined, q: q || undefined });
  const { data: semesters } = useSemesters();
  const { data: teachers } = useTeachers();
  const { data: groups } = useGroups();
  const del = useDeleteCourse();
  const confirm = useConfirm();
  const [modal, setModal] = useState<{ open: boolean; course?: CourseView | null }>({ open: false });

  const columns: Column<CourseView>[] = [
    {
      key: 'subject',
      header: 'Fan',
      sortValue: (c) => c.subject.name,
      cell: (c) => (
        <div className="flex items-center gap-3">
          <span className={cn('h-9 w-1.5 rounded-full', SUBJECT_COLORS[c.subject.color].solid)} />
          <div>
            <div className="font-bold text-fg">{c.subject.name}</div>
            <div className="text-[11px] text-muted">
              {c.subject.code} · {c.subject.credits} kredit
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'teacher',
      header: "O'qituvchi",
      sortValue: (c) => c.teacher.lastName,
      cell: (c) => (
        <div className="flex items-center gap-2">
          <Avatar user={c.teacher} size="sm" />
          <span className="text-[12.5px] font-semibold">
            {c.teacher.lastName} {c.teacher.firstName.charAt(0)}.
          </span>
        </div>
      ),
    },
    {
      key: 'groups',
      header: 'Guruhlar',
      cell: (c) => (
        <div className="flex flex-wrap gap-1">
          {c.groups.map((g) => (
            <Badge key={g.id} tone="brand">
              {g.name}
            </Badge>
          ))}
        </div>
      ),
    },
    { key: 'grading', header: 'JN/ON/YN', cell: (c) => <span className="font-mono text-xs">{c.grading.current}/{c.grading.midterm}/{c.grading.final}</span> },
    {
      key: 'progress',
      header: 'Mavzular',
      sortValue: (c) => c.stats.topicsDone / Math.max(1, c.stats.topicsTotal),
      cell: (c) => (
        <div className="w-28">
          <div className="mb-1 text-[11px] font-semibold">
            {c.stats.topicsDone}/{c.stats.topicsTotal}
          </div>
          <Progress value={(c.stats.topicsDone / Math.max(1, c.stats.topicsTotal)) * 100} size="sm" />
        </div>
      ),
    },
    { key: 'students', header: 'Talaba', align: 'center', sortValue: (c) => c.stats.students, cell: (c) => c.stats.students },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (c) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown
            width="w-44"
            trigger={() => (
              <button className="grid size-8 place-items-center rounded-lg text-muted hover:bg-panel" aria-label="Amallar">
                <MoreHorizontal className="size-4" />
              </button>
            )}
            items={[
              { label: 'Tahrirlash', icon: <Pencil />, onClick: () => setModal({ open: true, course: c }) },
              {
                label: "O'chirish",
                icon: <Trash2 />,
                danger: true,
                onClick: async () => {
                  if (await confirm({ title: "Kursni o'chirish", description: "Kursga tegishli barcha mavzular, topshiriqlar, testlar, baholar va jadval o'chiriladi!", danger: true, confirmText: "O'chirish" })) del.mutate(c.id);
                },
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <Page>
      <PageHeader title="Kurslar (o'quv yuklamasi)" description="Qaysi fanni qaysi o'qituvchi qaysi guruhlarga o'tishi" actions={<Button icon={<Plus />} onClick={() => setModal({ open: true })}>Yangi kurs</Button>} />
      <div className="flex flex-wrap gap-2">
        <Select value={semesterId} onChange={(e) => setSemesterId(e.target.value)} options={(semesters ?? []).map((s) => ({ value: s.id, label: `${s.name}${s.isCurrent ? ' (joriy)' : ''}` }))} placeholder="Joriy semestr" className="w-60" />
        <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} placeholder="Barcha o'qituvchilar" options={(teachers ?? []).map((t) => ({ value: t.id, label: `${t.lastName} ${t.firstName}` }))} className="w-56" />
        <Select value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="Barcha guruhlar" options={(groups ?? []).map((g) => ({ value: g.id, label: g.name }))} className="w-44" />
        <SearchInput value={q} onChange={setQ} placeholder="Fan nomi" className="w-52" />
      </div>
      <Card className="overflow-hidden">
        <DataTable columns={columns} rows={data} loading={isLoading} rowKey={(c) => c.id} onRowClick={(c) => setModal({ open: true, course: c })} pageSize={15} />
      </Card>
      <CourseFormModal open={modal.open} onClose={() => setModal({ open: false })} initial={modal.course} />
    </Page>
  );
}
