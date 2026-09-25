import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Clock, Database, GraduationCap, RotateCcw, Save, School, UserPlus, X } from 'lucide-react';
import type { SystemSettings } from '@edu/shared';
import { API_MODE, IS_MOCK } from '@/config/app';
import { useResetDemo, useSaveSettings, useSettings } from '@/api/queries/admin';
import { useUIStore } from '@/stores/ui.store';
import { useConfirm } from '@/contexts/ConfirmProvider';
import { Badge, Button, Card, CardHeader, Field, Input, Page, PageHeader, Skeleton, Switch } from '@/components/ui';

export default function SettingsPage() {
  const { data } = useSettings();
  const save = useSaveSettings();
  const reset = useResetDemo();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const enable3d = useUIStore((s) => s.enable3d);
  const setEnable3d = useUIStore((s) => s.setEnable3d);
  const [s, setS] = useState<SystemSettings | null>(null);
  const [domain, setDomain] = useState('');

  useEffect(() => {
    if (data && !s) setS(structuredClone(data));
  }, [data, s]);

  if (!s) return <Skeleton className="h-96 rounded-3xl" />;
  const sum = s.grading.current + s.grading.midterm + s.grading.final;
  const dirty = JSON.stringify(s) !== JSON.stringify(data);

  return (
    <Page>
      <PageHeader
        title="Tizim sozlamalari"
        description="Universitet, ro'yxatdan o'tish, baholash va jadval parametrlari"
        actions={
          <Button icon={<Save />} disabled={!dirty || sum !== 100} loading={save.isPending} onClick={() => save.mutate(s)}>
            Saqlash
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <CardHeader title="Universitet" icon={<School />} />
          <Field label="To'liq nomi">
            <Input value={s.universityName} onChange={(e) => setS({ ...s, universityName: e.target.value })} />
          </Field>
        </Card>

        <Card className="p-6">
          <CardHeader title="Ro'yxatdan o'tish" icon={<UserPlus />} />
          <div className="space-y-4">
            <Switch checked={s.registration.enabled} onChange={(v) => setS({ ...s, registration: { ...s.registration, enabled: v } })} label="Email orqali ro'yxatdan o'tish" description="O'chirilsa, faqat administrator hisob yaratadi" />
            <Switch checked={s.registration.requireApproval} onChange={(v) => setS({ ...s, registration: { ...s.registration, requireApproval: v } })} label="Administrator tasdig'i talab qilinsin" description="Yangi foydalanuvchilar tasdiqlangunga qadar kira olmaydi" />
            <Field label="Ruxsat etilgan email domenlari" hint="Bo'sh bo'lsa — istalgan domen">
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-2">
                {s.registration.allowedDomains.map((d) => (
                  <span key={d} className="flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                    @{d}
                    <button onClick={() => setS({ ...s, registration: { ...s.registration, allowedDomains: s.registration.allowedDomains.filter((x) => x !== d) } })} aria-label="O'chirish">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && domain.trim()) {
                      e.preventDefault();
                      const d = domain.trim().replace(/^@/, '').toLowerCase();
                      if (!s.registration.allowedDomains.includes(d)) setS({ ...s, registration: { ...s.registration, allowedDomains: [...s.registration.allowedDomains, d] } });
                      setDomain('');
                    }
                  }}
                  placeholder="tuit.uz + Enter"
                  className="h-7 min-w-32 flex-1 bg-transparent px-1 text-[13px] outline-none"
                />
              </div>
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <CardHeader title="Baholash tizimi (standart)" icon={<GraduationCap />} subtitle="Yangi kurslar uchun JN + ON + YN = 100" />
          <div className="grid grid-cols-3 gap-3">
            {(['current', 'midterm', 'final'] as const).map((k) => (
              <Field key={k} label={k === 'current' ? 'JN (joriy)' : k === 'midterm' ? 'ON (oraliq)' : 'YN (yakuniy)'}>
                <Input type="number" min={0} max={100} value={s.grading[k]} onChange={(e) => setS({ ...s, grading: { ...s.grading, [k]: Number(e.target.value) } })} />
              </Field>
            ))}
          </div>
          <p className={sum === 100 ? 'mt-2 text-xs font-semibold text-emerald-600' : 'mt-2 text-xs font-semibold text-rose-500'}>Yig'indi: {sum}/100</p>
        </Card>

        <Card className="p-6">
          <CardHeader title="Juftlik vaqtlari" icon={<Clock />} />
          <div className="space-y-2">
            {s.pairTimes.map((p, i) => (
              <div key={p.pair} className="flex items-center gap-3">
                <span className="w-20 text-[13px] font-bold text-fg">{p.pair}-juftlik</span>
                <Input type="time" value={p.start} onChange={(e) => setS({ ...s, pairTimes: s.pairTimes.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)) })} inputSize="sm" />
                <span className="text-muted">—</span>
                <Input type="time" value={p.end} onChange={(e) => setS({ ...s, pairTimes: s.pairTimes.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)) })} inputSize="sm" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <CardHeader title="Interfeys" icon={<Box />} />
          <Switch checked={enable3d} onChange={setEnable3d} label="3D effektlar" description="Login, bannerlar va reyting podiumidagi WebGL sahnalar (zaif qurilmalarda o'chiring)" />
        </Card>

        <Card className="p-6">
          <CardHeader title="Tizim" icon={<Database />} />
          <div className="space-y-3 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-muted">API rejimi</span>
              <Badge tone={IS_MOCK ? 'amber' : 'green'}>{API_MODE === 'mock' ? 'Mock (brauzer ichida)' : 'HTTP (NestJS)'}</Badge>
            </div>
            {IS_MOCK && (
              <>
                <p className="text-xs text-muted">Ma'lumotlar brauzeringizdagi IndexedDB'da saqlanadi. Backend ulanganda `VITE_API_MODE=http` qiling.</p>
                <Button
                  variant="outline"
                  icon={<RotateCcw />}
                  loading={reset.isPending}
                  onClick={async () => {
                    if (await confirm({ title: "Demo ma'lumotlarni tiklash", description: "Barcha o'zgarishlar o'chiriladi va boshlang'ich demo ma'lumotlar qayta yaratiladi.", danger: true, confirmText: 'Tiklash' })) {
                      await reset.mutateAsync();
                      await qc.invalidateQueries();
                      setS(null);
                    }
                  }}
                >
                  Demo ma'lumotlarni qayta tiklash
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </Page>
  );
}
