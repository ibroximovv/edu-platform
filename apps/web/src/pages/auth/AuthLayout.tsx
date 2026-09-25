import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { motion } from 'motion/react';
import { Award, BookOpenCheck, Sparkles, Users } from 'lucide-react';
import { APP_NAME } from '@/config/app';
import { Logo } from '@/components/layout/Logo';
import { Auth3D } from '@/components/three';
import { PageLoader } from '@/components/ui';

const floating = [
  { icon: Users, label: 'Faol talabalar', value: '12 400+', className: 'left-8 top-[18%]', delay: 0.2 },
  { icon: BookOpenCheck, label: 'Onlayn kurslar', value: '640', className: 'right-8 top-[30%]', delay: 0.4 },
  { icon: Award, label: "O'rtacha GPA", value: '3.72', className: 'bottom-[26%] left-12', delay: 0.6 },
];

export function AuthLayout() {
  return (
    <div className="grid min-h-dvh bg-bg lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="relative flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[420px]">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
        <p className="text-center text-xs text-muted">
          © {new Date().getFullYear()} {APP_NAME}. Barcha huquqlar himoyalangan.
        </p>
      </div>

      <div className="relative hidden overflow-hidden p-4 lg:block">
        <div className="relative h-full overflow-hidden rounded-[32px] bg-[radial-gradient(120%_90%_at_20%_10%,#8f7cf8_0%,#5a45cf_45%,#1e1650_100%)]">
          <div className="bg-grid absolute inset-0 opacity-[0.08] [--line:white]" />
          <div className="absolute inset-0">
            <Auth3D
              fallback={
                <div className="grid size-full place-items-center">
                  <Sparkles className="size-24 animate-float text-white/40" />
                </div>
              }
            />
          </div>

          {floating.map((f) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: f.delay, type: 'spring', stiffness: 200, damping: 20 }}
              className={`absolute ${f.className} pointer-events-none flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white shadow-2xl backdrop-blur-xl`}
            >
              <span className="grid size-10 place-items-center rounded-xl bg-white/20">
                <f.icon className="size-5" />
              </span>
              <span>
                <span className="block text-[11px] font-medium text-white/70">{f.label}</span>
                <span className="block text-lg font-extrabold leading-tight">{f.value}</span>
              </span>
            </motion.div>
          ))}

          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="max-w-md text-[34px] font-extrabold leading-[1.1] tracking-tight">
              Bilimni boshqarishning zamonaviy usuli
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-3 max-w-md text-sm text-white/75">
              Topshiriqlar, testlar, baholash, dars jadvali va reyting — talaba, o'qituvchi va administrator uchun yagona platformada.
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
