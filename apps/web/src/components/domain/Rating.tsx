import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Crown, Medal, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import type { RatingScope } from '@edu/shared';
import { cn } from '@/lib/cn';
import { useRating } from '@/api/queries/journal';
import { useFaculties, useGroups, useSemesters } from '@/api/queries/admin';
import { useCurrentUser } from '@/stores/auth.store';
import { Podium3D } from '@/components/three';
import { Avatar, Card, DataTable, Page, PageHeader, Segmented, Select, Skeleton, type Column } from '@/components/ui';
import type { RatingEntry } from '@edu/shared';

function PodiumFallback({ top }: { top: RatingEntry[] }) {
  const order = [top[1], top[0], top[2]];
  const heights = ['h-28', 'h-40', 'h-20'];
  return (
    <div className="flex h-full items-end justify-center gap-4 px-6 pb-6">
      {order.map((e, i) =>
        e ? (
          <div key={e.student.id} className="flex w-32 flex-col items-center">
            <Avatar user={e.student} size="lg" className="mb-2" />
            <div className="mb-2 max-w-full truncate text-xs font-bold text-fg">{e.student.firstName}</div>
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className={cn('grid w-full place-items-center rounded-t-2xl text-3xl font-black text-white', heights[i], i === 1 ? 'bg-brand-600' : i === 0 ? 'bg-slate-400' : 'bg-amber-500')}>
              {i === 1 ? 1 : i === 0 ? 2 : 3}
            </motion.div>
          </div>
        ) : null,
      )}
    </div>
  );
}

export function RatingView({ admin }: { admin?: boolean }) {
  const me = useCurrentUser();
  const [scope, setScope] = useState<RatingScope>(admin ? 'university' : 'group');
  const [semesterId, setSemesterId] = useState<string>('');
  const [groupId, setGroupId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const { data: semesters } = useSemesters();
  const { data: groups } = useGroups(undefined);
  const { data: faculties } = useFaculties();
  const { data, isLoading, isFetching } = useRating({ scope, semesterId: semesterId || undefined, groupId: groupId || undefined, facultyId: facultyId || undefined });

  const top = data?.entries.slice(0, 3) ?? [];
  const people = useMemo(() => top.map((e) => ({ id: e.student.id, name: `${e.student.firstName} ${e.student.lastName}`, score: `${e.average}%`, avatarUrl: e.student.avatarUrl })), [top]);

  const columns: Column<RatingEntry>[] = [
    {
      key: 'rank',
      header: "O'rin",
      width: '80px',
      sortValue: (r) => r.rank,
      cell: (r) => (
        <span className={cn('grid size-9 place-items-center rounded-xl text-[13px] font-extrabold', r.rank === 1 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15' : r.rank === 2 ? 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300' : r.rank === 3 ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/15' : 'bg-panel text-muted')}>
          {r.rank <= 3 ? <Medal className="size-4" /> : r.rank}
        </span>
      ),
    },
    {
      key: 'student',
      header: 'Talaba',
      sortValue: (r) => r.student.lastName,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar user={r.student} size="md" />
          <div>
            <div className="font-bold text-fg">
              {r.student.lastName} {r.student.firstName} {r.student.id === me?.id && <span className="ml-1 rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] text-white">Siz</span>}
            </div>
            <div className="text-[11px] text-muted">
              {r.student.groupName} · {r.student.facultyShortName}
            </div>
          </div>
        </div>
      ),
    },
    { key: 'avg', header: "O'zlashtirish", align: 'right', sortValue: (r) => r.average, cell: (r) => <span className="text-[15px] font-extrabold text-fg tabular-nums">{r.average}%</span> },
    { key: 'gpa', header: 'GPA', align: 'right', sortValue: (r) => r.gpa, cell: (r) => <span className="font-bold tabular-nums">{r.gpa.toFixed(2)}</span> },
    { key: 'credits', header: 'Kredit', align: 'right', sortValue: (r) => r.credits, cell: (r) => <span className="tabular-nums">{r.credits}</span> },
    {
      key: 'trend',
      header: 'Dinamika',
      align: 'right',
      sortValue: (r) => r.trend,
      cell: (r) => (
        <span className={cn('inline-flex items-center gap-1 text-xs font-bold tabular-nums', r.trend >= 0 ? 'text-emerald-600' : 'text-rose-500')}>
          {r.trend >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
          {r.trend > 0 ? '+' : ''}
          {r.trend}
        </span>
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title="Reyting"
        description={data ? `${data.label} · ${data.semester.name}` : "Talabalar o'zlashtirish reytingi"}
        actions={<Select value={semesterId || data?.semester.id || ''} onChange={(e) => setSemesterId(e.target.value)} options={(semesters ?? []).map((s) => ({ value: s.id, label: s.name }))} className="w-60" />}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={scope}
          onChange={setScope}
          items={[
            { value: 'group', label: 'Guruh' },
            { value: 'course', label: 'Kurs' },
            { value: 'faculty', label: 'Fakultet' },
            { value: 'university', label: 'Universitet' },
          ]}
        />
        {admin && scope === 'group' && <Select value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="Guruhni tanlang" options={(groups ?? []).map((g) => ({ value: g.id, label: g.name }))} className="w-48" />}
        {admin && scope === 'faculty' && <Select value={facultyId} onChange={(e) => setFacultyId(e.target.value)} placeholder="Barcha fakultetlar" options={(faculties ?? []).map((f) => ({ value: f.id, label: f.name }))} className="w-64" />}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="relative h-[380px] overflow-hidden bg-gradient-to-b from-brand-50 to-card dark:from-brand-500/10">
          <div className="absolute left-5 top-5 z-10 flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/15">
              <Trophy className="size-5" />
            </span>
            <div>
              <div className="text-[15px] font-extrabold text-fg">Eng yaxshi uchlik</div>
              <div className="text-xs text-muted">{data?.label}</div>
            </div>
          </div>
          {isLoading ? <Skeleton className="m-6 h-[320px]" /> : top.length ? <Podium3D people={people} fallback={<PodiumFallback top={top} />} /> : <div className="grid h-full place-items-center text-sm text-muted">Ma'lumot yo'q</div>}
        </Card>

        {data?.me ? (
          <Card className="relative overflow-hidden p-6">
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-brand-500/15 blur-2xl" />
            <div className="label-caps">Mening o'rnim</div>
            <div className="mt-4 flex items-center gap-4">
              <div className="relative">
                <Avatar user={data.me.student} size="xl" />
                {data.me.rank <= 3 && <Crown className="absolute -top-3 left-1/2 size-6 -translate-x-1/2 text-amber-400" />}
              </div>
              <div>
                <div className="text-5xl font-black tracking-tight text-fg">
                  #{data.me.rank}
                  <span className="text-lg font-bold text-muted"> / {data.entries.length}</span>
                </div>
                <div className="text-sm text-muted">{data.label}</div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <MeStat label="O'zlashtirish" value={`${data.me.average}%`} />
              <MeStat label="GPA" value={data.me.gpa.toFixed(2)} />
              <MeStat label="Dinamika" value={`${data.me.trend > 0 ? '+' : ''}${data.me.trend}`} tone={data.me.trend >= 0 ? 'text-emerald-600' : 'text-rose-500'} />
            </div>
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-xs text-muted">
                <span>Top {Math.max(1, Math.round((data.me.rank / data.entries.length) * 100))}%</span>
                <span>{data.entries.length - data.me.rank} talabadan yuqori</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-panel">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" initial={{ width: 0 }} animate={{ width: `${100 - (data.me.rank / data.entries.length) * 100 + 100 / data.entries.length}%` }} transition={{ duration: 1 }} />
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="label-caps">Statistika</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MeStat label="Talabalar" value={String(data?.entries.length ?? 0)} />
              <MeStat label="O'rtacha" value={`${data?.entries.length ? (data.entries.reduce((s, e) => s + e.average, 0) / data.entries.length).toFixed(1) : 0}%`} />
              <MeStat label="Eng yuqori" value={`${data?.entries[0]?.average ?? 0}%`} />
              <MeStat label="A'lochilar (86+)" value={String(data?.entries.filter((e) => e.average >= 86).length ?? 0)} />
            </div>
          </Card>
        )}
      </div>

      <Card className={cn('overflow-hidden transition-opacity', isFetching && 'opacity-70')}>
        <DataTable columns={columns} rows={data?.entries} rowKey={(r) => r.student.id} loading={isLoading} pageSize={15} rowClassName={(r) => (r.student.id === me?.id ? 'bg-brand-50/70 dark:bg-brand-500/10' : undefined)} />
      </Card>
    </Page>
  );
}

function MeStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="panel p-3 text-center">
      <div className={cn('text-lg font-extrabold text-fg tabular-nums', tone)}>{value}</div>
      <div className="text-[10.5px] font-semibold text-muted">{label}</div>
    </div>
  );
}
