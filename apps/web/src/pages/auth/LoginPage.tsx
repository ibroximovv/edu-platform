import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { AlertCircle, ArrowRight, Lock, Mail, Zap } from 'lucide-react';
import { IS_MOCK } from '@/config/app';
import { DEMO_ACCOUNTS } from '@/config/demo';
import { ROLE_META } from '@/config/navigation';
import { authApi } from '@/api/queries/auth';
import { errorMessage } from '@/api/http';
import { defaultRole, useAuthStore } from '@/stores/auth.store';
import { Button, Checkbox, Field, Input, PasswordInput } from '@/components/ui';
import { emailSchema } from './schemas';

const schema = z.object({ email: emailSchema, password: z.string().min(1, 'Parolni kiriting') });
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  const { register, handleSubmit, setValue, formState } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const session = await authApi.login(values);
      setSession(session);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/' ? from : `/${defaultRole(session.user)}`, { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-[28px] font-extrabold tracking-tight text-fg">Xush kelibsiz! 👋</h1>
      <p className="mt-1.5 text-sm text-muted">Davom etish uchun hisobingizga kiring</p>

      {error && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-[13px] font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </motion.div>
      )}

      <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
        <Field label="Email" error={formState.errors.email?.message} htmlFor="email">
          <Input id="email" type="email" autoComplete="email" icon={<Mail />} placeholder="siz@universitet.uz" inputSize="lg" invalid={!!formState.errors.email} {...register('email')} />
        </Field>
        <Field
          label={
            <span className="flex items-center justify-between">
              Parol
              <Link to="/forgot-password" className="text-xs font-semibold text-brand-600 hover:underline">
                Parolni unutdingizmi?
              </Link>
            </span>
          }
          error={formState.errors.password?.message}
          htmlFor="password"
        >
          <PasswordInput id="password" autoComplete="current-password" icon={<Lock />} placeholder="••••••••" inputSize="lg" invalid={!!formState.errors.password} {...register('password')} />
        </Field>
        <Checkbox checked={remember} onChange={setRemember} label="Meni eslab qol" />
        <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting} iconRight={<ArrowRight />}>
          Kirish
        </Button>
      </form>

      {IS_MOCK && (
        <div className="mt-7 rounded-3xl border border-dashed border-brand-200 bg-brand-50/50 p-4 dark:border-brand-500/30 dark:bg-brand-500/5">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-brand-700 dark:text-brand-300">
            <Zap className="size-3.5" /> Demo hisoblar — bosing va kiring
          </div>
          <div className="grid gap-2">
            {DEMO_ACCOUNTS.map((a) => {
              const Icon = ROLE_META[a.roles[0]].icon;
              return (
                <button
                  key={a.email}
                  type="button"
                  aria-label={`${a.label} (${a.email}) sifatida kirish`}
                  onClick={() => {
                    setValue('email', a.email);
                    setValue('password', a.password);
                    onSubmit();
                  }}
                  className="flex items-center gap-3 rounded-2xl bg-card p-2.5 text-left ring-1 ring-line transition hover:ring-brand-300"
                >
                  <span className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br text-white ${ROLE_META[a.roles[0]].tone}`}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-fg">{a.label}</span>
                    <span className="block truncate text-[11px] text-muted">{a.email}</span>
                  </span>
                  <span className="flex gap-1">
                    {a.roles.map((r) => (
                      <span key={r} className="rounded-md bg-panel px-1.5 py-0.5 text-[9.5px] font-bold uppercase text-muted">
                        {r}
                      </span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-7 text-center text-sm text-muted">
        Hisobingiz yo'qmi?{' '}
        <Link to="/register" className="font-bold text-brand-600 hover:underline">
          Ro'yxatdan o'ting
        </Link>
      </p>
    </motion.div>
  );
}
