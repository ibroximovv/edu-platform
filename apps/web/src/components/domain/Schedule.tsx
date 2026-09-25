import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Clock, MapPin, Plus, Users } from 'lucide-react';
import { DEFAULT_PAIR_TIMES, type PairTime, type ScheduleItem } from '@edu/shared';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS } from '@/lib/colors';
import { LESSON_TYPE } from '@/lib/labels';
import { isoWeekday, WEEKDAYS, WEEKDAYS_SHORT } from '@/lib/format';
import { useSettings } from '@/api/queries/admin';
import { Avatar, Badge, EmptyState, Segmented } from '@/components/ui';

export function usePairTimes(): PairTime[] {
  const { data } = useSettings();
  return data?.pairTimes ?? DEFAULT_PAIR_TIMES;
}

function minutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function lessonState(pair: PairTime, now = new Date()) {
  const n = now.getHours() * 60 + now.getMinutes();
  if (n < minutes(pair.start)) return 'upcoming' as const;
  if (n > minutes(pair.end)) return 'done' as const;
  return 'now' as const;
}

function SlotCard({ item, showTeacher, showGroups, onClick, compact }: { item: ScheduleItem; showTeacher?: boolean; showGroups?: boolean; onClick?: () => void; compact?: boolean }) {
  const c = SUBJECT_COLORS[item.subject.color];
  return (
    <motion.button
      type="button"
      layout
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn('relative block h-full w-full overflow-hidden rounded-2xl border border-transparent p-2.5 text-left transition', c.soft, onClick ? 'cursor-pointer hover:border-current/20' : 'cursor-default')}
    >
      <span className={cn('absolute inset-y-2 left-0 w-1 rounded-r-full', c.solid)} />
      <div className="pl-1.5">
        <div className={cn('text-[10px] font-bold uppercase tracking-wide', c.text)}>
          {LESSON_TYPE[item.type]}
          {item.week !== 'all' && ` · ${item.week === 'odd' ? 'toq' : 'juft'} hafta`}
        </div>
        <div className={cn('mt-0.5 font-bold leading-snug text-fg', compact ? 'line-clamp-2 text-[12px]' : 'line-clamp-2 text-[12.5px]')}>{item.subject.name}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] font-medium text-fg-soft">
          <span className="flex items-center gap-0.5">
            <MapPin className="size-3" />
            {item.room}
          </span>
          {showGroups && (
            <span className="flex items-center gap-0.5">
              <Users className="size-3" />
              {item.groups.map((g) => g.name).join(', ')}
            </span>
          )}
        </div>
        {showTeacher && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Avatar user={item.teacher} size="xs" />
            <span className="truncate text-[10.5px] font-semibold text-fg-soft">
              {item.teacher.firstName.charAt(0)}. {item.teacher.lastName}
            </span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

export function ScheduleGrid({
  items,
  showTeacher,
  showGroups,
  onCellClick,
  onItemClick,
  days = 6,
}: {
  items: ScheduleItem[];
  showTeacher?: boolean;
  showGroups?: boolean;
  onCellClick?: (day: number, pair: number) => void;
  onItemClick?: (item: ScheduleItem) => void;
  days?: number;
}) {
  const pairs = usePairTimes();
  const today = isoWeekday();
  const [mobileDay, setMobileDay] = useState(String(Math.min(today, days)));
  const byCell = useMemo(() => {
    const m = new Map<string, ScheduleItem[]>();
    for (const it of items) {
      const k = `${it.day}-${it.pair}`;
      m.set(k, [...(m.get(k) ?? []), it]);
    }
    return m;
  }, [items]);
  const dayList = Array.from({ length: days }, (_, i) => i + 1);

  return (
    <>
      {/* Desktop grid */}
      <div className="hidden overflow-x-auto lg:block">
        <div className="grid min-w-[900px] gap-2" style={{ gridTemplateColumns: `92px repeat(${days}, minmax(0, 1fr))` }}>
          <div />
          {dayList.map((d) => (
            <div key={d} className={cn('rounded-2xl px-3 py-2.5 text-center', d === today ? 'bg-brand-600 text-white shadow-brand' : 'bg-panel')}>
              <div className="text-[13px] font-bold">{WEEKDAYS[d]}</div>
            </div>
          ))}
          {pairs.map((p) => (
            <div key={p.pair} className="contents">
              <div className="flex flex-col justify-center rounded-2xl bg-panel/60 px-3 py-2 text-center">
                <div className="text-[13px] font-extrabold text-fg">{p.pair}-juftlik</div>
                <div className="text-[10.5px] font-semibold text-muted tabular-nums">
                  {p.start}–{p.end}
                </div>
              </div>
              {dayList.map((d) => {
                const cell = byCell.get(`${d}-${p.pair}`) ?? [];
                return (
                  <div key={d} className={cn('min-h-[104px] rounded-2xl', cell.length ? '' : 'border border-dashed border-line', d === today && !cell.length && 'bg-brand-50/30 dark:bg-brand-500/5')}>
                    {cell.length ? (
                      <div className="flex h-full flex-col gap-1.5">
                        {cell.map((it) => (
                          <SlotCard key={it.id} item={it} showTeacher={showTeacher} showGroups={showGroups} onClick={onItemClick ? () => onItemClick(it) : undefined} compact={cell.length > 1} />
                        ))}
                      </div>
                    ) : onCellClick ? (
                      <button onClick={() => onCellClick(d, p.pair)} className="group grid size-full place-items-center rounded-2xl text-muted/60 transition hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10" aria-label="Dars qo'shish">
                        <Plus className="size-5 opacity-0 transition group-hover:opacity-100" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: day tabs */}
      <div className="space-y-3 lg:hidden">
        <Segmented size="sm" value={mobileDay} onChange={setMobileDay} items={dayList.map((d) => ({ value: String(d), label: WEEKDAYS_SHORT[d] }))} />
        {pairs.map((p) => {
          const cell = byCell.get(`${mobileDay}-${p.pair}`) ?? [];
          return (
            <div key={p.pair} className="flex gap-3">
              <div className="w-16 shrink-0 pt-2 text-center">
                <div className="text-xs font-extrabold text-fg">{p.pair}-juft</div>
                <div className="text-[10px] text-muted tabular-nums">{p.start}</div>
              </div>
              <div className="flex-1 space-y-1.5">
                {cell.length ? (
                  cell.map((it) => <SlotCard key={it.id} item={it} showTeacher={showTeacher} showGroups={showGroups} onClick={onItemClick ? () => onItemClick(it) : undefined} />)
                ) : onCellClick ? (
                  <button onClick={() => onCellClick(Number(mobileDay), p.pair)} className="flex h-14 w-full items-center justify-center rounded-2xl border border-dashed border-line text-xs text-muted">
                    <Plus className="mr-1 size-4" /> Qo'shish
                  </button>
                ) : (
                  <div className="h-14 rounded-2xl border border-dashed border-line" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Vertical timeline of today's lessons */
export function TodayTimeline({ items, showGroups, empty }: { items: ScheduleItem[]; showGroups?: boolean; empty?: string }) {
  const pairs = usePairTimes();
  if (!items.length) return <EmptyState className="py-8" icon={<Clock />} title="Bugun dars yo'q" description={empty ?? 'Dam oling yoki mustaqil ta’lim bilan shug‘ullaning'} />;
  return (
    <ol className="relative space-y-3 before:absolute before:bottom-3 before:left-[27px] before:top-3 before:w-px before:bg-line">
      {items.map((it) => {
        const pt = pairs.find((p) => p.pair === it.pair) ?? pairs[0];
        const state = lessonState(pt);
        const c = SUBJECT_COLORS[it.subject.color];
        return (
          <li key={it.id} className="relative flex gap-3">
            <div className={cn('relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl text-center leading-none', state === 'now' ? 'bg-brand-600 text-white shadow-brand' : state === 'done' ? 'bg-panel text-muted' : 'bg-card text-fg ring-1 ring-line')}>
              <div>
                <div className="text-[13px] font-extrabold tabular-nums">{pt.start}</div>
                <div className="mt-0.5 text-[9.5px] font-semibold opacity-70">{it.pair}-juft</div>
              </div>
            </div>
            <div className={cn('flex-1 rounded-2xl p-3', state === 'done' ? 'bg-panel/60 opacity-70' : c.soft)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-fg">{it.subject.name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[11px] font-medium text-fg-soft">
                    <span>{LESSON_TYPE[it.type]}</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="size-3" /> {it.room}
                    </span>
                    {showGroups && <span>{it.groups.map((g) => g.name).join(', ')}</span>}
                    <span className="tabular-nums">
                      {pt.start}–{pt.end}
                    </span>
                  </div>
                </div>
                {state === 'now' && (
                  <Badge tone="brand" dot>
                    Hozir
                  </Badge>
                )}
                {state === 'done' && <Badge>Tugadi</Badge>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
