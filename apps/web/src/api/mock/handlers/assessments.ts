import type { Assessment, AssessmentResult, Course, AttemptReview, AttemptView, Question, UpsertAssessmentDto } from '@edu/shared';
import { getDb, idx, touch, uid } from '../db';
import {
  assertCourseAccess,
  assertCourseTeacher,
  assessmentView,
  brief,
  courseStudents,
  courseTitle,
  getCourse,
  isStudentOf,
  notify,
  now,
  studentCourses,
  teacherCourses,
  ts,
} from '../helpers';
import { fail, route } from '../server';

const GRACE_MS = 30_000;

function findAssessment(id: string) {
  return getDb().assessments.find((a) => a.id === id) ?? fail(404, 'Test topilmadi');
}

function findAttempt(id: string) {
  return getDb().results.find((r) => r.id === id) ?? fail(404, 'Urinish topilmadi');
}

export function scoreQuestion(q: Question, answer: string[] | undefined) {
  const ans = answer ?? [];
  if (!ans.length) return 0;
  switch (q.type) {
    case 'single':
    case 'truefalse':
      return ans[0] === q.correct[0] ? q.points : 0;
    case 'multiple': {
      const right = ans.filter((a) => q.correct.includes(a)).length;
      const wrong = ans.length - right;
      return Math.max(0, Math.round(((right - wrong) / q.correct.length) * q.points * 100) / 100);
    }
    case 'short': {
      const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
      return q.correct.some((c) => norm(c) === norm(ans[0])) ? q.points : 0;
    }
  }
}

function attemptDeadline(a: Assessment, r: AssessmentResult) {
  return Math.min(ts(r.startedAt) + a.durationMin * 60_000, ts(a.endsAt));
}

function finish(a: Assessment, r: AssessmentResult) {
  const total = a.questions.reduce((s, q) => s + scoreQuestion(q, r.answers?.[q.id]), 0);
  const raw = a.questions.reduce((s, q) => s + q.points, 0);
  // Normalise to assessment max score if question points don't sum to it
  r.score = raw > 0 ? Math.round(((total / raw) * a.maxScore) * 10) / 10 : 0;
  r.status = 'finished';
  r.finishedAt = new Date(Math.min(now(), attemptDeadline(a, r))).toISOString();
  touch();
}

/** Lazily close attempts whose time ran out (the server-side timer). */
function finalizeExpired(studentId?: string) {
  const t = now();
  let changed = false;
  for (const r of getDb().results) {
    if (r.status !== 'in_progress' || (studentId && r.studentId !== studentId)) continue;
    const a = idx().course.has(r.courseId) ? getDb().assessments.find((x) => x.id === r.assessmentId) : undefined;
    if (a && t > attemptDeadline(a, r) + GRACE_MS) {
      finish(a, r);
      changed = true;
    }
  }
  return changed;
}

function attemptView(a: Assessment, r: AssessmentResult): AttemptView {
  const order = r.order ?? a.questions.map((q) => q.id);
  const byId = new Map(a.questions.map((q) => [q.id, q]));
  return {
    result: r,
    assessment: { id: a.id, title: a.title, durationMin: a.durationMin, maxScore: a.maxScore, endsAt: a.endsAt, courseTitle: courseTitle(getCourse(a.courseId)) },
    questions: order
      .map((id) => byId.get(id))
      .filter((q): q is Question => !!q)
      .map((q) => ({ id: q.id, type: q.type, text: q.text, options: q.options, points: q.points })),
    deadline: new Date(attemptDeadline(a, r)).toISOString(),
  };
}

function validate(dto: UpsertAssessmentDto) {
  if (ts(dto.endsAt) <= ts(dto.startsAt)) fail(400, "Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak", { endsAt: "Noto'g'ri sana" });
  if (dto.format === 'test' && dto.status === 'published' && !dto.questions.length) fail(400, "Test uchun kamida bitta savol qo'shing");
  for (const q of dto.questions) {
    if (!q.text.trim()) fail(400, "Savol matni bo'sh bo'lmasligi kerak");
    if (q.type !== 'short' && !q.correct.length) fail(400, `«${q.text.slice(0, 40)}» savoli uchun to'g'ri javob belgilanmagan`);
  }
}

/* ───────────── CRUD ───────────── */

route('GET', '/assessments', ({ query, me }) => {
  finalizeExpired(query.as === 'student' ? me.id : undefined);
  let courses: Course[];
  if (query.courseId) {
    const c = getCourse(query.courseId);
    assertCourseAccess(me, c);
    courses = [c];
  } else if (query.as === 'student') courses = studentCourses(me);
  else if (query.as === 'teacher') courses = teacherCourses(me.id);
  else if (me.roles.includes('admin')) courses = getDb().courses;
  else courses = [];
  const ids = new Set(courses.map((c) => c.id));
  const studentView = query.as === 'student';
  return getDb()
    .assessments.filter((a) => ids.has(a.courseId) && (!studentView || a.status === 'published') && (!query.category || a.category === query.category) && (!query.format || a.format === query.format))
    .sort((a, b) => ts(a.startsAt) - ts(b.startsAt))
    .map((a) => assessmentView(a, me));
});

route('GET', '/assessments/:id', ({ params, me }) => {
  const a = findAssessment(params.id);
  const c = getCourse(a.courseId);
  assertCourseAccess(me, c);
  finalizeExpired(me.id);
  return assessmentView(a, me, true);
});

route('POST', '/assessments', ({ body, me }) => {
  const dto = body as UpsertAssessmentDto;
  const c = getCourse(dto.courseId);
  assertCourseTeacher(me, c);
  validate(dto);
  const a: Assessment = { id: uid('as'), ...dto, createdAt: new Date().toISOString(), createdBy: me.id };
  getDb().assessments.push(a);
  touch();
  if (a.status === 'published') notify(courseStudents(c).map((s) => s.id), 'test', a.format === 'test' ? 'Yangi test' : 'Nazorat ishi e’lon qilindi', `${courseTitle(c)}: ${a.title}`, '/student/tests');
  return assessmentView(a, me, true);
});

route('PATCH', '/assessments/:id', ({ params, body, me }) => {
  const a = findAssessment(params.id);
  const c = getCourse(a.courseId);
  assertCourseTeacher(me, c);
  const wasDraft = a.status === 'draft';
  const next = { ...a, ...body, id: a.id, courseId: a.courseId } as Assessment;
  validate(next);
  Object.assign(a, next);
  touch();
  if (wasDraft && a.status === 'published') notify(courseStudents(c).map((s) => s.id), 'test', 'Yangi test', `${courseTitle(c)}: ${a.title}`, '/student/tests');
  return assessmentView(a, me, true);
});

route('DELETE', '/assessments/:id', ({ params, me }) => {
  const db = getDb();
  const a = findAssessment(params.id);
  assertCourseTeacher(me, getCourse(a.courseId));
  db.assessments = db.assessments.filter((x) => x.id !== a.id);
  db.results = db.results.filter((r) => r.assessmentId !== a.id);
  touch();
});

/* ───────────── Taking a test ───────────── */

route('POST', '/assessments/:id/start', ({ params, me }) => {
  const a = findAssessment(params.id);
  const c = getCourse(a.courseId);
  if (!isStudentOf(me, c)) fail(403, 'Siz bu kurs talabasi emassiz');
  if (a.format !== 'test') fail(400, 'Bu nazorat onlayn topshirilmaydi');
  if (a.status !== 'published') fail(404, 'Test topilmadi');
  finalizeExpired(me.id);
  const t = now();
  if (t < ts(a.startsAt)) fail(400, 'Test hali boshlanmagan');
  if (t > ts(a.endsAt)) fail(400, 'Test muddati tugagan');
  const mine = getDb().results.filter((r) => r.assessmentId === a.id && r.studentId === me.id);
  const active = mine.find((r) => r.status === 'in_progress');
  if (active) return attemptView(a, active);
  if (mine.length >= a.attempts) fail(400, 'Urinishlar soni tugagan');
  const ids = a.questions.map((q) => q.id);
  if (a.shuffle) ids.sort(() => Math.random() - 0.5);
  const r: AssessmentResult = { id: uid('res'), assessmentId: a.id, courseId: c.id, studentId: me.id, status: 'in_progress', attempt: mine.length + 1, startedAt: new Date().toISOString(), finishedAt: null, answers: {}, order: ids, score: null };
  getDb().results.push(r);
  touch();
  return attemptView(a, r);
});

route('GET', '/attempts/:id', ({ params, me }) => {
  const r = findAttempt(params.id);
  if (r.studentId !== me.id) fail(403, "Ruxsat yo'q");
  const a = findAssessment(r.assessmentId);
  finalizeExpired(me.id);
  return attemptView(a, r);
});

route('PUT', '/attempts/:id/answers', ({ params, body, me }) => {
  const r = findAttempt(params.id);
  if (r.studentId !== me.id) fail(403, "Ruxsat yo'q");
  if (r.status !== 'in_progress') fail(409, 'Urinish yakunlangan');
  const a = findAssessment(r.assessmentId);
  r.answers = { ...r.answers, ...(body.answers as Record<string, string[]>) };
  if (now() > attemptDeadline(a, r) + GRACE_MS) finish(a, r);
  return { savedAt: new Date().toISOString(), status: r.status };
});

function review(a: Assessment, r: AssessmentResult, full: boolean): AttemptReview {
  const view = assessmentView(a, idx().user.get(r.studentId)!);
  return {
    result: r,
    assessment: view,
    questions: full ? a.questions.map((q) => ({ ...q, earned: scoreQuestion(q, r.answers?.[q.id]) })) : undefined,
  };
}

route('POST', '/attempts/:id/finish', ({ params, body, me }) => {
  const r = findAttempt(params.id);
  if (r.studentId !== me.id) fail(403, "Ruxsat yo'q");
  const a = findAssessment(r.assessmentId);
  if (r.status === 'in_progress') {
    if (body?.answers) r.answers = { ...r.answers, ...(body.answers as Record<string, string[]>) };
    finish(a, r);
    notify([getCourse(a.courseId).teacherId], 'test', 'Test topshirildi', `${me.lastName} ${me.firstName}: ${a.title} — ${r.score}/${a.maxScore}`, `/teacher/tests/${a.id}/results`);
  }
  return review(a, r, a.showResults);
});

route('GET', '/attempts/:id/review', ({ params, me }) => {
  const r = findAttempt(params.id);
  const a = findAssessment(r.assessmentId);
  const c = getCourse(a.courseId);
  const isTeacher = c.teacherId === me.id || me.roles.includes('admin');
  if (r.studentId !== me.id && !isTeacher) fail(403, "Ruxsat yo'q");
  return review(a, r, isTeacher || a.showResults);
});

/* ───────────── Results (teacher) ───────────── */

route('GET', '/assessments/:id/results', ({ params, me }) => {
  const a = findAssessment(params.id);
  const c = getCourse(a.courseId);
  assertCourseTeacher(me, c);
  finalizeExpired();
  const results = getDb().results.filter((r) => r.assessmentId === a.id);
  return courseStudents(c).map((s) => {
    const mine = results.filter((r) => r.studentId === s.id);
    const best = mine.reduce<AssessmentResult | null>((b, r) => (!b || (r.score ?? -1) > (b.score ?? -1) ? r : b), null);
    return { student: { ...brief(s), groupName: idx().group.get(s.student?.groupId ?? '')?.name ?? '' }, result: best, attempts: mine.length };
  });
});

route('PUT', '/assessments/:id/scores', ({ params, body, me }) => {
  const a = findAssessment(params.id);
  const c = getCourse(a.courseId);
  assertCourseTeacher(me, c);
  const scores = body.scores as Record<string, number | null>;
  const db = getDb();
  const changed: string[] = [];
  for (const [studentId, score] of Object.entries(scores)) {
    if (score != null && (score < 0 || score > a.maxScore)) fail(400, `Ball 0..${a.maxScore} oralig'ida bo'lishi kerak`);
    let r = db.results.find((x) => x.assessmentId === a.id && x.studentId === studentId);
    if (score == null) {
      if (r) db.results = db.results.filter((x) => x !== r);
      continue;
    }
    if (!r) {
      r = { id: uid('res'), assessmentId: a.id, courseId: c.id, studentId, status: 'graded', attempt: 1, startedAt: a.startsAt, finishedAt: a.endsAt, score };
      db.results.push(r);
    } else {
      r.score = score;
      r.status = r.status === 'in_progress' ? 'finished' : r.status === 'finished' ? 'finished' : 'graded';
    }
    changed.push(studentId);
  }
  touch();
  if (changed.length) notify(changed, 'grade', 'Nazorat natijasi', `${courseTitle(c)}: «${a.title}» bo'yicha ball qo'yildi`, '/student/grades');
  return { updated: changed.length };
});
