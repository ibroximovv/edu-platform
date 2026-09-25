import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Activity, BookOpen, Building2, CalendarDays, Check, GraduationCap, Layers, Library, Presentation, ShieldCheck, UserPlus, Users, UsersRound, X } from 'lucide-react';
import { fmtRelative, greeting } from '@/lib/format';
import { useCurrentUser } from '@/stores/auth.store';
import { useAdminDashboard } from '@/api/queries/misc';
import { useBulkUsers } from '@/api/queries/admin';
import { BarChart, DonutChart } from '@/components/charts';
import { HeroBanner } from '@/components/domain/Bits';
import { Avatar, Badge, Button, ButtonLink, Card, CardHeader, EmptyState, Page, Skeleton, StatCard, stagger } from '@/components/ui';

const ACTIVITY_ICON: Record<string, typeof Activity> = { schedule: CalendarDays, subject: Library, year: Layers, user: Users, grade: GraduationCap, system: ShieldCheck, group: UsersRound, course: BookOpen };

export default function AdminDashboardPage() {
  const user = useCurrentUser()!;
  const { data, isLoading } = useAdminDashboard();
  const bulk = useBulkUsers();
  const navigate = useNavigate();
  const maxFaculty = Math.max(1, ...(data?.byFaculty.map((f) => f.students) ?? [1]));

  return (
    <Page>
      <HeroBanner
        eyebrow="Boshqaruv paneli"
        title={
          <>
            {greeting()}, {user.firstName}!
            <br />
            Universitet nazoratingizda
          </>
        }
        subtitle={data ? `${data.stats.students} talaba, ${data.stats.teachers} o'qituvchi va ${data.stats.courses} ta faol kurs. ${data.stats.pendingUsers ? `${data.stats.pendingUsers} ta foydalanuvchi tasdiqni kutmoqda.` : ''}` : ''}
        actions={
          <>
            <ButtonLink to="/admin/users" className="rounded-full bg-slate-950 px-5 text-white shadow-none hover:bg-slate-900" icon={<UserPlus className="size-4" />}>
              Foydalanuvchilar
            </ButtonLink>
            <ButtonLink to="/admin/schedule" variant="ghost" className="rounded-full bg-white/15 px-5 text-white backdrop-blur hover:bg-white/25 hover:text-white">
              Dars jadvali
            </ButtonLink>
          </>
        }
      />

      <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {data
          ? [
              { icon: <GraduationCap />, label: 'Talabalar', value: data.stats.students, tone: 'violet' as const, to: '/admin/users?role=student' },
              { icon: <Presentation />, label: "O'qituvchilar", value: data.stats.teachers, tone: 'sky' as const, to: '/admin/teachers' },
              { icon: <UsersRound />, label: 'Guruhlar', value: data.stats.groups, tone: 'pink' as const, to: '/admin/groups' },
              { icon: <Library />, label: 'Fanlar', value: data.stats.subjects, tone: 'emerald' as const, to: '/admin/subjects' },
              { icon: <Layers />, label: 'Faol kurslar', value: data.stats.courses, tone: 'amber' as const, to: '/admin/courses' },
              { icon: <Building2 />, label: 'Fakultetlar', value: data.stats.faculties, tone: 'rose' as const, to: '/admin/structure' },
            ].map((s) => (
              <motion.div key={s.label} variants={stagger.item}>
                <StatCard icon={s.icon} label={s.label} value={s.value} tone={s.tone} onClick={() => navigate(s.to)} />
              </motion.div>
            ))
          : Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[84px] rounded-3xl" />)}
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <CardHeader title="Fakultetlar kesimida" subtitle="Talabalar va o'qituvchilar soni" icon={<Building2 />} />
          {data ? (
            <div className="space-y-4">
              {data.byFaculty.map((f, i) => (
                <div key={f.label} className="grid grid-cols-[60px_minmax(0,1fr)] items-center gap-4">
                  <span className="text-sm font-extrabold text-fg">{f.label}</span>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <motion.div className="h-3.5 rounded-full bg-gradient-to-r from-brand-400 to-brand-600" initial={{ width: 0 }} animate={{ width: `${(f.students / maxFaculty) * 100}%` }} transition={{ duration: 0.9, delay: i * 0.1 }} />
                      <span className="text-xs font-bold tabular-nums text-fg">{f.students}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.div className="h-2 rounded-full bg-gradient-to-r from-sky-300 to-sky-500" initial={{ width: 0 }} animate={{ width: `${Math.max(3, (f.teachers / maxFaculty) * 100)}%` }} transition={{ duration: 0.9, delay: i * 0.1 + 0.1 }} />
                      <span className="text-[11px] font-semibold tabular-nums text-muted">{f.teachers}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-4 pt-1 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-brand-500" /> Talabalar
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-sky-400" /> O'qituvchilar
                </span>
              </div>
            </div>
          ) : (
            <Skeleton className="h-40" />
          )}
        </Card>
        <Card className="p-5">
          <CardHeader title="Baholar taqsimoti" subtitle="Joriy semestr (prognoz)" />
          {data ? (
            <DonutChart
              size={130}
              thickness={16}
              data={[
                { label: "A'lo", value: data.gradeDistribution[0].value, color: '#10b981' },
                { label: 'Yaxshi', value: data.gradeDistribution[1].value, color: '#0ea5e9' },
                { label: 'Qoniqarli', value: data.gradeDistribution[2].value, color: '#f59e0b' },
                { label: 'Qoniqarsiz', value: data.gradeDistribution[3].value, color: '#f43f5e' },
              ]}
              center={<span className="text-xs font-bold text-muted">baholar</span>}
            />
          ) : (
            <Skeleton className="h-40" />
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <CardHeader
            title="Tasdiqlash kutilmoqda"
            subtitle="Yangi ro'yxatdan o'tganlar"
            action={data?.pendingUsers.length ? <Badge tone="amber">{data.pendingUsers.length}</Badge> : undefined}
          />
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : data?.pendingUsers.length ? (
            <ul className="space-y-2">
              {data.pendingUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3 rounded-2xl bg-panel p-2.5">
                  <Avatar user={u} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-fg">
                      {u.lastName} {u.firstName}
                    </div>
                    <div className="truncate text-[11px] text-muted">
                      {u.email} · {fmtRelative(u.createdAt)}
                    </div>
                  </div>
                  <Button size="icon-sm" variant="success" onClick={() => bulk.mutate({ ids: [u.id], action: 'approve' })} aria-label="Tasdiqlash">
                    <Check />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => bulk.mutate({ ids: [u.id], action: 'block' })} aria-label="Rad etish">
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<Check />} title="Kutilayotganlar yo'q" className="py-8" />
          )}
        </Card>

        <Card className="p-5">
          <CardHeader title="Ro'yxatdan o'tishlar" subtitle="So'nggi 6 oy" />
          {data ? <BarChart data={data.registrations} height={180} /> : <Skeleton className="h-44" />}
        </Card>

        <Card className="p-5">
          <CardHeader title="Top talabalar" action={<Link to="/admin/rating" className="text-xs font-semibold text-brand-600">Reyting</Link>} />
          <ul className="space-y-2.5">
            {data?.topStudents.map((e) => (
              <li key={e.student.id} className="flex items-center gap-3">
                <span className="w-5 text-center text-sm font-extrabold text-muted">{e.rank}</span>
                <Avatar user={e.student} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-fg">
                    {e.student.lastName} {e.student.firstName}
                  </div>
                  <div className="text-[11px] text-muted">{e.student.groupName}</div>
                </div>
                <span className="text-sm font-extrabold text-emerald-600 tabular-nums">{e.average}%</span>
              </li>
            )) ?? <Skeleton className="h-40" />}
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <CardHeader title="So'nggi faoliyat" icon={<Activity />} />
        <ol className="grid gap-3 md:grid-cols-2">
          {data?.activity.map((a) => {
            const Icon = ACTIVITY_ICON[a.kind] ?? Activity;
            return (
              <li key={a.id} className="flex items-center gap-3 rounded-2xl bg-panel/60 p-3">
                <span className="grid size-9 place-items-center rounded-xl bg-card text-brand-600 ring-1 ring-line">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-fg-soft">{a.text}</span>
                <span className="shrink-0 text-[11px] text-muted">{fmtRelative(a.at)}</span>
              </li>
            );
          })}
        </ol>
      </Card>
    </Page>
  );
}
