import { useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Flame, GraduationCap, Mail, Target, Trophy, UserCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS } from '@/lib/colors';
import { fmtDateTime, fmtRelative, greeting } from '@/lib/format';
import { subjectIcon } from '@/lib/subjectIcon';
import { useCurrentUser } from '@/stores/auth.store';
import { useStudentDashboard } from '@/api/queries/misc';
import { BarChart } from '@/components/charts';
import { CourseCard } from '@/components/domain/CourseCard';
import { Deadline, deadlineStatusBadge, HeroBanner, SectionTitle } from '@/components/domain/Bits';
import { TodayTimeline } from '@/components/domain/Schedule';
import { Avatar, ButtonLink, Card, CardHeader, EmptyState, Page, RingProgress, Skeleton, StatCard, stagger } from '@/components/ui';

export default function StudentDashboardPage() {
  const user = useCurrentUser()!;
  const { data, isLoading } = useStudentDashboard();
  const scroller = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const scroll = (dir: number) => scroller.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  return (
    <Page>
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-6">
          <HeroBanner
            eyebrow="Onlayn ta'lim"
            title={
              <>
                Bilimingizni yangi
                <br />
                cho'qqilarga olib chiqing
              </>
            }
            subtitle="Topshiriqlar, testlar va materiallar — barchasi bir joyda. Bugungi rejangizni ko'rib chiqing."
            actions={
              <>
                <ButtonLink to="/student/assignments" className="rounded-full bg-slate-950 px-5 text-white shadow-none hover:bg-slate-900" iconRight={<span className="grid size-6 place-items-center rounded-full bg-white text-slate-900"><ArrowRight className="size-3.5" /></span>}>
                  Topshiriqlar
                </ButtonLink>
                <ButtonLink to="/student/schedule" variant="ghost" className="rounded-full bg-white/15 px-5 text-white backdrop-blur hover:bg-white/25 hover:text-white">
                  Dars jadvali
                </ButtonLink>
              </>
            }
          />

          <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {isLoading || !data ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[84px] rounded-3xl" />)
            ) : (
              <>
                <motion.div variants={stagger.item}>
                  <StatCard icon={<BookOpen />} label="Fanlar" value={data.stats.courses} tone="violet" hint="joriy semestr" />
                </motion.div>
                <motion.div variants={stagger.item}>
                  <StatCard icon={<ClipboardList />} label="Kutilayotgan vazifa" value={data.stats.pendingAssignments} tone="pink" hint="topshirilmagan" onClick={() => navigate('/student/assignments')} />
                </motion.div>
                <motion.div variants={stagger.item}>
                  <StatCard icon={<Target />} label="O'zlashtirish" value={data.stats.average} decimals={1} suffix="%" tone="sky" hint={`GPA ${data.stats.gpa.toFixed(2)}`} />
                </motion.div>
                <motion.div variants={stagger.item}>
                  <StatCard icon={<UserCheck />} label="Davomat" value={data.stats.attendance} suffix="%" tone="emerald" hint="barcha fanlar" />
                </motion.div>
              </>
            )}
          </motion.div>

          <section>
            <SectionTitle
              action={
                <div className="flex gap-2">
                  <button onClick={() => scroll(-1)} className="grid size-9 place-items-center rounded-full border border-line bg-card text-muted transition hover:text-fg" aria-label="Oldingi">
                    <ChevronLeft className="size-4" />
                  </button>
                  <button onClick={() => scroll(1)} className="grid size-9 place-items-center rounded-full bg-brand-600 text-white shadow-brand transition hover:bg-brand-700" aria-label="Keyingi">
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              }
            >
              O'qishni davom ettiring
            </SectionTitle>
            <div ref={scroller} className="scroll-x -mx-2 flex snap-x gap-4 px-2 pb-2">
              {isLoading || !data
                ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[330px] w-[290px] shrink-0 rounded-3xl" />)
                : data.courses.map((c) => (
                    <div key={c.id} className="w-[290px] shrink-0 snap-start">
                      <CourseCard course={c} to={`/student/courses/${c.id}`} />
                    </div>
                  ))}
              {data && !data.courses.length && <EmptyState title="Fanlar yo'q" description="Siz hali guruhga biriktirilmagansiz" />}
            </div>
          </section>

          <section>
            <SectionTitle
              action={
                <Link to="/student/assignments" className="text-[13px] font-semibold text-brand-600 hover:underline">
                  Barchasi
                </Link>
              }
            >
              Yaqin muddatlar
            </SectionTitle>
            <Card className="overflow-hidden">
              <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_56px] gap-4 border-b border-line bg-panel/60 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted md:grid">
                <span>Vazifa</span>
                <span>Fan</span>
                <span>Muddat</span>
                <span className="text-right">Amal</span>
              </div>
              {isLoading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
                </div>
              ) : data?.deadlines.length ? (
                data.deadlines.map((d, i) => {
                  const c = SUBJECT_COLORS[d.color];
                  const Icon = subjectIcon(d.courseTitle);
                  const to = d.kind === 'assignment' ? `/student/assignments/${d.id}` : '/student/tests';
                  return (
                    <motion.div key={d.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                      <Link to={to} className="grid grid-cols-[minmax(0,1fr)_40px] items-center gap-4 border-b border-line px-5 py-3.5 transition last:border-0 hover:bg-panel/50 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_56px]">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={cn('grid size-10 shrink-0 place-items-center rounded-2xl', c.soft, c.text)}>
                            <Icon className="size-[18px]" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-[13.5px] font-bold text-fg">{d.title}</div>
                            <div className="mt-0.5 flex items-center gap-2 md:hidden">
                              <Deadline date={d.date} />
                            </div>
                          </div>
                        </div>
                        <div className="hidden min-w-0 md:block">
                          <div className="mb-1">{deadlineStatusBadge(d)}</div>
                          <div className="truncate text-xs text-muted">{d.courseTitle}</div>
                        </div>
                        <div className="hidden md:block">
                          <div className="text-[13px] font-semibold text-fg">{fmtDateTime(d.date)}</div>
                          <Deadline date={d.date} />
                        </div>
                        <span className="ml-auto grid size-9 place-items-center rounded-full border border-brand-200 text-brand-600 transition group-hover:bg-brand-600 dark:border-brand-500/30">
                          <ArrowRight className="size-4 -rotate-45" />
                        </span>
                      </Link>
                    </motion.div>
                  );
                })
              ) : (
                <EmptyState icon={<Flame />} title="Hammasi bajarilgan!" description="Yaqin muddatli vazifalar yo'q" />
              )}
            </Card>
          </section>
        </div>

        {/* ── Right column ── */}
        <aside className="space-y-6">
          <Card className="p-5">
            <CardHeader title="Statistika" subtitle="Joriy semestr" action={<Link to="/student/grades" className="text-xs font-semibold text-brand-600">Batafsil</Link>} className="mb-2" />
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <RingProgress value={data?.stats.average ?? 0} size={132} stroke={7} color="#6a58e6">
                  <Avatar user={user} size="2xl" className="size-[104px]" />
                </RingProgress>
                <span className="absolute right-0 top-2 rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-brand">{Math.round(data?.stats.average ?? 0)}%</span>
              </div>
              <h3 className="mt-3 text-[17px] font-extrabold text-fg">
                {greeting()}, {user.firstName} 🔥
              </h3>
              <p className="text-xs text-muted">Maqsadingizga erishish uchun o'qishda davom eting!</p>
            </div>
            <div className="panel mt-5 p-4">
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="font-bold text-fg">Haftalik faollik</span>
                <span className="text-muted">so'nggi 5 hafta</span>
              </div>
              {data ? <BarChart data={data.weeklyActivity} height={140} /> : <Skeleton className="h-[140px]" />}
            </div>
            {data && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link to="/student/rating" className="panel flex items-center gap-2.5 p-3 transition hover:ring-1 hover:ring-brand-200">
                  <Trophy className="size-5 text-amber-500" />
                  <div className="leading-tight">
                    <div className="text-sm font-extrabold text-fg">
                      {data.stats.rank || '—'}
                      <span className="text-xs font-medium text-muted">/{data.stats.rankOf}</span>
                    </div>
                    <div className="text-[10.5px] text-muted">guruhda o'rin</div>
                  </div>
                </Link>
                <Link to="/student/grades" className="panel flex items-center gap-2.5 p-3 transition hover:ring-1 hover:ring-brand-200">
                  <GraduationCap className="size-5 text-brand-600" />
                  <div className="leading-tight">
                    <div className="text-sm font-extrabold text-fg">{data.stats.gpa.toFixed(2)}</div>
                    <div className="text-[10.5px] text-muted">GPA (4.0)</div>
                  </div>
                </Link>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <CardHeader title="Bugungi darslar" icon={<CalendarDays />} action={<Link to="/student/schedule" className="text-xs font-semibold text-brand-600">Jadval</Link>} />
            {data ? <TodayTimeline items={data.today} /> : <Skeleton className="h-40" />}
          </Card>

          <Card className="p-5">
            <CardHeader title="O'qituvchilarim" />
            <div className="panel space-y-1 p-2">
              {data?.teachers.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-card">
                  <Avatar user={t} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-fg">
                      {t.firstName} {t.lastName}
                    </div>
                    <div className="truncate text-[11px] text-muted">{t.subject}</div>
                  </div>
                  <a href={`mailto:${t.email}`} className="flex items-center gap-1 rounded-full border border-brand-200 px-2.5 py-1 text-[11px] font-semibold text-brand-600 transition hover:bg-brand-600 hover:text-white dark:border-brand-500/30">
                    <Mail className="size-3" /> Yozish
                  </a>
                </div>
              )) ?? <Skeleton className="h-40" />}
            </div>
          </Card>

          {!!data?.recentGrades.length && (
            <Card className="p-5">
              <CardHeader title="So'nggi baholar" />
              <ul className="space-y-3">
                {data.recentGrades.map((g, i) => {
                  const pct = (g.score / g.maxScore) * 100;
                  return (
                    <li key={i} className="flex items-center gap-3">
                      <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl text-[13px] font-extrabold tabular-nums', pct >= 86 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : pct >= 71 ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' : pct >= 55 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300')}>
                        {g.score}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-fg">{g.title}</div>
                        <div className="truncate text-[11px] text-muted">
                          {g.courseTitle} · {fmtRelative(g.date)}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-muted tabular-nums">/{g.maxScore}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </Page>
  );
}
