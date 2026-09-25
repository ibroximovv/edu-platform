import { computeCourseScore, type AttendanceSession, type AttendanceView, type Gradebook, type GradebookColumn, type RatingScope } from '@edu/shared';
import { getDb, idx, touch, uid, type DbUser } from '../db';
import {
  assertCourseAccess,
  assertCourseTeacher,
  attendanceRate,
  brief,
  courseStudents,
  courseView,
  currentSemester,
  getCourse,
  ratingFor,
  scoreDetails,
  semesterFromQuery,
  studentSemesterGrades,
  summarize,
  ts,
} from '../helpers';
import { fail, route } from '../server';

route('GET', '/courses/:id/gradebook', ({ params, me }) => {
  const c = getCourse(params.id);
  assertCourseTeacher(me, c);
  const db = getDb();
  const i = idx();
  const columns: GradebookColumn[] = [
    ...db.assignments.filter((a) => a.courseId === c.id && a.status === 'published').map<GradebookColumn>((a) => ({ id: a.id, kind: 'assignment', title: a.title, category: 'current', maxScore: a.maxScore, date: a.deadline })),
    ...db.assessments.filter((a) => a.courseId === c.id && a.status === 'published').map<GradebookColumn>((a) => ({ id: a.id, kind: 'assessment', title: a.title, category: a.category, format: a.format, maxScore: a.maxScore, date: a.startsAt })),
  ].sort((a, b) => ['current', 'midterm', 'final'].indexOf(a.category) - ['current', 'midterm', 'final'].indexOf(b.category) || ts(a.date) - ts(b.date));

  const rows = courseStudents(c).map((s) => {
    const details = scoreDetails(c, s.id);
    const cells: Record<string, number | null> = {};
    for (const d of details) cells[d.id] = d.earned;
    return {
      student: { ...brief(s), groupName: i.group.get(s.student?.groupId ?? '')?.name ?? '', recordBook: s.student?.recordBook ?? '' },
      cells,
      score: computeCourseScore(c.grading, details.filter((d) => d.counted)),
      attendance: attendanceRate(c.id, s.id),
    };
  });
  const book: Gradebook = { course: courseView(c), columns, rows };
  return book;
});

route('GET', '/grades/me', ({ query, me }) => {
  const semester = semesterFromQuery(query);
  const courses = studentSemesterGrades(me, semester.id);
  const { average, gpa } = summarize(courses);
  return { semester, courses, average, gpa };
}, ['student']);

route('GET', '/grades/history', ({ me }) => {
  const db = getDb();
  const cur = currentSemester();
  return db.semesters
    .filter((s) => ts(s.startDate) <= ts(cur.startDate))
    .sort((a, b) => ts(a.startDate) - ts(b.startDate))
    .map((s) => ({ semester: s, ...summarize(studentSemesterGrades(me, s.id)) }))
    .filter((x) => x.credits > 0);
}, ['student']);

function ratingPool(scope: RatingScope, me: DbUser, query: Record<string, string>) {
  const i = idx();
  const db = getDb();
  const students = db.users.filter((u) => u.roles.includes('student') && u.status === 'active' && u.student?.groupId);
  const myGroup = query.groupId ? i.group.get(query.groupId) : me.student?.groupId ? i.group.get(me.student.groupId) : undefined;
  switch (scope) {
    case 'group':
      if (!myGroup) return { pool: [], label: 'Guruh tanlanmagan' };
      return { pool: students.filter((s) => s.student!.groupId === myGroup.id), label: `${myGroup.name} guruhi` };
    case 'faculty': {
      const facultyId = query.facultyId || myGroup?.facultyId;
      const f = facultyId ? i.faculty.get(facultyId) : undefined;
      if (!f) return { pool: students, label: 'Barcha fakultetlar' };
      return { pool: students.filter((s) => i.group.get(s.student!.groupId!)?.facultyId === f.id), label: f.name };
    }
    case 'course': {
      const course = Number(query.course) || myGroup?.course;
      if (!course) return { pool: students, label: 'Barcha kurslar' };
      return { pool: students.filter((s) => i.group.get(s.student!.groupId!)?.course === course), label: `${course}-kurs talabalari` };
    }
    default:
      return { pool: students, label: 'Universitet bo‘yicha' };
  }
}

route('GET', '/rating', ({ query, me }) => {
  const scope = (query.scope ?? 'group') as RatingScope;
  const semester = semesterFromQuery(query);
  const { pool, label } = ratingPool(scope, me, query);
  const entries = ratingFor(pool, semester.id);
  return { scope, label, semester, entries, me: entries.find((e) => e.student.id === me.id) ?? null };
});

/* ───────────── Attendance ───────────── */

route('GET', '/courses/:id/attendance', ({ params, me }) => {
  const c = getCourse(params.id);
  assertCourseAccess(me, c);
  const isTeacher = c.teacherId === me.id || me.roles.includes('admin');
  const sessions = (idx().attendanceByCourse.get(c.id) ?? []).slice().sort((a, b) => ts(a.date) - ts(b.date));
  const students = courseStudents(c).map((s) => ({ ...brief(s), groupName: idx().group.get(s.student?.groupId ?? '')?.name ?? '' }));
  const view: AttendanceView = isTeacher
    ? { sessions, students }
    : { sessions: sessions.map((s) => ({ ...s, records: { [me.id]: s.records[me.id] } })), students: students.filter((s) => s.id === me.id) };
  return view;
});

route('POST', '/courses/:id/attendance', ({ params, body, me }) => {
  const c = getCourse(params.id);
  assertCourseTeacher(me, c);
  const date = body.date ?? new Date().toISOString();
  const db = getDb();
  if (db.attendance.some((a) => a.courseId === c.id && a.date.slice(0, 10) === String(date).slice(0, 10) && (a.topicId ?? null) === (body.topicId ?? null))) {
    fail(409, 'Bu sana uchun davomat allaqachon mavjud');
  }
  const session: AttendanceSession = {
    id: uid('att'),
    courseId: c.id,
    date,
    topicId: body.topicId ?? null,
    records: Object.fromEntries(courseStudents(c).map((s) => [s.id, 'present' as const])),
  };
  db.attendance.push(session);
  if (session.topicId) {
    const t = db.topics.find((x) => x.id === session.topicId);
    if (t) t.status = 'done';
  }
  touch();
  return session;
});

route('PATCH', '/attendance/:id', ({ params, body, me }) => {
  const s = getDb().attendance.find((a) => a.id === params.id) ?? fail(404, 'Davomat topilmadi');
  assertCourseTeacher(me, getCourse(s.courseId));
  s.records = { ...s.records, ...(body.records as AttendanceSession['records']) };
  touch();
  return s;
});

route('DELETE', '/attendance/:id', ({ params, me }) => {
  const db = getDb();
  const s = db.attendance.find((a) => a.id === params.id) ?? fail(404, 'Davomat topilmadi');
  assertCourseTeacher(me, getCourse(s.courseId));
  db.attendance = db.attendance.filter((a) => a.id !== s.id);
  touch();
});
