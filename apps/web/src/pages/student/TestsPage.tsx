import { useMemo, useState } from 'react';
import { CheckCircle2, ListChecks, PlayCircle, Target } from 'lucide-react';
import { useAssessments } from '@/api/queries/assessments';
import { assessmentState } from '@/components/domain/Bits';
import { AssessmentItem } from '@/components/domain/StudentLists';
import { EmptyState, Page, PageHeader, Segmented, Skeleton, StatCard } from '@/components/ui';

type Tab = 'active' | 'upcoming' | 'past';

export default function StudentTestsPage() {
  const { data, isLoading } = useAssessments({ as: 'student' });
  const [tab, setTab] = useState<Tab>('active');
  const groups = useMemo(() => {
    const g: Record<Tab, NonNullable<typeof data>> = { active: [], upcoming: [], past: [] };
    for (const a of data ?? []) {
      const s = assessmentState(a);
      if (s === 'open' || s === 'in_progress') g.active.push(a);
      else if (s === 'upcoming') g.upcoming.push(a);
      else if (s === 'closed' && new Date(a.endsAt).getTime() > Date.now()) g.upcoming.push(a);
      else g.past.push(a);
    }
    g.past.reverse();
    return g;
  }, [data]);
  const done = (data ?? []).filter((a) => a.myResult?.score != null && a.myResult.status !== 'in_progress');
  const avg = done.length ? done.reduce((s, a) => s + (a.myResult!.score! / a.maxScore) * 100, 0) / done.length : 0;

  return (
    <Page>
      <PageHeader title="Test va nazoratlar" description="Joriy testlar, oraliq va yakuniy nazorat ishlari" />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<PlayCircle />} label="Hozir ochiq" value={groups.active.length} tone="violet" />
        <StatCard icon={<CheckCircle2 />} label="Topshirilgan" value={done.length} tone="emerald" />
        <StatCard icon={<Target />} label="O'rtacha natija" value={avg} decimals={1} suffix="%" tone="sky" />
      </div>
      <Segmented
        value={tab}
        onChange={setTab}
        items={[
          { value: 'active', label: 'Faol', count: groups.active.length },
          { value: 'upcoming', label: 'Rejalashtirilgan', count: groups.upcoming.length },
          { value: 'past', label: 'Yakunlangan', count: groups.past.length },
        ]}
      />
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-3xl" />)
        ) : groups[tab].length ? (
          groups[tab].map((a, i) => <AssessmentItem key={a.id} a={a} index={i} />)
        ) : (
          <EmptyState icon={<ListChecks />} title={tab === 'active' ? "Hozircha ochiq test yo'q" : "Bu bo'lim bo'sh"} description="Yangi test e'lon qilinganda bildirishnoma olasiz" />
        )}
      </div>
    </Page>
  );
}
