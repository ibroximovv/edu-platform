import type { AssessmentCategory, GradingScheme, PairTime, SystemSettings } from './types';
import type { CourseScore } from './views';

export const DEFAULT_GRADING: GradingScheme = { current: 40, midterm: 30, final: 30 };

export const DEFAULT_PAIR_TIMES: PairTime[] = [
  { pair: 1, start: '08:30', end: '09:50' },
  { pair: 2, start: '10:00', end: '11:20' },
  { pair: 3, start: '11:30', end: '12:50' },
  { pair: 4, start: '13:30', end: '14:50' },
  { pair: 5, start: '15:00', end: '16:20' },
  { pair: 6, start: '16:30', end: '17:50' },
];

export const DEFAULT_SETTINGS: SystemSettings = {
  universityName: 'Toshkent Axborot Texnologiyalari Universiteti',
  registration: { enabled: true, requireApproval: true, allowedDomains: [] },
  grading: DEFAULT_GRADING,
  pairTimes: DEFAULT_PAIR_TIMES,
  upload: { maxFileSizeMb: 50, maxVideoSizeMb: 500 },
};

/** 5 ballik baho: 86+ → 5, 71+ → 4, 55+ → 3, aks holda 2 */
export function gradeFromTotal(total: number): 2 | 3 | 4 | 5 {
  if (total >= 86) return 5;
  if (total >= 71) return 4;
  if (total >= 55) return 3;
  return 2;
}

export const GRADE_LABELS: Record<number, string> = {
  5: "A'lo",
  4: 'Yaxshi',
  3: 'Qoniqarli',
  2: 'Qoniqarsiz',
};

/** 100 ballik natijani GPA (4.0) shkalasiga o'tkazish */
export function gpaFromTotal(total: number): number {
  if (total >= 90) return 4;
  if (total >= 86) return 3.7;
  if (total >= 80) return 3.3;
  if (total >= 75) return 3;
  if (total >= 71) return 2.7;
  if (total >= 65) return 2.3;
  if (total >= 60) return 2;
  if (total >= 55) return 1.7;
  return 0;
}

export interface ScoreItem {
  category: AssessmentCategory;
  earned: number | null;
  max: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Kurs bo'yicha yakuniy ballni hisoblash.
 * Har bir kategoriya (JN/ON/YN) bo'yicha to'plangan ball ulushi sxema vazniga ko'paytiriladi.
 * Baholanmagan (null) elementlar 0 hisoblanadi, lekin maksimalga qo'shiladi.
 */
export function computeCourseScore(scheme: GradingScheme, items: ScoreItem[]): CourseScore {
  const acc: Record<AssessmentCategory, { earned: number; max: number }> = {
    current: { earned: 0, max: 0 },
    midterm: { earned: 0, max: 0 },
    final: { earned: 0, max: 0 },
  };
  for (const item of items) {
    acc[item.category].earned += item.earned ?? 0;
    acc[item.category].max += item.max;
  }
  const part = (c: AssessmentCategory) => (acc[c].max > 0 ? (acc[c].earned / acc[c].max) * scheme[c] : 0);
  const current = round1(part('current'));
  const midterm = round1(part('midterm'));
  const final = round1(part('final'));
  const total = round1(current + midterm + final);
  const weights = (['current', 'midterm', 'final'] as const).reduce((w, c) => w + (acc[c].max > 0 ? scheme[c] : 0), 0);
  const percent = weights ? round1((total / weights) * 100) : 0;
  return { current, midterm, final, total, percent, grade: gradeFromTotal(percent) };
}

export function weightedGpa(entries: { total: number; credits: number }[]): number {
  const credits = entries.reduce((s, e) => s + e.credits, 0);
  if (!credits) return 0;
  const sum = entries.reduce((s, e) => s + gpaFromTotal(e.total) * e.credits, 0);
  return Math.round((sum / credits) * 100) / 100;
}
