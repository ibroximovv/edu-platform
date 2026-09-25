import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import { authApi } from '@/api/queries/auth';
import { ApiError, errorMessage } from '@/api/http';
import { cn } from '@/lib/cn';
import { Button, Checkbox, Field, Input, PasswordInput } from '@/components/ui';
import { emailSchema, passwordSchema, passwordStrength } from './schemas';

const schema = z
  .object({
    firstName: z.string().trim().min(2, 'Ism kamida 2 harf'),
    lastName: z.string().trim().min(2, 'Familiya kamida 2 harf'),
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
    agree: z.boolean().refine((v) => v, 'Shartlarga rozilik bering'),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Parollar mos emas' });
type Form = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, setError, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirm: '', agree: false },
  });
  const pwd = watch('password');
  const strength = passwordStrength(pwd);
  const errors = formState.errors;

  const onSubmit = handleSubmit(async ({ firstName, lastName, email, password }) => {
    try {
      const res = await authApi.register({ firstName, lastName, email, password });
      toast.success('Tasdiqlash kodi emailingizga yuborildi');
      navigate(`/verify-email?email=${encodeURIComponent(res.email)}`, { state: { devCode: res.devCode } });
    } catch (e) {
      if (e instanceof ApiError && e.details) Object.entries(e.details).forEach(([k, m]) => setError(k as keyof Form, { message: m }));
      toast.error(errorMessage(e));
    }
  });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-[28px] font-extrabold tracking-tight text-fg">Ro'yxatdan o'tish</h1>
      <p className="mt-1.5 text-sm text-muted">Universitet emailingiz bilan hisob yarating</p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ism" error={errors.firstName?.message}>
            <Input icon={<User />} placeholder="Jasur" autoComplete="given-name" invalid={!!errors.firstName} {...register('firstName')} />
          </Field>
          <Field label="Familiya" error={errors.lastName?.message}>
            <Input placeholder="Karimov" autoComplete="family-name" invalid={!!errors.lastName} {...register('lastName')} />
          </Field>
        </div>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" icon={<Mail />} placeholder="siz@universitet.uz" autoComplete="email" invalid={!!errors.email} {...register('email')} />
        </Field>
        <Field label="Parol" error={errors.password?.message}>
          <PasswordInput icon={<Lock />} placeholder="Kamida 8 ta belgi" autoComplete="new-password" invalid={!!errors.password} {...register('password')} />
          {pwd && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i < strength.score ? strength.color : 'bg-line')} />
                ))}
              </div>
              <span className="text-[11px] font-semibold text-muted">{strength.label}</span>
            </div>
          )}
        </Field>
        <Field label="Parolni tasdiqlang" error={errors.confirm?.message}>
          <PasswordInput icon={<Lock />} placeholder="Parolni qayta kiriting" autoComplete="new-password" invalid={!!errors.confirm} {...register('confirm')} />
        </Field>
        <div>
          <Checkbox checked={watch('agree')} onChange={(v) => setValue('agree', v, { shouldValidate: true })} label="Foydalanish shartlari va maxfiylik siyosatiga roziman" />
          {errors.agree && <p className="mt-1 text-xs font-medium text-rose-500">{errors.agree.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting} iconRight={<ArrowRight />}>
          Davom etish
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted">
        Hisobingiz bormi?{' '}
        <Link to="/login" className="font-bold text-brand-600 hover:underline">
          Kirish
        </Link>
      </p>
    </motion.div>
  );
}
