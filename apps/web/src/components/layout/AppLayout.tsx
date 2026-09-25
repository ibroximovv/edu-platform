import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { connectRealtime, disconnectRealtime, onRealtime } from '@/api/realtime';
import { PageLoader } from '@/components/ui';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';

export function AppLayout() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const token = useAuthStore((s) => s.tokens?.accessToken);
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  const { pathname } = useLocation();

  // Realtime: socket.io in http mode, in-process bus in mock mode
  useEffect(() => {
    if (token) connectRealtime(token);
    const off = onRealtime('notification', (n) => {
      if (n.userId !== userId) return;
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['counters'] });
      toast(n.title, { description: n.body });
    });
    const offDb = onRealtime('db:changed', () => qc.invalidateQueries());
    return () => {
      off();
      offDb();
    };
  }, [token, userId, qc]);

  useEffect(() => () => disconnectRealtime(), []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-dvh">
      <Sidebar />
      <div className={cn('transition-[padding] duration-300', collapsed ? 'lg:pl-[84px]' : 'lg:pl-[264px]')}>
        <Topbar />
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
