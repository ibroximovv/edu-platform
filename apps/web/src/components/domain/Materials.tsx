import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { Eye, FileUp, Link2, PlayCircle, Trash2 } from 'lucide-react';
import type { FileRef, Material, MaterialView, Topic } from '@edu/shared';
import { cn } from '@/lib/cn';
import { fmtBytes, fmtRelative } from '@/lib/format';
import { ACCEPT_PRESETS } from '@/lib/files';
import { useFileUrl } from '@/api/files';
import { trackMaterialView, useSaveMaterial } from '@/api/queries/learning';
import { Button, Field, Input, Modal, Segmented, Select, Textarea } from '@/components/ui';
import { FileDropzone, FileViewer, KIND_META, KindIcon, type Viewable } from './Files';

export function useMaterialViewer() {
  const [item, setItem] = useState<Viewable | null>(null);
  const open = (m: Material) => {
    trackMaterialView(m.id);
    if (m.kind === 'link' && m.url) {
      window.open(m.url, '_blank', 'noopener');
      return;
    }
    setItem({ title: m.title, kind: m.kind, file: m.file, url: m.url });
  };
  return { open, viewer: <FileViewer item={item} onClose={() => setItem(null)} /> };
}

export function MaterialRow({ material, onOpen, onDelete }: { material: Material; onOpen: () => void; onDelete?: () => void }) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-panel">
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <KindIcon kind={material.kind} />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-fg group-hover:text-brand-600">{material.title}</div>
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <span>{KIND_META[material.kind].label}</span>
            {material.file && <span>· {fmtBytes(material.file.size)}</span>}
            <span className="flex items-center gap-0.5">
              · <Eye className="size-3" /> {material.views}
            </span>
          </div>
        </div>
      </button>
      {onDelete && (
        <button onClick={onDelete} className="grid size-8 place-items-center rounded-lg text-muted opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 dark:hover:bg-rose-500/10" aria-label="O'chirish">
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}

function Thumb({ material }: { material: MaterialView }) {
  const src = useFileUrl(material.kind === 'image' ? material.file?.url : null);
  const meta = KIND_META[material.kind];
  if (src) return <img src={src} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />;
  return (
    <div className={cn('grid size-full place-items-center', meta.tone)}>
      {material.kind === 'video' ? <PlayCircle className="size-12 opacity-80 transition group-hover:scale-110" /> : <meta.icon className="size-10 opacity-80" />}
    </div>
  );
}

export function MaterialCard({ material, onOpen, onDelete }: { material: MaterialView; onOpen: () => void; onDelete?: () => void }) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card group relative overflow-hidden p-2.5">
      <button onClick={onOpen} className="block w-full text-left">
        <div className="relative aspect-video overflow-hidden rounded-2xl">
          <Thumb material={material} />
          <span className="absolute left-2 top-2 rounded-lg bg-black/45 px-2 py-0.5 text-[10.5px] font-bold text-white backdrop-blur">{KIND_META[material.kind].label}</span>
        </div>
        <div className="px-1.5 pb-1 pt-3">
          <div className="line-clamp-2 min-h-[2.5em] text-[13px] font-bold leading-snug text-fg">{material.title}</div>
          <div className="mt-1 truncate text-[11px] text-muted">{material.courseTitle}</div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
            <span>{fmtRelative(material.createdAt)}</span>
            <span className="flex items-center gap-1">
              <Eye className="size-3" /> {material.views}
            </span>
          </div>
        </div>
      </button>
      {onDelete && (
        <button onClick={onDelete} className="absolute right-4 top-4 hidden size-8 place-items-center rounded-lg bg-black/40 text-white backdrop-blur hover:bg-rose-600 group-hover:grid" aria-label="O'chirish">
          <Trash2 className="size-4" />
        </button>
      )}
    </motion.div>
  );
}

const schema = z.object({
  title: z.string().trim().min(3, 'Kamida 3 ta belgi'),
  description: z.string().optional(),
  topicId: z.string().optional(),
  url: z.string().optional(),
});

export function MaterialUploadModal({ open, onClose, courseId, topics, defaultTopicId }: { open: boolean; onClose: () => void; courseId: string; topics: Topic[]; defaultTopicId?: string | null }) {
  const [mode, setMode] = useState<'file' | 'link'>('file');
  const [files, setFiles] = useState<FileRef[]>([]);
  const [busy, setBusy] = useState(false);
  const save = useSaveMaterial();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { title: '', description: '', topicId: defaultTopicId ?? '', url: '' } });

  useEffect(() => {
    if (open) {
      form.reset({ title: '', description: '', topicId: defaultTopicId ?? '', url: '' });
      setFiles([]);
      setMode('file');
    }
  }, [open, defaultTopicId, form]);

  // Auto-fill title from the first uploaded file
  useEffect(() => {
    if (files[0] && !form.getValues('title')) form.setValue('title', files[0].name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
  }, [files, form]);

  const submit = form.handleSubmit(async (v) => {
    if (mode === 'file' && !files.length) return form.setError('title', { message: 'Avval fayl yuklang' });
    if (mode === 'link' && !/^https?:\/\//.test(v.url ?? '')) return form.setError('url', { message: "To'g'ri havola kiriting (https://...)" });
    if (mode === 'file') {
      // One material per file; first uses the given title
      for (const [i, f] of files.entries()) {
        await save.mutateAsync({ courseId, topicId: v.topicId || null, title: i === 0 ? v.title : f.name, description: v.description, file: f });
      }
    } else {
      await save.mutateAsync({ courseId, topicId: v.topicId || null, title: v.title, description: v.description, url: v.url });
    }
    onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<FileUp />}
      title="Material yuklash"
      description="Video, rasm, PDF, taqdimot yoki tashqi havola qo'shing"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={submit} loading={form.formState.isSubmitting} disabled={busy}>
            {busy ? 'Yuklanmoqda...' : 'Saqlash'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Segmented
          value={mode}
          onChange={setMode}
          items={[
            { value: 'file', label: 'Fayl', icon: <FileUp /> },
            { value: 'link', label: 'Havola', icon: <Link2 /> },
          ]}
        />
        {mode === 'file' ? (
          <FileDropzone value={files} onChange={setFiles} accept={ACCEPT_PRESETS.material} onBusyChange={setBusy} />
        ) : (
          <Field label="Havola (URL)" error={form.formState.errors.url?.message} required>
            <Input placeholder="https://youtube.com/..." icon={<Link2 />} {...form.register('url')} />
          </Field>
        )}
        <Field label="Sarlavha" error={form.formState.errors.title?.message} required>
          <Input placeholder="Masalan: 3-ma'ruza taqdimoti" {...form.register('title')} />
        </Field>
        <Field label="Mavzu">
          <Select placeholder="— Mavzusiz —" options={topics.map((t) => ({ value: t.id, label: `${t.order}. ${t.title}` }))} {...form.register('topicId')} />
        </Field>
        <Field label="Izoh">
          <Textarea rows={3} placeholder="Qisqacha tavsif (ixtiyoriy)" {...form.register('description')} />
        </Field>
      </div>
    </Modal>
  );
}
