import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, BookOpen, ClipboardList, CornerDownLeft, FolderOpen, Moon, Search, Sun, User, Users } from 'lucide-react';
import type { SearchResult } from '@edu/shared';
import { NAVIGATION, ROLE_META } from '@/config/navigation';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { useTheme } from '@/contexts/ThemeProvider';
import { useSearch } from '@/api/queries/misc';
import { Kbd, Spinner } from '@/components/ui';

const KIND_ICON: Record<SearchResult['kind'], typeof BookOpen> = { course: BookOpen, assignment: ClipboardList, material: FolderOpen, user: User, group: Users };

interface Item {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: typeof BookOpen;
  run: () => void;
}

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.activeRole) ?? 'student';
  const setRole = useAuthStore((s) => s.setActiveRole);
  const { resolved, setMode } = useTheme();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebounced(q);
  const { data: results, isFetching } = useSearch(debounced, role);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!useUIStore.getState().commandOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const go = (to: string) => () => {
      setOpen(false);
      navigate(to);
    };
    const needle = q.trim().toLowerCase();
    const pages: Item[] = NAVIGATION[role]
      .flatMap((s) => s.items)
      .filter((i) => !needle || i.label.toLowerCase().includes(needle))
      .map((i) => ({ id: i.to, group: 'Sahifalar', label: i.label, icon: i.icon, run: go(i.to) }));
    const found: Item[] = (results ?? []).map((r) => ({ id: `${r.kind}-${r.id}`, group: 'Natijalar', label: r.title, hint: r.subtitle, icon: KIND_ICON[r.kind], run: go(r.link) }));
    const actions: Item[] = [
      { id: 'theme', group: 'Amallar', label: resolved === 'dark' ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish", icon: resolved === 'dark' ? Sun : Moon, run: () => setMode(resolved === 'dark' ? 'light' : 'dark') },
      ...(user?.roles ?? [])
        .filter((r) => r !== role)
        .map((r) => ({ id: `role-${r}`, group: 'Amallar', label: `${ROLE_META[r].label} paneliga o'tish`, icon: ROLE_META[r].icon, run: () => { setRole(r); go(`/${r}`)(); } })),
    ].filter((a) => !needle || a.label.toLowerCase().includes(needle));
    return [...found, ...pages, ...actions];
  }, [q, results, role, resolved, user, navigate, setOpen, setMode, setRole]);

  useEffect(() => setActive(0), [q, results]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      items[active]?.run();
    } else if (e.key === 'Escape') setOpen(false);
  };

  let lastGroup = '';

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: 'spring', damping: 30, stiffness: 420 }}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-card shadow-lift"
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-line px-5">
              <Search className="size-5 text-muted" />
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nimani qidiryapsiz?" className="h-14 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-muted" />
              {isFetching && <Spinner className="size-4" />}
              <Kbd>Esc</Kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {items.length === 0 && <div className="py-10 text-center text-sm text-muted">Hech narsa topilmadi</div>}
              {items.map((it, i) => {
                const header = it.group !== lastGroup ? it.group : null;
                lastGroup = it.group;
                return (
                  <div key={it.id}>
                    {header && <div className="label-caps px-3 pb-1 pt-3">{header}</div>}
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={it.run}
                      className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition', i === active ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-white' : 'text-fg-soft')}
                    >
                      <span className={cn('grid size-8 place-items-center rounded-lg', i === active ? 'bg-brand-600 text-white' : 'bg-panel text-muted')}>
                        <it.icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold">{it.label}</span>
                        {it.hint && <span className="block truncate text-xs text-muted">{it.hint}</span>}
                      </span>
                      {i === active ? <CornerDownLeft className="size-4 opacity-60" /> : <ArrowRight className="size-4 opacity-0" />}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 border-t border-line bg-panel/50 px-5 py-2.5 text-[11px] text-muted">
              <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> tanlash</span>
              <span className="flex items-center gap-1"><Kbd>Enter</Kbd> ochish</span>
              <span className="ml-auto">Kamida 2 ta harf kiriting</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
