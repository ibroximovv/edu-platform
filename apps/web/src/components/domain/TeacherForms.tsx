import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookMarked, ClipboardList } from 'lucide-react';
import type { AssignmentView, CourseView, FileRef, Topic } from '@edu/shared';
import { toInputDate, toInputDateTime } from '@/lib/format';
import { ASSIGNMENT_TYPE, LESSON_TYPE } from '@/lib/labels';
import { useSaveAssignment, useSaveTopic, useTopics } from '@/api/queries/learning';
import { Button, Field, Input, Modal, Select, Switch, Textarea } from '@/components/ui';
import { FileDropzone } from './Files';

/* ───────────── Assignment ───────────── */

const asgSchema = z.object({
  courseId: z.string().min(1, 'Kursni tanlang'),
  topicId: z.string().optional(),
  title: z.string().trim().min(3, 'Kamida 3 ta belgi'),
  description: z.string().trim().min(10, 'Shartni batafsilroq yozing (kamida 10 belgi)'),
  type: z.enum(['homework', 'lab', 'project', 'essay', 'practice']),
  maxScore: z.coerce.number().min(1, 'Kamida 1').max(100, "Ko'pi bilan 100"),
  deadline: z.string().min(1, 'Muddatni kiriting'),
  allowLate: z.boolean(),
  latePenalty: z.coerce.number().min(0).max(100),
});
type AsgForm = z.input<typeof asgSchema>;

export function AssignmentFormModal({ open, onClose, courses, initial, defaultCourseId }: { open: boolean; onClose: () => void; courses: CourseView[]; initial?: AssignmentView | null; defaultCourseId?: string }) {
  const save = useSaveAssignment();
  const [files, setFiles] = useState<FileRef[]>([]);
  const [busy, setBusy] = useState(false);
  const form = useForm<AsgForm>({ resolver: zodResolver(asgSchema) });
  const courseId = form.watch('courseId');
  const { data: topics } = useTopics(courseId || undefined);

  useEffect(() => {
    if (!open) return;
    const week = new Date(Date.now() + 7 * 86400000);
    week.setHours(23, 59, 0, 0);
    form.reset(
      initial
        ? { courseId: initial.courseId, topicId: initial.topicId ?? '', title: initial.title, description: initial.description, type: initial.type, maxScore: initial.maxScore, deadline: toInputDateTime(initial.deadline), allowLate: initial.allowLate, latePenalty: initial.latePenalty }
        : { courseId: defaultCourseId ?? courses[0]?.id ?? '', topicId: '', title: '', description: '', type: 'practice', maxScore: 10, deadline: toInputDateTime(week), allowLate: true, latePenalty: 20 },
    );
    setFiles(initial?.attachments ?? []);
  }, [open, initial, defaultCourseId, courses, form]);

  const submit = (status: 'draft' | 'published') =>
    form.handleSubmit(async (v) => {
      const parsed = asgSchema.parse(v);
      await save.mutateAsync({ ...parsed, id: initial?.id, topicId: parsed.topicId || null, deadline: new Date(parsed.deadline).toISOString(), attachments: files, status });
      onClose();
    })();

  const e = form.formState.errors;
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<ClipboardList />}
      title={initial ? 'Topshiriqni tahrirlash' : 'Yangi topshiriq'}
      description="Talabalar uchun vazifa sharti, muddati va baholash mezoni"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          {(!initial || initial.status === 'draft') && (
            <Button variant="outline" onClick={() => submit('draft')} disabled={busy} loading={save.isPending}>
              Qoralama
            </Button>
          )}
          <Button onClick={() => submit('published')} disabled={busy} loading={save.isPending}>
            {initial?.status === 'published' ? 'Saqlash' : "E'lon qilish"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kurs" error={e.courseId?.message} required>
          <Select disabled={!!initial} options={courses.map((c) => ({ value: c.id, label: `${c.subject.name} (${c.groups.map((g) => g.name).join(', ')})` }))} {...form.register('courseId')} />
        </Field>
        <Field label="Mavzu">
          <Select placeholder="— Mavzusiz —" options={(topics ?? []).map((t) => ({ value: t.id, label: `${t.order}. ${t.title}` }))} {...form.register('topicId')} />
        </Field>
        <Field label="Sarlavha" error={e.title?.message} required className="sm:col-span-2">
          <Input placeholder="Masalan: 3-laboratoriya ishi — Saralash algoritmlari" {...form.register('title')} />
        </Field>
        <Field label="Topshiriq sharti" error={e.description?.message} required className="sm:col-span-2">
          <Textarea rows={5} placeholder="Nima qilish kerak, talablar, baholash mezonlari..." {...form.register('description')} />
        </Field>
        <Field label="Turi">
          <Select options={Object.entries(ASSIGNMENT_TYPE).map(([value, label]) => ({ value, label }))} {...form.register('type')} />
        </Field>
        <Field label="Maksimal ball" error={e.maxScore?.message}>
          <Input type="number" min={1} max={100} {...form.register('maxScore')} />
        </Field>
        <Field label="Topshirish muddati" error={e.deadline?.message} required>
          <Input type="datetime-local" {...form.register('deadline')} />
        </Field>
        <Field label="Kechikish jarimasi (%)">
          <Input type="number" min={0} max={100} disabled={!form.watch('allowLate')} {...form.register('latePenalty')} />
        </Field>
        <div className="panel p-3.5 sm:col-span-2">
          <Switch checked={!!form.watch('allowLate')} onChange={(v) => form.setValue('allowLate', v)} label="Muddatdan keyin qabul qilish" description="Yoqilgan bo'lsa, kech topshirilgan ishlar jarima bilan qabul qilinadi" />
        </div>
        <div className="sm:col-span-2">
          <div className="mb-1.5 text-[12.5px] font-semibold text-fg-soft">Ilova fayllar (shart, namuna, shablon)</div>
          <FileDropzone value={files} onChange={setFiles} onBusyChange={setBusy} compact maxFiles={5} />
        </div>
      </div>
    </Modal>
  );
}

/* ───────────── Topic ───────────── */

const topicSchema = z.object({
  title: z.string().trim().min(3, 'Kamida 3 ta belgi'),
  description: z.string().optional(),
  type: z.enum(['lecture', 'practice', 'lab', 'seminar']),
  hours: z.coerce.number().min(1).max(8),
  plannedDate: z.string().optional(),
  status: z.enum(['planned', 'done']),
});
type TopicForm = z.input<typeof topicSchema>;

export function TopicFormModal({ open, onClose, courseId, initial }: { open: boolean; onClose: () => void; courseId: string; initial?: Topic | null }) {
  const save = useSaveTopic();
  const form = useForm<TopicForm>({ resolver: zodResolver(topicSchema) });
  useEffect(() => {
    if (open) {
      form.reset(
        initial
          ? { title: initial.title, description: initial.description ?? '', type: initial.type, hours: initial.hours, plannedDate: initial.plannedDate ? toInputDate(initial.plannedDate) : '', status: initial.status }
          : { title: '', description: '', type: 'lecture', hours: 2, plannedDate: '', status: 'planned' },
      );
    }
  }, [open, initial, form]);

  const submit = form.handleSubmit(async (v) => {
    const p = topicSchema.parse(v);
    await save.mutateAsync({ ...p, id: initial?.id, courseId, plannedDate: p.plannedDate ? new Date(p.plannedDate).toISOString() : null });
    onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<BookMarked />}
      title={initial ? 'Mavzuni tahrirlash' : "Yangi mavzu qo'shish"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            Saqlash
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mavzu nomi" error={form.formState.errors.title?.message} required className="sm:col-span-2">
          <Input placeholder="Masalan: React Hooks va holat boshqaruvi" {...form.register('title')} />
        </Field>
        <Field label="Mashg'ulot turi">
          <Select options={Object.entries(LESSON_TYPE).map(([value, label]) => ({ value, label }))} {...form.register('type')} />
        </Field>
        <Field label="Soat">
          <Input type="number" min={1} max={8} {...form.register('hours')} />
        </Field>
        <Field label="Rejalashtirilgan sana">
          <Input type="date" {...form.register('plannedDate')} />
        </Field>
        <Field label="Holat">
          <Select options={[{ value: 'planned', label: 'Rejalashtirilgan' }, { value: 'done', label: "O'tildi" }]} {...form.register('status')} />
        </Field>
        <Field label="Tavsif" className="sm:col-span-2">
          <Textarea rows={3} {...form.register('description')} />
        </Field>
      </div>
    </Modal>
  );
}
