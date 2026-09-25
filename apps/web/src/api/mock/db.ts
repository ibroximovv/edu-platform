import { createStore, get, set, del } from 'idb-keyval';
import type {
  AcademicYear,
  Assessment,
  AssessmentResult,
  Assignment,
  AttendanceSession,
  Course,
  Department,
  Faculty,
  GradeRecord,
  Group,
  Material,
  Notification,
  ScheduleSlot,
  Semester,
  Subject,
  Submission,
  SystemSettings,
  Topic,
  User,
} from '@edu/shared';

/** Bump when the seed or schema changes — stored demo data is then regenerated. */
export const DB_VERSION = 4;

export type DbUser = User & { passwordHash: string };

export interface PendingCode {
  email: string;
  code: string;
  purpose: 'verify' | 'reset';
  expiresAt: number;
  attempts: number;
}

export interface ActivityItem {
  id: string;
  text: string;
  kind: string;
  at: string;
}

export interface DB {
  version: number;
  seededAt: string;
  users: DbUser[];
  faculties: Faculty[];
  departments: Department[];
  groups: Group[];
  academicYears: AcademicYear[];
  semesters: Semester[];
  subjects: Subject[];
  courses: Course[];
  topics: Topic[];
  materials: Material[];
  assignments: Assignment[];
  submissions: Submission[];
  assessments: Assessment[];
  results: AssessmentResult[];
  schedule: ScheduleSlot[];
  attendance: AttendanceSession[];
  gradeRecords: GradeRecord[];
  notifications: Notification[];
  activity: ActivityItem[];
  codes: PendingCode[];
  settings: SystemSettings;
}

const store = typeof indexedDB !== 'undefined' ? createStore('edu-mock-db', 'kv') : undefined;
const KEY = 'db';

let db: DB | null = null;
let loading: Promise<DB> | null = null;
let revision = 0;

export function getDb(): DB {
  if (!db) throw new Error('Mock DB not loaded');
  return db;
}

export function loadDb(): Promise<DB> {
  if (db) return Promise.resolve(db);
  loading ??= (async () => {
    let stored: DB | undefined;
    try {
      stored = await get<DB>(KEY, store);
    } catch {
      stored = undefined;
    }
    if (stored && stored.version === DB_VERSION) {
      db = stored;
    } else {
      const { createSeed } = await import('./seed');
      db = await createSeed();
      await set(KEY, db, store).catch(() => undefined);
    }
    revision++;
    return db;
  })();
  return loading;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('edu-mock-db') : null;

/** Persist after a mutation (debounced) and tell other tabs to reload. */
export function commit() {
  revision++;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (!db) return;
    await set(KEY, db, store).catch(() => undefined);
    channel?.postMessage({ type: 'db-changed' });
  }, 120);
}

export function onExternalChange(cb: () => void) {
  if (!channel) return () => undefined;
  const handler = async (e: MessageEvent) => {
    if (e.data?.type !== 'db-changed') return;
    const fresh = await get<DB>(KEY, store).catch(() => undefined);
    if (fresh) {
      db = fresh;
      revision++;
      cb();
    }
  };
  channel.addEventListener('message', handler);
  return () => channel.removeEventListener('message', handler);
}

export async function resetDb() {
  await del(KEY, store).catch(() => undefined);
  db = null;
  loading = null;
  await loadDb();
  channel?.postMessage({ type: 'db-changed' });
}

/* ───────────── Indexes (rebuilt lazily on revision change) ───────────── */

export interface DbIndex {
  user: Map<string, DbUser>;
  group: Map<string, Group>;
  subject: Map<string, Subject>;
  course: Map<string, Course>;
  semester: Map<string, Semester>;
  faculty: Map<string, Faculty>;
  department: Map<string, Department>;
  studentsByGroup: Map<string, DbUser[]>;
  submissionsByAssignment: Map<string, Submission[]>;
  resultsByAssessment: Map<string, AssessmentResult[]>;
  attendanceByCourse: Map<string, AttendanceSession[]>;
}

let indexCache: { rev: number; index: DbIndex } | null = null;

function groupBy<T>(items: T[], key: (t: T) => string | null | undefined) {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    if (!k) continue;
    const arr = m.get(k);
    if (arr) arr.push(it);
    else m.set(k, [it]);
  }
  return m;
}

export function idx(): DbIndex {
  if (indexCache && indexCache.rev === revision) return indexCache.index;
  const d = getDb();
  const index: DbIndex = {
    user: new Map(d.users.map((u) => [u.id, u])),
    group: new Map(d.groups.map((g) => [g.id, g])),
    subject: new Map(d.subjects.map((s) => [s.id, s])),
    course: new Map(d.courses.map((c) => [c.id, c])),
    semester: new Map(d.semesters.map((s) => [s.id, s])),
    faculty: new Map(d.faculties.map((f) => [f.id, f])),
    department: new Map(d.departments.map((x) => [x.id, x])),
    studentsByGroup: groupBy(
      d.users.filter((u) => u.roles.includes('student') && u.status === 'active'),
      (u) => u.student?.groupId,
    ),
    submissionsByAssignment: groupBy(d.submissions, (s) => s.assignmentId),
    resultsByAssessment: groupBy(d.results, (r) => r.assessmentId),
    attendanceByCourse: groupBy(d.attendance, (a) => a.courseId),
  };
  for (const list of index.studentsByGroup.values()) list.sort((a, b) => a.lastName.localeCompare(b.lastName));
  indexCache = { rev: revision, index };
  return index;
}

/** Mark indexes stale without persisting (used inside handlers after in-place edits). */
export function touch() {
  revision++;
}

/* ───────────── Utilities ───────────── */

export function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export async function hashPassword(password: string) {
  const data = new TextEncoder().encode(`edu-mock-salt::${password}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
