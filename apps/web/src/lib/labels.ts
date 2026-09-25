import type { AssessmentCategory, AssessmentFormat, AssignmentType, AttendanceStatus, EducationForm, EducationLang, LessonType, QuestionType, TeacherPosition, UserStatus } from '@edu/shared';

export const LESSON_TYPE: Record<LessonType, string> = { lecture: "Ma'ruza", practice: 'Amaliy', lab: 'Laboratoriya', seminar: 'Seminar' };
export const ASSIGNMENT_TYPE: Record<AssignmentType, string> = { homework: 'Uy vazifasi', lab: 'Laboratoriya', project: 'Loyiha', essay: 'Referat', practice: 'Amaliy ish' };
export const CATEGORY: Record<AssessmentCategory, string> = { current: 'Joriy nazorat', midterm: 'Oraliq nazorat', final: 'Yakuniy nazorat' };
export const CATEGORY_SHORT: Record<AssessmentCategory, string> = { current: 'JN', midterm: 'ON', final: 'YN' };
export const FORMAT: Record<AssessmentFormat, string> = { test: 'Test', written: 'Yozma ish', oral: "Og'zaki" };
export const QUESTION_TYPE: Record<QuestionType, string> = { single: 'Bitta javob', multiple: "Bir nechta javob", truefalse: "To'g'ri / Noto'g'ri", short: 'Qisqa javob' };
export const POSITION: Record<TeacherPosition, string> = { assistant: 'Assistent', senior: "Katta o'qituvchi", docent: 'Dotsent', professor: 'Professor', head: 'Kafedra mudiri' };
export const EDU_FORM: Record<EducationForm, string> = { fulltime: 'Kunduzgi', parttime: 'Sirtqi', evening: 'Kechki' };
export const EDU_LANG: Record<EducationLang, string> = { uz: "O'zbek", ru: 'Rus', en: 'Ingliz' };
export const USER_STATUS: Record<UserStatus, string> = { active: 'Faol', pending: 'Kutilmoqda', blocked: 'Bloklangan' };
export const ATTENDANCE: Record<AttendanceStatus, { label: string; short: string; tone: string }> = {
  present: { label: 'Keldi', short: '+', tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  late: { label: 'Kechikdi', short: 'K', tone: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  absent: { label: 'Kelmadi', short: 'NB', tone: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
  excused: { label: 'Sababli', short: 'S', tone: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
};
export const GRADE_TONE: Record<number, 'green' | 'sky' | 'amber' | 'red'> = { 5: 'green', 4: 'sky', 3: 'amber', 2: 'red' };
