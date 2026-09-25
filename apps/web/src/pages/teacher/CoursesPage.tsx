import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen } from 'lucide-react';
import { useCourses } from '@/api/queries/learning';
import { CourseCard } from '@/components/domain/CourseCard';
import { EmptyState, Page, PageHeader, SearchInput, Skeleton, stagger } from '@/components/ui';

export default function TeacherCoursesPage() {
  const { data, isLoading } = useCourses({ as: 'teacher' });
  const [q, setQ] = useState('');
  const list = useMemo(() => (data ?? []).filter((c) => `${c.subject.name} ${c.groups.map((g) => g.name).join(' ')}`.toLowerCase().includes(q.toLowerCase())), [data, q]);
  const students = (data ?? []).reduce((s, c) => s + c.stats.students, 0);
  return (
    <Page>
      <PageHeader title="Kurslarim" description={data ? `${data.length} ta kurs · ${students} ta talaba` : ''} actions={<SearchInput value={q} onChange={setQ} placeholder="Fan yoki guruh..." className="w-64" />} />
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[330px] rounded-3xl" />
          ))}
        </div>
      ) : list.length ? (
        <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {list.map((c) => (
            <motion.div key={c.id} variants={stagger.item}>
              <CourseCard course={c} to={`/teacher/courses/${c.id}`} variant="teacher" />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState icon={<BookOpen />} title="Kurslar yo'q" description="Sizga hali kurs biriktirilmagan. Administratorga murojaat qiling." />
      )}
    </Page>
  );
}
