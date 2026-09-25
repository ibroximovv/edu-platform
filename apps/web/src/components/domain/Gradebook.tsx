import { useMemo, useState } from 'react';
import { Download, Pencil, Save } from 'lucide-react';
import type { Gradebook as GradebookData } from '@edu/shared';
import { cn } from '@/lib/cn';
import { downloadCsv } from '@/lib/csv';
import { fmtDay } from '@/lib/format';
import { CATEGORY_SHORT } from '@/lib/labels';
import { useSaveScores } from '@/api/queries/assessments';
import { Avatar, Button, SearchInput } from '@/components/ui';
import { GradeBadge, scoreTone } from './Bits';

const CAT_TONE = { current: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300', midterm: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300', final: 'bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300' };

function cellTone(v: number | null, max: number) {
  if (v == null) return 'text-muted';
  const r = v / max;
  return r >= 0.86 ? 'text-emerald-600 dark:text-emerald-400' : r >= 0.71 ? 'text-sky-600 dark:text-sky-400' : r >= 0.55 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
}

export function GradebookTable({ book }: { book: GradebookData }) {
  const [q, setQ] = useState('');
  const [edits, setEdits] = useState<Record<string, Record<string, number | null>>>({});
  const save = useSaveScores();
  const editable = (colId: string) => {
    const c = book.columns.find((x) => x.id === colId);
    return c?.kind === 'assessment' && c.format !== 'test';
  };
  const changes = Object.values(edits).reduce((n, m) => n + Object.keys(m).length, 0);
  const rows = useMemo(() => book.rows.filter((r) => `${r.student.lastName} ${r.student.firstName}`.toLowerCase().includes(q.toLowerCase())), [book.rows, q]);

  const saveAll = async () => {
    for (const [id, scores] of Object.entries(edits)) await save.mutateAsync({ id, scores });
    setEdits({});
  };

  const exportCsv = () =>
    downloadCsv(`jurnal-${book.course.subject.code}`, [
      ['№', 'Talaba', 'Guruh', ...book.columns.map((c) => `${c.title} (${c.maxScore})`), 'JN', 'ON', 'YN', 'Jami', 'Baho', 'Davomat %'],
      ...book.rows.map((r, i) => [i + 1, `${r.student.lastName} ${r.student.firstName}`, r.student.groupName, ...book.columns.map((c) => r.cells[c.id] ?? ''), r.score.current, r.score.midterm, r.score.final, r.score.total, r.score.grade, r.attendance]),
    ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
        <SearchInput value={q} onChange={setQ} placeholder="Talaba qidirish..." className="w-64" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-muted">
            <Pencil className="size-3.5" /> Yozma/og'zaki nazorat kataklarini tahrirlash mumkin
          </span>
          {changes > 0 && (
            <Button icon={<Save />} onClick={saveAll} loading={save.isPending}>
              Saqlash ({changes})
            </Button>
          )}
          <Button variant="outline" icon={<Download />} onClick={exportCsv}>
            Excel (CSV)
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-[12.5px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 min-w-[240px] border-b border-r border-line bg-panel px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-muted">Talaba</th>
              {book.columns.map((c) => (
                <th key={c.id} className={cn('min-w-[74px] border-b border-line px-2 py-2 text-center align-bottom', CAT_TONE[c.category])} title={c.title}>
                  <div className="text-[10px] font-extrabold uppercase">{CATEGORY_SHORT[c.category]}</div>
                  <div className="mx-auto line-clamp-2 max-w-[90px] text-[10.5px] font-semibold leading-tight">{c.title.replace(/^\d+-/, '')}</div>
                  <div className="text-[10px] font-medium opacity-70">
                    {fmtDay(c.date)} · {c.maxScore}
                  </div>
                </th>
              ))}
              {['JN', 'ON', 'YN', 'Jami', 'Baho', 'Dav.'].map((h) => (
                <th key={h} className="min-w-[64px] border-b border-l border-line bg-panel px-2 py-2 text-center text-[11px] font-bold uppercase text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.student.id} className="group">
                <td className="sticky left-0 z-10 border-b border-r border-line bg-card px-4 py-2 group-hover:bg-panel">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-right text-[11px] font-semibold text-muted">{i + 1}</span>
                    <Avatar user={r.student} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-fg">
                        {r.student.lastName} {r.student.firstName}
                      </div>
                      <div className="text-[10.5px] text-muted">{r.student.groupName}</div>
                    </div>
                  </div>
                </td>
                {book.columns.map((c) => {
                  const edited = edits[c.id]?.[r.student.id];
                  const value = edited !== undefined ? edited : r.cells[c.id];
                  if (editable(c.id)) {
                    return (
                      <td key={c.id} className="border-b border-line px-1 py-1 text-center group-hover:bg-panel/50">
                        <input
                          type="number"
                          min={0}
                          max={c.maxScore}
                          value={value ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const v = raw === '' ? null : Math.min(c.maxScore, Math.max(0, Number(raw)));
                            setEdits((x) => ({ ...x, [c.id]: { ...x[c.id], [r.student.id]: v } }));
                          }}
                          className={cn('h-8 w-14 rounded-lg border bg-transparent text-center font-bold outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20', edited !== undefined ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10' : 'border-dashed border-line', cellTone(value, c.maxScore))}
                          placeholder="—"
                        />
                      </td>
                    );
                  }
                  return (
                    <td key={c.id} className={cn('border-b border-line px-2 py-2 text-center font-bold tabular-nums group-hover:bg-panel/50', cellTone(value, c.maxScore))}>
                      {value ?? '—'}
                    </td>
                  );
                })}
                <td className="border-b border-l border-line text-center font-semibold tabular-nums group-hover:bg-panel/50">{r.score.current}</td>
                <td className="border-b border-line text-center font-semibold tabular-nums group-hover:bg-panel/50">{r.score.midterm}</td>
                <td className="border-b border-line text-center font-semibold tabular-nums group-hover:bg-panel/50">{r.score.final}</td>
                <td className={cn('border-b border-line text-center text-[14px] font-extrabold tabular-nums group-hover:bg-panel/50', scoreTone(r.score.percent))}>{r.score.total}</td>
                <td className="border-b border-line px-2 text-center group-hover:bg-panel/50">
                  <GradeBadge grade={r.score.grade} showLabel={false} />
                </td>
                <td className={cn('border-b border-line text-center font-semibold tabular-nums group-hover:bg-panel/50', r.attendance < 75 ? 'text-rose-500' : 'text-fg-soft')}>{r.attendance}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
