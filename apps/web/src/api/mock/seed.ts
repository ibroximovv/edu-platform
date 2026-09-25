/**
 * Deterministic demo data generator. All dates are relative to "now",
 * so the demo always looks alive: open tests, upcoming deadlines, review queues.
 */
import {
  DEFAULT_GRADING,
  DEFAULT_SETTINGS,
  type AcademicYear,
  type Assessment,
  type AssessmentResult,
  type Assignment,
  type AttendanceSession,
  type AttendanceStatus,
  type Course,
  type Department,
  type Faculty,
  type FileRef,
  type GradeRecord,
  type Group,
  type LessonType,
  type Material,
  type Notification,
  type Question,
  type ScheduleSlot,
  type Semester,
  type Subject,
  type Submission,
  type Topic,
} from '@edu/shared';
import { DB_VERSION, hashPassword, type ActivityItem, type DB, type DbUser } from './db';
import * as S from './seedData';

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;
const HOUR = 3_600_000;

export async function createSeed(): Promise<DB> {
  const rnd = mulberry32(20260925);
  const pick = <T>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)];
  const chance = (p: number) => rnd() < p;
  const between = (a: number, b: number) => a + rnd() * (b - a);
  const int = (a: number, b: number) => Math.floor(between(a, b + 1));
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const shuffle = <T>(arr: T[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  let counter = 0;
  const id = (p: string) => `${p}_${(++counter).toString(36).padStart(4, '0')}`;

  const nowMs = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const at = (ms: number, h: number, m = 0) => {
    const d = new Date(ms);
    d.setHours(h, m, 0, 0);
    return d.getTime();
  };

  const [demoHash, adminHash] = await Promise.all([hashPassword('Demo@1234'), hashPassword('Ibroximov@1')]);

  /* ───────── Academic calendar ───────── */
  const now = new Date(nowMs);
  const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const academicYears: AcademicYear[] = [];
  const semesters: Semester[] = [];
  for (const y of [startYear - 2, startYear - 1, startYear]) {
    const ay: AcademicYear = {
      id: `ay_${y}`,
      name: `${y}-${y + 1}`,
      startDate: iso(new Date(y, 8, 1).getTime()),
      endDate: iso(new Date(y + 1, 5, 30).getTime()),
      isCurrent: y === startYear,
    };
    academicYears.push(ay);
    semesters.push(
      { id: `sem_${y}_1`, academicYearId: ay.id, number: 1, name: `${y}-${y + 1}, 1-semestr`, startDate: iso(new Date(y, 8, 1).getTime()), endDate: iso(new Date(y + 1, 0, 20).getTime()), isCurrent: false },
      { id: `sem_${y}_2`, academicYearId: ay.id, number: 2, name: `${y}-${y + 1}, 2-semestr`, startDate: iso(new Date(y + 1, 1, 2).getTime()), endDate: iso(new Date(y + 1, 5, 15).getTime()), isCurrent: false },
    );
  }
  const curYearSems = semesters.filter((s) => s.academicYearId === `ay_${startYear}`);
  const current = nowMs >= new Date(curYearSems[1].startDate).getTime() ? curYearSems[1] : curYearSems[0];
  current.isCurrent = true;
  const semStart = new Date(current.startDate).getTime();
  const semEnd = new Date(current.endDate).getTime();
  const pastSemesters = semesters.filter((s) => new Date(s.endDate).getTime() < semStart);

  /* ───────── Structure ───────── */
  const faculties: Faculty[] = S.FACULTIES.map((f) => ({ id: `fac_${f.key.toLowerCase()}`, name: f.name, shortName: f.shortName, deanId: null }));
  const facId = (key: string) => `fac_${key.toLowerCase()}`;
  const departments: Department[] = S.DEPARTMENTS.map((d) => ({ id: `dep_${d.key}`, facultyId: facId(d.faculty), name: d.name, headId: null }));

  const subjects: Subject[] = S.SUBJECTS.map((s) => ({
    id: `sub_${s.key}`,
    name: s.name,
    code: s.code,
    credits: s.credits,
    color: s.color,
    departmentId: `dep_${s.dept}`,
    description: s.description,
    hours: { lecture: 30, practice: s.key === 'en' ? 60 : 30, lab: ['py', 'db', 'net', 'os'].includes(s.key) ? 30 : 0 },
  }));
  const subjectSeed = new Map(S.SUBJECTS.map((s) => [`sub_${s.key}`, s]));

  const groups: Group[] = S.GROUPS.map((g) => ({
    id: `grp_${g.name.toLowerCase().replace('-', '')}`,
    name: g.name,
    facultyId: facId(g.faculty),
    course: g.course,
    language: g.language,
    form: 'fulltime',
    curatorId: null,
    enrollmentYear: startYear - g.course + 1,
  }));

  /* ───────── Users ───────── */
  const users: DbUser[] = [];
  const ability = new Map<string, number>();
  const usedEmails = new Set<string>();
  const translit = (s: string) => s.toLowerCase().replace(/['’`ʻʼ]/g, '').replace(/[^a-z]/g, '');
  const makeEmail = (first: string, last: string, domain = 'bilimdon.uz') => {
    const base = `${translit(first)}.${translit(last)}`;
    let email = `${base}@${domain}`;
    let n = 2;
    while (usedEmails.has(email)) email = `${base}${n++}@${domain}`;
    usedEmails.add(email);
    return email;
  };

  const admin: DbUser = {
    id: 'u_admin',
    email: 'ibroximov@gmail.com',
    firstName: 'Ilyosbek',
    lastName: 'Ibroximov',
    phone: '+998 90 123 45 67',
    roles: ['admin', 'teacher', 'student'],
    status: 'active',
    emailVerified: true,
    createdAt: iso(nowMs - 400 * DAY),
    lastLoginAt: null,
    passwordHash: adminHash,
    avatarUrl: null,
    teacher: { departmentId: 'dep_dt', position: 'senior', degree: 'MSc' },
    student: { groupId: 'grp_di301', recordBook: `${startYear - 2}DI0300`, enrollmentYear: startYear - 2 },
  };
  usedEmails.add(admin.email);
  users.push(admin);
  ability.set(admin.id, 0.93);

  const teacherIds: string[] = [];
  const teacherSubjects = new Map<string, string[]>();
  for (const t of S.TEACHERS) {
    const email = t.email ?? makeEmail(t.first, t.last);
    usedEmails.add(email);
    const u: DbUser = {
      id: id('u'),
      email,
      firstName: t.first,
      lastName: t.last,
      phone: `+998 9${int(0, 9)} ${int(100, 999)} ${int(10, 99)} ${int(10, 99)}`,
      roles: ['teacher'],
      status: 'active',
      emailVerified: true,
      createdAt: iso(nowMs - int(300, 900) * DAY),
      lastLoginAt: iso(nowMs - int(1, 72) * HOUR),
      passwordHash: demoHash,
      avatarUrl: null,
      teacher: { departmentId: `dep_${t.dept}`, position: t.position, degree: t.degree },
      student: null,
    };
    users.push(u);
    teacherIds.push(u.id);
    teacherSubjects.set(u.id, t.subjects.map((k) => `sub_${k}`));
  }
  const demoTeacherId = teacherIds[0];
  faculties[0].deanId = teacherIds[1];
  faculties[1].deanId = teacherIds[7];
  faculties[2].deanId = teacherIds[8];
  departments.forEach((d) => {
    d.headId = teacherIds.find((tid) => users.find((u) => u.id === tid)?.teacher?.departmentId === d.id) ?? null;
  });

  let demoStudentId = '';
  groups.forEach((g, gi) => {
    g.curatorId = teacherIds[gi % teacherIds.length];
    for (let i = 0; i < 14; i++) {
      const female = chance(0.45);
      const first = pick(female ? S.FEMALE_NAMES : S.MALE_NAMES);
      const root = pick(S.LAST_NAME_ROOTS);
      const last = female ? `${root}a` : root;
      const isDemo = g.name === 'DI-301' && i === 0;
      const email = isDemo ? 'student@bilimdon.uz' : makeEmail(first, last);
      usedEmails.add(email);
      const u: DbUser = {
        id: id('u'),
        email,
        firstName: isDemo ? 'Madina' : first,
        lastName: isDemo ? 'Yusupova' : last,
        roles: ['student'],
        status: 'active',
        emailVerified: true,
        createdAt: iso(new Date(g.enrollmentYear, 7, 20).getTime() + int(0, 20) * DAY),
        lastLoginAt: chance(0.8) ? iso(nowMs - int(1, 200) * HOUR) : null,
        passwordHash: demoHash,
        avatarUrl: null,
        phone: `+998 9${int(0, 9)} ${int(100, 999)} ${int(10, 99)} ${int(10, 99)}`,
        student: { groupId: g.id, recordBook: `${g.enrollmentYear}${g.name.slice(0, 2)}${String(gi + 1).padStart(2, '0')}${String(i + 1).padStart(2, '0')}`, enrollmentYear: g.enrollmentYear },
        teacher: null,
      };
      if (isDemo) demoStudentId = u.id;
      users.push(u);
      ability.set(u.id, isDemo ? 0.88 : clamp(between(0.5, 0.99), 0, 1));
    }
  });
  // one blocked student for admin demo
  const blocked = users.find((u) => u.student?.groupId === 'grp_ki201' && u.roles.includes('student'));
  if (blocked) blocked.status = 'blocked';

  // Pending registrations (awaiting admin approval)
  for (const [first, last, hours] of [['Bobur', 'Saidov', 3], ['Sitora', 'Olimova', 9], ['Diyor', 'Hamidov', 26]] as const) {
    users.push({
      id: id('u'),
      email: makeEmail(first, last, 'gmail.com'),
      firstName: first,
      lastName: last,
      roles: ['student'],
      status: 'pending',
      emailVerified: true,
      createdAt: iso(nowMs - hours * HOUR),
      passwordHash: demoHash,
      avatarUrl: null,
      student: { groupId: null, recordBook: '', enrollmentYear: startYear },
      teacher: null,
    });
  }

  const studentsOf = (groupIds: string[]) => users.filter((u) => u.status === 'active' && u.roles.includes('student') && groupIds.includes(u.student?.groupId ?? ''));

  /* ───────── Courses (teaching load) ───────── */
  const courses: Course[] = [];
  const load = new Map<string, number>(teacherIds.map((t) => [t, 0]));
  const overrides: Record<string, string> = { 'DI-201:web': admin.id, 'DI-101:ux': admin.id };
  for (const g of S.GROUPS) {
    const group = groups.find((x) => x.name === g.name)!;
    for (const sk of g.subjects) {
      const subjectId = `sub_${sk}`;
      let teacherId = overrides[`${g.name}:${sk}`];
      if (!teacherId) {
        const candidates = teacherIds.filter((t) => teacherSubjects.get(t)!.includes(subjectId));
        candidates.sort((a, b) => load.get(a)! - load.get(b)!);
        teacherId = candidates[0];
      }
      load.set(teacherId, (load.get(teacherId) ?? 0) + 1);
      courses.push({
        id: id('crs'),
        subjectId,
        teacherId,
        groupIds: [group.id],
        semesterId: current.id,
        grading: { ...DEFAULT_GRADING },
        createdAt: iso(semStart - 10 * DAY),
      });
    }
  }

  /* ───────── Topics, materials ───────── */
  const topics: Topic[] = [];
  const materials: Material[] = [];
  const fileRef = (name: string, kind: FileRef['kind'], url: string, mime: string, size: number, by: string, when: number): FileRef => ({
    id: id('f'),
    name,
    kind,
    url,
    mime,
    size,
    uploadedBy: by,
    uploadedAt: iso(when),
  });
  const labSubjects = ['sub_py', 'sub_db', 'sub_net', 'sub_os'];

  for (const c of courses) {
    const seed = subjectSeed.get(c.subjectId)!;
    seed.topics.forEach((title, i) => {
      const planned = at(semStart + i * 7 * DAY + (i % 2) * 2 * DAY, 9);
      const type: LessonType = i % 2 === 0 ? 'lecture' : labSubjects.includes(c.subjectId) ? 'lab' : 'practice';
      const topic: Topic = {
        id: id('tp'),
        courseId: c.id,
        order: i + 1,
        title,
        description: type === 'lecture' ? `${title} mavzusidagi nazariy ma'ruza.` : `${title} bo'yicha amaliy mashg'ulot.`,
        type,
        hours: 2,
        plannedDate: iso(planned),
        status: planned < nowMs ? 'done' : 'planned',
      };
      topics.push(topic);
      if (planned > nowMs + 8 * DAY) return;
      const when = planned - 2 * DAY;
      materials.push({
        id: id('mat'),
        courseId: c.id,
        topicId: topic.id,
        title: `Ma'ruza matni: ${title}`,
        description: "Mavzu bo'yicha asosiy nazariy material.",
        kind: 'pdf',
        file: fileRef(`${i + 1}-mavzu.pdf`, 'pdf', S.SAMPLE_FILES.pdf, 'application/pdf', int(180, 2400) * 1024, c.teacherId, when),
        createdAt: iso(when),
        createdBy: c.teacherId,
        views: int(3, 40),
      });
      if (i % 2 === 0) {
        materials.push({
          id: id('mat'),
          courseId: c.id,
          topicId: topic.id,
          title: `Video dars: ${title}`,
          kind: 'video',
          file: fileRef(`video-dars-${i + 1}.mp4`, 'video', S.SAMPLE_FILES.videos[i % 2], 'video/mp4', int(40, 380) * 1024 * 1024, c.teacherId, when),
          createdAt: iso(when + HOUR),
          createdBy: c.teacherId,
          views: int(10, 70),
        });
      }
      if (i % 3 === 1) {
        materials.push({
          id: id('mat'),
          courseId: c.id,
          topicId: topic.id,
          title: `Sxema: ${title}`,
          kind: 'image',
          file: fileRef(`sxema-${i + 1}.jpg`, 'image', S.SAMPLE_FILES.image(`${c.id}${i}`), 'image/jpeg', int(200, 900) * 1024, c.teacherId, when),
          createdAt: iso(when + 2 * HOUR),
          createdBy: c.teacherId,
          views: int(5, 30),
        });
      }
      if (i === 0) {
        materials.push({
          id: id('mat'),
          courseId: c.id,
          topicId: topic.id,
          title: "Qo'shimcha manba (rasmiy hujjatlar)",
          kind: 'link',
          url: S.SUBJECT_LINKS[seed.key],
          createdAt: iso(when),
          createdBy: c.teacherId,
          views: int(5, 50),
        });
      }
    });
  }

  /* ───────── Assignments & submissions ───────── */
  const assignments: Assignment[] = [];
  const submissions: Submission[] = [];
  const demoIds = new Set([demoStudentId, admin.id]);
  const deadlines = [nowMs - 14 * DAY, nowMs - 3 * DAY, nowMs + 3 * DAY, nowMs + 11 * DAY];

  courses.forEach((c, ci) => {
    const courseTopics = topics.filter((t) => t.courseId === c.id);
    const studs = studentsOf(c.groupIds);
    deadlines.forEach((dl, ai) => {
      const tpl = S.ASSIGNMENT_TEMPLATES[(ci + ai) % S.ASSIGNMENT_TEMPLATES.length];
      const topic = courseTopics[Math.min(courseTopics.length - 1, ai * 2 + 1)];
      const maxScore = tpl.type === 'project' ? 20 : 10;
      const deadline = at(dl, 23, 59);
      const a: Assignment = {
        id: id('asg'),
        courseId: c.id,
        topicId: topic.id,
        title: `${ai + 1}-${tpl.title.toLowerCase()}: ${topic.title}`,
        description: tpl.desc,
        type: tpl.type,
        maxScore,
        deadline: iso(deadline),
        allowLate: ai !== 3,
        latePenalty: 20,
        attachments: ai === 0 ? [fileRef('topshiriq-shartlari.pdf', 'pdf', S.SAMPLE_FILES.pdf, 'application/pdf', 312_000, c.teacherId, deadline - 10 * DAY)] : [],
        status: 'published',
        createdAt: iso(deadline - 10 * DAY),
        createdBy: c.teacherId,
      };
      assignments.push(a);

      for (const s of studs) {
        const ab = ability.get(s.id) ?? 0.7;
        const isDemo = demoIds.has(s.id);
        if (ai >= 2 && isDemo) continue;
        const submitP = ai <= 1 ? 0.55 + ab * 0.45 : ai === 2 ? 0.35 : 0.08;
        if (!isDemo && !chance(submitP)) continue;
        if (dl > nowMs && !isDemo && ai === 3 && !chance(0.5)) continue;
        const late = ai <= 1 && chance(0.08);
        const submittedAt = late ? deadline + int(2, 30) * HOUR : Math.min(nowMs - HOUR, deadline - int(1, 96) * HOUR);
        const gradedP = ai === 0 ? 0.96 : ai === 1 ? (isDemo ? 0 : 0.45) : 0;
        const graded = chance(gradedP);
        const raw = clamp(ab + between(-0.12, 0.1), 0.35, 1);
        const score = graded ? Math.round(maxScore * raw * (late ? 0.8 : 1)) : null;
        const useText = chance(0.25);
        submissions.push({
          id: id('sbm'),
          assignmentId: a.id,
          courseId: c.id,
          studentId: s.id,
          text: useText ? "Topshiriq bajarildi. Kod va hisobot GitHub'da: https://github.com/student/lab" : undefined,
          files: useText ? [] : [fileRef(`${translit(s.lastName)}_${ai + 1}-topshiriq.pdf`, 'pdf', S.SAMPLE_FILES.pdf, 'application/pdf', int(120, 4800) * 1024, s.id, submittedAt)],
          submittedAt: iso(submittedAt),
          late,
          status: graded ? 'graded' : 'submitted',
          score,
          feedback: graded ? pick(["Yaxshi bajarilgan, lekin xulosani kengaytiring.", "A'lo! Kod toza va tushunarli.", "Hisobotda xatoliklar bor, keyingi safar e'tiborli bo'ling.", 'Talablar to‘liq bajarilgan.', "Algoritm to'g'ri, ammo optimallashtirish mumkin."]) : null,
          gradedAt: graded ? iso(Math.min(nowMs - HOUR, deadline + int(4, 60) * HOUR)) : null,
          gradedBy: graded ? c.teacherId : null,
          attempt: 1,
        });
      }
    });
  });

  /* ───────── Assessments & results ───────── */
  const assessments: Assessment[] = [];
  const results: AssessmentResult[] = [];

  const buildQuestions = (subjectKey: string, n: number, points: number): Question[] => {
    const own = shuffle(S.QUESTION_BANK[subjectKey] ?? []);
    const pool = [...own, ...shuffle(S.QUESTION_BANK.generic)].slice(0, n);
    return pool.map((q) => {
      const type = q.type ?? 'single';
      const options = type === 'truefalse'
        ? [{ id: 'true', text: "To'g'ri" }, { id: 'false', text: "Noto'g'ri" }]
        : q.options.map((text, i) => ({ id: `o${i + 1}`, text }));
      return { id: id('q'), type, text: q.text, options, correct: q.correct.map((ci) => options[ci].id), points };
    });
  };

  const simulate = (qs: Question[], ab: number) => {
    const answers: Record<string, string[]> = {};
    let score = 0;
    for (const q of qs) {
      if (chance(ab * 0.95 + 0.03)) {
        answers[q.id] = q.correct;
        score += q.points;
      } else {
        const wrong = q.options.filter((o) => !q.correct.includes(o.id));
        answers[q.id] = wrong.length ? [pick(wrong).id] : [];
      }
    }
    return { answers, score };
  };

  courses.forEach((c, ci) => {
    const seed = subjectSeed.get(c.subjectId)!;
    const studs = studentsOf(c.groupIds);
    const writtenMid = ['math', 'dm', 'en'].includes(seed.key);
    const midPast = ci % 2 === 0;
    const defs: Omit<Assessment, 'id' | 'createdAt' | 'createdBy' | 'courseId'>[] = [
      { title: 'Joriy test №1', description: "Birinchi mavzular bo'yicha qisqa test.", category: 'current', format: 'test', maxScore: 10, startsAt: iso(at(nowMs - 12 * DAY, 9)), endsAt: iso(at(nowMs - 10 * DAY, 23, 59)), durationMin: 20, attempts: 1, shuffle: true, showResults: true, questions: buildQuestions(seed.key, 5, 2), status: 'published' },
      { title: 'Joriy test №2', description: "O'tilgan mavzularni mustahkamlash testi. Vaqt cheklangan!", category: 'current', format: 'test', maxScore: 10, startsAt: iso(at(nowMs - DAY, 8)), endsAt: iso(at(nowMs + 4 * DAY, 23, 59)), durationMin: 15, attempts: 2, shuffle: true, showResults: true, questions: buildQuestions(seed.key, 5, 2), status: 'published' },
      { title: 'Oraliq nazorat', description: writtenMid ? 'Yozma ish: 3 ta nazariy savol va 2 ta masala.' : 'Oraliq nazorat testi (10 savol).', category: 'midterm', format: writtenMid ? 'written' : 'test', maxScore: 30, startsAt: iso(at(midPast ? nowMs - 5 * DAY : nowMs + 9 * DAY, 10)), endsAt: iso(at(midPast ? nowMs - 5 * DAY : nowMs + 9 * DAY, 12)), durationMin: 40, attempts: 1, shuffle: true, showResults: false, questions: writtenMid ? [] : buildQuestions(seed.key, 10, 3), status: 'published' },
      { title: 'Yakuniy nazorat', description: "Semestr yakunidagi yozma imtihon. Barcha mavzular bo'yicha.", category: 'final', format: 'written', maxScore: 30, startsAt: iso(at(semEnd - 12 * DAY, 9)), endsAt: iso(at(semEnd - 12 * DAY, 12)), durationMin: 80, attempts: 1, shuffle: false, showResults: false, questions: [], status: 'published' },
    ];
    defs.forEach((def, di) => {
      const a: Assessment = { ...def, id: id('as'), courseId: c.id, createdAt: iso(new Date(def.startsAt).getTime() - 7 * DAY), createdBy: c.teacherId };
      assessments.push(a);
      const start = new Date(a.startsAt).getTime();
      const end = new Date(a.endsAt).getTime();
      if (start > nowMs) return;
      for (const s of studs) {
        const ab = ability.get(s.id) ?? 0.7;
        const isDemo = demoIds.has(s.id);
        if (di === 1 && (isDemo || !chance(0.35))) continue; // open test — let demo users take it
        if (!isDemo && !chance(0.93)) continue;
        const startedAt = start + int(0, Math.max(1, Math.floor((Math.min(end, nowMs) - start) / HOUR) - 1)) * HOUR;
        if (a.format === 'test') {
          const { answers, score } = simulate(a.questions, ab);
          results.push({ id: id('res'), assessmentId: a.id, courseId: c.id, studentId: s.id, status: 'finished', attempt: 1, startedAt: iso(startedAt), finishedAt: iso(startedAt + int(5, a.durationMin) * 60_000), answers, order: a.questions.map((q) => q.id), score });
        } else {
          results.push({ id: id('res'), assessmentId: a.id, courseId: c.id, studentId: s.id, status: 'graded', attempt: 1, startedAt: a.startsAt, finishedAt: a.endsAt, score: Math.round(a.maxScore * clamp(ab + between(-0.2, 0.08), 0.25, 1)), feedback: null });
        }
      }
    });
  });

  /* ───────── Attendance ───────── */
  const attendance: AttendanceSession[] = [];
  for (const c of courses) {
    const studs = studentsOf(c.groupIds);
    for (const t of topics.filter((x) => x.courseId === c.id && x.status === 'done')) {
      const records: Record<string, AttendanceStatus> = {};
      for (const s of studs) {
        const ab = ability.get(s.id) ?? 0.7;
        const r = rnd();
        records[s.id] = r < 0.72 + ab * 0.24 ? 'present' : r < 0.95 ? (chance(0.5) ? 'late' : 'absent') : 'excused';
      }
      attendance.push({ id: id('att'), courseId: c.id, date: t.plannedDate!, topicId: t.id, records });
    }
  }

  /* ───────── Schedule ───────── */
  const schedule: ScheduleSlot[] = [];
  const busy = new Set<string>();
  const place = (c: Course, type: LessonType, pairs: number[]) => {
    for (let attempt = 0; attempt < 200; attempt++) {
      const day = int(1, 6);
      const pair = pick(pairs);
      const room = type === 'lecture' ? pick(S.LECTURE_HALLS) : pick(S.ROOMS);
      const keys = [...c.groupIds.map((g) => `g:${g}:${day}:${pair}`), `t:${c.teacherId}:${day}:${pair}`, `r:${room}:${day}:${pair}`];
      if (keys.some((k) => busy.has(k))) continue;
      if (day === 6 && attempt < 150) continue; // prefer weekdays
      keys.forEach((k) => busy.add(k));
      schedule.push({ id: id('sl'), courseId: c.id, groupIds: c.groupIds, day, pair, room, type, week: 'all' });
      return;
    }
  };
  for (const c of courses) {
    place(c, 'lecture', [1, 2, 3]);
    place(c, labSubjects.includes(c.subjectId) ? 'lab' : 'practice', [2, 3, 4, 5]);
  }

  /* ───────── Transcript records (past semesters) ───────── */
  const gradeRecords: GradeRecord[] = [];
  for (const u of users) {
    if (!u.student?.groupId || u.status !== 'active') continue;
    const ab = ability.get(u.id) ?? 0.7;
    for (const sem of pastSemesters) {
      const semYear = Number(sem.academicYearId.slice(3));
      if (semYear < u.student.enrollmentYear) continue;
      for (const sub of shuffle(subjects).slice(0, 5)) {
        const total = Math.round(clamp(52 + ab * 44 + between(-9, 7), 38, 100));
        const current = Math.round(total * 0.4);
        const midterm = Math.round(total * 0.3);
        gradeRecords.push({ id: id('gr'), studentId: u.id, subjectId: sub.id, semesterId: sem.id, credits: sub.credits, current, midterm, final: total - current - midterm, total });
      }
    }
  }

  /* ───────── Notifications & activity ───────── */
  const notifications: Notification[] = [];
  const notify = (userId: string, n: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>, hoursAgo: number, read = false) =>
    notifications.push({ id: id('ntf'), userId, read, createdAt: iso(nowMs - hoursAgo * HOUR), ...n });

  for (const sid of [demoStudentId, admin.id]) {
    notify(sid, { type: 'test', title: 'Yangi test ochildi', body: "«Joriy test №2» boshlandi. Topshirish muddati 4 kun.", link: '/student/tests' }, 2);
    notify(sid, { type: 'grade', title: 'Topshiriq baholandi', body: "1-topshiriq bo'yicha bahoingiz qo'yildi.", link: '/student/grades' }, 20);
    notify(sid, { type: 'assignment', title: 'Muddat yaqinlashmoqda', body: '3 kun ichida topshirilishi kerak bo‘lgan vazifangiz bor.', link: '/student/assignments' }, 28, true);
    notify(sid, { type: 'material', title: "Yangi material qo'shildi", body: "Video dars yuklandi. Ko'rib chiqing!", link: '/student/materials' }, 50, true);
  }
  for (const tid of [demoTeacherId, admin.id]) {
    notify(tid, { type: 'submission', title: 'Yangi topshiriqlar', body: "Tekshirishni kutayotgan ishlar bor.", link: '/teacher/reviews' }, 1);
    notify(tid, { type: 'schedule', title: "Jadvalda o'zgarish", body: 'Payshanba kungi dars IT-Lab 2 xonasiga ko‘chirildi.', link: '/teacher/schedule' }, 30, true);
  }
  notify(admin.id, { type: 'system', title: "Tasdiqlash kutilmoqda", body: "3 ta yangi foydalanuvchi ro'yxatdan o'tdi va tasdiqni kutmoqda.", link: '/admin/users?status=pending' }, 3);

  const activity: ActivityItem[] = S.ADMIN_ACTIVITY.map((a, i) => ({ id: id('act'), text: a.text, kind: a.kind, at: iso(nowMs - (i * 5 + 1) * HOUR) }));

  return {
    version: DB_VERSION,
    seededAt: iso(nowMs),
    users,
    faculties,
    departments,
    groups,
    academicYears,
    semesters,
    subjects,
    courses,
    topics,
    materials,
    assignments,
    submissions,
    assessments,
    results,
    schedule,
    attendance,
    gradeRecords,
    notifications,
    activity,
    codes: [],
    settings: structuredClone(DEFAULT_SETTINGS),
  };
}
