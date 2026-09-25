import {
  type AcademicYearView,
  type BulkUserAction,
  type Course,
  type DepartmentView,
  type Faculty,
  type Group,
  type GroupDetail,
  type GroupView,
  type Semester,
  type SemesterView,
  type Subject,
  type SystemSettings,
  type TeacherView,
  type UpsertCourseDto,
  type UpsertUserDto,
  type UserRow,
} from '@edu/shared';
import { getDb, hashPassword, idx, resetDb, touch, uid, type DbUser } from '../db';
import {
  brief,
  courseStudents,
  courseTitle,
  courseView,
  currentSemester,
  logActivity,
  matches,
  notify,
  paginate,
  publicUser,
  studentCourses,
  teacherCourses,
  ts,
} from '../helpers';
import { fail, route } from '../server';

const ADMIN = ['admin'] as const;
const POSITIONS: Record<string, string> = { assistant: 'Assistent', senior: "Katta o'qituvchi", docent: 'Dotsent', professor: 'Professor', head: 'Kafedra mudiri' };

function userRow(u: DbUser): UserRow {
  const i = idx();
  return {
    ...publicUser(u),
    groupName: u.student?.groupId ? i.group.get(u.student.groupId)?.name ?? null : null,
    departmentName: u.teacher?.departmentId ? i.department.get(u.teacher.departmentId)?.name ?? null : null,
  };
}

function groupView(g: Group): GroupView {
  const i = idx();
  return {
    ...g,
    faculty: i.faculty.get(g.facultyId) ?? null,
    curator: g.curatorId ? brief(i.user.get(g.curatorId)) : null,
    studentCount: (i.studentsByGroup.get(g.id) ?? []).length,
  };
}

function findUser(id: string) {
  const u = idx().user.get(id);
  if (!u) fail(404, 'Foydalanuvchi topilmadi');
  return u!;
}

function applyUserDto(u: DbUser, dto: Partial<UpsertUserDto>) {
  if (dto.firstName !== undefined) u.firstName = dto.firstName.trim();
  if (dto.lastName !== undefined) u.lastName = dto.lastName.trim();
  if (dto.middleName !== undefined) u.middleName = dto.middleName.trim();
  if (dto.phone !== undefined) u.phone = dto.phone.trim();
  if (dto.status !== undefined) u.status = dto.status;
  if (dto.roles !== undefined) {
    if (!dto.roles.length) fail(400, 'Kamida bitta rol tanlang', { roles: 'Rol tanlanmagan' });
    u.roles = [...new Set(dto.roles)];
  }
  if (u.roles.includes('student')) {
    u.student ??= { groupId: null, recordBook: '', enrollmentYear: new Date().getFullYear() };
    if (dto.groupId !== undefined) u.student.groupId = dto.groupId || null;
    if (!u.student.recordBook) u.student.recordBook = `${u.student.enrollmentYear}${String(Math.floor(Math.random() * 1e5)).padStart(5, '0')}`;
  }
  if (u.roles.includes('teacher')) {
    u.teacher ??= { departmentId: null, position: 'assistant' };
    if (dto.departmentId !== undefined) u.teacher.departmentId = dto.departmentId || null;
    if (dto.position !== undefined) u.teacher.position = dto.position;
    if (dto.degree !== undefined) u.teacher.degree = dto.degree;
  }
}

/* ───────────── Users ───────────── */

route('GET', '/users', ({ query }) => {
  const list = getDb()
    .users.filter((u) => (!query.role || u.roles.includes(query.role as never)) && (!query.status || u.status === query.status) && (!query.groupId || u.student?.groupId === query.groupId) && matches(query.q, u.firstName, u.lastName, u.email, `${u.lastName} ${u.firstName}`, u.student?.recordBook))
    .sort((a, b) => (a.status === 'pending' ? -1 : 0) - (b.status === 'pending' ? -1 : 0) || ts(b.createdAt) - ts(a.createdAt));
  const page = paginate(list, query);
  return { ...page, items: page.items.map(userRow) };
}, [...ADMIN]);

route('GET', '/users/:id', ({ params }) => userRow(findUser(params.id)), [...ADMIN]);

route('POST', '/users', async ({ body }) => {
  const dto = body as UpsertUserDto;
  const db = getDb();
  const email = dto.email.trim().toLowerCase();
  if (db.users.some((u) => u.email === email)) fail(409, 'Bu email band', { email: 'Email band' });
  const u: DbUser = {
    id: uid('u'),
    email,
    firstName: '',
    lastName: '',
    roles: [],
    status: 'active',
    emailVerified: true,
    createdAt: new Date().toISOString(),
    passwordHash: await hashPassword(dto.password || 'Welcome@123'),
    avatarUrl: null,
    student: null,
    teacher: null,
  };
  applyUserDto(u, dto);
  db.users.push(u);
  touch();
  logActivity(`Foydalanuvchi yaratildi: ${u.firstName} ${u.lastName}`, 'user');
  return userRow(u);
}, [...ADMIN]);

route('PATCH', '/users/:id', async ({ params, body, me }) => {
  const u = findUser(params.id);
  const dto = body as Partial<UpsertUserDto>;
  if (u.id === me.id && dto.roles && !dto.roles.includes('admin')) fail(400, "O'zingizdan admin rolini olib bo'lmaydi");
  if (dto.email && dto.email.toLowerCase() !== u.email) {
    if (getDb().users.some((x) => x.email === dto.email!.toLowerCase())) fail(409, 'Bu email band', { email: 'Email band' });
    u.email = dto.email.toLowerCase();
  }
  const wasPending = u.status === 'pending';
  applyUserDto(u, dto);
  if (dto.password) u.passwordHash = await hashPassword(dto.password);
  touch();
  if (wasPending && u.status === 'active') notify([u.id], 'system', 'Hisobingiz tasdiqlandi', "Platformaga xush kelibsiz! Endi barcha imkoniyatlardan foydalanishingiz mumkin.");
  return userRow(u);
}, [...ADMIN]);

route('DELETE', '/users/:id', ({ params, me }) => {
  if (params.id === me.id) fail(400, "O'zingizni o'chira olmaysiz");
  const db = getDb();
  if (db.courses.some((c) => c.teacherId === params.id)) fail(409, "Bu o'qituvchiga kurslar biriktirilgan. Avval kurslarni boshqa o'qituvchiga o'tkazing");
  db.users = db.users.filter((u) => u.id !== params.id);
  touch();
}, [...ADMIN]);

route('POST', '/users/bulk', ({ body, me }) => {
  const { ids, action } = body as { ids: string[]; action: BulkUserAction };
  const db = getDb();
  let affected = 0;
  for (const id of ids) {
    if (id === me.id) continue;
    const u = idx().user.get(id);
    if (!u) continue;
    if (action === 'delete') {
      if (db.courses.some((c) => c.teacherId === id)) continue;
      db.users = db.users.filter((x) => x.id !== id);
    } else {
      const was = u.status;
      u.status = action === 'block' ? 'blocked' : 'active';
      if (was === 'pending' && u.status === 'active') notify([u.id], 'system', 'Hisobingiz tasdiqlandi', 'Platformaga xush kelibsiz!');
    }
    affected++;
  }
  touch();
  if (action === 'approve') logActivity(`${affected} ta foydalanuvchi tasdiqlandi`, 'user');
  return { affected };
}, [...ADMIN]);

route('GET', '/teachers', ({ query }) => {
  const i = idx();
  const sem = currentSemester().id;
  const db = getDb();
  return db.users
    .filter((u) => u.roles.includes('teacher') && u.status === 'active' && (!query.departmentId || u.teacher?.departmentId === query.departmentId) && matches(query.q, u.firstName, u.lastName, u.email))
    .map<TeacherView>((u) => {
      const courses = teacherCourses(u.id, sem);
      return {
        ...brief(u),
        department: u.teacher?.departmentId ? i.department.get(u.teacher.departmentId) ?? null : null,
        position: POSITIONS[u.teacher?.position ?? 'assistant'],
        degree: u.teacher?.degree,
        courseCount: courses.length,
        studentCount: courses.reduce((n, c) => n + courseStudents(c).length, 0),
        weeklyPairs: db.schedule.filter((s) => courses.some((c) => c.id === s.courseId)).length,
      };
    })
    .sort((a, b) => a.lastName.localeCompare(b.lastName));
});

/* ───────────── Faculties & departments ───────────── */

route('GET', '/faculties', () => getDb().faculties);
route('POST', '/faculties', ({ body }) => {
  const f: Faculty = { id: uid('fac'), name: body.name, shortName: body.shortName, deanId: body.deanId ?? null };
  getDb().faculties.push(f);
  touch();
  return f;
}, [...ADMIN]);
route('PATCH', '/faculties/:id', ({ params, body }) => {
  const f = getDb().faculties.find((x) => x.id === params.id) ?? fail(404, 'Fakultet topilmadi');
  Object.assign(f, body);
  touch();
  return f;
}, [...ADMIN]);
route('DELETE', '/faculties/:id', ({ params }) => {
  const db = getDb();
  if (db.groups.some((g) => g.facultyId === params.id)) fail(409, 'Fakultetda guruhlar mavjud');
  if (db.departments.some((d) => d.facultyId === params.id)) fail(409, 'Fakultetda kafedralar mavjud');
  db.faculties = db.faculties.filter((f) => f.id !== params.id);
  touch();
}, [...ADMIN]);

route('GET', '/departments', () => {
  const i = idx();
  const db = getDb();
  return db.departments.map<DepartmentView>((d) => ({
    ...d,
    faculty: i.faculty.get(d.facultyId) ?? null,
    teacherCount: db.users.filter((u) => u.teacher?.departmentId === d.id && u.roles.includes('teacher')).length,
  }));
});
route('POST', '/departments', ({ body }) => {
  const d = { id: uid('dep'), name: body.name, facultyId: body.facultyId, headId: body.headId ?? null };
  getDb().departments.push(d);
  touch();
  return d;
}, [...ADMIN]);
route('PATCH', '/departments/:id', ({ params, body }) => {
  const d = getDb().departments.find((x) => x.id === params.id) ?? fail(404, 'Kafedra topilmadi');
  Object.assign(d, body);
  touch();
  return d;
}, [...ADMIN]);
route('DELETE', '/departments/:id', ({ params }) => {
  const db = getDb();
  if (db.users.some((u) => u.teacher?.departmentId === params.id)) fail(409, "Kafedrada o'qituvchilar mavjud");
  db.departments = db.departments.filter((d) => d.id !== params.id);
  touch();
}, [...ADMIN]);

/* ───────────── Groups ───────────── */

route('GET', '/groups', ({ query }) =>
  getDb()
    .groups.filter((g) => (!query.facultyId || g.facultyId === query.facultyId) && (!query.course || g.course === Number(query.course)) && matches(query.q, g.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(groupView),
);

route('GET', '/groups/:id', ({ params }) => {
  const g = idx().group.get(params.id) ?? fail(404, 'Guruh topilmadi');
  const sem = currentSemester().id;
  const detail: GroupDetail = {
    ...groupView(g),
    students: (idx().studentsByGroup.get(g.id) ?? []).map(userRow),
    courses: getDb().courses.filter((c) => c.semesterId === sem && c.groupIds.includes(g.id)).map((c) => courseView(c)),
  };
  return detail;
}, ['admin', 'teacher']);

route('POST', '/groups', ({ body }) => {
  const db = getDb();
  if (db.groups.some((g) => g.name.toLowerCase() === String(body.name).toLowerCase())) fail(409, 'Bunday nomli guruh mavjud', { name: 'Nom band' });
  const g: Group = { id: uid('grp'), name: body.name, facultyId: body.facultyId, course: Number(body.course), language: body.language, form: body.form, curatorId: body.curatorId || null, enrollmentYear: Number(body.enrollmentYear) };
  db.groups.push(g);
  touch();
  logActivity(`Yangi guruh yaratildi: ${g.name}`, 'group');
  return groupView(g);
}, [...ADMIN]);

route('PATCH', '/groups/:id', ({ params, body }) => {
  const g = getDb().groups.find((x) => x.id === params.id) ?? fail(404, 'Guruh topilmadi');
  Object.assign(g, { ...body, course: body.course !== undefined ? Number(body.course) : g.course, curatorId: body.curatorId === '' ? null : body.curatorId ?? g.curatorId });
  touch();
  return groupView(g);
}, [...ADMIN]);

route('DELETE', '/groups/:id', ({ params }) => {
  const db = getDb();
  if ((idx().studentsByGroup.get(params.id) ?? []).length) fail(409, "Guruhda talabalar bor. Avval ularni boshqa guruhga o'tkazing");
  if (db.courses.some((c) => c.groupIds.includes(params.id))) fail(409, 'Guruhga kurslar biriktirilgan');
  db.groups = db.groups.filter((g) => g.id !== params.id);
  touch();
}, [...ADMIN]);

route('POST', '/groups/:id/students', ({ params, body }) => {
  const ids = body.studentIds as string[];
  for (const id of ids) {
    const u = idx().user.get(id);
    if (!u) continue;
    if (!u.roles.includes('student')) u.roles.push('student');
    u.student = { ...(u.student ?? { recordBook: '', enrollmentYear: new Date().getFullYear() }), groupId: params.id };
  }
  touch();
  return { affected: ids.length };
}, [...ADMIN]);

/* ───────────── Subjects ───────────── */

route('GET', '/subjects', ({ query }) => getDb().subjects.filter((s) => matches(query.q, s.name, s.code)).sort((a, b) => a.name.localeCompare(b.name)));
route('POST', '/subjects', ({ body }) => {
  const db = getDb();
  if (db.subjects.some((s) => s.code.toLowerCase() === String(body.code).toLowerCase())) fail(409, 'Bu kod band', { code: 'Kod band' });
  const s: Subject = { id: uid('sub'), ...body };
  db.subjects.push(s);
  touch();
  logActivity(`Yangi fan qo'shildi: ${s.name}`, 'subject');
  return s;
}, [...ADMIN]);
route('PATCH', '/subjects/:id', ({ params, body }) => {
  const s = getDb().subjects.find((x) => x.id === params.id) ?? fail(404, 'Fan topilmadi');
  Object.assign(s, body);
  touch();
  return s;
}, [...ADMIN]);
route('DELETE', '/subjects/:id', ({ params }) => {
  const db = getDb();
  if (db.courses.some((c) => c.subjectId === params.id)) fail(409, 'Fan kurslarda ishlatilmoqda');
  db.subjects = db.subjects.filter((s) => s.id !== params.id);
  touch();
}, [...ADMIN]);

/* ───────────── Academic years & semesters ───────────── */

route('GET', '/academic-years', () => {
  const db = getDb();
  return [...db.academicYears]
    .sort((a, b) => ts(b.startDate) - ts(a.startDate))
    .map<AcademicYearView>((y) => ({
      ...y,
      semesters: db.semesters.filter((s) => s.academicYearId === y.id).sort((a, b) => a.number - b.number).map((s) => ({ ...s, courseCount: db.courses.filter((c) => c.semesterId === s.id).length })),
    }));
});

route('GET', '/semesters', () => {
  const i = idx();
  return [...getDb().semesters]
    .sort((a, b) => ts(b.startDate) - ts(a.startDate))
    .map<SemesterView>((s) => ({ ...s, academicYearName: getDb().academicYears.find((y) => y.id === s.academicYearId)?.name ?? '' }))
    .filter((s) => i.semester.has(s.id));
});

route('POST', '/academic-years', ({ body }) => {
  const db = getDb();
  const startYear = Number(body.startYear);
  const name = `${startYear}-${startYear + 1}`;
  if (db.academicYears.some((y) => y.name === name)) fail(409, "Bu o'quv yili mavjud");
  const id = uid('ay');
  const y = { id, name, startDate: new Date(startYear, 8, 1).toISOString(), endDate: new Date(startYear + 1, 5, 30).toISOString(), isCurrent: false };
  db.academicYears.push(y);
  const sems: Semester[] = [
    { id: uid('sem'), academicYearId: id, number: 1, name: `${name}, 1-semestr`, startDate: new Date(startYear, 8, 1).toISOString(), endDate: new Date(startYear + 1, 0, 20).toISOString(), isCurrent: false },
    { id: uid('sem'), academicYearId: id, number: 2, name: `${name}, 2-semestr`, startDate: new Date(startYear + 1, 1, 2).toISOString(), endDate: new Date(startYear + 1, 5, 15).toISOString(), isCurrent: false },
  ];
  db.semesters.push(...sems);
  touch();
  logActivity(`Yangi o'quv yili qo'shildi: ${name}`, 'year');
  return y;
}, [...ADMIN]);

route('PATCH', '/semesters/:id', ({ params, body }) => {
  const s = getDb().semesters.find((x) => x.id === params.id) ?? fail(404, 'Semestr topilmadi');
  if (body.startDate) s.startDate = body.startDate;
  if (body.endDate) s.endDate = body.endDate;
  touch();
  return s;
}, [...ADMIN]);

route('POST', '/semesters/:id/activate', ({ params }) => {
  const db = getDb();
  const target = db.semesters.find((s) => s.id === params.id) ?? fail(404, 'Semestr topilmadi');
  db.semesters.forEach((s) => (s.isCurrent = s.id === target.id));
  db.academicYears.forEach((y) => (y.isCurrent = y.id === target.academicYearId));
  touch();
  logActivity(`Joriy semestr o'zgartirildi: ${target.name}`, 'year');
  return target;
}, [...ADMIN]);

route('DELETE', '/academic-years/:id', ({ params }) => {
  const db = getDb();
  const semIds = db.semesters.filter((s) => s.academicYearId === params.id).map((s) => s.id);
  if (db.academicYears.find((y) => y.id === params.id)?.isCurrent) fail(409, "Joriy o'quv yilini o'chirib bo'lmaydi");
  if (db.courses.some((c) => semIds.includes(c.semesterId)) || db.gradeRecords.some((r) => semIds.includes(r.semesterId))) fail(409, "O'quv yilida ma'lumotlar mavjud");
  db.academicYears = db.academicYears.filter((y) => y.id !== params.id);
  db.semesters = db.semesters.filter((s) => !semIds.includes(s.id));
  touch();
}, [...ADMIN]);

/* ───────────── Courses (teaching load) ───────────── */

route('GET', '/courses', ({ query, me }) => {
  const db = getDb();
  const semesterId = query.semesterId || currentSemester().id;
  let list: Course[];
  if (query.as === 'student') list = studentCourses(me, semesterId);
  else if (query.as === 'teacher') list = teacherCourses(me.id, semesterId);
  else {
    if (!me.roles.includes('admin')) fail(403, "Ruxsat yo'q");
    list = db.courses.filter((c) => c.semesterId === semesterId);
  }
  return list
    .filter((c) => (!query.teacherId || c.teacherId === query.teacherId) && (!query.groupId || c.groupIds.includes(query.groupId)) && (!query.subjectId || c.subjectId === query.subjectId) && matches(query.q, courseTitle(c)))
    .map((c) => courseView(c, query.as === 'student' ? me : null))
    .sort((a, b) => a.subject.name.localeCompare(b.subject.name));
});

function validateCourse(dto: UpsertCourseDto) {
  const sum = dto.grading.current + dto.grading.midterm + dto.grading.final;
  if (sum !== 100) fail(400, `Ball taqsimoti yig'indisi 100 bo'lishi kerak (hozir ${sum})`);
  if (!dto.groupIds.length) fail(400, 'Kamida bitta guruh tanlang', { groupIds: 'Guruh tanlanmagan' });
}

route('POST', '/courses', ({ body }) => {
  const dto = body as UpsertCourseDto;
  validateCourse(dto);
  const c: Course = { id: uid('crs'), ...dto, createdAt: new Date().toISOString() };
  getDb().courses.push(c);
  touch();
  notify([dto.teacherId], 'system', 'Yangi kurs biriktirildi', `Sizga «${courseTitle(c)}» kursi biriktirildi`, `/teacher/courses/${c.id}`);
  logActivity(`Yangi kurs: ${courseTitle(c)}`, 'course');
  return courseView(c);
}, [...ADMIN]);

route('PATCH', '/courses/:id', ({ params, body }) => {
  const c = getDb().courses.find((x) => x.id === params.id) ?? fail(404, 'Kurs topilmadi');
  const dto = { ...c, ...body } as UpsertCourseDto;
  validateCourse(dto);
  Object.assign(c, { subjectId: dto.subjectId, teacherId: dto.teacherId, groupIds: dto.groupIds, semesterId: dto.semesterId, grading: dto.grading });
  touch();
  return courseView(c);
}, [...ADMIN]);

route('DELETE', '/courses/:id', ({ params }) => {
  const db = getDb();
  const id = params.id;
  db.courses = db.courses.filter((c) => c.id !== id);
  db.topics = db.topics.filter((x) => x.courseId !== id);
  db.materials = db.materials.filter((x) => x.courseId !== id);
  db.assignments = db.assignments.filter((x) => x.courseId !== id);
  db.submissions = db.submissions.filter((x) => x.courseId !== id);
  db.assessments = db.assessments.filter((x) => x.courseId !== id);
  db.results = db.results.filter((x) => x.courseId !== id);
  db.schedule = db.schedule.filter((x) => x.courseId !== id);
  db.attendance = db.attendance.filter((x) => x.courseId !== id);
  touch();
}, [...ADMIN]);

/* ───────────── Settings ───────────── */

route('GET', '/settings', () => getDb().settings, false);
route('PATCH', '/settings', ({ body }) => {
  const db = getDb();
  db.settings = { ...db.settings, ...(body as Partial<SystemSettings>) };
  logActivity('Tizim sozlamalari yangilandi', 'system');
  return db.settings;
}, [...ADMIN]);

route('POST', '/admin/reset-demo', async () => {
  await resetDb();
  return { ok: true };
}, [...ADMIN]);
