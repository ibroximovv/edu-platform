import { useParams, useSearchParams } from 'react-router';
import { BookMarked, CalendarCheck, ClipboardList, GraduationCap, ListChecks } from 'lucide-react';
import { cn } from '@/lib/cn';
import { fmtDate } from '@/lib/format';
import { ATTENDANCE, CATEGORY } from '@/lib/labels';
import { useCurrentUser } from '@/stores/auth.store';
import { useAssignments, useAttendance, useCourse, useMaterials, useTopics } from '@/api/queries/learning';
import { useAssessments } from '@/api/queries/assessments';
import { useMyGrades } from '@/api/queries/journal';
import { CourseHero, ScoreBreakdown } from '@/components/domain/CourseHero';
import { TopicsList } from '@/components/domain/Topics';
import { useMaterialViewer } from '@/components/domain/Materials';
import { AssessmentItem, AssignmentItem } from '@/components/domain/StudentLists';
import { Badge, Card, CardHeader, EmptyState, Page, PageHeader, RingProgress, Skeleton, Tabs } from '@/components/ui';

type Tab = 'topics' | 'assignments' | 'tests' | 'grades' | 'attendance';

export default function StudentCourseDetailPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) ?? 'topics';
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true });
  const { data: course } = useCourse(id);
  const { data: topics } = useTopics(id);
  const { data: materials } = useMaterials({ courseId: id }, !!id);
  const { data: assignments } = useAssignments({ courseId: id }, tab === 'assignments');
  const { data: tests } = useAssessments({ courseId: id }, tab === 'tests');
  const { data: grades } = useMyGrades();
  const { data: attendance } = useAttendance(tab === 'attendance' ? id : undefined);
  const me = useCurrentUser();
  const { open, viewer } = useMaterialViewer();
  const myGrade = grades?.courses.find((c) => c.courseId === id);

  return (
    <Page>
      <PageHeader title="" breadcrumbs={[{ label: 'Fanlarim', to: '/student/courses' }, { label: course?.subject.name ?? '...' }]} className="-mb-2" />
      <CourseHero course={course} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'topics', label: 'Mavzular', icon: <BookMarked />, count: topics?.length },
              { value: 'assignments', label: 'Topshiriqlar', icon: <ClipboardList />, count: course?.stats.assignments },
              { value: 'tests', label: 'Test va nazorat', icon: <ListChecks /> },
              { value: 'grades', label: 'Baholar', icon: <GraduationCap /> },
              { value: 'attendance', label: 'Davomat', icon: <CalendarCheck /> },
            ]}
          />

          {tab === 'topics' && (topics && materials ? <TopicsList topics={topics} materials={materials} onOpenMaterial={open} /> : <Skeleton className="h-64" />)}

          {tab === 'assignments' && (
            <div className="space-y-3">
              {assignments ? assignments.length ? assignments.map((a, i) => <AssignmentItem key={a.id} a={a} index={i} />) : <EmptyState title="Topshiriqlar yo'q" /> : <Skeleton className="h-40" />}
            </div>
          )}

          {tab === 'tests' && (
            <div className="space-y-3">
              {tests ? tests.length ? tests.map((a, i) => <AssessmentItem key={a.id} a={a} index={i} />) : <EmptyState title="Testlar yo'q" /> : <Skeleton className="h-40" />}
            </div>
          )}

          {tab === 'grades' && (
            <Card className="overflow-hidden">
              {myGrade ? (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-line bg-panel/60 text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                      <th className="px-5 py-3">Nazorat turi</th>
                      <th className="px-5 py-3">Turkum</th>
                      <th className="px-5 py-3">Sana</th>
                      <th className="px-5 py-3 text-right">Ball</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myGrade.items.map((it, i) => (
                      <tr key={i} className="border-b border-line last:border-0">
                        <td className="px-5 py-3 font-semibold text-fg">{it.title}</td>
                        <td className="px-5 py-3">
                          <Badge tone={it.category === 'final' ? 'red' : it.category === 'midterm' ? 'amber' : 'violet'}>{CATEGORY[it.category]}</Badge>
                        </td>
                        <td className="px-5 py-3 text-muted">{fmtDate(it.date, false)}</td>
                        <td className="px-5 py-3 text-right font-bold tabular-nums">
                          {it.score == null ? <span className="text-muted">—</span> : <span className={cn(it.score / it.maxScore >= 0.55 ? 'text-fg' : 'text-rose-500')}>{it.score}</span>}
                          <span className="text-muted"> / {it.maxScore}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Skeleton className="h-40" />
              )}
            </Card>
          )}

          {tab === 'attendance' && (
            <Card className="p-5">
              {attendance ? (
                attendance.sessions.length ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                    {attendance.sessions.map((s) => {
                      const st = me ? s.records[me.id] : undefined;
                      const meta = st ? ATTENDANCE[st] : null;
                      return (
                        <div key={s.id} className={cn('rounded-2xl p-3 text-center', meta?.tone ?? 'bg-panel text-muted')}>
                          <div className="text-[11px] font-semibold opacity-80">{fmtDate(s.date, false)}</div>
                          <div className="mt-1 text-sm font-extrabold">{meta?.label ?? '—'}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState title="Davomat qayd etilmagan" />
                )
              ) : (
                <Skeleton className="h-32" />
              )}
            </Card>
          )}
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <CardHeader title="Mening natijam" subtitle="JN + ON + YN = 100" />
            {myGrade && course ? <ScoreBreakdown score={myGrade.score} grading={course.grading} /> : <Skeleton className="h-40" />}
          </Card>
          <Card className="flex items-center gap-4 p-5">
            <RingProgress value={course?.myProgress ?? 0} size={72} stroke={7}>
              <span className="text-sm font-extrabold text-fg">{course?.myProgress ?? 0}%</span>
            </RingProgress>
            <div>
              <div className="text-[14px] font-bold text-fg">Kurs progressi</div>
              <div className="text-xs text-muted">Bajarilgan topshiriq va testlar ulushi</div>
              {myGrade && <div className="mt-1 text-xs font-semibold text-fg-soft">Davomat: {myGrade.attendance}%</div>}
            </div>
          </Card>
        </aside>
      </div>
      {viewer}
    </Page>
  );
}
