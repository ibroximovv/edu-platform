import { isRouteErrorResponse, useRouteError } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Home, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui';

function ErrorShell({ code, title, description, actions }: { code: string; title: string; description: string; actions: React.ReactNode }) {
  return (
    <div className="relative grid min-h-[70dvh] place-items-center overflow-hidden px-6 py-16 text-center">
      <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <motion.div
          animate={{ rotateY: [0, 18, 0, -18, 0], y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformPerspective: 600 }}
          className="text-gradient text-[120px] font-black leading-none tracking-tighter sm:text-[160px]"
        >
          {code}
        </motion.div>
        <h1 className="mt-2 text-2xl font-extrabold text-fg">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">{actions}</div>
      </motion.div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <ErrorShell
        code="404"
        title="Sahifa topilmadi"
        description="Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan bo'lishi mumkin."
        actions={
          <>
            <Button variant="outline" icon={<ArrowLeft />} onClick={() => history.back()}>
              Orqaga
            </Button>
            <ButtonLink to="/" icon={<Home className="size-4" />}>
              Bosh sahifa
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <ErrorShell
      code="403"
      title="Kirish taqiqlangan"
      description="Bu bo'limga kirish uchun sizda tegishli rol yo'q. Administratorga murojaat qiling."
      actions={
        <ButtonLink to="/" icon={<ShieldAlert className="size-4" />}>
          Mening panelim
        </ButtonLink>
      }
    />
  );
}

export function RouteErrorPage() {
  const error = useRouteError();
  const isChunk = error instanceof Error && /dynamically imported module|Failed to fetch/i.test(error.message);
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  return (
    <div className="min-h-dvh bg-bg">
      <ErrorShell
        code="Oops"
        title={isChunk ? 'Yangi versiya mavjud' : 'Kutilmagan xatolik'}
        description={isChunk ? 'Ilova yangilangan. Sahifani qayta yuklang.' : error instanceof Error ? error.message : "Nimadir noto'g'ri ketdi."}
        actions={
          <Button icon={<RefreshCw />} onClick={() => location.reload()}>
            Qayta yuklash
          </Button>
        }
      />
    </div>
  );
}
