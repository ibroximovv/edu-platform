import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen } from 'lucide-react';
import { useCourses } from '@/api/queries/learning';
import { CourseCard } from '@/components/domain/CourseCard';
import { EmptyState, Page, PageHeader, SearchInput, Skeleton, stagger } from '@/components/ui';

export default function StudentCoursesPage() {
  const { data, isLoading } = useCourses({ as: 'student' });
  const [q, setQ] = useState('');
  const list = useMemo(() => (data ?? []).filter((c) => c.subject.name.toLowerCase().includes(q.toLowerCase())), [data, q]);
  const credits = (data ?? []).reduce((s, c) => s + c.subject.credits, 0);

  return (
    <Page>
      <PageHeader title="Fanlarim" description={data ? `Joriy semestrda ${data.length} ta fan · ${credits} kredit` : 'Yuklanmoqda...'} actions={<SearchInput value={q} onChange={setQ} placeholder="Fan nomi..." className="w-64" />} />
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[330px] rounded-3xl" />
          ))}
        </div>
      ) : list.length ? (
        <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {list.map((c) => (
            <motion.div key={c.id} variants={stagger.item}>
              <CourseCard course={c} to={`/student/courses/${c.id}`} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState icon={<BookOpen />} title="Fanlar topilmadi" description={q ? "Qidiruv so'zini o'zgartiring" : 'Siz hali guruhga biriktirilmagansiz'} />
      )}
    </Page>
  );
}
