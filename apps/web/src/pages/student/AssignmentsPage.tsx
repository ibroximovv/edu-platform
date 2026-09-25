import { useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useAssignments } from '@/api/queries/learning';
import { assignmentState, type AssignmentState } from '@/components/domain/Bits';
import { AssignmentItem } from '@/components/domain/StudentLists';
import { EmptyState, Page, PageHeader, SearchInput, Segmented, Select, Skeleton } from '@/components/ui';

type Filter = 'all' | 'todo' | 'submitted' | 'graded';
const MATCH: Record<Filter, AssignmentState[]> = {
  all: ['pending', 'submitted', 'graded', 'returned', 'overdue', 'closed'],
  todo: ['pending', 'overdue', 'returned'],
  submitted: ['submitted'],
  graded: ['graded'],
};

export default function StudentAssignmentsPage() {
  const { data, isLoading } = useAssignments({ as: 'student' });
  const [filter, setFilter] = useState<Filter>('todo');
  const [course, setCourse] = useState('');
  const [q, setQ] = useState('');

  const withState = useMemo(() => (data ?? []).map((a) => ({ a, state: assignmentState(a) })), [data]);
  const counts = useMemo(() => Object.fromEntries((Object.keys(MATCH) as Filter[]).map((f) => [f, withState.filter((x) => MATCH[f].includes(x.state)).length])), [withState]);
  const courses = useMemo(() => [...new Map((data ?? []).map((a) => [a.course.id, a.course.title])).entries()], [data]);
  const list = withState
    .filter((x) => MATCH[filter].includes(x.state) && (!course || x.a.courseId === course) && x.a.title.toLowerCase().includes(q.toLowerCase()))
    .sort((x, y) => (filter === 'graded' ? +new Date(y.a.deadline) - +new Date(x.a.deadline) : +new Date(x.a.deadline) - +new Date(y.a.deadline)));

  return (
    <Page>
      <PageHeader title="Topshiriqlar" description="Uy vazifalari, laboratoriya va amaliy ishlar" />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'todo', label: 'Bajarish kerak', count: counts.todo },
            { value: 'submitted', label: 'Tekshirilmoqda', count: counts.submitted },
            { value: 'graded', label: 'Baholangan', count: counts.graded },
            { value: 'all', label: 'Barchasi', count: counts.all },
          ]}
        />
        <div className="flex gap-2">
          <Select value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Barcha fanlar" options={courses.map(([value, label]) => ({ value, label }))} className="w-56" />
          <SearchInput value={q} onChange={setQ} className="w-56" />
        </div>
      </div>
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-3xl" />)
        ) : list.length ? (
          list.map(({ a }, i) => <AssignmentItem key={a.id} a={a} index={i} />)
        ) : (
          <EmptyState icon={<ClipboardList />} title={filter === 'todo' ? 'Barcha topshiriqlar bajarilgan 🎉' : 'Topshiriqlar topilmadi'} description="Bu bo'limda hozircha hech narsa yo'q" />
        )}
      </div>
    </Page>
  );
}
