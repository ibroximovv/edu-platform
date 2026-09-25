import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Archive,
  Download,
  Eye,
  File,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Link2,
  Presentation,
  UploadCloud,
  X,
} from 'lucide-react';
import type { FileKind, FileRef, MaterialKind } from '@edu/shared';
import { cn } from '@/lib/cn';
import { fmtBytes } from '@/lib/format';
import { downloadFile, uploadFile, useFileUrl, validateFile } from '@/api/files';
import { errorMessage } from '@/api/http';
import { Button, Modal } from '@/components/ui';

export const KIND_META: Record<MaterialKind, { icon: typeof File; tone: string; label: string }> = {
  video: { icon: FileVideo, tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300', label: 'Video' },
  image: { icon: FileImage, tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300', label: 'Rasm' },
  pdf: { icon: FileText, tone: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300', label: 'PDF' },
  document: { icon: FileText, tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300', label: 'Hujjat' },
  presentation: { icon: Presentation, tone: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300', label: 'Taqdimot' },
  spreadsheet: { icon: FileSpreadsheet, tone: 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-300', label: 'Jadval' },
  archive: { icon: Archive, tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300', label: 'Arxiv' },
  audio: { icon: FileAudio, tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300', label: 'Audio' },
  other: { icon: File, tone: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300', label: 'Fayl' },
  link: { icon: Link2, tone: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300', label: 'Havola' },
};

export function KindIcon({ kind, className }: { kind: MaterialKind; className?: string }) {
  const m = KIND_META[kind];
  return (
    <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', m.tone, className)}>
      <m.icon className="size-[18px]" />
    </span>
  );
}

/* ───────────── Viewer ───────────── */

export interface Viewable {
  title: string;
  kind: MaterialKind;
  file?: FileRef | null;
  url?: string | null;
}

export function FileViewer({ item, onClose }: { item: Viewable | null; onClose: () => void }) {
  const src = useFileUrl(item?.file?.url ?? item?.url ?? null);
  const kind = item?.kind;
  return (
    <Modal
      open={!!item}
      onClose={onClose}
      size={kind === 'video' || kind === 'pdf' || kind === 'image' ? 'xl' : 'md'}
      title={item?.title}
      description={item?.file ? `${item.file.name} · ${fmtBytes(item.file.size)}` : item?.url ?? undefined}
      footer={
        item && (
          <>
            {item.file && (
              <Button variant="outline" icon={<Download />} onClick={() => downloadFile(item.file!).catch((e) => toast.error(errorMessage(e)))}>
                Yuklab olish
              </Button>
            )}
            {kind === 'link' && item.url && (
              <a href={item.url} target="_blank" rel="noreferrer">
                <Button icon={<Link2 />}>Havolani ochish</Button>
              </a>
            )}
          </>
        )
      }
      bodyClassName="p-0"
    >
      {item && (
        <div className="bg-panel/50">
          {!src && kind !== 'link' ? (
            <div className="grid h-64 place-items-center text-sm text-muted">Yuklanmoqda...</div>
          ) : kind === 'video' ? (
            <video src={src!} controls autoPlay className="max-h-[72vh] w-full bg-black" />
          ) : kind === 'image' ? (
            <img src={src!} alt={item.title} className="mx-auto max-h-[72vh] object-contain" />
          ) : kind === 'pdf' ? (
            <iframe src={src!} title={item.title} className="h-[72vh] w-full bg-white" />
          ) : kind === 'audio' ? (
            <div className="p-8">
              <audio src={src!} controls className="w-full" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <KindIcon kind={kind!} className="size-16 rounded-2xl [&_svg]:size-7" />
              <p className="max-w-sm text-sm text-muted">{kind === 'link' ? "Tashqi resurs yangi oynada ochiladi." : "Bu fayl turini brauzerda ko'rib bo'lmaydi. Yuklab oling."}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ───────────── Chips ───────────── */

export function FileChip({ file, onRemove, onPreview, className }: { file: FileRef; onRemove?: () => void; onPreview?: () => void; className?: string }) {
  return (
    <div className={cn('group flex items-center gap-3 rounded-2xl border border-line bg-card p-2.5 pr-3 transition hover:border-brand-200 dark:hover:border-brand-500/30', className)}>
      <KindIcon kind={file.kind} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-fg">{file.name}</div>
        <div className="text-[11px] text-muted">
          {KIND_META[file.kind].label} · {fmtBytes(file.size)}
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        {onPreview && (
          <button type="button" onClick={onPreview} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-panel hover:text-brand-600" aria-label="Ko'rish">
            <Eye className="size-4" />
          </button>
        )}
        <button type="button" onClick={() => downloadFile(file).catch((e) => toast.error(errorMessage(e)))} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-panel hover:text-brand-600" aria-label="Yuklab olish">
          <Download className="size-4" />
        </button>
        {onRemove && (
          <button type="button" onClick={onRemove} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" aria-label="O'chirish">
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function FileList({ files, onRemove }: { files: FileRef[]; onRemove?: (f: FileRef) => void }) {
  const [preview, setPreview] = useState<FileRef | null>(null);
  if (!files.length) return null;
  const previewable = (k: FileKind) => ['video', 'image', 'pdf', 'audio'].includes(k);
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        {files.map((f) => (
          <FileChip key={f.id} file={f} onRemove={onRemove ? () => onRemove(f) : undefined} onPreview={previewable(f.kind) ? () => setPreview(f) : undefined} />
        ))}
      </div>
      <FileViewer item={preview ? { title: preview.name, kind: preview.kind, file: preview } : null} onClose={() => setPreview(null)} />
    </>
  );
}

/* ───────────── Dropzone ───────────── */

interface Pending {
  key: string;
  file: File;
  progress: number;
  controller: AbortController;
}

export function FileDropzone({
  value,
  onChange,
  accept,
  multiple = true,
  maxFiles = 10,
  hint,
  onBusyChange,
  compact,
}: {
  value: FileRef[];
  onChange: (files: FileRef[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  hint?: string;
  onBusyChange?: (busy: boolean) => void;
  compact?: boolean;
}) {
  const [drag, setDrag] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => onBusyChange?.(pending.length > 0), [pending.length, onBusyChange]);

  const start = useCallback(
    (files: File[]) => {
      const room = (multiple ? maxFiles : 1) - valueRef.current.length - pending.length;
      if (room <= 0) return toast.error(`Ko'pi bilan ${multiple ? maxFiles : 1} ta fayl`);
      for (const file of files.slice(0, room)) {
        const err = validateFile(file);
        if (err) {
          toast.error(err);
          continue;
        }
        const key = `${file.name}-${file.size}-${Math.random()}`;
        const controller = new AbortController();
        setPending((p) => [...p, { key, file, progress: 0, controller }]);
        uploadFile(file, { signal: controller.signal, onProgress: (progress) => setPending((p) => p.map((x) => (x.key === key ? { ...x, progress } : x))) })
          .then((ref) => onChange(multiple ? [...valueRef.current, ref] : [ref]))
          .catch((e) => e?.name !== 'AbortError' && toast.error(errorMessage(e)))
          .finally(() => setPending((p) => p.filter((x) => x.key !== key)));
      }
    },
    [maxFiles, multiple, onChange, pending.length],
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    start(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition-all',
          compact ? 'gap-1 px-4 py-5' : 'gap-2 px-6 py-8',
          drag ? 'scale-[1.01] border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-line bg-panel/50 hover:border-brand-300 hover:bg-brand-50/40 dark:hover:bg-brand-500/5',
        )}
      >
        <motion.div animate={drag ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }} className="grid size-12 place-items-center rounded-2xl bg-card text-brand-600 shadow-soft">
          <UploadCloud className="size-6" />
        </motion.div>
        <div className="text-[13.5px] font-semibold text-fg">
          Fayllarni shu yerga tashlang yoki <span className="text-brand-600 underline decoration-brand-300 underline-offset-2">tanlang</span>
        </div>
        <div className="text-xs text-muted">{hint ?? 'PDF, DOCX, PPTX, ZIP, rasm yoki video · 50 MB gacha (video 500 MB)'}</div>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple={multiple}
          accept={accept}
          onChange={(e) => {
            start(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
      </div>

      <AnimatePresence initial={false}>
        {pending.map((p) => (
          <motion.div key={p.key} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-2.5 pr-3">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">
                <UploadCloud className="size-[18px] animate-pulse" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2 text-[13px]">
                  <span className="truncate font-semibold text-fg">{p.file.name}</span>
                  <span className="shrink-0 font-bold tabular-nums text-brand-600">{p.progress}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-[width] duration-150" style={{ width: `${p.progress}%` }} />
                </div>
                <div className="mt-1 text-[11px] text-muted">
                  {fmtBytes((p.file.size * p.progress) / 100)} / {fmtBytes(p.file.size)}
                </div>
              </div>
              <button type="button" onClick={() => p.controller.abort()} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-rose-50 hover:text-rose-600" aria-label="Bekor qilish">
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <FileList files={value} onRemove={(f) => onChange(value.filter((x) => x.id !== f.id))} />
    </div>
  );
}
