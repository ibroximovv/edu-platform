import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ArrowLeft, Inbox, MailCheck } from 'lucide-react';
import { IS_MOCK } from '@/config/app';
import { authApi } from '@/api/queries/auth';
import { errorMessage } from '@/api/http';
import { defaultRole, useAuthStore } from '@/stores/auth.store';
import { Button, OtpInput } from '@/components/ui';

export function DevInbox({ code }: { code?: string }) {
  if (!IS_MOCK || !code) return null;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-5 flex items-center gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-3.5 dark:border-amber-500/40 dark:bg-amber-500/10">
      <span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20">
        <Inbox className="size-5" />
      </span>
      <div className="text-[12.5px] leading-snug text-amber-800 dark:text-amber-200">
        <b>Demo rejim:</b> email yuborilmaydi. Tasdiqlash kodingiz:
        <div className="mt-0.5 font-mono text-lg font-extrabold tracking-[0.3em]">{code}</div>
      </div>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const email = params.get('email') ?? '';
  const [devCode, setDevCode] = useState<string | undefined>((location.state as { devCode?: string } | null)?.devCode);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (value = code) => {
    if (value.length !== 6) return;
    setLoading(true);
    setInvalid(false);
    try {
      const res = await authApi.verifyEmail({ email, code: value });
      if ('pendingApproval' in res) {
        navigate(`/pending?email=${encodeURIComponent(email)}`, { replace: true });
      } else {
        setSession(res);
        toast.success('Email tasdiqlandi. Xush kelibsiz!');
        navigate(`/${defaultRole(res.user)}`, { replace: true });
      }
    } catch (e) {
      setInvalid(true);
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const res = await authApi.resendCode(email);
      setDevCode(res.devCode);
      setCooldown(60);
      toast.success('Yangi kod yuborildi');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (!email) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted">Email ko'rsatilmagan.</p>
        <Link to="/register" className="mt-3 inline-block font-bold text-brand-600">
          Ro'yxatdan o'tish
        </Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="mb-6 grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-brand">
        <MailCheck className="size-7" />
      </motion.div>
      <h1 className="text-[28px] font-extrabold tracking-tight text-fg">Emailni tasdiqlang</h1>
      <p className="mt-1.5 text-sm text-muted">
        6 xonali kod <b className="text-fg">{email}</b> manziliga yuborildi. Kod 10 daqiqa amal qiladi.
      </p>
      <DevInbox code={devCode} />
      <div className="mt-7">
        <OtpInput
          value={code}
          invalid={invalid}
          autoFocus
          onChange={(v) => {
            setCode(v);
            setInvalid(false);
            if (v.length === 6) submit(v);
          }}
        />
      </div>
      <Button size="lg" className="mt-6 w-full" loading={loading} disabled={code.length !== 6} onClick={() => submit()}>
        Tasdiqlash
      </Button>
      <div className="mt-5 text-center text-sm text-muted">
        Kod kelmadimi?{' '}
        {cooldown > 0 ? (
          <span className="font-semibold tabular-nums">{cooldown} soniyadan so'ng qayta yuborish</span>
        ) : (
          <button onClick={resend} className="font-bold text-brand-600 hover:underline">
            Qayta yuborish
          </button>
        )}
      </div>
      <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Kirish sahifasiga qaytish
      </Link>
    </motion.div>
  );
}
