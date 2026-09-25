import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useUIStore, type ThemeMode } from '@/stores/ui.store';

interface ThemeCtx {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

function systemDark() {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useUIStore((s) => s.theme);
  const setMode = useUIStore((s) => s.setTheme);
  const [sysDark, setSysDark] = useState(systemDark);

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSysDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved = mode === 'system' ? (sysDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('[&_*]:!transition-none');
    root.classList.toggle('dark', resolved === 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0b0b12' : '#6a58e6');
    const t = setTimeout(() => root.classList.remove('[&_*]:!transition-none'), 50);
    return () => clearTimeout(t);
  }, [resolved]);

  return <ThemeContext.Provider value={{ mode, resolved, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
