import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Plus } from 'lucide-react';
import type { AssignmentView } from '@edu/shared';
import { useAssignments, useCourses } from '@/api/queries/learning';
import { SubmissionsDrawer } from '@/components/domain/Review';
import { AssignmentFormModal } from '@/components/domain/TeacherForms';
import { AssignmentTable } from '@/components/domain/TeacherTables';
import { Button, Card, Page, PageHeader, SearchInput, Select } from '@/components/ui';

export default function TeacherAssignmentsPage() {
  const [params] = useSearchParams();
  const { data: courses } = useCourses({ as: 'teacher' });
  const [courseId, setCourseId] = useState('');
  const [q, setQ] = useState('');
  const { data, isLoading } = useAssignments({ as: 'teacher', courseId: courseId || undefined, q: q || undefined });
  const [modal, setModal] = useState<{ open: boolean; item?: AssignmentView | null }>({ open: false });
  const [subsFor, setSubsFor] = useState<AssignmentView | null>(null);

  useEffect(() => {
    const focus = params.get('focus');
    if (focus && data) setSubsFor(data.find((a) => a.id === focus) ?? null);
  }, [params, data]);

  return (
    <Page>
      <PageHeader
        title="Topshiriqlar"
        description="Barcha kurslaringiz bo'yicha topshiriqlar, muddatlar va topshirish holati"
        actions={
          <Button icon={<Plus />} onClick={() => setModal({ open: true })} disabled={!courses?.length}>
            Yangi topshiriq
          </Button>
        }
      />
      <div className="flex flex-wrap gap-2">
        <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} placeholder="Barcha kurslar" options={(courses ?? []).map((c) => ({ value: c.id, label: `${c.subject.name} · ${c.groups.map((g) => g.name).join(', ')}` }))} className="w-72" />
        <SearchInput value={q} onChange={setQ} className="w-64" />
      </div>
      <Card className="overflow-hidden">
        <AssignmentTable rows={data} loading={isLoading} showCourse onEdit={(a) => setModal({ open: true, item: a })} onOpen={setSubsFor} />
      </Card>
      <AssignmentFormModal open={modal.open} onClose={() => setModal({ open: false })} courses={courses ?? []} initial={modal.item} defaultCourseId={courseId || undefined} />
      <SubmissionsDrawer assignment={subsFor} onClose={() => setSubsFor(null)} />
    </Page>
  );
}
