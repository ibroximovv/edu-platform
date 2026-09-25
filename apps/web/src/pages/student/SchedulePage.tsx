import { CalendarDays, Clock, Layers } from 'lucide-react';
import { fmtDate, isoWeekday, WEEKDAYS, weekNumberSince } from '@/lib/format';
import { useSchedule } from '@/api/queries/misc';
import { useSemesters } from '@/api/queries/admin';
import { ScheduleGrid, TodayTimeline } from '@/components/domain/Schedule';
import { Card, CardHeader, Page, PageHeader, Skeleton, StatCard } from '@/components/ui';

export function ScheduleView({ as }: { as: 'student' | 'teacher' }) {
  const { data, isLoading } = useSchedule({ as });
  const { data: semesters } = useSemesters();
  const sem = semesters?.find((s) => s.isCurrent);
  const week = sem ? Math.max(1, weekNumberSince(sem.startDate)) : 1;
  const today = (data ?? []).filter((s) => s.day === isoWeekday());
  const subjects = new Set((data ?? []).map((s) => s.subject.id)).size;

  return (
    <Page>
      <PageHeader title="Dars jadvali" description={`${WEEKDAYS[isoWeekday()]}, ${fmtDate(new Date())} · ${week}-hafta (${week % 2 ? 'toq' : 'juft'})`} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Layers />} label="Haftalik juftliklar" value={data?.length ?? 0} tone="violet" />
        <StatCard icon={<CalendarDays />} label="Bugungi darslar" value={today.length} tone="pink" />
        <StatCard icon={<Clock />} label="Fanlar soni" value={subjects} tone="sky" />
      </div>
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 p-5">{isLoading ? <Skeleton className="h-[520px]" /> : <ScheduleGrid items={data ?? []} showTeacher={as === 'student'} showGroups={as === 'teacher'} />}</Card>
        <Card className="h-fit p-5">
          <CardHeader title="Bugun" subtitle={WEEKDAYS[isoWeekday()]} icon={<CalendarDays />} />
          {data ? <TodayTimeline items={today} showGroups={as === 'teacher'} /> : <Skeleton className="h-40" />}
        </Card>
      </div>
    </Page>
  );
}

export default function StudentSchedulePage() {
  return <ScheduleView as="student" />;
}
