import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { CalendarCheck, NotebookPen } from 'lucide-react';
import { useCourses, useTopics } from '@/api/queries/learning';
import { useGradebook } from '@/api/queries/journal';
import { AttendanceBoard } from '@/components/domain/Attendance';
import { GradebookTable } from '@/components/domain/Gradebook';
import { Card, EmptyState, Page, PageHeader, Segmented, Select, Skeleton } from '@/components/ui';

export default function JournalPage() {
  const [params, setParams] = useSearchParams();
  const { data: courses } = useCourses({ as: 'teacher' });
  const courseId = params.get('course') ?? '';
  const [view, setView] = useState<'grades' | 'attendance'>('grades');
  const { data: book, isFetching } = useGradebook(view === 'grades' && courseId ? courseId : undefined);
  const { data: topics } = useTopics(view === 'attendance' && courseId ? courseId : undefined);

  useEffect(() => {
    if (!courseId && courses?.length) setParams({ course: courses[0].id }, { replace: true });
  }, [courseId, courses, setParams]);

  return (
    <Page>
      <PageHeader
        title="Elektron jurnal"
        description="Baholar (JN/ON/YN) va davomat — yagona jadvalda"
        actions={<Select value={courseId} onChange={(e) => setParams({ course: e.target.value })} options={(courses ?? []).map((c) => ({ value: c.id, label: `${c.subject.name} · ${c.groups.map((g) => g.name).join(', ')}` }))} className="w-80" />}
      />
      <Segmented
        value={view}
        onChange={setView}
        items={[
          { value: 'grades', label: 'Baholar', icon: <NotebookPen /> },
          { value: 'attendance', label: 'Davomat', icon: <CalendarCheck /> },
        ]}
      />
      {!courses?.length && courses ? (
        <EmptyState title="Kurslar yo'q" />
      ) : (
        <Card className="overflow-hidden">
          {view === 'grades' ? book && !isFetching ? <GradebookTable key={courseId} book={book} /> : <Skeleton className="m-5 h-72" /> : courseId ? <AttendanceBoard key={courseId} courseId={courseId} topics={topics ?? []} /> : null}
        </Card>
      )}
    </Page>
  );
}
