import {
  gradeFromTotal,
  type AdminDashboard,
  type DeadlineItem,
  type ScheduleSlot,
  type SearchResult,
  type StudentDashboard,
  type TeacherDashboard,
} from '@edu/shared';
import { getDb, idx, touch, uid } from '../db';
import {
  attendanceRate,
  bestResult,
  brief,
  courseColor,
  courseScore,
  courseStudents,
  courseTitle,
  courseView,
  currentSemester,
  logActivity,
  matches,
  notify,
  now,
  publicUser,
  ratingFor,
  scheduleItem,
  studentCourses,
  studentSemesterGrades,
  submissionOf,
  submissionView,
  summarize,
  teacherCourses,
  ts,
} from '../helpers';
import { fail, route } from '../server';

const DAY = 86_400_000;
const isoWeekday = (d = new Date()) => ((d.getDay() + 6) % 7) + 1;

/* ───────────── Schedule ───────────── */

route('GET', '/schedule', ({ query, me }) => {
  const db = getDb();
  const sem = currentSemester().id;
  let courseIds: Set<string>;
  if (query.as === 'student') courseIds = new Set(studentCourses(me).map((c) => c.id));
  else if (query.as === 'teacher') courseIds = new Set(teacherCourses(me.id).map((c) => c.id));
  else if (query.teacherId) courseIds = new Set(teacherCourses(query.teacherId).map((c) => c.id));
  else courseIds = new Set(db.courses.filter((c) => c.semesterId === sem).map((c) => c.id));
  return db.schedule
    .filter((s) => courseIds.has(s.courseId) && (!query.groupId || s.groupIds.includes(query.groupId)) && (!query.room || s.room === query.room))
    .sort((a, b) => a.day - b.day || a.pair - b.pair)
    .map(scheduleItem);
});

function assertNoConflict(slot: Omit<ScheduleSlot, 'id'>, ignoreId?: string) {
  const i = idx();
  const course = i.course.get(slot.courseId) ?? fail(404, 'Kurs topilmadi');
  const overlaps = (w: ScheduleSlot['week']) => w === 'all' || slot.week === 'all' || w === slot.week;
  for (const s of getDb().schedule) {
    if (s.id === ignoreId || s.day !== slot.day || s.pair !== slot.pair || !overlaps(s.week)) continue;
    const other = i.course.get(s.courseId);
    if (!other) continue;
    const g = s.groupIds.find((x) => slot.groupIds.includes(x));
    if (g) fail(409, `Konflikt: ${i.group.get(g)?.name} guruhida bu vaqtda «${courseTitle(other)}» darsi bor`);
    if (other.teacherId === course.teacherId) fail(409, `Konflikt: o'qituvchi bu vaqtda «${courseTitle(other)}» darsida band`);
    if (s.room.trim().toLowerCase() === slot.room.trim().toLowerCase()) fail(409, `Konflikt: ${s.room} xonasi bu vaqtda band`);
  }
}

route('POST', '/schedule', ({ body }) => {
  const dto = body as Omit<ScheduleSlot, 'id'>;
  const c = idx().course.get(dto.courseId) ?? fail(404, 'Kurs topilmadi');
  const slot = { ...dto, groupIds: dto.groupIds?.length ? dto.groupIds : c.groupIds };
  assertNoConflict(slot);
  const created: ScheduleSlot = { id: uid('sl'), ...slot };
  getDb().schedule.push(created);
  touch();
  notify([c.teacherId, ...courseStudents(c).map((s) => s.id)], 'schedule', 'Dars jadvali yangilandi', `${courseTitle(c)} darsi jadvalga qo'shildi`, '/student/schedule');
  logActivity(`Dars jadvali yangilandi: ${courseTitle(c)}`, 'schedule');
  return scheduleItem(created);
}, ['admin']);

route('PATCH', '/schedule/:id', ({ params, body }) => {
  const s = getDb().schedule.find((x) => x.id === params.id) ?? fail(404, 'Dars topilmadi');
  const next = { ...s, ...body };
  assertNoConflict(next, s.id);
  Object.assign(s, next);
  touch();
  return scheduleItem(s);
}, ['admin']);

route('DELETE', '/schedule/:id', ({ params }) => {
  const db = getDb();
  db.schedule = db.schedule.filter((s) => s.id !== params.id);
  touch();
}, ['admin']);

/* ───────────── Notifications ───────────── */

route('GET', '/notifications', ({ query, me }) => {
  const mine = getDb().notifications.filter((n) => n.userId === me.id);
  const list = query.unread ? mine.filter((n) => !n.read) : mine;
  return { items: list.slice(0, Number(query.limit ?? 50)), unread: mine.filter((n) => !n.read).length, total: mine.length };
});

route('PATCH', '/notifications/:id/read', ({ params, me }) => {
  const n = getDb().notifications.find((x) => x.id === params.id && x.userId === me.id);
  if (n) n.read = true;
  return n;
});

route('POST', '/notifications/read-all', ({ me }) => {
  getDb().notifications.forEach((n) => n.userId === me.id && (n.read = true));
  return { ok: true };
});

route('DELETE', '/notifications/:id', ({ params, me }) => {
  const db = getDb();
  db.notifications = db.notifications.filter((n) => !(n.id === params.id && n.userId === me.id));
});

/* ───────────── Dashboards ───────────── */

function periodBuckets(dates: number[], periods: number, size: number) {
  const end = now();
  return Array.from({ length: periods }, (_, k) => {
    const to = end - (periods - 1 - k) * size * DAY;
    const from = to - size * DAY;
    const d1 = new Date(from + DAY);
    const d2 = new Date(to);
    const label = size === 1 ? ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'][d2.getDay()] : `${d1.getDate()}–${d2.getDate()}.${String(d2.getMonth() + 1).padStart(2, '0')}`;
    return { label, value: dates.filter((t) => t > from && t <= to).length };
  });
}

route('GET', '/dashboard/student', ({ me }) => {
  const db = getDb();
  const i = idx();
  const courses = studentCourses(me);
  const t = now();
  const grades = studentSemesterGrades(me, currentSemester().id);
  const { average, gpa } = summarize(grades);
  const groupId = me.student?.groupId;
  const groupmatesAll = groupId ? i.studentsByGroup.get(groupId) ?? [] : [];
  const rating = ratingFor(groupmatesAll, currentSemester().id);
  const myRank = rating.find((r) => r.student.id === me.id);

  const deadlines: DeadlineItem[] = [];
  for (const c of courses) {
    for (const a of db.assignments.filter((x) => x.courseId === c.id && x.status === 'published')) {
      const sub = submissionOf(a.id, me.id);
      const due = ts(a.deadline);
      if (due < t - 7 * DAY || due > t + 21 * DAY) continue;
      const status = sub ? (sub.status === 'graded' ? 'graded' : 'submitted') : due < t ? 'overdue' : 'pending';
      if (status === 'graded') continue;
      deadlines.push({ id: a.id, kind: 'assignment', title: a.title, courseTitle: courseTitle(c), color: courseColor(c), date: a.deadline, status });
    }
    for (const a of db.assessments.filter((x) => x.courseId === c.id && x.status === 'published')) {
      const r = bestResult(a.id, me.id);
      if (ts(a.endsAt) < t || ts(a.startsAt) > t + 21 * DAY || (r && r.status !== 'in_progress')) continue;
      deadlines.push({ id: a.id, kind: 'assessment', title: a.title, courseTitle: courseTitle(c), color: courseColor(c), date: ts(a.startsAt) > t ? a.startsAt : a.endsAt, status: 'pending' });
    }
  }
  deadlines.sort((a, b) => (a.status === 'overdue' ? -1 : 0) - (b.status === 'overdue' ? -1 : 0) || ts(a.date) - ts(b.date));

  const courseIds = new Set(courses.map((c) => c.id));
  const activityDates = [
    ...db.submissions.filter((s) => s.studentId === me.id).map((s) => ts(s.submittedAt)),
    ...db.results.filter((r) => r.studentId === me.id && r.finishedAt && r.startedAt !== r.finishedAt).map((r) => ts(r.finishedAt)),
    ...db.attendance.filter((a) => courseIds.has(a.courseId) && (a.records[me.id] === 'present' || a.records[me.id] === 'late')).map((a) => ts(a.date)),
  ];

  const recentGrades = [
    ...db.submissions.filter((s) => s.studentId === me.id && s.status === 'graded').map((s) => {
      const a = db.assignments.find((x) => x.id === s.assignmentId)!;
      return { title: a.title, courseTitle: courseTitle(i.course.get(s.courseId)!), score: s.score ?? 0, maxScore: a.maxScore, date: s.gradedAt ?? s.submittedAt };
    }),
    ...db.results.filter((r) => r.studentId === me.id && r.score != null && r.status !== 'in_progress').map((r) => {
      const a = db.assessments.find((x) => x.id === r.assessmentId)!;
      return { title: a.title, courseTitle: courseTitle(i.course.get(r.courseId)!), score: r.score ?? 0, maxScore: a.maxScore, date: r.finishedAt ?? a.endsAt };
    }),
  ]
    .sort((a, b) => ts(b.date) - ts(a.date))
    .slice(0, 6);

  const teacherMap = new Map<string, StudentDashboard['teachers'][number]>();
  for (const c of courses) if (!teacherMap.has(c.teacherId)) teacherMap.set(c.teacherId, { ...brief(i.user.get(c.teacherId)), subject: courseTitle(c) });

  const dash: StudentDashboard = {
    stats: {
      courses: courses.length,
      pendingAssignments: deadlines.filter((d) => d.kind === 'assignment' && (d.status === 'pending' || d.status === 'overdue')).length,
      average,
      gpa,
      rank: myRank?.rank ?? 0,
      rankOf: rating.length,
      attendance: courses.length ? Math.round(courses.reduce((s, c) => s + attendanceRate(c.id, me.id), 0) / courses.length) : 100,
    },
    courses: courses.map((c) => courseView(c, me)),
    deadlines: deadlines.slice(0, 8),
    today: db.schedule.filter((s) => courseIds.has(s.courseId) && s.day === isoWeekday()).sort((a, b) => a.pair - b.pair).map(scheduleItem),
    weeklyActivity: periodBuckets(activityDates, 5, 7),
    teachers: [...teacherMap.values()],
    groupmates: groupmatesAll.filter((u) => u.id !== me.id).slice(0, 4).map(brief),
    recentGrades,
  };
  return dash;
}, ['student']);

route('GET', '/dashboard/teacher', ({ me }) => {
  const db = getDb();
  const courses = teacherCourses(me.id);
  const courseIds = new Set(courses.map((c) => c.id));
  const t = now();
  const studentIds = new Set(courses.flatMap((c) => courseStudents(c).map((s) => s.id)));

  const dist = { 5: 0, 4: 0, 3: 0, 2: 0 } as Record<number, number>;
  let sum = 0;
  let n = 0;
  for (const c of courses) {
    for (const s of courseStudents(c)) {
      const sc = courseScore(c, s.id);
      dist[sc.grade]++;
      sum += sc.percent;
      n++;
    }
  }

  const upcoming: DeadlineItem[] = [
    ...db.assignments.filter((a) => courseIds.has(a.courseId) && ts(a.deadline) > t && ts(a.deadline) < t + 21 * DAY).map<DeadlineItem>((a) => {
      const c = idx().course.get(a.courseId)!;
      return { id: a.id, kind: 'assignment', title: a.title, courseTitle: courseTitle(c), color: courseColor(c), date: a.deadline, status: 'pending' };
    }),
    ...db.assessments.filter((a) => courseIds.has(a.courseId) && ts(a.endsAt) > t && ts(a.startsAt) < t + 30 * DAY).map<DeadlineItem>((a) => {
      const c = idx().course.get(a.courseId)!;
      return { id: a.id, kind: 'assessment', title: a.title, courseTitle: courseTitle(c), color: courseColor(c), date: ts(a.startsAt) > t ? a.startsAt : a.endsAt, status: 'pending' };
    }),
  ].sort((a, b) => ts(a.date) - ts(b.date));

  const pending = db.submissions.filter((s) => courseIds.has(s.courseId) && s.status === 'submitted').sort((a, b) => ts(a.submittedAt) - ts(b.submittedAt));

  const dash: TeacherDashboard = {
    stats: {
      courses: courses.length,
      students: studentIds.size,
      pendingReviews: pending.length,
      weeklyPairs: db.schedule.filter((s) => courseIds.has(s.courseId)).length,
      avgScore: n ? Math.round((sum / n) * 10) / 10 : 0,
      materials: db.materials.filter((m) => courseIds.has(m.courseId)).length,
    },
    courses: courses.map((c) => courseView(c)),
    today: db.schedule.filter((s) => courseIds.has(s.courseId) && s.day === isoWeekday()).sort((a, b) => a.pair - b.pair).map(scheduleItem),
    reviewQueue: pending.slice(0, 6).map(submissionView),
    upcoming: upcoming.slice(0, 6),
    scoreDistribution: [5, 4, 3, 2].map((g) => ({ label: `${g}`, value: dist[g] })),
    submissionsByDay: periodBuckets(db.submissions.filter((s) => courseIds.has(s.courseId)).map((s) => ts(s.submittedAt)), 7, 1),
  };
  return dash;
}, ['teacher']);

route('GET', '/dashboard/admin', () => {
  const db = getDb();
  const i = idx();
  const sem = currentSemester().id;
  const students = db.users.filter((u) => u.roles.includes('student') && u.status === 'active');
  const teachers = db.users.filter((u) => u.roles.includes('teacher') && u.status === 'active');
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0 } as Record<number, number>;
  for (const c of db.courses.filter((x) => x.semesterId === sem)) for (const s of courseStudents(c)) dist[gradeFromTotal(courseScore(c, s.id).percent)]++;

  const months = Array.from({ length: 6 }, (_, k) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - k));
    return d;
  });
  const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

  const dash: AdminDashboard = {
    stats: {
      students: students.length,
      teachers: teachers.length,
      groups: db.groups.length,
      subjects: db.subjects.length,
      courses: db.courses.filter((c) => c.semesterId === sem).length,
      pendingUsers: db.users.filter((u) => u.status === 'pending' && u.emailVerified).length,
      faculties: db.faculties.length,
      materials: db.materials.length,
    },
    byFaculty: db.faculties.map((f) => ({
      label: f.shortName,
      students: students.filter((s) => i.group.get(s.student?.groupId ?? '')?.facultyId === f.id).length,
      teachers: teachers.filter((t) => i.department.get(t.teacher?.departmentId ?? '')?.facultyId === f.id).length,
    })),
    gradeDistribution: [5, 4, 3, 2].map((g) => ({ label: `${g}`, value: dist[g] })),
    registrations: months.map((m) => ({
      label: MONTHS[m.getMonth()],
      value: db.users.filter((u) => {
        const c = new Date(u.createdAt);
        return c.getFullYear() === m.getFullYear() && c.getMonth() === m.getMonth();
      }).length,
    })),
    pendingUsers: db.users.filter((u) => u.status === 'pending' && u.emailVerified).map(publicUser),
    topStudents: ratingFor(students, sem).slice(0, 5),
    activity: db.activity.slice(0, 8),
  };
  return dash;
}, ['admin']);

/* ───────────── Global search ───────────── */

route('GET', '/search', ({ query, me }) => {
  const q = query.q?.trim();
  if (!q || q.length < 2) return [];
  const db = getDb();
  const out: SearchResult[] = [];
  const role = query.as ?? 'student';
  const courses = role === 'admin' ? db.courses : role === 'teacher' ? teacherCourses(me.id) : studentCourses(me);
  for (const c of courses) {
    if (matches(q, courseTitle(c))) out.push({ id: c.id, kind: 'course', title: courseTitle(c), subtitle: c.groupIds.map((g) => idx().group.get(g)?.name).join(', '), link: role === 'admin' ? '/admin/courses' : `/${role}/courses/${c.id}` });
  }
  const ids = new Set(courses.map((c) => c.id));
  for (const a of db.assignments) if (ids.has(a.courseId) && matches(q, a.title)) out.push({ id: a.id, kind: 'assignment', title: a.title, subtitle: courseTitle(idx().course.get(a.courseId)!), link: role === 'student' ? `/student/assignments/${a.id}` : `/teacher/assignments?focus=${a.id}` });
  for (const m of db.materials) if (ids.has(m.courseId) && matches(q, m.title)) out.push({ id: m.id, kind: 'material', title: m.title, subtitle: courseTitle(idx().course.get(m.courseId)!), link: `/${role === 'admin' ? 'teacher' : role}/materials?q=${encodeURIComponent(m.title)}` });
  if (role === 'admin') {
    for (const u of db.users) if (matches(q, u.firstName, u.lastName, u.email, `${u.lastName} ${u.firstName}`)) out.push({ id: u.id, kind: 'user', title: `${u.lastName} ${u.firstName}`, subtitle: u.email, link: `/admin/users?q=${encodeURIComponent(u.email)}` });
    for (const g of db.groups) if (matches(q, g.name)) out.push({ id: g.id, kind: 'group', title: g.name, subtitle: `${g.course}-kurs`, link: `/admin/groups/${g.id}` });
  }
  return out.slice(0, 20);
});

/* ───────────── Sidebar counters ───────────── */

route('GET', '/me/counters', ({ query, me }) => {
  const db = getDb();
  const t = now();
  if (query.as === 'teacher') {
    const ids = new Set(teacherCourses(me.id).map((c) => c.id));
    return { pendingReviews: db.submissions.filter((s) => ids.has(s.courseId) && s.status === 'submitted').length };
  }
  if (query.as === 'admin') {
    return { pendingUsers: db.users.filter((u) => u.status === 'pending' && u.emailVerified).length };
  }
  const ids = new Set(studentCourses(me).map((c) => c.id));
  const pendingAssignments = db.assignments.filter((a) => ids.has(a.courseId) && a.status === 'published' && ts(a.deadline) > t && !submissionOf(a.id, me.id)).length;
  return { pendingAssignments };
});
