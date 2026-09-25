import { Fragment, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Award, BookOpenCheck, ChevronDown, Download, GraduationCap, Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import { downloadCsv } from '@/lib/csv';
import { fmtDate } from '@/lib/format';
import { CATEGORY_SHORT } from '@/lib/labels';
import { SUBJECT_COLORS } from '@/lib/colors';
import { useGradeHistory, useMyGrades } from '@/api/queries/journal';
import { useCurrentUser } from '@/stores/auth.store';
import { LineChart } from '@/components/charts';
import { GradeBadge, scoreTone } from '@/components/domain/Bits';
import { Button, Card, CardHeader, EmptyState, Page, PageHeader, Select, Skeleton, StatCard } from '@/components/ui';

export default function StudentGradesPage() {
  const [semesterId, setSemesterId] = useState<string>();
  const { data, isLoading, isFetching } = useMyGrades(semesterId);
  const { data: history } = useGradeHistory();
  const user = useCurrentUser();
  const [open, setOpen] = useState<string | null>(null);
  const credits = data?.courses.reduce((s, c) => s + c.credits, 0) ?? 0;

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(`baholar-${data.semester.name}`, [
      ['Talaba', `${user?.lastName} ${user?.firstName}`],
      ['Semestr', data.semester.name],
      [],
      ['Fan', 'Kredit', 'JN', 'ON', 'YN', 'Jami', 'Baho'],
      ...data.courses.map((c) => [c.subject.name, c.credits, c.score.current, c.score.midterm, c.score.final, c.score.total, c.score.grade]),
      [],
      ["O'rtacha", data.average],
      ['GPA', data.gpa],
    ]);
  };

  return (
    <Page>
      <PageHeader
        title="Baholarim"
        description="Semestrlar bo'yicha o'zlashtirish qaydnomasi"
        actions={
          <>
            <Select value={semesterId ?? data?.semester.id ?? ''} onChange={(e) => setSemesterId(e.target.value)} className="w-64" options={(history ?? []).map((h) => ({ value: h.semester.id, label: h.semester.name })).reverse()} />
            <Button variant="outline" icon={<Download />} onClick={exportCsv}>
              CSV
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Target />} label="O'rtacha ball" value={data?.average ?? 0} decimals={1} tone="violet" />
        <StatCard icon={<GraduationCap />} label="GPA (4.0)" value={data?.gpa ?? 0} decimals={2} tone="sky" />
        <StatCard icon={<BookOpenCheck />} label="Fanlar" value={data?.courses.length ?? 0} tone="pink" />
        <StatCard icon={<Award />} label="Kreditlar" value={credits} tone="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className={cn('min-w-0 overflow-hidden transition-opacity', isFetching && 'opacity-60')}>
          {isLoading ? (
            <Skeleton className="m-5 h-64" />
          ) : data?.courses.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-panel/60 text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                    <th className="px-5 py-3">Fan</th>
                    <th className="px-3 py-3 text-center">JN</th>
                    <th className="px-3 py-3 text-center">ON</th>
                    <th className="px-3 py-3 text-center">YN</th>
                    <th className="px-3 py-3 text-center">Jami</th>
                    <th className="px-3 py-3">Baho</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {data.courses.map((c) => {
                    const key = c.courseId ?? c.subject.id;
                    const isOpen = open === key;
                    const col = SUBJECT_COLORS[c.subject.color];
                    return (
                      <Fragment key={key}>
                        <tr onClick={() => c.items.length && setOpen(isOpen ? null : key)} className={cn('border-b border-line transition', c.items.length && 'cursor-pointer hover:bg-panel/50')}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className={cn('h-8 w-1.5 rounded-full', col.solid)} />
                              <div>
                                <div className="font-bold text-fg">{c.subject.name}</div>
                                <div className="text-[11px] text-muted">
                                  {c.subject.code} · {c.credits} kredit{c.teacher ? ` · ${c.teacher.firstName} ${c.teacher.lastName}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 text-center font-semibold tabular-nums">{c.score.current}</td>
                          <td className="px-3 text-center font-semibold tabular-nums">{c.score.midterm}</td>
                          <td className="px-3 text-center font-semibold tabular-nums">{c.score.final}</td>
                          <td className={cn('px-3 text-center text-[15px] font-extrabold tabular-nums', scoreTone(c.score.percent))}>{c.score.total}</td>
                          <td className="px-3">
                            <GradeBadge grade={c.score.grade} />
                          </td>
                          <td className="pr-4">{c.items.length > 0 && <ChevronDown className={cn('size-4 text-muted transition', isOpen && 'rotate-180')} />}</td>
                        </tr>
                        <AnimatePresence>
                          {isOpen && (
                            <tr>
                              <td colSpan={7} className="bg-panel/40 p-0">
                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                  <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {c.items.map((it, i) => (
                                      <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-card px-3 py-2 ring-1 ring-line">
                                        <div className="min-w-0">
                                          <div className="truncate text-[12.5px] font-semibold text-fg">{it.title}</div>
                                          <div className="text-[10.5px] text-muted">
                                            {CATEGORY_SHORT[it.category]} · {fmtDate(it.date, false)}
                                          </div>
                                        </div>
                                        <div className="text-[13px] font-extrabold tabular-nums">
                                          {it.score ?? '—'}
                                          <span className="text-[11px] font-semibold text-muted">/{it.maxScore}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="px-4 pb-3 text-[11px] text-muted">Davomat: {c.attendance}% · O'zlashtirish: {c.score.percent}%</div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Bu semestr uchun baholar yo'q" />
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <CardHeader title="O'zlashtirish dinamikasi" subtitle="Semestrlar bo'yicha o'rtacha ball" />
            {history?.length ? <LineChart data={history.map((h) => ({ label: h.semester.name.replace(/, (\d)-semestr/, ' · $1'), value: h.average }))} min={40} max={100} format={(v) => v.toFixed(1)} /> : <Skeleton className="h-44" />}
          </Card>
          <Card className="p-5">
            <CardHeader title="Baholash tizimi" />
            <ul className="space-y-2 text-[13px]">
              {[
                ['86–100', 5, "A'lo"],
                ['71–85', 4, 'Yaxshi'],
                ['55–70', 3, 'Qoniqarli'],
                ['0–54', 2, 'Qoniqarsiz'],
              ].map(([range, g]) => (
                <li key={range} className="flex items-center justify-between rounded-xl bg-panel px-3 py-2">
                  <span className="font-semibold text-fg-soft tabular-nums">{range}</span>
                  <GradeBadge grade={g as number} />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Jami ball = Joriy nazorat (JN) + Oraliq nazorat (ON) + Yakuniy nazorat (YN). Semestr davomida baho prognoz sifatida ko'rsatiladi.</p>
          </Card>
        </div>
      </div>
    </Page>
  );
}
