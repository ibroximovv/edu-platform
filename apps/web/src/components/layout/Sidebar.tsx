import { NavLink, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronsLeft, LogOut, Sparkles, UserCog, X } from 'lucide-react';
import { NAVIGATION, ROLE_META } from '@/config/navigation';
import { cn } from '@/lib/cn';
import { weekNumberSince } from '@/lib/format';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { useCounters } from '@/api/queries/misc';
import { useSemesters } from '@/api/queries/admin';
import { useConfirm } from '@/contexts/ConfirmProvider';
import { Logo } from './Logo';

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const role = useAuthStore((s) => s.activeRole) ?? 'student';
  const logout = useAuthStore((s) => s.logout);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const { data: counters } = useCounters(role);
  const { data: semesters } = useSemesters();
  const current = semesters?.find((s) => s.isCurrent);
  const confirm = useConfirm();
  const navigate = useNavigate();
  const RoleIcon = ROLE_META[role].icon;

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-[72px] shrink-0 items-center gap-3 px-5', collapsed && 'justify-center px-0')}>
        <Logo compact={collapsed} />
        {!collapsed && (
          <button onClick={toggle} className="ml-auto hidden size-8 place-items-center rounded-lg text-muted transition hover:bg-panel hover:text-fg lg:grid" aria-label="Menyuni yig'ish">
            <ChevronsLeft className="size-4" />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="mx-4 mb-2 flex items-center gap-2.5 rounded-2xl bg-panel px-3 py-2.5">
          <span className={cn('grid size-8 place-items-center rounded-xl bg-gradient-to-br text-white', ROLE_META[role].tone)}>
            <RoleIcon className="size-4" />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="text-[12.5px] font-bold text-fg">{ROLE_META[role].label}</div>
            <div className="truncate text-[11px] text-muted">{ROLE_META[role].description}</div>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {NAVIGATION[role].map((section) => (
          <div key={section.title}>
            {!collapsed && <div className="label-caps mb-2 px-3">{section.title}</div>}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const count = item.badge ? counters?.[item.badge] : undefined;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors',
                          collapsed && 'justify-center px-0',
                          isActive ? 'text-brand-700 dark:text-white' : 'text-fg-soft hover:bg-panel hover:text-fg',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-brand-50 ring-1 ring-brand-100 dark:bg-brand-500/15 dark:ring-brand-500/20" transition={{ type: 'spring', stiffness: 450, damping: 35 }} />
                          )}
                          {isActive && !collapsed && <motion.span layoutId="nav-bar" className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-brand-600" />}
                          <item.icon className={cn('relative size-[18px] shrink-0', isActive ? 'text-brand-600 dark:text-brand-300' : 'text-muted group-hover:text-fg')} />
                          {!collapsed && <span className="relative truncate">{item.label}</span>}
                          {!!count && (
                            <span className={cn('relative ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-[10.5px] font-bold text-white', collapsed && 'absolute -right-0.5 -top-0.5 ml-0 h-4 min-w-4 px-1 text-[9px]')}>{count}</span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && current && (
        <div className="relative mx-4 mb-3 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-fuchsia-700 p-4 text-white">
          <div className="absolute -right-6 -top-6 size-24 rounded-full bg-white/10 blur-xl" />
          <Sparkles className="absolute right-3 top-3 size-4 text-white/60" />
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Joriy semestr</div>
          <div className="mt-0.5 text-sm font-bold">{current.name}</div>
          <div className="mt-2 inline-flex items-center rounded-lg bg-white/15 px-2 py-0.5 text-[11px] font-semibold backdrop-blur">{Math.max(1, weekNumberSince(current.startDate))}-o'quv haftasi</div>
        </div>
      )}

      <div className={cn('space-y-0.5 border-t border-line p-3', collapsed && 'px-2')}>
        <NavLink
          to="/profile"
          onClick={onNavigate}
          className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition', collapsed && 'justify-center px-0', isActive ? 'bg-panel text-fg' : 'text-fg-soft hover:bg-panel hover:text-fg')}
          title="Profil sozlamalari"
        >
          <UserCog className="size-[18px] text-muted" />
          {!collapsed && 'Profil sozlamalari'}
        </NavLink>
        <button
          onClick={async () => {
            if (await confirm({ title: 'Tizimdan chiqish', description: 'Haqiqatan ham chiqmoqchimisiz?', confirmText: 'Chiqish', danger: true })) {
              logout();
              navigate('/login');
            }
          }}
          className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10', collapsed && 'justify-center px-0')}
          title="Chiqish"
        >
          <LogOut className="size-[18px]" />
          {!collapsed && 'Chiqish'}
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const mobileOpen = useUIStore((s) => s.mobileNavOpen);
  const setMobile = useUIStore((s) => s.setMobileNav);
  const toggle = useUIStore((s) => s.toggleSidebar);

  return (
    <>
      <aside className={cn('fixed inset-y-0 left-0 z-40 hidden border-r border-line bg-card transition-[width] duration-300 lg:block', collapsed ? 'w-[84px]' : 'w-[264px]')}>
        <SidebarContent collapsed={collapsed} />
        {collapsed && (
          <button onClick={toggle} className="absolute -right-3 top-6 grid size-6 place-items-center rounded-full border border-line bg-card text-muted shadow-soft hover:text-fg" aria-label="Menyuni ochish">
            <ChevronsLeft className="size-3.5 rotate-180" />
          </button>
        )}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <motion.div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobile(false)} />
            <motion.aside className="absolute inset-y-0 left-0 w-[280px] bg-card shadow-lift" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <button onClick={() => setMobile(false)} className="absolute right-3 top-5 z-10 grid size-8 place-items-center rounded-lg text-muted hover:bg-panel" aria-label="Yopish">
                <X className="size-4" />
              </button>
              <SidebarContent collapsed={false} onNavigate={() => setMobile(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

