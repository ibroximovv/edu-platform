import { useState } from 'react';
import { BookOpen, Layers, Plus, Users } from 'lucide-react';
import type { TeacherView } from '@edu/shared';
import { useDepartments, useTeachers } from '@/api/queries/admin';
import { useCourses } from '@/api/queries/learning';
import { useSchedule } from '@/api/queries/misc';
import { UserFormModal } from '@/components/domain/AdminForms';
import { ScheduleGrid } from '@/components/domain/Schedule';
import { Avatar, Badge, Button, Card, DataTable, Drawer, Page, PageHeader, SearchInput, Select, Skeleton, type Column } from '@/components/ui';

export default function TeachersPage() {
  const [q, setQ] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const { data, isLoading } = useTeachers({ q: q || undefined, departmentId: departmentId || undefined });
  const { data: departments } = useDepartments();
  const [active, setActive] = useState<TeacherView | null>(null);
  const [creating, setCreating] = useState(false);

  const columns: Column<TeacherView>[] = [
    {
      key: 'name',
      header: "O'qituvchi",
      sortValue: (t) => t.lastName,
      cell: (t) => (
        <div className="flex items-center gap-3">
          <Avatar user={t} size="md" />
          <div>
            <div className="font-bold text-fg">
              {t.lastName} {t.firstName}
            </div>
            <div className="text-[11px] text-muted">{t.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'pos',
      header: 'Lavozim',
      sortValue: (t) => t.position,
      cell: (t) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="violet">{t.position}</Badge>
          {t.degree && <Badge tone="sky">{t.degree}</Badge>}
        </div>
      ),
    },
    { key: 'dep', header: 'Kafedra', sortValue: (t) => t.department?.name ?? '', cell: (t) => <span className="text-[12.5px]">{t.department?.name ?? '—'}</span> },
    { key: 'courses', header: 'Kurslar', align: 'center', sortValue: (t) => t.courseCount, cell: (t) => <b className="text-fg">{t.courseCount}</b> },
    { key: 'students', header: 'Talabalar', align: 'center', sortValue: (t) => t.studentCount, cell: (t) => t.studentCount },
    {
      key: 'load',
      header: 'Haftalik yuklama',
      sortValue: (t) => t.weeklyPairs,
      cell: (t) => (
        <div className="w-32">
          <div className="mb-1 text-[11px] font-semibold text-fg">{t.weeklyPairs} juftlik</div>
          <div className="h-1.5 overflow-hidden rounded-full bg-panel">
            <div className={t.weeklyPairs > 10 ? 'h-full bg-rose-500' : 'h-full bg-brand-500'} style={{ width: `${Math.min(100, (t.weeklyPairs / 12) * 100)}%` }} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <Page>
      <PageHeader title="O'qituvchilar" description="Professor-o'qituvchilar tarkibi va o'quv yuklamasi" actions={<Button icon={<Plus />} onClick={() => setCreating(true)}>Yangi o'qituvchi</Button>} />
      <div className="flex flex-wrap gap-2">
        <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} placeholder="Barcha kafedralar" options={(departments ?? []).map((d) => ({ value: d.id, label: d.name }))} className="w-72" />
        <SearchInput value={q} onChange={setQ} className="w-64" />
      </div>
      <Card className="overflow-hidden">
        <DataTable columns={columns} rows={data} loading={isLoading} rowKey={(t) => t.id} onRowClick={setActive} pageSize={15} />
      </Card>
      <TeacherDrawer teacher={active} onClose={() => setActive(null)} />
      <UserFormModal open={creating} onClose={() => setCreating(false)} presetRoles={['teacher']} />
    </Page>
  );
}

function TeacherDrawer({ teacher, onClose }: { teacher: TeacherView | null; onClose: () => void }) {
  const { data: courses } = useCourses({ as: 'admin', teacherId: teacher?.id }, !!teacher);
  const { data: schedule } = useSchedule({ teacherId: teacher?.id }, !!teacher);
  return (
    <Drawer open={!!teacher} onClose={onClose} width="max-w-5xl" title={teacher ? `${teacher.lastName} ${teacher.firstName}` : ''} description={teacher && `${teacher.position}${teacher.degree ? `, ${teacher.degree}` : ''} · ${teacher.department?.name ?? ''}`}>
      {teacher && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <Mini icon={<BookOpen />} label="Kurslar" value={teacher.courseCount} />
            <Mini icon={<Users />} label="Talabalar" value={teacher.studentCount} />
            <Mini icon={<Layers />} label="Juftlik/hafta" value={teacher.weeklyPairs} />
          </div>
          <div>
            <div className="label-caps mb-2">Kurslar</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {courses?.map((c) => (
                <div key={c.id} className="rounded-2xl border border-line p-3">
                  <div className="font-bold text-fg">{c.subject.name}</div>
                  <div className="text-xs text-muted">
                    {c.groups.map((g) => g.name).join(', ')} · {c.stats.students} talaba
                  </div>
                </div>
              )) ?? <Skeleton className="h-20" />}
            </div>
          </div>
          <div>
            <div className="label-caps mb-2">Dars jadvali</div>
            {schedule ? <ScheduleGrid items={schedule} showGroups /> : <Skeleton className="h-64" />}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="panel flex items-center gap-3 p-3 [&_svg]:size-5 [&_svg]:text-brand-600">
      {icon}
      <div>
        <div className="text-lg font-extrabold text-fg">{value}</div>
        <div className="text-[11px] text-muted">{label}</div>
      </div>
    </div>
  );
}
