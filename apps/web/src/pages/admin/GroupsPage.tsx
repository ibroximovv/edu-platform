import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { GraduationCap, Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import type { GroupView } from '@edu/shared';
import { EDU_FORM, EDU_LANG } from '@/lib/labels';
import { useCrud, useFaculties, useGroups } from '@/api/queries/admin';
import { useConfirm } from '@/contexts/ConfirmProvider';
import { GroupFormModal } from '@/components/domain/AdminForms';
import { Avatar, Badge, Button, EmptyState, Page, PageHeader, SearchInput, Segmented, Select, Skeleton, stagger } from '@/components/ui';

const GRADIENTS = ['from-violet-500 to-fuchsia-500', 'from-sky-500 to-indigo-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-pink-500 to-rose-500'];

export default function GroupsPage() {
  const [facultyId, setFacultyId] = useState('');
  const [course, setCourse] = useState('');
  const [q, setQ] = useState('');
  const { data: faculties } = useFaculties();
  const { data, isLoading } = useGroups({ facultyId: facultyId || undefined, course: course ? Number(course) : undefined, q: q || undefined });
  const { remove } = useCrud('groups', [['groups']], 'Guruh');
  const confirm = useConfirm();
  const [modal, setModal] = useState<{ open: boolean; group?: GroupView | null }>({ open: false });

  return (
    <Page>
      <PageHeader title="Guruhlar" description="Akademik guruhlar, kuratorlar va talabalar soni" actions={<Button icon={<Plus />} onClick={() => setModal({ open: true })}>Yangi guruh</Button>} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented value={course} onChange={setCourse} items={[{ value: '', label: 'Barcha kurslar' }, ...[1, 2, 3, 4].map((n) => ({ value: String(n), label: `${n}-kurs` }))]} />
        <div className="flex gap-2">
          <Select value={facultyId} onChange={(e) => setFacultyId(e.target.value)} placeholder="Barcha fakultetlar" options={(faculties ?? []).map((f) => ({ value: f.id, label: f.name }))} className="w-64" />
          <SearchInput value={q} onChange={setQ} placeholder="Guruh nomi" className="w-48" />
        </div>
      </div>
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-3xl" />
          ))}
        </div>
      ) : data?.length ? (
        <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((g, i) => (
            <motion.div key={g.id} variants={stagger.item} whileHover={{ y: -4 }} className="card group relative overflow-hidden p-5">
              <div className={`absolute -right-8 -top-8 size-32 rounded-full bg-gradient-to-br opacity-15 blur-xl ${GRADIENTS[i % GRADIENTS.length]}`} />
              <div className="flex items-start justify-between">
                <Link to={`/admin/groups/${g.id}`} className="flex items-center gap-3">
                  <span className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${GRADIENTS[i % GRADIENTS.length]}`}>
                    <UsersRound className="size-5" />
                  </span>
                  <div>
                    <div className="text-lg font-extrabold text-fg group-hover:text-brand-600">{g.name}</div>
                    <div className="text-xs text-muted">{g.faculty?.name}</div>
                  </div>
                </Link>
                <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => setModal({ open: true, group: g })} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-panel hover:text-fg" aria-label="Tahrirlash">
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (await confirm({ title: "Guruhni o'chirish", description: g.name, danger: true, confirmText: "O'chirish" })) remove.mutate(g.id);
                    }}
                    className="grid size-8 place-items-center rounded-lg text-muted hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    aria-label="O'chirish"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge tone="brand">{g.course}-kurs</Badge>
                <Badge>{EDU_FORM[g.form]}</Badge>
                <Badge tone="sky">{EDU_LANG[g.language]}</Badge>
                <Badge>{g.enrollmentYear}-yil</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                <div className="flex items-center gap-2">
                  {g.curator ? (
                    <>
                      <Avatar user={g.curator} size="sm" />
                      <div className="leading-tight">
                        <div className="text-[12.5px] font-semibold text-fg">
                          {g.curator.firstName} {g.curator.lastName}
                        </div>
                        <div className="text-[10.5px] text-muted">Kurator</div>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted">Kurator tayinlanmagan</span>
                  )}
                </div>
                <Link to={`/admin/groups/${g.id}`} className="flex items-center gap-1.5 rounded-xl bg-panel px-3 py-1.5 text-[13px] font-bold text-fg hover:bg-brand-50 hover:text-brand-600">
                  <GraduationCap className="size-4" /> {g.studentCount}
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState icon={<UsersRound />} title="Guruhlar topilmadi" action={<Button icon={<Plus />} onClick={() => setModal({ open: true })}>Guruh yaratish</Button>} />
      )}
      <GroupFormModal open={modal.open} onClose={() => setModal({ open: false })} initial={modal.group} />
    </Page>
  );
}
