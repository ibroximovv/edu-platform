import { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Library, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Subject } from '@edu/shared';
import { useCrud, useDepartments, useSubjects } from '@/api/queries/admin';
import { useConfirm } from '@/contexts/ConfirmProvider';
import { SubjectFormModal } from '@/components/domain/AdminForms';
import { SubjectCover } from '@/components/domain/CourseCard';
import { Button, EmptyState, Page, PageHeader, SearchInput, Skeleton, stagger } from '@/components/ui';

export default function SubjectsPage() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useSubjects({ q: q || undefined });
  const { data: departments } = useDepartments();
  const { remove } = useCrud('subjects', [['subjects']], 'Fan');
  const confirm = useConfirm();
  const [modal, setModal] = useState<{ open: boolean; subject?: Subject | null }>({ open: false });

  return (
    <Page>
      <PageHeader title="Fanlar" description="O'quv rejasidagi fanlar katalogi" actions={<><SearchInput value={q} onChange={setQ} placeholder="Nomi yoki kodi" className="w-56" /><Button icon={<Plus />} onClick={() => setModal({ open: true })}>Yangi fan</Button></>} />
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-3xl" />
          ))}
        </div>
      ) : data?.length ? (
        <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {data.map((s) => (
            <motion.div key={s.id} variants={stagger.item} whileHover={{ y: -4 }} className="card group overflow-hidden p-3">
              <SubjectCover subject={s} className="h-28 rounded-2xl">
                <div className="absolute left-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => setModal({ open: true, subject: s })} className="grid size-8 place-items-center rounded-lg bg-white/25 text-white backdrop-blur hover:bg-white/40" aria-label="Tahrirlash">
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (await confirm({ title: "Fanni o'chirish", description: s.name, danger: true, confirmText: "O'chirish" })) remove.mutate(s.id);
                    }}
                    className="grid size-8 place-items-center rounded-lg bg-white/25 text-white backdrop-blur hover:bg-rose-500"
                    aria-label="O'chirish"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </SubjectCover>
              <div className="p-2 pt-3">
                <div className="line-clamp-2 min-h-[2.5em] font-bold leading-snug text-fg">{s.name}</div>
                <div className="mt-1 truncate text-[11px] text-muted">{departments?.find((d) => d.id === s.departmentId)?.name ?? '—'}</div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="rounded-lg bg-brand-50 px-2 py-0.5 font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{s.credits} kredit</span>
                  <span className="flex items-center gap-1 text-muted">
                    <Clock className="size-3.5" /> {s.hours.lecture}/{s.hours.practice}/{s.hours.lab} soat
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState icon={<Library />} title="Fanlar topilmadi" />
      )}
      <SubjectFormModal open={modal.open} onClose={() => setModal({ open: false })} initial={modal.subject} />
    </Page>
  );
}
