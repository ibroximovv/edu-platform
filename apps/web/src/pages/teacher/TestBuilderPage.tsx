import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Circle, Copy, FileText, ListPlus, Plus, Save, Send, Square, SquareCheck, Trash2, Wand2, X } from 'lucide-react';
import type { AssessmentCategory, AssessmentFormat, Question, QuestionType, UpsertAssessmentDto } from '@edu/shared';
import { cn } from '@/lib/cn';
import { toInputDateTime } from '@/lib/format';
import { CATEGORY, FORMAT, QUESTION_TYPE } from '@/lib/labels';
import { useAssessment, useSaveAssessment } from '@/api/queries/assessments';
import { useCourses } from '@/api/queries/learning';
import { Badge, Button, Card, CardHeader, Dropdown, Field, Input, Modal, Page, PageHeader, Segmented, Select, Skeleton, Switch, Textarea } from '@/components/ui';

const uid = () => Math.random().toString(36).slice(2, 10);

function newQuestion(type: QuestionType, points = 1): Question {
  if (type === 'truefalse') return { id: `q_${uid()}`, type, text: '', options: [{ id: 'true', text: "To'g'ri" }, { id: 'false', text: "Noto'g'ri" }], correct: ['true'], points };
  if (type === 'short') return { id: `q_${uid()}`, type, text: '', options: [], correct: [''], points };
  return { id: `q_${uid()}`, type, text: '', options: [1, 2, 3, 4].map(() => ({ id: `o_${uid()}`, text: '' })), correct: [], points };
}

/** Bulk import: "? question" lines followed by "+ correct" / "- wrong" options. */
function parseBulk(text: string, points: number): Question[] {
  const out: Question[] = [];
  let cur: Question | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('?')) {
      if (cur) out.push(cur);
      cur = { id: `q_${uid()}`, type: 'single', text: line.slice(1).trim(), options: [], correct: [], points };
    } else if (cur && (line.startsWith('+') || line.startsWith('-'))) {
      const o = { id: `o_${uid()}`, text: line.slice(1).trim() };
      cur.options.push(o);
      if (line.startsWith('+')) cur.correct.push(o.id);
    }
  }
  if (cur) out.push(cur);
  return out.map((q) => ({ ...q, type: q.correct.length > 1 ? 'multiple' : 'single' }));
}

interface Meta {
  courseId: string;
  title: string;
  description: string;
  category: AssessmentCategory;
  format: AssessmentFormat;
  maxScore: number;
  startsAt: string;
  endsAt: string;
  durationMin: number;
  attempts: number;
  shuffle: boolean;
  showResults: boolean;
}

export default function TestBuilderPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data: courses } = useCourses({ as: 'teacher' });
  const { data: existing, isLoading } = useAssessment(id);
  const save = useSaveAssessment();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    if (meta) return;
    if (id && existing) {
      setMeta({ courseId: existing.courseId, title: existing.title, description: existing.description ?? '', category: existing.category, format: existing.format, maxScore: existing.maxScore, startsAt: toInputDateTime(existing.startsAt), endsAt: toInputDateTime(existing.endsAt), durationMin: existing.durationMin, attempts: existing.attempts, shuffle: existing.shuffle, showResults: existing.showResults });
      setQuestions(existing.questions ?? []);
    } else if (!id && courses) {
      const start = new Date(Date.now() + 86400000);
      start.setHours(9, 0, 0, 0);
      const end = new Date(start.getTime() + 3 * 86400000);
      end.setHours(23, 59, 0, 0);
      setMeta({ courseId: params.get('courseId') ?? courses[0]?.id ?? '', title: '', description: '', category: 'current', format: 'test', maxScore: 10, startsAt: toInputDateTime(start), endsAt: toInputDateTime(end), durationMin: 20, attempts: 1, shuffle: true, showResults: true });
      setQuestions([newQuestion('single', 2)]);
    }
  }, [id, existing, courses, params, meta]);

  const totalPoints = useMemo(() => questions.reduce((s, q) => s + (Number(q.points) || 0), 0), [questions]);
  const issues = useMemo(() => {
    if (!meta) return [];
    const list: string[] = [];
    if (!meta.title.trim()) list.push('Sarlavha kiritilmagan');
    if (new Date(meta.endsAt) <= new Date(meta.startsAt)) list.push("Tugash vaqti boshlanishdan keyin bo'lishi kerak");
    if (meta.format === 'test') {
      if (!questions.length) list.push("Kamida bitta savol qo'shing");
      questions.forEach((q, i) => {
        if (!q.text.trim()) list.push(`${i + 1}-savol matni bo'sh`);
        if (q.type !== 'short' && !q.correct.length) list.push(`${i + 1}-savolda to'g'ri javob belgilanmagan`);
        if ((q.type === 'single' || q.type === 'multiple') && q.options.some((o) => !o.text.trim())) list.push(`${i + 1}-savolda bo'sh variant bor`);
        if (q.type === 'short' && !q.correct.some((c) => c.trim())) list.push(`${i + 1}-savol uchun javob kiritilmagan`);
      });
    }
    return list;
  }, [meta, questions]);

  if ((id && isLoading) || !meta) return <Skeleton className="h-[600px] rounded-3xl" />;

  const set = <K extends keyof Meta>(k: K, v: Meta[K]) => setMeta((m) => (m ? { ...m, [k]: v } : m));
  const updateQ = (qid: string, patch: Partial<Question>) => setQuestions((qs) => qs.map((q) => (q.id === qid ? { ...q, ...patch } : q)));
  const moveQ = (i: number, dir: -1 | 1) =>
    setQuestions((qs) => {
      const a = [...qs];
      [a[i], a[i + dir]] = [a[i + dir], a[i]];
      return a;
    });

  const distribute = () => {
    if (!questions.length) return;
    const p = Math.round((meta.maxScore / questions.length) * 100) / 100;
    setQuestions((qs) => qs.map((q) => ({ ...q, points: p })));
    toast.success(`Har bir savolga ${p} ball taqsimlandi`);
  };

  const submit = async (status: 'draft' | 'published') => {
    if (status === 'published' && issues.length) return toast.error(issues[0]);
    const dto: UpsertAssessmentDto & { id?: string } = {
      id,
      ...meta,
      maxScore: Number(meta.maxScore),
      durationMin: Number(meta.durationMin),
      attempts: Number(meta.attempts),
      startsAt: new Date(meta.startsAt).toISOString(),
      endsAt: new Date(meta.endsAt).toISOString(),
      questions: meta.format === 'test' ? questions.map((q) => ({ ...q, points: Number(q.points) || 0, correct: q.type === 'short' ? q.correct.filter((c) => c.trim()) : q.correct })) : [],
      status,
    };
    const saved = await save.mutateAsync(dto);
    navigate(`/teacher/tests/${saved.id}/results`, { replace: true });
  };

  return (
    <Page>
      <PageHeader
        breadcrumbs={[{ label: 'Test va nazoratlar', to: '/teacher/tests' }, { label: id ? 'Tahrirlash' : 'Yangi' }]}
        title={id ? meta.title || 'Tahrirlash' : 'Yangi test / nazorat'}
        actions={
          <>
            <Button variant="outline" icon={<Save />} onClick={() => submit('draft')} loading={save.isPending}>
              Qoralama
            </Button>
            <Button icon={<Send />} onClick={() => submit('published')} loading={save.isPending}>
              {existing?.status === 'published' ? 'Saqlash' : "E'lon qilish"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card className="p-6">
            <CardHeader title="Asosiy ma'lumotlar" icon={<FileText />} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kurs" required>
                <Select value={meta.courseId} disabled={!!id} onChange={(e) => set('courseId', e.target.value)} options={(courses ?? []).map((c) => ({ value: c.id, label: `${c.subject.name} · ${c.groups.map((g) => g.name).join(', ')}` }))} />
              </Field>
              <Field label="Nazorat turkumi">
                <Select value={meta.category} onChange={(e) => set('category', e.target.value as AssessmentCategory)} options={Object.entries(CATEGORY).map(([value, label]) => ({ value, label }))} />
              </Field>
              <Field label="Sarlavha" required className="sm:col-span-2">
                <Input value={meta.title} onChange={(e) => set('title', e.target.value)} placeholder="Masalan: Joriy test №3 — SQL JOIN" />
              </Field>
              <Field label="Tavsif / yo'riqnoma" className="sm:col-span-2">
                <Textarea rows={2} value={meta.description} onChange={(e) => set('description', e.target.value)} />
              </Field>
              <Field label="Shakl" className="sm:col-span-2">
                <Segmented value={meta.format} onChange={(v) => set('format', v)} items={Object.entries(FORMAT).map(([value, label]) => ({ value: value as AssessmentFormat, label }))} />
              </Field>
              <Field label="Boshlanish">
                <Input type="datetime-local" value={meta.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
              </Field>
              <Field label="Tugash">
                <Input type="datetime-local" value={meta.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
              </Field>
              <Field label="Maksimal ball">
                <Input type="number" min={1} max={100} value={meta.maxScore} onChange={(e) => set('maxScore', Number(e.target.value))} />
              </Field>
              {meta.format === 'test' && (
                <>
                  <Field label="Davomiylik (daqiqa)">
                    <Input type="number" min={1} max={300} value={meta.durationMin} onChange={(e) => set('durationMin', Number(e.target.value))} />
                  </Field>
                  <Field label="Urinishlar soni">
                    <Input type="number" min={1} max={10} value={meta.attempts} onChange={(e) => set('attempts', Number(e.target.value))} />
                  </Field>
                  <div className="space-y-3 rounded-2xl bg-panel p-4 sm:col-span-2">
                    <Switch checked={meta.shuffle} onChange={(v) => set('shuffle', v)} label="Savollarni aralashtirish" description="Har bir talabaga savollar tasodifiy tartibda beriladi" />
                    <Switch checked={meta.showResults} onChange={(v) => set('showResults', v)} label="Natija tahlilini ko'rsatish" description="Talaba yakunlagach to'g'ri javoblarni ko'radi" />
                  </div>
                </>
              )}
            </div>
          </Card>

          {meta.format === 'test' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[17px] font-extrabold text-fg">Savollar ({questions.length})</h2>
                <div className="flex gap-2">
                  <Button variant="outline" icon={<Wand2 />} onClick={() => setBulkOpen(true)}>
                    Matndan import
                  </Button>
                  <Dropdown
                    trigger={() => <Button icon={<Plus />}>Savol qo'shish</Button>}
                    items={(Object.keys(QUESTION_TYPE) as QuestionType[]).map((t) => ({ label: QUESTION_TYPE[t], icon: <ListPlus />, onClick: () => setQuestions((qs) => [...qs, newQuestion(t, questions[0]?.points ?? 1)]) }))}
                  />
                </div>
              </div>
              <AnimatePresence initial={false}>
                {questions.map((q, i) => (
                  <motion.div key={q.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
                    <QuestionEditor
                      q={q}
                      index={i}
                      total={questions.length}
                      onChange={(p) => updateQ(q.id, p)}
                      onMove={(d) => moveQ(i, d)}
                      onDuplicate={() => setQuestions((qs) => [...qs.slice(0, i + 1), { ...q, id: `q_${uid()}`, options: q.options.map((o) => ({ ...o, id: q.type === 'truefalse' ? o.id : `o_${uid()}` })), correct: q.type === 'single' || q.type === 'multiple' ? [] : q.correct }, ...qs.slice(i + 1)])}
                      onDelete={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              <button onClick={() => setQuestions((qs) => [...qs, newQuestion('single', questions[0]?.points ?? 1)])} className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line py-6 text-sm font-semibold text-muted transition hover:border-brand-300 hover:text-brand-600">
                <Plus className="size-4" /> Yangi savol
              </button>
            </div>
          ) : (
            <Card className="p-6 text-sm text-muted">
              <b className="text-fg">{FORMAT[meta.format]}</b> auditoriyada o'tkaziladi. Natijalarni e'lon qilgandan so'ng «Natijalar» sahifasida har bir talaba uchun ball kiritasiz.
            </Card>
          )}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:h-fit">
          <Card className="p-5">
            <CardHeader title="Xulosa" />
            <div className="space-y-2.5 text-[13px]">
              <Row label="Turkum" value={<Badge tone={meta.category === 'final' ? 'red' : meta.category === 'midterm' ? 'amber' : 'violet'}>{CATEGORY[meta.category]}</Badge>} />
              <Row label="Shakl" value={FORMAT[meta.format]} />
              {meta.format === 'test' && (
                <>
                  <Row label="Savollar" value={questions.length} />
                  <Row
                    label="Savol ballari yig'indisi"
                    value={
                      <span className={cn('font-bold', Math.abs(totalPoints - meta.maxScore) > 0.01 ? 'text-amber-600' : 'text-emerald-600')}>
                        {totalPoints} / {meta.maxScore}
                      </span>
                    }
                  />
                  {Math.abs(totalPoints - meta.maxScore) > 0.01 && (
                    <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                      Yig'indi maksimal balldan farq qiladi — natija avtomatik {meta.maxScore} ballga normallashtiriladi.
                      <button onClick={distribute} className="mt-1.5 block font-bold underline">
                        Ballarni teng taqsimlash
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
          <Card className="p-5">
            <CardHeader title="Tekshiruv" />
            {issues.length ? (
              <ul className="space-y-2">
                {issues.slice(0, 8).map((x) => (
                  <li key={x} className="flex gap-2 text-xs text-fg-soft">
                    <AlertTriangle className="size-4 shrink-0 text-amber-500" /> {x}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <CheckCircle2 className="size-5" /> E'lon qilishga tayyor
              </div>
            )}
          </Card>
        </aside>
      </div>

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        size="lg"
        icon={<Wand2 />}
        title="Matndan savollarni import qilish"
        description="Har bir savol «?» bilan, to'g'ri variant «+», noto'g'ri variant «-» bilan boshlanadi"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBulkOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={() => {
                const parsed = parseBulk(bulkText, questions[0]?.points ?? 1);
                if (!parsed.length) return toast.error('Savollar topilmadi. Formatni tekshiring');
                setQuestions((qs) => [...qs.filter((q) => q.text.trim()), ...parsed]);
                setBulkOpen(false);
                setBulkText('');
                toast.success(`${parsed.length} ta savol qo'shildi`);
              }}
            >
              Import ({parseBulk(bulkText, 1).length})
            </Button>
          </>
        }
      >
        <Textarea
          rows={12}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          className="font-mono text-[13px]"
          placeholder={`? React'da holat uchun qaysi hook ishlatiladi?\n+ useState\n- useEffect\n- useRef\n\n? Qaysilari HTTP metodlari?\n+ GET\n+ POST\n- SEND`}
        />
      </Modal>
    </Page>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-fg">{value}</span>
    </div>
  );
}

function QuestionEditor({ q, index, total, onChange, onMove, onDuplicate, onDelete }: { q: Question; index: number; total: number; onChange: (p: Partial<Question>) => void; onMove: (d: -1 | 1) => void; onDuplicate: () => void; onDelete: () => void }) {
  const multi = q.type === 'multiple';
  const toggleCorrect = (oid: string) => onChange({ correct: multi ? (q.correct.includes(oid) ? q.correct.filter((x) => x !== oid) : [...q.correct, oid]) : [oid] });
  const changeType = (type: QuestionType) => {
    const fresh = newQuestion(type, q.points);
    onChange({ type, options: type === 'single' || type === 'multiple' ? (q.options.length && q.type !== 'truefalse' ? q.options : fresh.options) : fresh.options, correct: type === 'single' ? q.correct.slice(0, 1) : type === 'multiple' ? q.correct : fresh.correct });
  };
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid size-8 place-items-center rounded-xl bg-brand-600 text-sm font-extrabold text-white">{index + 1}</span>
        <Select selectSize="sm" value={q.type} onChange={(e) => changeType(e.target.value as QuestionType)} options={Object.entries(QUESTION_TYPE).map(([value, label]) => ({ value, label }))} className="w-48" />
        <div className="flex items-center gap-1.5">
          <Input inputSize="sm" type="number" min={0} step="0.5" value={q.points} onChange={(e) => onChange({ points: Number(e.target.value) })} className="w-20" />
          <span className="text-xs font-semibold text-muted">ball</span>
        </div>
        <div className="ml-auto flex gap-0.5">
          <IconBtn onClick={() => onMove(-1)} disabled={index === 0} label="Yuqoriga">
            <ArrowUp />
          </IconBtn>
          <IconBtn onClick={() => onMove(1)} disabled={index === total - 1} label="Pastga">
            <ArrowDown />
          </IconBtn>
          <IconBtn onClick={onDuplicate} label="Nusxalash">
            <Copy />
          </IconBtn>
          <IconBtn onClick={onDelete} label="O'chirish" danger>
            <Trash2 />
          </IconBtn>
        </div>
      </div>
      <Textarea rows={2} value={q.text} onChange={(e) => onChange({ text: e.target.value })} placeholder="Savol matni..." className="mt-4 text-[14.5px] font-medium" />

      {q.type === 'short' ? (
        <Field label="Qabul qilinadigan javoblar" hint="Bir nechta variantni vergul bilan ajrating. Katta-kichik harf farqlanmaydi." className="mt-4">
          <Input value={q.correct.join(', ')} onChange={(e) => onChange({ correct: e.target.value.split(',').map((s) => s.trimStart()) })} placeholder="masalan: O(log n), log n" />
        </Field>
      ) : (
        <div className="mt-4 space-y-2">
          {q.options.map((o, oi) => {
            const correct = q.correct.includes(o.id);
            return (
              <div key={o.id} className={cn('flex items-center gap-2 rounded-2xl border p-1.5 pl-2 transition', correct ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-500/10' : 'border-line')}>
                <button onClick={() => toggleCorrect(o.id)} className={cn('grid size-8 shrink-0 place-items-center rounded-lg transition', correct ? 'text-emerald-600' : 'text-muted hover:text-fg')} title="To'g'ri javob">
                  {multi ? correct ? <SquareCheck className="size-5" /> : <Square className="size-5" /> : correct ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                </button>
                <span className="w-5 text-xs font-bold text-muted">{String.fromCharCode(65 + oi)}</span>
                <input
                  value={o.text}
                  disabled={q.type === 'truefalse'}
                  onChange={(e) => onChange({ options: q.options.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)) })}
                  placeholder={`${oi + 1}-variant`}
                  className="h-9 flex-1 bg-transparent text-[13.5px] text-fg outline-none placeholder:text-muted"
                />
                {q.type !== 'truefalse' && q.options.length > 2 && (
                  <button onClick={() => onChange({ options: q.options.filter((x) => x.id !== o.id), correct: q.correct.filter((x) => x !== o.id) })} className="grid size-8 place-items-center rounded-lg text-muted hover:text-rose-500" aria-label="Variantni o'chirish">
                    <X className="size-4" />
                  </button>
                )}
              </div>
            );
          })}
          {q.type !== 'truefalse' && q.options.length < 8 && (
            <button onClick={() => onChange({ options: [...q.options, { id: `o_${uid()}`, text: '' }] })} className="flex items-center gap-1.5 px-2 py-1 text-[12.5px] font-semibold text-brand-600 hover:underline">
              <Plus className="size-3.5" /> Variant qo'shish
            </button>
          )}
          <p className="px-2 text-[11px] text-muted">{multi ? "Bir nechta to'g'ri javobni belgilang (qisman ball beriladi)" : "To'g'ri javobni belgilash uchun doirachani bosing"}</p>
        </div>
      )}
      <Input value={q.explanation ?? ''} onChange={(e) => onChange({ explanation: e.target.value })} placeholder="Izoh (natija tahlilida ko'rsatiladi, ixtiyoriy)" className="mt-3" inputSize="sm" />
    </Card>
  );
}

function IconBtn({ children, onClick, disabled, label, danger }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; label: string; danger?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} title={label} aria-label={label} className={cn('grid size-8 place-items-center rounded-lg text-muted transition disabled:opacity-30 [&_svg]:size-4', danger ? 'hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10' : 'hover:bg-panel hover:text-fg')}>
      {children}
    </button>
  );
}
