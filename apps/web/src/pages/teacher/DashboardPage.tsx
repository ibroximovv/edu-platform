import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, CalendarDays, ClipboardCheck, Layers, Plus, Users } from 'lucide-react';
import type { SubmissionView } from '@edu/shared';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS } from '@/lib/colors';
import { fmtDateTime, fmtRelative, greeting } from '@/lib/format';
import { useCurrentUser } from '@/stores/auth.store';
import { useTeacherDashboard } from '@/api/queries/misc';
import { BarChart, DonutChart } from '@/components/charts';
import { CourseCard } from '@/components/domain/CourseCard';
import { Deadline, HeroBanner, SectionTitle } from '@/components/domain/Bits';
import { ReviewDrawer } from '@/components/domain/Review';
import { TodayTimeline } from '@/components/domain/Schedule';
import { Avatar, Badge, ButtonLink, Card, CardHeader, EmptyState, Page, Skeleton, StatCard, stagger } from '@/components/ui';

export default function TeacherDashboardPage() {
  const user = useCurrentUser()!;
  const { data, isLoading } = useTeacherDashboard();
  const [review, setReview] = useState<SubmissionView | null>(null);
  const total = data?.scoreDistribution.reduce((s, d) => s + d.value, 0) ?? 0;

  return (
    <Page>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <HeroBanner
            eyebrow="O'qituvchi paneli"
            title={
              <>
                {greeting()}, {user.firstName}!
              </>
            }
            subtitle={data ? `Bugun ${data.today.length} ta darsingiz bor. ${data.stats.pendingReviews} ta ish tekshiruvni kutmoqda.` : 'Kunlik rejangiz tayyorlanmoqda...'}
            actions={
              <>
                <ButtonLink to="/teacher/reviews" className="rounded-full bg-slate-950 px-5 text-white shadow-none hover:bg-slate-900" iconRight={<span className="grid size-6 place-items-center rounded-full bg-white text-slate-900"><ArrowRight className="size-3.5" /></span>}>
                  Tekshirish
                </ButtonLink>
                <ButtonLink to="/teacher/tests/new" variant="ghost" className="rounded-full bg-white/15 px-5 text-white backdrop-blur hover:bg-white/25 hover:text-white" icon={<Plus className="size-4" />}>
                  Yangi test
                </ButtonLink>
              </>
            }
          />

          <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {data ? (
              <>
                <motion.div variants={stagger.item}>
                  <StatCard icon={<BookOpen />} label="Kurslar" value={data.stats.courses} tone="violet" />
                </motion.div>
                <motion.div variants={stagger.item}>
                  <StatCard icon={<Users />} label="Talabalar" value={data.stats.students} tone="sky" />
                </motion.div>
                <motion.div variants={stagger.item}>
                  <StatCard icon={<ClipboardCheck />} label="Tekshirish kutmoqda" value={data.stats.pendingReviews} tone="amber" />
                </motion.div>
                <motion.div variants={stagger.item}>
                  <StatCard icon={<Layers />} label="Haftalik juftlik" value={data.stats.weeklyPairs} tone="pink" />
                </motion.div>
              </>
            ) : (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[84px] rounded-3xl" />)
            )}
          </motion.div>

          <section>
            <SectionTitle action={<Link to="/teacher/courses" className="text-[13px] font-semibold text-brand-600 hover:underline">Barchasi</Link>}>Kurslarim</SectionTitle>
            <div className="scroll-x -mx-2 flex snap-x gap-4 px-2 pb-2">
              {data
                ? data.courses.map((c) => (
                    <div key={c.id} className="w-[290px] shrink-0 snap-start">
                      <CourseCard course={c} to={`/teacher/courses/${c.id}`} variant="teacher" />
                    </div>
                  ))
                : Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[330px] w-[290px] shrink-0 rounded-3xl" />)}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <CardHeader title="Tekshirish navbati" subtitle="Eng eski javoblar birinchi" action={<Link to="/teacher/reviews" className="text-xs font-semibold text-brand-600">Barchasi</Link>} />
              {isLoading ? (
                <Skeleton className="h-60" />
              ) : data?.reviewQueue.length ? (
                <ul className="space-y-1.5">
                  {data.reviewQueue.map((s) => (
                    <li key={s.id}>
                      <button onClick={() => setReview(s)} className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-panel">
                        <Avatar user={s.student} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-bold text-fg">
                            {s.student.lastName} {s.student.firstName}
                          </div>
                          <div className="truncate text-[11px] text-muted">{s.assignment.title}</div>
                        </div>
                        <div className="text-right">
                          {s.late && <Badge tone="red">kech</Badge>}
                          <div className="text-[10.5px] text-muted">{fmtRelative(s.submittedAt)}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={<ClipboardCheck />} title="Hammasi tekshirilgan 🎉" className="py-8" />
              )}
            </Card>

            <Card className="p-5">
              <CardHeader title="Baholar taqsimoti" subtitle="Barcha kurslar bo'yicha (prognoz)" />
              {data ? (
                <DonutChart
                  size={140}
                  data={[
                    { label: "A'lo (5)", value: data.scoreDistribution[0].value, color: '#10b981' },
                    { label: 'Yaxshi (4)', value: data.scoreDistribution[1].value, color: '#0ea5e9' },
                    { label: 'Qoniqarli (3)', value: data.scoreDistribution[2].value, color: '#f59e0b' },
                    { label: 'Qoniqarsiz (2)', value: data.scoreDistribution[3].value, color: '#f43f5e' },
                  ]}
                  center={
                    <div>
                      <div className="text-xl font-extrabold text-fg">{data.stats.avgScore}%</div>
                      <div className="text-[10px] text-muted">{total} talaba</div>
                    </div>
                  }
                />
              ) : (
                <Skeleton className="h-40" />
              )}
            </Card>
          </div>
        </div>

        <aside className="space-y-6">
          <Card className="p-5">
            <CardHeader title="Bugungi darslar" icon={<CalendarDays />} action={<Link to="/teacher/schedule" className="text-xs font-semibold text-brand-600">Jadval</Link>} />
            {data ? <TodayTimeline items={data.today} showGroups /> : <Skeleton className="h-40" />}
          </Card>
          <Card className="p-5">
            <CardHeader title="Javoblar oqimi" subtitle="So'nggi 7 kun" />
            {data ? <BarChart data={data.submissionsByDay} height={150} /> : <Skeleton className="h-36" />}
          </Card>
          <Card className="p-5">
            <CardHeader title="Yaqin muddatlar" />
            <ul className="space-y-2.5">
              {data?.upcoming.map((d) => {
                const c = SUBJECT_COLORS[d.color];
                return (
                  <li key={d.id} className="flex items-center gap-3">
                    <span className={cn('h-10 w-1.5 shrink-0 rounded-full', c.solid)} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-fg">{d.title}</div>
                      <div className="truncate text-[11px] text-muted">
                        {d.courseTitle} · {fmtDateTime(d.date)}
                      </div>
                    </div>
                    <Deadline date={d.date} />
                  </li>
                );
              }) ?? <Skeleton className="h-32" />}
              {data && !data.upcoming.length && <li className="py-4 text-center text-xs text-muted">Yaqin muddatlar yo'q</li>}
            </ul>
          </Card>
        </aside>
      </div>
      <ReviewDrawer submission={review} onClose={() => setReview(null)} />
    </Page>
  );
}
