import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { FolderOpen } from 'lucide-react';
import type { MaterialKind } from '@edu/shared';
import { useMaterials } from '@/api/queries/learning';
import { KIND_META } from '@/components/domain/Files';
import { MaterialCard, useMaterialViewer } from '@/components/domain/Materials';
import { EmptyState, Page, PageHeader, SearchInput, Segmented, Select, Skeleton } from '@/components/ui';

export function MaterialsLibrary({ as, actions, onDelete }: { as: 'student' | 'teacher'; actions?: React.ReactNode; onDelete?: (id: string) => void }) {
  const [params] = useSearchParams();
  const { data, isLoading } = useMaterials({ as });
  const [kind, setKind] = useState<'all' | MaterialKind>('all');
  const [course, setCourse] = useState('');
  const [q, setQ] = useState(params.get('q') ?? '');
  const { open, viewer } = useMaterialViewer();

  const courses = useMemo(() => [...new Map((data ?? []).map((m) => [m.courseId, m.courseTitle])).entries()], [data]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data?.length ?? 0 };
    for (const m of data ?? []) c[m.kind] = (c[m.kind] ?? 0) + 1;
    return c;
  }, [data]);
  const list = (data ?? []).filter((m) => (kind === 'all' || m.kind === kind) && (!course || m.courseId === course) && m.title.toLowerCase().includes(q.toLowerCase()));
  const kinds: ('all' | MaterialKind)[] = ['all', 'video', 'pdf', 'image', 'link', 'presentation', 'document'];

  return (
    <Page>
      <PageHeader title="Materiallar" description="Video darslar, ma'ruza matnlari, qo'llanmalar va havolalar" actions={actions} />
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Segmented value={kind} onChange={setKind} items={kinds.filter((k) => k === 'all' || counts[k]).map((k) => ({ value: k, label: k === 'all' ? 'Barchasi' : KIND_META[k].label, count: counts[k] ?? 0 }))} />
        <div className="flex gap-2">
          <Select value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Barcha fanlar" options={courses.map(([value, label]) => ({ value, label }))} className="w-56" />
          <SearchInput value={q} onChange={setQ} className="w-56" />
        </div>
      </div>
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      ) : list.length ? (
        <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {list.map((m) => (
            <MaterialCard key={m.id} material={m} onOpen={() => open(m)} onDelete={onDelete ? () => onDelete(m.id) : undefined} />
          ))}
        </motion.div>
      ) : (
        <EmptyState icon={<FolderOpen />} title="Materiallar topilmadi" description="Filtrlarni o'zgartirib ko'ring" />
      )}
      {viewer}
    </Page>
  );
}

export default function StudentMaterialsPage() {
  return <MaterialsLibrary as="student" />;
}
