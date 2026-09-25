import { useEffect, type ReactNode } from 'react';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { MotionConfig } from 'motion/react';
import { IS_MOCK } from '@/config/app';
import { ApiError } from '@/api/http';
import { emitRealtime } from '@/api/realtime';
import { ThemeProvider, useTheme } from '@/contexts/ThemeProvider';
import { ConfirmProvider } from '@/contexts/ConfirmProvider';

export const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (count, e) => !(e instanceof ApiError && e.status >= 400 && e.status < 500) && count < 2,
    },
  },
  mutationCache: new MutationCache({
    // Any successful write can change sidebar counters
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['counters'] });
    },
  }),
});

function ThemedToaster() {
  const { resolved } = useTheme();
  return <Toaster theme={resolved} position="top-right" richColors closeButton toastOptions={{ className: 'font-sans !rounded-2xl' }} />;
}

/** In mock mode: sync data written in other tabs (e.g. teacher tab grades, student tab updates). */
function MockTabSync() {
  useEffect(() => {
    if (!IS_MOCK) return;
    let off: (() => void) | undefined;
    import('@/api/mock/db').then(({ onExternalChange }) => {
      off = onExternalChange(() => emitRealtime('db:changed', {}));
    });
    return () => off?.();
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <ConfirmProvider>
            {children}
            <ThemedToaster />
            <MockTabSync />
          </ConfirmProvider>
        </MotionConfig>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
