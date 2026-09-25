import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookPlus, CalendarPlus, Check, Layers, Trash2, UserPlus, UsersRound } from 'lucide-react';
import { ROLES, type CourseView, type GroupView, type Role, type ScheduleItem, type Subject, type SubjectColor, type UserRow } from '@edu/shared';
import { ROLE_META } from '@/config/navigation';
import { cn } from '@/lib/cn';
import { SUBJECT_COLOR_KEYS, SUBJECT_COLORS } from '@/lib/colors';
import { EDU_FORM, EDU_LANG, LESSON_TYPE, POSITION } from '@/lib/labels';
import { useCrud, useDepartments, useFaculties, useGroups, useSaveUser, useSemesters, useSubjects, useTeachers } from '@/api/queries/admin';
import { useSaveCourse } from '@/api/queries/learning';
import { useSaveSlot } from '@/api/queries/misc';
import { WEEKDAYS } from '@/lib/format';
import { Button, Checkbox, Field, Input, Modal, PasswordInput, Select, Textarea } from '@/components/ui';
import { usePairTimes } from './Schedule';

/* ───────────── User ───────────── */

const userSchema = z
  .object({
    firstName: z.string().trim().min(2, 'Kamida 2 harf'),
    lastName: z.string().trim().min(2, 'Kamida 2 harf'),
    middleName: z.string().optional(),
    email: z.string().trim().email("Email noto'g'ri"),
    phone: z.string().optional(),
    roles: z.array(z.enum(ROLES)).min(1, 'Kamida bitta rol'),
    status: z.enum(['active', 'pending', 'blocked']),
    password: z.string().optional(),
    groupId: z.string().optional(),
    departmentId: z.string().optional(),
    position: z.enum(['assistant', 'senior', 'docent', 'professor', 'head']).optional(),
    degree: z.string().optional(),
  })
  .refine((v) => !v.password || v.password.length >= 8, { path: ['password'], message: 'Kamida 8 ta belgi' });
type UserForm = z.infer<typeof userSchema>;

export function UserFormModal({ open, onClose, initial, presetRoles }: { open: boolean; onClose: () => void; initial?: UserRow | null; presetRoles?: Role[] }) {
  const save = useSaveUser();
  const { data: groups } = useGroups();
  const { data: departments } = useDepartments();
  const form = useForm<UserForm>({ resolver: zodResolver(userSchema) });
  const roles = form.watch('roles') ?? [];

  useEffect(() => {
    if (!open) return;
    form.reset(
      initial
        ? { firstName: initial.firstName, lastName: initial.lastName, middleName: initial.middleName ?? '', email: initial.email, phone: initial.phone ?? '', roles: initial.roles, status: initial.status, password: '', groupId: initial.student?.groupId ?? '', departmentId: initial.teacher?.departmentId ?? '', position: initial.teacher?.position ?? 'assistant', degree: initial.teacher?.degree ?? '' }
        : { firstName: '', lastName: '', middleName: '', email: '', phone: '', roles: presetRoles ?? ['student'], status: 'active', password: '', groupId: '', departmentId: '', position: 'assistant', degree: '' },
    );
  }, [open, initial, presetRoles, form]);

  const submit = form.handleSubmit(async (v) => {
    await save.mutateAsync({ ...v, id: initial?.id, password: v.password || undefined, groupId: v.groupId || null, departmentId: v.departmentId || null });
    onClose();
  });
  const e = form.formState.errors;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<UserPlus />}
      title={initial ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}
      description="Bitta foydalanuvchiga bir nechta rol berish mumkin"
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
        <Field label="Familiya" error={e.lastName?.message} required>
          <Input {...form.register('lastName')} />
        </Field>
        <Field label="Ism" error={e.firstName?.message} required>
          <Input {...form.register('firstName')} />
        </Field>
        <Field label="Otasining ismi">
          <Input {...form.register('middleName')} />
        </Field>
        <Field label="Telefon">
          <Input placeholder="+998 90 123 45 67" {...form.register('phone')} />
        </Field>
        <Field label="Email" error={e.email?.message} required>
          <Input type="email" {...form.register('email')} />
        </Field>
        <Field label={initial ? 'Yangi parol' : 'Parol'} error={e.password?.message} hint={initial ? "Bo'sh qoldirilsa o'zgarmaydi" : "Bo'sh qoldirilsa: Welcome@123"}>
          <PasswordInput autoComplete="new-password" {...form.register('password')} />
        </Field>

        <div className="sm:col-span-2">
          <div className="mb-1.5 text-[12.5px] font-semibold text-fg-soft">Rollar</div>
          <div className="grid gap-2 sm:grid-cols-3">
            {ROLES.map((r) => {
              const Icon = ROLE_META[r].icon;
              const on = roles.includes(r);
              return (
                <button
                  type="button"
                  key={r}
                  onClick={() => form.setValue('roles', on ? roles.filter((x) => x !== r) : [...roles, r], { shouldValidate: true })}
                  aria-pressed={on}
                  className={cn('flex items-center gap-2.5 rounded-2xl border-2 p-3 text-left transition', on ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-500/10 dark:bg-brand-500/15' : 'border-line opacity-70 hover:border-brand-200 hover:opacity-100')}
                >
                  <span className={cn('grid size-8 place-items-center rounded-xl bg-gradient-to-br text-white', ROLE_META[r].tone)}>
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1 text-[13px] font-bold text-fg">{ROLE_META[r].label}</span>
                  <span className={cn('grid size-5 place-items-center rounded-full border-2 transition', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-line')}>{on && <Check className="size-3" strokeWidth={3.5} />}</span>
                </button>
              );
            })}
          </div>
          {e.roles && <p className="mt-1 text-xs text-rose-500">{e.roles.message}</p>}
        </div>

        {roles.includes('student') && (
          <Field label="Guruh (talaba uchun)">
            <Select placeholder="— Biriktirilmagan —" options={(groups ?? []).map((g) => ({ value: g.id, label: `${g.name} · ${g.course}-kurs` }))} {...form.register('groupId')} />
          </Field>
        )}
        {roles.includes('teacher') && (
          <>
            <Field label="Kafedra (o'qituvchi uchun)">
              <Select placeholder="— Tanlanmagan —" options={(departments ?? []).map((d) => ({ value: d.id, label: d.name }))} {...form.register('departmentId')} />
            </Field>
            <Field label="Lavozim">
              <Select options={Object.entries(POSITION).map(([value, label]) => ({ value, label }))} {...form.register('position')} />
            </Field>
            <Field label="Ilmiy daraja">
              <Input placeholder="PhD, DSc..." {...form.register('degree')} />
            </Field>
          </>
        )}
        <Field label="Holat">
          <Select
            options={[
              { value: 'active', label: 'Faol' },
              { value: 'pending', label: 'Kutilmoqda' },
              { value: 'blocked', label: 'Bloklangan' },
            ]}
            {...form.register('status')}
          />
        </Field>
      </div>
    </Modal>
  );
}

/* ───────────── Group ───────────── */

const groupSchema = z.object({
  name: z.string().trim().min(2, 'Nom kiriting'),
  facultyId: z.string().min(1, 'Fakultetni tanlang'),
  course: z.coerce.number().min(1).max(6),
  language: z.enum(['uz', 'ru', 'en']),
  form: z.enum(['fulltime', 'parttime', 'evening']),
  curatorId: z.string().optional(),
  enrollmentYear: z.coerce.number().min(2000).max(2100),
});

export function GroupFormModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: GroupView | null }) {
  const { save } = useCrud<Record<string, unknown> & { id?: string }>('groups', [['groups'], ['dashboard']], 'Guruh');
  const { data: faculties } = useFaculties();
  const { data: teachers } = useTeachers();
  const form = useForm<z.input<typeof groupSchema>>({ resolver: zodResolver(groupSchema) });
  useEffect(() => {
    if (open)
      form.reset(
        initial
          ? { name: initial.name, facultyId: initial.facultyId, course: initial.course, language: initial.language, form: initial.form, curatorId: initial.curatorId ?? '', enrollmentYear: initial.enrollmentYear }
          : { name: '', facultyId: faculties?.[0]?.id ?? '', course: 1, language: 'uz', form: 'fulltime', curatorId: '', enrollmentYear: new Date().getFullYear() },
      );
  }, [open, initial, faculties, form]);
  const submit = form.handleSubmit(async (v) => {
    await save.mutateAsync({ ...groupSchema.parse(v), id: initial?.id });
    onClose();
  });
  const e = form.formState.errors;
  return (
    <Modal open={open} onClose={onClose} icon={<UsersRound />} title={initial ? 'Guruhni tahrirlash' : 'Yangi guruh'} footer={<><Button variant="ghost" onClick={onClose}>Bekor qilish</Button><Button onClick={submit} loading={save.isPending}>Saqlash</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Guruh nomi" error={e.name?.message} required>
          <Input placeholder="DI-401" {...form.register('name')} />
        </Field>
        <Field label="Fakultet" error={e.facultyId?.message} required>
          <Select options={(faculties ?? []).map((f) => ({ value: f.id, label: f.name }))} {...form.register('facultyId')} />
        </Field>
        <Field label="Kurs">
          <Select options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `${n}-kurs` }))} {...form.register('course')} />
        </Field>
        <Field label="Qabul yili">
          <Input type="number" {...form.register('enrollmentYear')} />
        </Field>
        <Field label="Ta'lim tili">
          <Select options={Object.entries(EDU_LANG).map(([value, label]) => ({ value, label }))} {...form.register('language')} />
        </Field>
        <Field label="Ta'lim shakli">
          <Select options={Object.entries(EDU_FORM).map(([value, label]) => ({ value, label }))} {...form.register('form')} />
        </Field>
        <Field label="Kurator" className="sm:col-span-2">
          <Select placeholder="— Tanlanmagan —" options={(teachers ?? []).map((t) => ({ value: t.id, label: `${t.lastName} ${t.firstName}` }))} {...form.register('curatorId')} />
        </Field>
      </div>
    </Modal>
  );
}

/* ───────────── Subject ───────────── */

const subjectSchema = z.object({
  name: z.string().trim().min(3, 'Nom kiriting'),
  code: z.string().trim().min(2, 'Kod kiriting'),
  credits: z.coerce.number().min(1).max(20),
  departmentId: z.string().optional(),
  lecture: z.coerce.number().min(0),
  practice: z.coerce.number().min(0),
  lab: z.coerce.number().min(0),
  description: z.string().optional(),
});

export function SubjectFormModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Subject | null }) {
  const { save } = useCrud<Record<string, unknown> & { id?: string }>('subjects', [['subjects']], 'Fan');
  const { data: departments } = useDepartments();
  const form = useForm<z.input<typeof subjectSchema> & { color: SubjectColor }>({ resolver: zodResolver(subjectSchema) as never });
  const color = form.watch('color');
  useEffect(() => {
    if (open)
      form.reset(
        initial
          ? { name: initial.name, code: initial.code, credits: initial.credits, departmentId: initial.departmentId ?? '', lecture: initial.hours.lecture, practice: initial.hours.practice, lab: initial.hours.lab, description: initial.description ?? '', color: initial.color }
          : { name: '', code: '', credits: 4, departmentId: '', lecture: 30, practice: 30, lab: 0, description: '', color: 'violet' },
      );
  }, [open, initial, form]);
  const submit = form.handleSubmit(async (v) => {
    const p = subjectSchema.parse(v);
    await save.mutateAsync({ id: initial?.id, name: p.name, code: p.code.toUpperCase(), credits: p.credits, departmentId: p.departmentId || null, hours: { lecture: p.lecture, practice: p.practice, lab: p.lab }, description: p.description, color: v.color });
    onClose();
  });
  const e = form.formState.errors;
  return (
    <Modal open={open} onClose={onClose} size="lg" icon={<BookPlus />} title={initial ? 'Fanni tahrirlash' : 'Yangi fan'} footer={<><Button variant="ghost" onClick={onClose}>Bekor qilish</Button><Button onClick={submit} loading={save.isPending}>Saqlash</Button></>}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Fan nomi" error={e.name?.message} required className="sm:col-span-2">
          <Input {...form.register('name')} />
        </Field>
        <Field label="Kod" error={e.code?.message} required>
          <Input placeholder="DI305" {...form.register('code')} />
        </Field>
        <Field label="Kredit">
          <Input type="number" {...form.register('credits')} />
        </Field>
        <Field label="Kafedra" className="sm:col-span-2">
          <Select placeholder="— Tanlanmagan —" options={(departments ?? []).map((d) => ({ value: d.id, label: d.name }))} {...form.register('departmentId')} />
        </Field>
        <Field label="Ma'ruza (soat)">
          <Input type="number" {...form.register('lecture')} />
        </Field>
        <Field label="Amaliy (soat)">
          <Input type="number" {...form.register('practice')} />
        </Field>
        <Field label="Laboratoriya (soat)">
          <Input type="number" {...form.register('lab')} />
        </Field>
        <Field label="Rang" className="sm:col-span-3">
          <div className="flex flex-wrap gap-2">
            {SUBJECT_COLOR_KEYS.map((c) => (
              <button type="button" key={c} onClick={() => form.setValue('color', c)} className={cn('size-9 rounded-xl bg-gradient-to-br transition', SUBJECT_COLORS[c].gradient, color === c ? 'scale-110 ring-2 ring-fg ring-offset-2 ring-offset-card' : 'opacity-70 hover:opacity-100')} aria-label={c} />
            ))}
          </div>
        </Field>
        <Field label="Tavsif" className="sm:col-span-3">
          <Textarea rows={3} {...form.register('description')} />
        </Field>
      </div>
    </Modal>
  );
}

/* ───────────── Course (teaching load) ───────────── */

const courseSchema = z
  .object({
    subjectId: z.string().min(1, 'Fanni tanlang'),
    teacherId: z.string().min(1, "O'qituvchini tanlang"),
    semesterId: z.string().min(1, 'Semestrni tanlang'),
    groupIds: z.array(z.string()).min(1, 'Kamida bitta guruh'),
    current: z.coerce.number().min(0).max(100),
    midterm: z.coerce.number().min(0).max(100),
    final: z.coerce.number().min(0).max(100),
  })
  .refine((v) => Number(v.current) + Number(v.midterm) + Number(v.final) === 100, { path: ['final'], message: "JN + ON + YN = 100 bo'lishi kerak" });

export function CourseFormModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: CourseView | null }) {
  const save = useSaveCourse();
  const { data: subjects } = useSubjects();
  const { data: teachers } = useTeachers();
  const { data: groups } = useGroups();
  const { data: semesters } = useSemesters();
  const form = useForm<z.input<typeof courseSchema>>({ resolver: zodResolver(courseSchema) });
  const groupIds = form.watch('groupIds') ?? [];
  const sum = Number(form.watch('current') ?? 0) + Number(form.watch('midterm') ?? 0) + Number(form.watch('final') ?? 0);
  useEffect(() => {
    if (open)
      form.reset(
        initial
          ? { subjectId: initial.subjectId, teacherId: initial.teacherId, semesterId: initial.semesterId, groupIds: initial.groupIds, current: initial.grading.current, midterm: initial.grading.midterm, final: initial.grading.final }
          : { subjectId: '', teacherId: '', semesterId: semesters?.find((s) => s.isCurrent)?.id ?? '', groupIds: [], current: 40, midterm: 30, final: 30 },
      );
  }, [open, initial, semesters, form]);
  const submit = form.handleSubmit(async (v) => {
    const p = courseSchema.parse(v);
    await save.mutateAsync({ id: initial?.id, subjectId: p.subjectId, teacherId: p.teacherId, semesterId: p.semesterId, groupIds: p.groupIds, grading: { current: p.current, midterm: p.midterm, final: p.final } });
    onClose();
  });
  const e = form.formState.errors;
  return (
    <Modal open={open} onClose={onClose} size="lg" icon={<Layers />} title={initial ? 'Kursni tahrirlash' : 'Yangi kurs (yuklama)'} description="Fan + o'qituvchi + guruh(lar) + semestr" footer={<><Button variant="ghost" onClick={onClose}>Bekor qilish</Button><Button onClick={submit} loading={save.isPending}>Saqlash</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fan" error={e.subjectId?.message} required>
          <Select placeholder="— Tanlang —" options={(subjects ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))} {...form.register('subjectId')} />
        </Field>
        <Field label="O'qituvchi" error={e.teacherId?.message} required>
          <Select placeholder="— Tanlang —" options={(teachers ?? []).map((t) => ({ value: t.id, label: `${t.lastName} ${t.firstName} · ${t.position}` }))} {...form.register('teacherId')} />
        </Field>
        <Field label="Semestr" error={e.semesterId?.message} required className="sm:col-span-2">
          <Select options={(semesters ?? []).map((s) => ({ value: s.id, label: `${s.name}${s.isCurrent ? ' (joriy)' : ''}` }))} {...form.register('semesterId')} />
        </Field>
        <div className="sm:col-span-2">
          <div className="mb-1.5 text-[12.5px] font-semibold text-fg-soft">Guruhlar (potok uchun bir nechta)</div>
          <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto rounded-2xl border border-line p-3 sm:grid-cols-3">
            {(groups ?? []).map((g) => (
              <Checkbox key={g.id} checked={groupIds.includes(g.id)} onChange={(v) => form.setValue('groupIds', v ? [...groupIds, g.id] : groupIds.filter((x) => x !== g.id), { shouldValidate: true })} label={g.name} description={`${g.course}-kurs · ${g.studentCount} talaba`} />
            ))}
          </div>
          {e.groupIds && <p className="mt-1 text-xs text-rose-500">{e.groupIds.message}</p>}
        </div>
        <div className="grid grid-cols-3 gap-3 sm:col-span-2">
          <Field label="JN (joriy)">
            <Input type="number" {...form.register('current')} />
          </Field>
          <Field label="ON (oraliq)">
            <Input type="number" {...form.register('midterm')} />
          </Field>
          <Field label="YN (yakuniy)" error={e.final?.message}>
            <Input type="number" {...form.register('final')} />
          </Field>
        </div>
        <p className={cn('text-xs font-semibold sm:col-span-2', sum === 100 ? 'text-emerald-600' : 'text-amber-600')}>Yig'indi: {sum} / 100</p>
      </div>
    </Modal>
  );
}

/* ───────────── Schedule slot ───────────── */

export function SlotFormModal({ open, onClose, groupId, cell, initial, courses, onDelete }: { open: boolean; onClose: () => void; groupId: string; cell?: { day: number; pair: number } | null; initial?: ScheduleItem | null; courses: CourseView[]; onDelete?: (item: ScheduleItem) => void }) {
  const save = useSaveSlot();
  const pairs = usePairTimes();
  const form = useForm<{ courseId: string; type: string; room: string; week: string; day: number; pair: number }>();
  const groupCourses = useMemo(() => courses.filter((c) => c.groupIds.includes(groupId)), [courses, groupId]);
  useEffect(() => {
    if (open)
      form.reset(
        initial
          ? { courseId: initial.courseId, type: initial.type, room: initial.room, week: initial.week, day: initial.day, pair: initial.pair }
          : { courseId: groupCourses[0]?.id ?? '', type: 'lecture', room: '', week: 'all', day: cell?.day ?? 1, pair: cell?.pair ?? 1 },
      );
  }, [open, initial, cell, groupCourses, form]);
  const submit = form.handleSubmit(async (v) => {
    if (!v.room.trim()) return form.setError('room', { message: 'Xonani kiriting' });
    const course = courses.find((c) => c.id === v.courseId);
    await save.mutateAsync({ id: initial?.id, courseId: v.courseId, groupIds: initial?.groupIds ?? course?.groupIds ?? [groupId], day: Number(v.day), pair: Number(v.pair), room: v.room.trim(), type: v.type as ScheduleItem['type'], week: v.week as ScheduleItem['week'] });
    onClose();
  });
  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={<CalendarPlus />}
      title={initial ? 'Darsni tahrirlash' : "Jadvalga dars qo'shish"}
      description="Guruh, o'qituvchi va xona bandligi avtomatik tekshiriladi"
      footer={
        <>
          {initial && onDelete && (
            <Button variant="ghost" className="mr-auto text-rose-500 hover:text-rose-600" icon={<Trash2 />} onClick={() => onDelete(initial)}>
              O'chirish
            </Button>
          )}
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
        <Field label="Kurs (fan)" className="sm:col-span-2">
          <Select options={groupCourses.map((c) => ({ value: c.id, label: `${c.subject.name} — ${c.teacher.lastName} ${c.teacher.firstName.charAt(0)}.` }))} {...form.register('courseId')} />
        </Field>
        <Field label="Kun">
          <Select options={[1, 2, 3, 4, 5, 6].map((d) => ({ value: d, label: WEEKDAYS[d] }))} {...form.register('day')} />
        </Field>
        <Field label="Juftlik">
          <Select options={pairs.map((p) => ({ value: p.pair, label: `${p.pair}-juftlik (${p.start}–${p.end})` }))} {...form.register('pair')} />
        </Field>
        <Field label="Mashg'ulot turi">
          <Select options={Object.entries(LESSON_TYPE).map(([value, label]) => ({ value, label }))} {...form.register('type')} />
        </Field>
        <Field label="Hafta">
          <Select options={[{ value: 'all', label: 'Har hafta' }, { value: 'odd', label: 'Toq haftalar' }, { value: 'even', label: 'Juft haftalar' }]} {...form.register('week')} />
        </Field>
        <Field label="Xona / auditoriya" error={form.formState.errors.room?.message} className="sm:col-span-2">
          <Input placeholder="A-204, IT-Lab 1..." {...form.register('room')} />
        </Field>
      </div>
    </Modal>
  );
}
