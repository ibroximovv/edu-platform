import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { ArrowLeft, KeyRound, Lock, Mail } from 'lucide-react';
import { authApi } from '@/api/queries/auth';
import { errorMessage } from '@/api/http';
import { Button, Field, Input, OtpInput, PasswordInput } from '@/components/ui';
import { emailSchema, passwordSchema } from './schemas';
import { DevInbox } from './VerifyEmailPage';

const resetSchema = z
  .object({ code: z.string().length(6, '6 xonali kodni kiriting'), password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Parollar mos emas' });

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [devCode, setDevCode] = useState<string>();
  const [sending, setSending] = useState(false);
  const form = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema), defaultValues: { code: '', password: '', confirm: '' } });

  const send = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return setEmailError(parsed.error.issues[0].message);
    setEmailError(undefined);
    setSending(true);
    try {
      const res = await authApi.forgotPassword(parsed.data);
      setDevCode(res.devCode);
      setStep('reset');
      toast.success("Agar hisob mavjud bo'lsa, kod emailga yuborildi");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const reset = form.handleSubmit(async ({ code, password }) => {
    try {
      await authApi.resetPassword({ email, code, password });
      toast.success('Parol yangilandi. Endi kirishingiz mumkin');
      navigate('/login', { replace: true });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  });

  return (
    <div>
      <div className="mb-6 grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30">
        <KeyRound className="size-7" />
      </div>
      <AnimatePresence mode="wait">
        {step === 'email' ? (
          <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h1 className="text-[28px] font-extrabold tracking-tight text-fg">Parolni tiklash</h1>
            <p className="mt-1.5 text-sm text-muted">Emailingizni kiriting — tiklash kodini yuboramiz</p>
            <form
              className="mt-7 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <Field label="Email" error={emailError}>
                <Input type="email" icon={<Mail />} inputSize="lg" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="siz@universitet.uz" invalid={!!emailError} autoFocus />
              </Field>
              <Button type="submit" size="lg" className="w-full" loading={sending}>
                Kod yuborish
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h1 className="text-[28px] font-extrabold tracking-tight text-fg">Yangi parol</h1>
            <p className="mt-1.5 text-sm text-muted">
              <b className="text-fg">{email}</b> ga yuborilgan kodni va yangi parolni kiriting
            </p>
            <DevInbox code={devCode} />
            <form onSubmit={reset} className="mt-6 space-y-4" noValidate>
              <Field label="Tasdiqlash kodi" error={form.formState.errors.code?.message}>
                <OtpInput value={form.watch('code')} onChange={(v) => form.setValue('code', v, { shouldValidate: form.formState.isSubmitted })} invalid={!!form.formState.errors.code} />
              </Field>
              <Field label="Yangi parol" error={form.formState.errors.password?.message}>
                <PasswordInput icon={<Lock />} autoComplete="new-password" invalid={!!form.formState.errors.password} {...form.register('password')} />
              </Field>
              <Field label="Parolni tasdiqlang" error={form.formState.errors.confirm?.message}>
                <PasswordInput icon={<Lock />} autoComplete="new-password" invalid={!!form.formState.errors.confirm} {...form.register('confirm')} />
              </Field>
              <Button type="submit" size="lg" className="w-full" loading={form.formState.isSubmitting}>
                Parolni yangilash
              </Button>
              <button type="button" onClick={() => setStep('email')} className="w-full text-center text-sm font-semibold text-muted hover:text-fg">
                Boshqa email kiritish
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Kirish sahifasiga qaytish
      </Link>
    </div>
  );
}
