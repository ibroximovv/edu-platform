import { useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { CheckCircle2, Clock3, ShieldCheck } from 'lucide-react';
import { ButtonLink } from '@/components/ui';

export default function PendingPage() {
  const [params] = useSearchParams();
  const email = params.get('email');
  const steps = [
    { icon: CheckCircle2, label: "Ro'yxatdan o'tildi", done: true },
    { icon: CheckCircle2, label: 'Email tasdiqlandi', done: true },
    { icon: ShieldCheck, label: 'Administrator tasdig‘i', done: false },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2.4, repeat: Infinity }} className="mx-auto mb-6 grid size-20 place-items-center rounded-[28px] bg-gradient-to-br from-sky-400 to-brand-600 text-white shadow-brand">
        <Clock3 className="size-9" />
      </motion.div>
      <h1 className="text-[26px] font-extrabold tracking-tight text-fg">Tasdiqlash kutilmoqda</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        {email ? <b className="text-fg">{email}</b> : 'Hisobingiz'} muvaffaqiyatli yaratildi. Administrator hisobingizni tasdiqlab, guruhga biriktirgach tizimga kira olasiz.
      </p>
      <ol className="mx-auto mt-7 max-w-xs space-y-2.5 text-left">
        {steps.map((s, i) => (
          <motion.li key={s.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.12 }} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
            <s.icon className={s.done ? 'size-5 text-emerald-500' : 'size-5 animate-pulse text-amber-500'} />
            <span className="text-[13px] font-semibold text-fg">{s.label}</span>
            {!s.done && <span className="ml-auto text-[11px] font-semibold text-amber-600">kutilmoqda</span>}
          </motion.li>
        ))}
      </ol>
      <ButtonLink to="/login" size="lg" className="mt-8 w-full">
        Kirish sahifasiga
      </ButtonLink>
    </motion.div>
  );
}
