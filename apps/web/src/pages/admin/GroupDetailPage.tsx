import { useState } from 'react';
import { useParams } from 'react-router';
import { CalendarDays, GraduationCap, Layers, UserPlus } from 'lucide-react';
import type { UserRow } from '@edu/shared';
import { EDU_FORM, EDU_LANG, USER_STATUS } from '@/lib/labels';
import { useAssignStudents, useGroup, useUsers } from '@/api/queries/admin';
import { useSchedule } from '@/api/queries/misc';
import { SubjectCover } from '@/components/domain/CourseCard';
import { ScheduleGrid } from '@/components/domain/Schedule';
import { Avatar, Badge, Button, Card, Checkbox, DataTable, Modal, Page, PageHeader, SearchInput, Skeleton, Tabs, type Column } from '@/components/ui';

export default function GroupDetailPage() {
  const { id = '' } = useParams();
  const { data: g } = useGroup(id);
  const [tab, setTab] = useState<'students' | 'courses' | 'schedule'>('students');
  const { data: schedule } = useSchedule({ groupId: id }, tab === 'schedule');
  const [adding, setAdding] = useState(false);

  const columns: Column<UserRow>[] = [
    { key: 'n', header: '№', width: '50px', cell: (_, i) => <span className="text-muted">{i + 1}</span> },
    {
      key: 'name',
      header: 'Talaba',
      sortValue: (u) => u.lastName,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar user={u} size="md" />
          <div>
            <div className="font-bold text-fg">
              {u.lastName} {u.firstName}
            </div>
            <div className="text-[11px] text-muted">{u.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'rb', header: 'Reyting daftarchasi', cell: (u) => <span className="font-mono text-xs">{u.student?.recordBook}</span> },
    { key: 'phone', header: 'Telefon', cell: (u) => <span className="text-xs">{u.phone ?? '—'}</span> },
    { key: 'status', header: 'Holat', cell: (u) => <Badge tone={u.status === 'active' ? 'green' : 'red'}>{USER_STATUS[u.status]}</Badge> },
  ];

  return (
    <Page>
      <PageHeader
        breadcrumbs={[{ label: 'Guruhlar', to: '/admin/groups' }, { label: g?.name ?? '...' }]}
        title={g ? `${g.name} guruhi` : '...'}
        description={g && `${g.faculty?.name} · ${g.course}-kurs · ${EDU_FORM[g.form]} · ${EDU_LANG[g.language]} tilida`}
        actions={
          <Button icon={<UserPlus />} onClick={() => setAdding(true)}>
            Talaba qo'shish
          </Button>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'students', label: 'Talabalar', icon: <GraduationCap />, count: g?.students.length },
          { value: 'courses', label: 'Fanlar', icon: <Layers />, count: g?.courses.length },
          { value: 'schedule', label: 'Dars jadvali', icon: <CalendarDays /> },
        ]}
      />
      {tab === 'students' && (
        <Card className="overflow-hidden">
          <DataTable columns={columns} rows={g?.students} loading={!g} rowKey={(u) => u.id} pageSize={25} />
        </Card>
      )}
      {tab === 'courses' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {g?.courses.map((c) => (
            <Card key={c.id} className="overflow-hidden p-3">
              <SubjectCover subject={c.subject} size="sm" className="h-24 rounded-2xl" />
              <div className="p-2 pt-3">
                <div className="font-bold text-fg">{c.subject.name}</div>
                <div className="mt-2 flex items-center gap-2">
                  <Avatar user={c.teacher} size="xs" />
                  <span className="text-xs text-muted">
                    {c.teacher.firstName} {c.teacher.lastName}
                  </span>
                  <span className="ml-auto text-xs font-semibold text-muted">{c.subject.credits} kredit</span>
                </div>
              </div>
            </Card>
          )) ?? <Skeleton className="h-40" />}
        </div>
      )}
      {tab === 'schedule' && <Card className="p-5">{schedule ? <ScheduleGrid items={schedule} showTeacher /> : <Skeleton className="h-96" />}</Card>}
      <AddStudentsModal open={adding} onClose={() => setAdding(false)} groupId={id} groupName={g?.name ?? ''} />
    </Page>
  );
}

function AddStudentsModal({ open, onClose, groupId, groupName }: { open: boolean; onClose: () => void; groupId: string; groupName: string }) {
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const { data } = useUsers({ role: 'student', q: q || undefined, limit: 50 });
  const assign = useAssignStudents();
  const list = (data?.items ?? []).filter((u) => u.student?.groupId !== groupId);
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<UserPlus />}
      title={`${groupName} guruhiga talaba qo'shish`}
      description="Boshqa guruhdagi talaba tanlansa, u shu guruhga o'tkaziladi"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
            disabled={!picked.length}
            loading={assign.isPending}
            onClick={async () => {
              await assign.mutateAsync({ groupId, studentIds: picked });
              setPicked([]);
              onClose();
            }}
          >
            Qo'shish ({picked.length})
          </Button>
        </>
      }
    >
      <SearchInput value={q} onChange={setQ} placeholder="Talaba qidirish..." />
      <div className="mt-3 max-h-[50vh] space-y-1 overflow-y-auto">
        {list.map((u) => (
          <div key={u.id} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-panel">
            <Checkbox checked={picked.includes(u.id)} onChange={(v) => setPicked((p) => (v ? [...p, u.id] : p.filter((x) => x !== u.id)))} />
            <Avatar user={u} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-fg">
                {u.lastName} {u.firstName}
              </div>
              <div className="truncate text-[11px] text-muted">{u.email}</div>
            </div>
            <Badge tone={u.groupName ? 'gray' : 'amber'}>{u.groupName ?? 'Guruhsiz'}</Badge>
          </div>
        ))}
        {!list.length && <p className="py-8 text-center text-sm text-muted">Talabalar topilmadi</p>}
      </div>
    </Modal>
  );
}
