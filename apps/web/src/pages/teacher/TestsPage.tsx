import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { AssessmentCategory } from '@edu/shared';
import { useAssessments } from '@/api/queries/assessments';
import { useCourses } from '@/api/queries/learning';
import { AssessmentTable } from '@/components/domain/TeacherTables';
import { ButtonLink, Card, Page, PageHeader, Segmented, Select } from '@/components/ui';

export default function TeacherTestsPage() {
  const { data: courses } = useCourses({ as: 'teacher' });
  const [courseId, setCourseId] = useState('');
  const [category, setCategory] = useState<'' | AssessmentCategory>('');
  const { data, isLoading } = useAssessments({ as: 'teacher', courseId: courseId || undefined, category: category || undefined });
  return (
    <Page>
      <PageHeader
        title="Test va nazoratlar"
        description="Joriy testlar, oraliq (ON) va yakuniy (YN) nazorat ishlari"
        actions={
          <ButtonLink to={`/teacher/tests/new${courseId ? `?courseId=${courseId}` : ''}`} icon={<Plus className="size-4" />}>
            Yangi test / nazorat
          </ButtonLink>
        }
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          value={category}
          onChange={setCategory}
          items={[
            { value: '', label: 'Barchasi' },
            { value: 'current', label: 'Joriy (JN)' },
            { value: 'midterm', label: 'Oraliq (ON)' },
            { value: 'final', label: 'Yakuniy (YN)' },
          ]}
        />
        <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} placeholder="Barcha kurslar" options={(courses ?? []).map((c) => ({ value: c.id, label: `${c.subject.name} · ${c.groups.map((g) => g.name).join(', ')}` }))} className="w-72" />
      </div>
      <Card className="overflow-hidden">
        <AssessmentTable rows={data} loading={isLoading} showCourse />
      </Card>
    </Page>
  );
}
