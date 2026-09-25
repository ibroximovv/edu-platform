import type {
  Assignment,
  GradeSubmissionDto,
  Material,
  MaterialView,
  SubmitAssignmentDto,
  Topic,
  UpsertAssignmentDto,
  UpsertMaterialDto,
  UpsertTopicDto,
} from '@edu/shared';
import { getDb, idx, touch, uid } from '../db';
import {
  assertCourseAccess,
  assertCourseTeacher,
  assignmentView,
  brief,
  courseStudents,
  courseView,
  courseTitle,
  getCourse,
  isStudentOf,
  matches,
  notify,
  now,
  studentCourses,
  submissionView,
  teacherCourses,
  ts,
} from '../helpers';
import { fail, route, type Ctx } from '../server';

/** Courses visible to the caller for list endpoints */
function scopeCourses({ query, me }: Ctx) {
  if (query.courseId) {
    const c = getCourse(query.courseId);
    assertCourseAccess(me, c);
    return [c];
  }
  if (query.as === 'student') return studentCourses(me);
  if (query.as === 'teacher') return teacherCourses(me.id);
  if (me.roles.includes('admin')) return getDb().courses;
  return [];
}

/* ───────────── Course detail ───────────── */

route('GET', '/courses/:id', ({ params, me }) => {
  const c = getCourse(params.id);
  assertCourseAccess(me, c);
  return courseView(c, me);
});

route('GET', '/courses/:id/students', ({ params, me }) => {
  const c = getCourse(params.id);
  assertCourseAccess(me, c);
  return courseStudents(c).map((s) => ({ ...brief(s), groupName: idx().group.get(s.student?.groupId ?? '')?.name ?? '', recordBook: s.student?.recordBook ?? '' }));
});

/* ───────────── Topics ───────────── */

route('GET', '/courses/:id/topics', ({ params, me }) => {
  const c = getCourse(params.id);
  assertCourseAccess(me, c);
  return getDb()
    .topics.filter((t) => t.courseId === c.id)
    .sort((a, b) => a.order - b.order);
});

route('POST', '/topics', ({ body, me }) => {
  const dto = body as UpsertTopicDto;
  const c = getCourse(dto.courseId);
  assertCourseTeacher(me, c);
  const db = getDb();
  const order = dto.order ?? Math.max(0, ...db.topics.filter((t) => t.courseId === c.id).map((t) => t.order)) + 1;
  const topic: Topic = { id: uid('tp'), ...dto, order };
  db.topics.push(topic);
  touch();
  return topic;
});

route('PATCH', '/topics/:id', ({ params, body, me }) => {
  const t = getDb().topics.find((x) => x.id === params.id) ?? fail(404, 'Mavzu topilmadi');
  assertCourseTeacher(me, getCourse(t.courseId));
  Object.assign(t, body, { id: t.id, courseId: t.courseId });
  touch();
  return t;
});

route('DELETE', '/topics/:id', ({ params, me }) => {
  const db = getDb();
  const t = db.topics.find((x) => x.id === params.id) ?? fail(404, 'Mavzu topilmadi');
  assertCourseTeacher(me, getCourse(t.courseId));
  db.topics = db.topics.filter((x) => x.id !== t.id);
  db.materials.forEach((m) => m.topicId === t.id && (m.topicId = null));
  touch();
});

route('POST', '/courses/:id/topics/reorder', ({ params, body, me }) => {
  const c = getCourse(params.id);
  assertCourseTeacher(me, c);
  (body.ids as string[]).forEach((id, i) => {
    const t = getDb().topics.find((x) => x.id === id && x.courseId === c.id);
    if (t) t.order = i + 1;
  });
  touch();
  return { ok: true };
});

/* ───────────── Materials ───────────── */

function materialView(m: Material): MaterialView {
  const c = idx().course.get(m.courseId)!;
  return { ...m, courseTitle: courseTitle(c), topicTitle: m.topicId ? getDb().topics.find((t) => t.id === m.topicId)?.title ?? null : null };
}

route('GET', '/materials', (ctx) => {
  const ids = new Set(scopeCourses(ctx).map((c) => c.id));
  const { query } = ctx;
  return getDb()
    .materials.filter((m) => ids.has(m.courseId) && (!query.topicId || m.topicId === query.topicId) && (!query.kind || m.kind === query.kind) && matches(query.q, m.title, m.file?.name))
    .sort((a, b) => ts(b.createdAt) - ts(a.createdAt))
    .map(materialView);
});

route('POST', '/materials', ({ body, me }) => {
  const dto = body as UpsertMaterialDto;
  const c = getCourse(dto.courseId);
  assertCourseTeacher(me, c);
  if (!dto.file && !dto.url) fail(400, 'Fayl yoki havola kerak');
  const m: Material = {
    id: uid('mat'),
    courseId: c.id,
    topicId: dto.topicId ?? null,
    title: dto.title,
    description: dto.description,
    kind: dto.file ? dto.file.kind : 'link',
    file: dto.file ?? null,
    url: dto.url ?? null,
    createdAt: new Date().toISOString(),
    createdBy: me.id,
    views: 0,
  };
  getDb().materials.push(m);
  touch();
  notify(courseStudents(c).map((s) => s.id), 'material', "Yangi material qo'shildi", `${courseTitle(c)}: ${m.title}`, `/student/courses/${c.id}?tab=topics`);
  return materialView(m);
});

route('PATCH', '/materials/:id', ({ params, body, me }) => {
  const m = getDb().materials.find((x) => x.id === params.id) ?? fail(404, 'Material topilmadi');
  assertCourseTeacher(me, getCourse(m.courseId));
  Object.assign(m, { title: body.title ?? m.title, description: body.description ?? m.description, topicId: body.topicId === undefined ? m.topicId : body.topicId });
  touch();
  return materialView(m);
});

route('DELETE', '/materials/:id', ({ params, me }) => {
  const db = getDb();
  const m = db.materials.find((x) => x.id === params.id) ?? fail(404, 'Material topilmadi');
  assertCourseTeacher(me, getCourse(m.courseId));
  db.materials = db.materials.filter((x) => x.id !== m.id);
  touch();
});

route('POST', '/materials/:id/view', ({ params }) => {
  const m = getDb().materials.find((x) => x.id === params.id);
  if (m) m.views++;
  return { views: m?.views ?? 0 };
});

/* ───────────── Assignments ───────────── */

route('GET', '/assignments', (ctx) => {
  const { query, me } = ctx;
  const courses = scopeCourses(ctx);
  const ids = new Set(courses.map((c) => c.id));
  const asStudent = query.as === 'student' || (query.courseId && isStudentOf(me, courses[0]) && courses[0].teacherId !== me.id && !me.roles.includes('admin'));
  return getDb()
    .assignments.filter((a) => ids.has(a.courseId) && (!asStudent || a.status === 'published') && matches(query.q, a.title))
    .sort((a, b) => ts(a.deadline) - ts(b.deadline))
    .map((a) => assignmentView(a, me));
});

route('GET', '/assignments/:id', ({ params, me }) => {
  const a = getDb().assignments.find((x) => x.id === params.id) ?? fail(404, 'Topshiriq topilmadi');
  const c = getCourse(a.courseId);
  assertCourseAccess(me, c);
  if (a.status === 'draft' && isStudentOf(me, c) && c.teacherId !== me.id) fail(404, 'Topshiriq topilmadi');
  return assignmentView(a, me);
});

route('POST', '/assignments', ({ body, me }) => {
  const dto = body as UpsertAssignmentDto;
  const c = getCourse(dto.courseId);
  assertCourseTeacher(me, c);
  const a: Assignment = { id: uid('asg'), ...dto, createdAt: new Date().toISOString(), createdBy: me.id };
  getDb().assignments.push(a);
  touch();
  if (a.status === 'published') notify(courseStudents(c).map((s) => s.id), 'assignment', 'Yangi topshiriq', `${courseTitle(c)}: ${a.title}`, `/student/assignments/${a.id}`);
  return assignmentView(a, me);
});

route('PATCH', '/assignments/:id', ({ params, body, me }) => {
  const a = getDb().assignments.find((x) => x.id === params.id) ?? fail(404, 'Topshiriq topilmadi');
  const c = getCourse(a.courseId);
  assertCourseTeacher(me, c);
  const wasDraft = a.status === 'draft';
  Object.assign(a, body, { id: a.id, courseId: a.courseId });
  touch();
  if (wasDraft && a.status === 'published') notify(courseStudents(c).map((s) => s.id), 'assignment', 'Yangi topshiriq', `${courseTitle(c)}: ${a.title}`, `/student/assignments/${a.id}`);
  return assignmentView(a, me);
});

route('DELETE', '/assignments/:id', ({ params, me }) => {
  const db = getDb();
  const a = db.assignments.find((x) => x.id === params.id) ?? fail(404, 'Topshiriq topilmadi');
  assertCourseTeacher(me, getCourse(a.courseId));
  db.assignments = db.assignments.filter((x) => x.id !== a.id);
  db.submissions = db.submissions.filter((s) => s.assignmentId !== a.id);
  touch();
});

route('POST', '/assignments/:id/submit', ({ params, body, me }) => {
  const db = getDb();
  const a = db.assignments.find((x) => x.id === params.id) ?? fail(404, 'Topshiriq topilmadi');
  const c = getCourse(a.courseId);
  if (!isStudentOf(me, c)) fail(403, 'Siz bu kurs talabasi emassiz');
  const dto = body as SubmitAssignmentDto;
  if (!dto.files?.length && !dto.text?.trim()) fail(400, 'Javob matni yoki fayl biriktiring');
  const late = now() > ts(a.deadline);
  if (late && !a.allowLate) fail(400, 'Topshirish muddati tugagan');
  let s = db.submissions.find((x) => x.assignmentId === a.id && x.studentId === me.id);
  if (s?.status === 'graded') fail(409, 'Topshiriq allaqachon baholangan');
  if (s) {
    Object.assign(s, { text: dto.text, files: dto.files, submittedAt: new Date().toISOString(), late, status: 'submitted', attempt: s.attempt + 1 });
  } else {
    s = { id: uid('sbm'), assignmentId: a.id, courseId: c.id, studentId: me.id, text: dto.text, files: dto.files, submittedAt: new Date().toISOString(), late, status: 'submitted', score: null, feedback: null, attempt: 1 };
    db.submissions.push(s);
  }
  touch();
  notify([c.teacherId], 'submission', 'Yangi topshiriq javobi', `${me.lastName} ${me.firstName} — ${a.title}`, `/teacher/reviews?submission=${s.id}`);
  return s;
});

route('DELETE', '/submissions/:id', ({ params, me }) => {
  const db = getDb();
  const s = db.submissions.find((x) => x.id === params.id) ?? fail(404, 'Javob topilmadi');
  if (s.studentId !== me.id) fail(403, "Ruxsat yo'q");
  if (s.status === 'graded') fail(409, "Baholangan javobni qaytarib olib bo'lmaydi");
  db.submissions = db.submissions.filter((x) => x.id !== s.id);
  touch();
});

route('GET', '/submissions', (ctx) => {
  const { query, me } = ctx;
  let courses = scopeCourses(ctx);
  if (!me.roles.includes('admin')) courses = courses.filter((c) => c.teacherId === me.id);
  const ids = new Set(courses.map((c) => c.id));
  return getDb()
    .submissions.filter((s) => ids.has(s.courseId) && (!query.assignmentId || s.assignmentId === query.assignmentId) && (!query.status || s.status === query.status))
    .sort((a, b) => ts(a.submittedAt) - ts(b.submittedAt))
    .map(submissionView)
    .filter((s) => matches(query.q, s.student.firstName, s.student.lastName, s.assignment.title));
});

route('GET', '/submissions/:id', ({ params, me }) => {
  const s = getDb().submissions.find((x) => x.id === params.id) ?? fail(404, 'Javob topilmadi');
  const c = getCourse(s.courseId);
  if (s.studentId !== me.id) assertCourseTeacher(me, c);
  return submissionView(s);
});

route('PATCH', '/submissions/:id/grade', ({ params, body, me }) => {
  const s = getDb().submissions.find((x) => x.id === params.id) ?? fail(404, 'Javob topilmadi');
  const c = getCourse(s.courseId);
  assertCourseTeacher(me, c);
  const a = getDb().assignments.find((x) => x.id === s.assignmentId)!;
  const dto = body as GradeSubmissionDto;
  if (dto.status === 'graded') {
    if (dto.score == null || dto.score < 0 || dto.score > a.maxScore) fail(400, `Ball 0 dan ${a.maxScore} gacha bo'lishi kerak`, { score: 'Noto‘g‘ri ball' });
  }
  Object.assign(s, { score: dto.status === 'graded' ? dto.score : null, feedback: dto.feedback ?? null, status: dto.status, gradedAt: new Date().toISOString(), gradedBy: me.id });
  touch();
  notify(
    [s.studentId],
    'grade',
    dto.status === 'graded' ? 'Topshiriq baholandi' : 'Topshiriq qayta ishlashga qaytarildi',
    dto.status === 'graded' ? `${a.title}: ${dto.score}/${a.maxScore} ball` : `${a.title}: ${dto.feedback ?? "o'qituvchi izohini ko'ring"}`,
    `/student/assignments/${a.id}`,
  );
  return submissionView(s);
});
