import {
  computeCourseScore,
  gpaFromTotal,
  gradeFromTotal,
  type AssessmentResult,
  weightedGpa,
  type Assessment,
  type AssessmentView,
  type Assignment,
  type AssignmentView,
  type Course,
  type CourseScore,
  type CourseView,
  type Notification,
  type NotificationType,
  type RatingEntry,
  type ScheduleItem,
  type ScheduleSlot,
  type ScoreItem,
  type Semester,
  type StudentCourseGrade,
  type Submission,
  type SubmissionView,
  type User,
  type UserBrief,
} from '@edu/shared';
import { emitRealtime } from '../realtime';
import { getDb, idx, uid, type DbUser } from './db';
import { fail } from './server';

export const now = () => Date.now();
export const ts = (iso?: string | null) => (iso ? new Date(iso).getTime() : 0);

export function brief(u: User | undefined | null): UserBrief {
  if (!u) return { id: 'unknown', firstName: "O'chirilgan", lastName: 'foydalanuvchi', email: '', avatarUrl: null };
  return { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, avatarUrl: u.avatarUrl ?? null };
}

export function publicUser(u: DbUser): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = u;
  return rest;
}

export function currentSemester(): Semester {
  const db = getDb();
  return db.semesters.find((s) => s.isCurrent) ?? db.semesters[db.semesters.length - 1];
}

export function semesterFromQuery(q: Record<string, string>) {
  return q.semesterId ? idx().semester.get(q.semesterId) ?? currentSemester() : currentSemester();
}

export function courseTitle(c: Course) {
  return idx().subject.get(c.subjectId)?.name ?? 'Fan';
}

export function courseColor(c: Course) {
  return idx().subject.get(c.subjectId)?.color ?? 'violet';
}

export function getCourse(id: string) {
  const c = idx().course.get(id);
  if (!c) fail(404, 'Kurs topilmadi');
  return c!;
}

export function courseStudents(c: Course): DbUser[] {
  const i = idx();
  return c.groupIds.flatMap((g) => i.studentsByGroup.get(g) ?? []);
}

export function isStudentOf(user: DbUser, c: Course) {
  return !!user.student?.groupId && user.roles.includes('student') && c.groupIds.includes(user.student.groupId);
}

export function isTeacherOf(user: DbUser, c: Course) {
  return c.teacherId === user.id;
}

/** Read access: admin, course teacher, or enrolled student */
export function assertCourseAccess(user: DbUser, c: Course) {
  if (user.roles.includes('admin') || isTeacherOf(user, c) || isStudentOf(user, c)) return;
  fail(403, "Bu kursga kirish huquqingiz yo'q");
}

/** Write access: admin or course teacher */
export function assertCourseTeacher(user: DbUser, c: Course) {
  if (user.roles.includes('admin') || isTeacherOf(user, c)) return;
  fail(403, "Faqat kurs o'qituvchisi bu amalni bajara oladi");
}

export function studentCourses(user: DbUser, semesterId = currentSemester().id) {
  const gid = user.student?.groupId;
  if (!gid) return [];
  return getDb().courses.filter((c) => c.semesterId === semesterId && c.groupIds.includes(gid));
}

export function teacherCourses(userId: string, semesterId = currentSemester().id) {
  return getDb().courses.filter((c) => c.semesterId === semesterId && c.teacherId === userId);
}

/* ───────────── Scores ───────────── */

export interface ScoreDetail extends ScoreItem {
  id: string;
  title: string;
  date: string;
  kind: 'assignment' | 'assessment';
}

export function bestResult(assessmentId: string, studentId: string) {
  let best: AssessmentResult | null = null;
  for (const r of idx().resultsByAssessment.get(assessmentId) ?? []) {
    if (r.studentId !== studentId) continue;
    if (!best || (r.score != null && (best.score == null || r.score > best.score))) best = r;
  }
  return best;
}

export function submissionOf(assignmentId: string, studentId: string) {
  return (idx().submissionsByAssignment.get(assignmentId) ?? []).find((s) => s.studentId === studentId) ?? null;
}

/** All gradable items of a course with the student's result. `counted` = contributes to score now. */
export function scoreDetails(c: Course, studentId: string): (ScoreDetail & { counted: boolean })[] {
  const db = getDb();
  const t = now();
  const out: (ScoreDetail & { counted: boolean })[] = [];
  for (const a of db.assignments) {
    if (a.courseId !== c.id || a.status !== 'published') continue;
    const sub = submissionOf(a.id, studentId);
    const graded = sub?.status === 'graded' && sub.score != null;
    const missed = !sub && ts(a.deadline) < t;
    out.push({ id: a.id, kind: 'assignment', title: a.title, category: 'current', max: a.maxScore, earned: graded ? sub!.score! : missed ? 0 : null, date: a.deadline, counted: graded || missed });
  }
  for (const a of db.assessments) {
    if (a.courseId !== c.id || a.status !== 'published') continue;
    const r = bestResult(a.id, studentId);
    const has = r?.score != null && r.status !== 'in_progress';
    const missed = !r && ts(a.endsAt) < t;
    out.push({ id: a.id, kind: 'assessment', title: a.title, category: a.category, max: a.maxScore, earned: has ? r!.score! : missed ? 0 : null, date: a.startsAt, counted: has || missed });
  }
  return out;
}

export function courseScore(c: Course, studentId: string): CourseScore {
  return computeCourseScore(c.grading, scoreDetails(c, studentId).filter((d) => d.counted));
}

export function attendanceRate(courseId: string, studentId: string) {
  const sessions = idx().attendanceByCourse.get(courseId) ?? [];
  let total = 0;
  let ok = 0;
  for (const s of sessions) {
    const st = s.records[studentId];
    if (!st) continue;
    total++;
    if (st === 'present' || st === 'late' || st === 'excused') ok++;
  }
  return total ? Math.round((ok / total) * 100) : 100;
}

export function studentSemesterGrades(user: DbUser, semesterId: string): StudentCourseGrade[] {
  const i = idx();
  const db = getDb();
  const sem = i.semester.get(semesterId);
  if (!sem) return [];
  if (sem.isCurrent) {
    return studentCourses(user, semesterId).map((c) => {
      const subject = i.subject.get(c.subjectId)!;
      const details = scoreDetails(c, user.id);
      return {
        courseId: c.id,
        subject,
        teacher: brief(i.user.get(c.teacherId)),
        score: computeCourseScore(c.grading, details.filter((d) => d.counted)),
        credits: subject.credits,
        items: details
          .sort((a, b) => ts(a.date) - ts(b.date))
          .map((d) => ({ title: d.title, category: d.category, score: d.earned, maxScore: d.max, date: d.date })),
        attendance: attendanceRate(c.id, user.id),
      };
    });
  }
  return db.gradeRecords
    .filter((r) => r.studentId === user.id && r.semesterId === semesterId)
    .map((r) => ({
      courseId: null,
      subject: i.subject.get(r.subjectId)!,
      teacher: null,
      score: { current: r.current, midterm: r.midterm, final: r.final, total: r.total, percent: r.total, grade: gradeFromTotal(r.total) },
      credits: r.credits,
      items: [],
      attendance: 100,
    }));
}

export function summarize(grades: StudentCourseGrade[]) {
  if (!grades.length) return { average: 0, gpa: 0, credits: 0 };
  const average = Math.round((grades.reduce((s, g) => s + g.score.percent, 0) / grades.length) * 10) / 10;
  const gpa = weightedGpa(grades.map((g) => ({ total: g.score.percent, credits: g.credits })));
  return { average, gpa, credits: grades.reduce((s, g) => s + g.credits, 0) };
}

/* ───────────── Rating ───────────── */

export function ratingFor(students: DbUser[], semesterId: string): RatingEntry[] {
  const i = idx();
  const db = getDb();
  const sem = i.semester.get(semesterId);
  const prevSem = sem ? db.semesters.filter((s) => ts(s.endDate) < ts(sem.startDate)).sort((a, b) => ts(b.endDate) - ts(a.endDate))[0] : undefined;
  const entries = students
    .filter((s) => s.status === 'active' && s.student?.groupId)
    .map((s) => {
      const grades = studentSemesterGrades(s, semesterId);
      const { average, gpa, credits } = summarize(grades);
      const prev = prevSem ? db.gradeRecords.filter((r) => r.studentId === s.id && r.semesterId === prevSem.id) : [];
      const prevAvg = prev.length ? prev.reduce((a, r) => a + r.total, 0) / prev.length : average;
      const group = i.group.get(s.student!.groupId!);
      return {
        rank: 0,
        student: { ...brief(s), groupName: group?.name ?? '—', facultyShortName: group ? i.faculty.get(group.facultyId)?.shortName ?? '' : '' },
        average,
        gpa,
        credits,
        trend: Math.round((average - prevAvg) * 10) / 10,
      };
    })
    .filter((e) => e.credits > 0)
    .sort((a, b) => b.average - a.average || b.gpa - a.gpa);
  entries.forEach((e, n) => (e.rank = n + 1));
  return entries;
}

export { gpaFromTotal };

/* ───────────── Views ───────────── */

export function courseView(c: Course, viewer?: DbUser | null): CourseView {
  const i = idx();
  const db = getDb();
  const topics = db.topics.filter((t) => t.courseId === c.id);
  const assignments = db.assignments.filter((a) => a.courseId === c.id && a.status === 'published');
  const pendingReviews = assignments.reduce((n, a) => n + (i.submissionsByAssignment.get(a.id) ?? []).filter((s) => s.status === 'submitted').length, 0);
  const view: CourseView = {
    ...c,
    subject: i.subject.get(c.subjectId)!,
    teacher: brief(i.user.get(c.teacherId)),
    groups: c.groupIds.map((g) => i.group.get(g)).filter(Boolean) as CourseView['groups'],
    semester: i.semester.get(c.semesterId) ?? null,
    stats: {
      students: courseStudents(c).length,
      topicsTotal: topics.length,
      topicsDone: topics.filter((t) => t.status === 'done').length,
      assignments: assignments.length,
      pendingReviews,
      materials: db.materials.filter((m) => m.courseId === c.id).length,
    },
  };
  if (viewer && isStudentOf(viewer, c)) {
    const details = scoreDetails(c, viewer.id);
    const done = details.filter((d) => d.earned != null || (d.kind === 'assignment' && submissionOf(d.id, viewer.id))).length;
    view.myProgress = details.length ? Math.round((done / details.length) * 100) : 0;
    view.myTotal = computeCourseScore(c.grading, details.filter((d) => d.counted)).percent;
  }
  return view;
}

export function assignmentView(a: Assignment, viewer: DbUser): AssignmentView {
  const c = idx().course.get(a.courseId)!;
  const view: AssignmentView = { ...a, course: { id: c.id, title: courseTitle(c), color: courseColor(c) } };
  if (isStudentOf(viewer, c)) view.mySubmission = submissionOf(a.id, viewer.id);
  if (isTeacherOf(viewer, c) || viewer.roles.includes('admin')) {
    const subs = idx().submissionsByAssignment.get(a.id) ?? [];
    view.counts = { submitted: subs.length, graded: subs.filter((s) => s.status === 'graded').length, students: courseStudents(c).length };
  }
  return view;
}

export function submissionView(s: Submission): SubmissionView {
  const i = idx();
  const st = i.user.get(s.studentId);
  const a = getDb().assignments.find((x) => x.id === s.assignmentId)!;
  const c = i.course.get(s.courseId)!;
  return {
    ...s,
    student: { ...brief(st), groupName: st?.student?.groupId ? i.group.get(st.student.groupId)?.name : undefined },
    assignment: { id: a.id, title: a.title, maxScore: a.maxScore, deadline: a.deadline },
    courseTitle: courseTitle(c),
  };
}

export function assessmentView(a: Assessment, viewer: DbUser, withQuestions = false): AssessmentView {
  const i = idx();
  const c = i.course.get(a.courseId)!;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { questions, ...rest } = a;
  const view: AssessmentView = { ...rest, course: { id: c.id, title: courseTitle(c), color: courseColor(c) }, questionCount: questions.length };
  const canManage = isTeacherOf(viewer, c) || viewer.roles.includes('admin');
  if (withQuestions && canManage) view.questions = questions;
  if (isStudentOf(viewer, c)) {
    const mine = (i.resultsByAssessment.get(a.id) ?? []).filter((r) => r.studentId === viewer.id);
    view.attemptsUsed = mine.length;
    view.myResult = mine.find((r) => r.status === 'in_progress') ?? bestResult(a.id, viewer.id);
    if (view.myResult && !a.showResults) view.myResult = { ...view.myResult, answers: undefined };
  }
  if (canManage) {
    const results = (i.resultsByAssessment.get(a.id) ?? []).filter((r) => r.score != null && r.status !== 'in_progress');
    const byStudent = new Map<string, number>();
    for (const r of results) byStudent.set(r.studentId, Math.max(byStudent.get(r.studentId) ?? 0, r.score!));
    const scores = [...byStudent.values()];
    view.counts = {
      finished: byStudent.size,
      students: courseStudents(c).length,
      avgScore: scores.length ? Math.round((scores.reduce((x, y) => x + y, 0) / scores.length) * 10) / 10 : null,
    };
  }
  return view;
}

export function scheduleItem(slot: ScheduleSlot): ScheduleItem {
  const i = idx();
  const c = i.course.get(slot.courseId)!;
  const s = i.subject.get(c.subjectId)!;
  return {
    ...slot,
    subject: { id: s.id, name: s.name, code: s.code, color: s.color },
    teacher: brief(i.user.get(c.teacherId)),
    groups: slot.groupIds.map((g) => ({ id: g, name: i.group.get(g)?.name ?? '—' })),
  };
}

/* ───────────── Side effects ───────────── */

export function notify(userIds: string[], type: NotificationType, title: string, body: string, link?: string) {
  const db = getDb();
  const createdAt = new Date().toISOString();
  for (const userId of new Set(userIds)) {
    const n: Notification = { id: uid('ntf'), userId, type, title, body, link: link ?? null, read: false, createdAt };
    db.notifications.unshift(n);
    emitRealtime('notification', n);
  }
}

export function logActivity(text: string, kind: string) {
  getDb().activity.unshift({ id: uid('act'), text, kind, at: new Date().toISOString() });
  getDb().activity.length = Math.min(getDb().activity.length, 60);
}

export function paginate<T>(items: T[], q: Record<string, string>) {
  const page = Math.max(1, Number(q.page ?? 1));
  const limit = Math.min(200, Math.max(1, Number(q.limit ?? 20)));
  return { items: items.slice((page - 1) * limit, page * limit), total: items.length, page, limit };
}

export function matches(q: string | undefined, ...fields: (string | undefined | null)[]) {
  if (!q) return true;
  const needle = q.toLowerCase().trim();
  return fields.some((f) => f?.toLowerCase().includes(needle));
}
