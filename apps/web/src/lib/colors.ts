import type { SubjectColor } from '@edu/shared';

/** Static class maps so Tailwind can see every class at build time. */
export const SUBJECT_COLORS: Record<SubjectColor, { soft: string; text: string; solid: string; gradient: string; ring: string; hex: string }> = {
  violet: { soft: 'bg-violet-100 dark:bg-violet-500/15', text: 'text-violet-600 dark:text-violet-300', solid: 'bg-violet-500', gradient: 'from-violet-500 via-purple-500 to-fuchsia-500', ring: 'ring-violet-200 dark:ring-violet-500/30', hex: '#8b5cf6' },
  pink: { soft: 'bg-pink-100 dark:bg-pink-500/15', text: 'text-pink-600 dark:text-pink-300', solid: 'bg-pink-500', gradient: 'from-pink-500 via-rose-400 to-orange-300', ring: 'ring-pink-200 dark:ring-pink-500/30', hex: '#ec4899' },
  sky: { soft: 'bg-sky-100 dark:bg-sky-500/15', text: 'text-sky-600 dark:text-sky-300', solid: 'bg-sky-500', gradient: 'from-sky-500 via-cyan-400 to-teal-300', ring: 'ring-sky-200 dark:ring-sky-500/30', hex: '#0ea5e9' },
  emerald: { soft: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-300', solid: 'bg-emerald-500', gradient: 'from-emerald-500 via-green-400 to-lime-300', ring: 'ring-emerald-200 dark:ring-emerald-500/30', hex: '#10b981' },
  amber: { soft: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-600 dark:text-amber-300', solid: 'bg-amber-500', gradient: 'from-amber-500 via-orange-400 to-yellow-300', ring: 'ring-amber-200 dark:ring-amber-500/30', hex: '#f59e0b' },
  rose: { soft: 'bg-rose-100 dark:bg-rose-500/15', text: 'text-rose-600 dark:text-rose-300', solid: 'bg-rose-500', gradient: 'from-rose-500 via-pink-500 to-purple-400', ring: 'ring-rose-200 dark:ring-rose-500/30', hex: '#f43f5e' },
  indigo: { soft: 'bg-indigo-100 dark:bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-300', solid: 'bg-indigo-500', gradient: 'from-indigo-600 via-blue-500 to-sky-400', ring: 'ring-indigo-200 dark:ring-indigo-500/30', hex: '#6366f1' },
  teal: { soft: 'bg-teal-100 dark:bg-teal-500/15', text: 'text-teal-600 dark:text-teal-300', solid: 'bg-teal-500', gradient: 'from-teal-500 via-emerald-400 to-cyan-300', ring: 'ring-teal-200 dark:ring-teal-500/30', hex: '#14b8a6' },
  orange: { soft: 'bg-orange-100 dark:bg-orange-500/15', text: 'text-orange-600 dark:text-orange-300', solid: 'bg-orange-500', gradient: 'from-orange-500 via-amber-400 to-rose-400', ring: 'ring-orange-200 dark:ring-orange-500/30', hex: '#f97316' },
  cyan: { soft: 'bg-cyan-100 dark:bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-300', solid: 'bg-cyan-500', gradient: 'from-cyan-500 via-sky-400 to-indigo-400', ring: 'ring-cyan-200 dark:ring-cyan-500/30', hex: '#06b6d4' },
};

export const SUBJECT_COLOR_KEYS = Object.keys(SUBJECT_COLORS) as SubjectColor[];
