import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowUp, CheckCircle2, ChevronDown, Circle, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import type { Material, Topic } from '@edu/shared';
import { cn } from '@/lib/cn';
import { fmtDate } from '@/lib/format';
import { LESSON_TYPE } from '@/lib/labels';
import { Badge, EmptyState } from '@/components/ui';
import { MaterialRow } from './Materials';

export interface TopicActions {
  onEdit: (t: Topic) => void;
  onDelete: (t: Topic) => void;
  onToggle: (t: Topic) => void;
  onMove: (t: Topic, dir: -1 | 1) => void;
  onUpload: (t: Topic) => void;
  onDeleteMaterial: (m: Material) => void;
}

export function TopicsList({ topics, materials, onOpenMaterial, actions }: { topics: Topic[]; materials: Material[]; onOpenMaterial: (m: Material) => void; actions?: TopicActions }) {
  const [open, setOpen] = useState<string | null>(() => topics.find((t) => t.status === 'planned')?.id ?? topics[0]?.id ?? null);
  if (!topics.length) return <EmptyState title="Mavzular hali qo'shilmagan" description="Sillabus bo'yicha mavzular shu yerda chiqadi" />;
  const loose = materials.filter((m) => !m.topicId);

  return (
    <div className="space-y-2.5">
      {topics.map((t, i) => {
        const mats = materials.filter((m) => m.topicId === t.id);
        const isOpen = open === t.id;
        const done = t.status === 'done';
        return (
          <motion.div key={t.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }} className={cn('overflow-hidden rounded-2xl border transition-colors', isOpen ? 'border-brand-200 bg-card shadow-soft dark:border-brand-500/30' : 'border-line bg-card')}>
            <div className="flex items-center gap-3 p-3.5">
              <button
                onClick={() => actions?.onToggle(t)}
                disabled={!actions}
                className={cn('grid size-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold transition', done ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-panel text-muted', actions && 'hover:ring-2 hover:ring-brand-200')}
                title={actions ? (done ? "O'tilmagan deb belgilash" : "O'tildi deb belgilash") : undefined}
              >
                {done ? <CheckCircle2 className="size-5" /> : actions ? <Circle className="size-5" /> : t.order}
              </button>
              <button onClick={() => setOpen(isOpen ? null : t.id)} className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-muted">{t.order}-mavzu</span>
                  <Badge tone={t.type === 'lecture' ? 'violet' : t.type === 'lab' ? 'pink' : 'sky'}>{LESSON_TYPE[t.type]}</Badge>
                  {t.plannedDate && <span className="text-[11px] text-muted">{fmtDate(t.plannedDate, false)}</span>}
                </div>
                <div className="mt-0.5 truncate text-[14px] font-bold text-fg">{t.title}</div>
              </button>
              <span className="hidden text-xs font-semibold text-muted sm:block">{mats.length} material</span>
              {actions && (
                <div className="hidden items-center gap-0.5 md:flex">
                  <IconBtn label="Yuqoriga" onClick={() => actions.onMove(t, -1)} disabled={i === 0}>
                    <ArrowUp />
                  </IconBtn>
                  <IconBtn label="Pastga" onClick={() => actions.onMove(t, 1)} disabled={i === topics.length - 1}>
                    <ArrowDown />
                  </IconBtn>
                  <IconBtn label="Tahrirlash" onClick={() => actions.onEdit(t)}>
                    <Pencil />
                  </IconBtn>
                  <IconBtn label="O'chirish" danger onClick={() => actions.onDelete(t)}>
                    <Trash2 />
                  </IconBtn>
                </div>
              )}
              <button onClick={() => setOpen(isOpen ? null : t.id)} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-panel" aria-label="Ochish">
                <ChevronDown className={cn('size-4 transition', isOpen && 'rotate-180')} />
              </button>
            </div>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                  <div className="border-t border-line px-3.5 pb-3.5 pt-2">
                    {t.description && <p className="px-2 pb-2 text-[13px] text-muted">{t.description}</p>}
                    {mats.length ? (
                      <div className="grid gap-1 md:grid-cols-2">
                        {mats.map((m) => (
                          <MaterialRow key={m.id} material={m} onOpen={() => onOpenMaterial(m)} onDelete={actions ? () => actions.onDeleteMaterial(m) : undefined} />
                        ))}
                      </div>
                    ) : (
                      <p className="px-2 py-3 text-[13px] text-muted">Bu mavzu uchun materiallar hali yuklanmagan.</p>
                    )}
                    {actions && (
                      <button onClick={() => actions.onUpload(t)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-2.5 text-[12.5px] font-semibold text-muted transition hover:border-brand-300 hover:text-brand-600">
                        <Upload className="size-4" /> Material qo'shish
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
      {loose.length > 0 && (
        <div className="rounded-2xl border border-line bg-card p-3.5">
          <div className="mb-2 flex items-center gap-2 px-2 text-[13px] font-bold text-fg">
            <Plus className="size-4 text-muted" /> Qo'shimcha materiallar
          </div>
          <div className="grid gap-1 md:grid-cols-2">
            {loose.map((m) => (
              <MaterialRow key={m.id} material={m} onOpen={() => onOpenMaterial(m)} onDelete={actions ? () => actions.onDeleteMaterial(m) : undefined} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled, danger }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} title={label} aria-label={label} className={cn('grid size-8 place-items-center rounded-lg text-muted transition disabled:opacity-30 [&_svg]:size-4', danger ? 'hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10' : 'hover:bg-panel hover:text-fg')}>
      {children}
    </button>
  );
}
