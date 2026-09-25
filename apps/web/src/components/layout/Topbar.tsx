import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronDown,
  ClipboardList,
  FileText,
  GraduationCap,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Search,
  Settings2,
  Sun,
  CalendarDays,
  ListChecks,
  Megaphone,
} from 'lucide-react';
import type { NotificationType, Role } from '@edu/shared';
import { ROLE_META } from '@/config/navigation';
import { cn } from '@/lib/cn';
import { fmtRelative } from '@/lib/format';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { useTheme } from '@/contexts/ThemeProvider';
import { useMarkAllRead, useMarkRead, useNotifications } from '@/api/queries/misc';
import { Avatar, Dropdown, Kbd } from '@/components/ui';

export const NOTIFICATION_ICONS: Record<NotificationType, { icon: typeof Bell; tone: string }> = {
  assignment: { icon: ClipboardList, tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
  submission: { icon: FileText, tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
  grade: { icon: GraduationCap, tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
  test: { icon: ListChecks, tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' },
  schedule: { icon: CalendarDays, tone: 'bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300' },
  material: { icon: FileText, tone: 'bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300' },
  system: { icon: Megaphone, tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' },
};

function ThemeToggle() {
  const { mode, setMode, resolved } = useTheme();
  const items = [
    { v: 'light' as const, label: "Yorug'", icon: Sun },
    { v: 'dark' as const, label: "Qorong'i", icon: Moon },
    { v: 'system' as const, label: 'Tizim', icon: Monitor },
  ];
  return (
    <Dropdown
      width="w-44"
      trigger={() => (
        <button className="grid size-10 place-items-center rounded-full border border-line bg-card text-fg-soft transition hover:text-brand-600" aria-label="Mavzu">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={resolved} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              {resolved === 'dark' ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
            </motion.span>
          </AnimatePresence>
        </button>
      )}
      items={items.map((i) => ({ label: <span className="flex flex-1 items-center justify-between">{i.label}{mode === i.v && <Check className="size-3.5 text-brand-600" />}</span>, icon: <i.icon />, onClick: () => setMode(i.v) }))}
    />
  );
}

function NotificationBell() {
  const navigate = useNavigate();
  const { data } = useNotifications({ limit: 8 });
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const unread = data?.unread ?? 0;
  return (
    <Dropdown
      width="w-[360px] max-w-[calc(100vw-2rem)]"
      trigger={() => (
        <button className="relative grid size-10 place-items-center rounded-full border border-line bg-card text-fg-soft transition hover:text-brand-600" aria-label="Bildirishnomalar">
          {unread ? <BellRing className="size-[18px]" /> : <Bell className="size-[18px]" />}
          {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] animate-pulse-ring place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-card">{unread > 9 ? '9+' : unread}</span>}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between px-3 pb-2 pt-1.5">
            <div>
              <div className="text-sm font-bold text-fg">Bildirishnomalar</div>
              <div className="text-[11px] text-muted">{unread ? `${unread} ta o'qilmagan` : "Hammasi o'qilgan"}</div>
            </div>
            {unread > 0 && (
              <button onClick={() => markAll.mutate()} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10">
                <CheckCheck className="size-3.5" /> Barchasini o'qish
              </button>
            )}
          </div>
          <div className="max-h-[380px] space-y-0.5 overflow-y-auto">
            {data?.items.length ? (
              data.items.map((n) => {
                const meta = NOTIFICATION_ICONS[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.read) markRead.mutate(n.id);
                      close();
                      if (n.link) navigate(n.link);
                    }}
                    className={cn('flex w-full gap-3 rounded-xl p-2.5 text-left transition hover:bg-panel', !n.read && 'bg-brand-50/50 dark:bg-brand-500/5')}
                  >
                    <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', meta.tone)}>
                      <meta.icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-semibold text-fg">{n.title}</span>
                        {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-brand-600" />}
                      </span>
                      <span className="line-clamp-2 text-xs text-muted">{n.body}</span>
                      <span className="mt-0.5 block text-[10.5px] font-medium text-muted/80">{fmtRelative(n.createdAt)}</span>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="py-10 text-center text-xs text-muted">Bildirishnomalar yo'q</div>
            )}
          </div>
          <button
            onClick={() => {
              close();
              navigate('/notifications');
            }}
            className="mt-1 w-full rounded-xl py-2 text-center text-[12.5px] font-semibold text-brand-600 hover:bg-panel"
          >
            Barchasini ko'rish
          </button>
        </div>
      )}
    </Dropdown>
  );
}

function RoleSwitcher() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.activeRole);
  const setRole = useAuthStore((s) => s.setActiveRole);
  const navigate = useNavigate();
  if (!user || user.roles.length < 2 || !role) return null;
  const switchTo = (r: Role) => {
    setRole(r);
    navigate(`/${r}`);
  };
  return (
    <div className="hidden items-center gap-1 rounded-full border border-line bg-card p-1 md:flex">
      {user.roles.map((r) => {
        const Icon = ROLE_META[r].icon;
        const active = r === role;
        return (
          <button key={r} onClick={() => switchTo(r)} className={cn('relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors', active ? 'text-white' : 'text-muted hover:text-fg')} title={ROLE_META[r].label}>
            {active && <motion.span layoutId="role-pill" className={cn('absolute inset-0 rounded-full bg-gradient-to-r shadow-brand', ROLE_META[r].tone)} transition={{ type: 'spring', stiffness: 450, damping: 32 }} />}
            <Icon className="relative size-3.5" />
            <span className="relative hidden xl:inline">{ROLE_META[r].label}</span>
          </button>
        );
      })}
    </div>
  );
}

function UserMenu() {
  const user = useAuthStore((s) => s.user)!;
  const role = useAuthStore((s) => s.activeRole);
  const setRole = useAuthStore((s) => s.setActiveRole);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  return (
    <Dropdown
      width="w-60"
      trigger={(open) => (
        <button className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-card">
          <Avatar user={user} size="md" />
          <span className="hidden text-left leading-tight sm:block">
            <span className="block max-w-[140px] truncate text-[13.5px] font-bold text-fg">
              {user.firstName} {user.lastName}
            </span>
            <span className="block text-[11px] font-medium text-muted">{role ? ROLE_META[role].label : ''}</span>
          </span>
          <ChevronDown className={cn('hidden size-4 text-muted transition sm:block', open && 'rotate-180')} />
        </button>
      )}
      items={[
        ...(user.roles.length > 1
          ? user.roles.map((r) => {
              const Icon = ROLE_META[r].icon;
              return { label: `${ROLE_META[r].label} sifatida`, icon: <Icon />, onClick: () => { setRole(r); navigate(`/${r}`); } };
            })
          : []),
        ...(user.roles.length > 1 ? [{ label: '', divider: true }] : []),
        { label: 'Profil sozlamalari', icon: <Settings2 />, onClick: () => navigate('/profile') },
        { label: 'Bildirishnomalar', icon: <Bell />, onClick: () => navigate('/notifications') },
        { label: '', divider: true },
        { label: 'Chiqish', icon: <LogOut />, danger: true, onClick: () => { logout(); navigate('/login'); } },
      ]}
    />
  );
}

export function Topbar() {
  const setMobile = useUIStore((s) => s.setMobileNav);
  const setCommand = useUIStore((s) => s.setCommandOpen);
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/75 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button onClick={() => setMobile(true)} className="grid size-10 place-items-center rounded-xl border border-line bg-card text-fg-soft lg:hidden" aria-label="Menyu">
          <Menu className="size-[18px]" />
        </button>
        <button onClick={() => setCommand(true)} className="group flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full border border-line bg-card px-4 text-left text-[13px] text-muted shadow-soft transition hover:border-brand-300 sm:max-w-md">
          <Search className="size-4 shrink-0 transition group-hover:text-brand-600" />
          <span className="min-w-0 flex-1 truncate">
            <span className="sm:hidden">Qidirish...</span>
            <span className="hidden sm:inline">Kurs, topshiriq yoki sahifani qidiring...</span>
          </span>
          <span className="hidden items-center gap-1 sm:flex">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          <RoleSwitcher />
          <ThemeToggle />
          <NotificationBell />
          <div className="mx-1 hidden h-8 w-px bg-line sm:block" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
