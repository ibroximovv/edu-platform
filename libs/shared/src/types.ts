/**
 * Domain entities shared between the web app and the (future) NestJS API.
 * Keep this file framework-agnostic: plain types only.
 */

export type ID = string;
/** ISO-8601 date-time string */
export type ISODate = string;

export const ROLES = ['admin', 'teacher', 'student'] as const;
export type Role = (typeof ROLES)[number];

export type UserStatus = 'active' | 'pending' | 'blocked';
export type TeacherPosition = 'assistant' | 'senior' | 'docent' | 'professor' | 'head';

export interface StudentProfile {
  groupId: ID | null;
  /** Reyting daftarchasi raqami */
  recordBook: string;
  enrollmentYear: number;
}

export interface TeacherProfile {
  departmentId: ID | null;
  position: TeacherPosition;
  degree?: string;
}

export interface User {
  id: ID;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  avatarUrl?: string | null;
  roles: Role[];
  status: UserStatus;
  emailVerified: boolean;
  createdAt: ISODate;
  lastLoginAt?: ISODate | null;
  student?: StudentProfile | null;
  teacher?: TeacherProfile | null;
}

/* ───────────────────────── Structure ───────────────────────── */

export interface Faculty {
  id: ID;
  name: string;
  shortName: string;
  deanId?: ID | null;
}

/** Kafedra */
export interface Department {
  id: ID;
  facultyId: ID;
  name: string;
  headId?: ID | null;
}

export type EducationForm = 'fulltime' | 'parttime' | 'evening';
export type EducationLang = 'uz' | 'ru' | 'en';

export interface Group {
  id: ID;
  name: string;
  facultyId: ID;
  /** Kurs (1-5) */
  course: number;
  language: EducationLang;
  form: EducationForm;
  curatorId?: ID | null;
  enrollmentYear: number;
}

export interface AcademicYear {
  id: ID;
  name: string;
  startDate: ISODate;
  endDate: ISODate;
  isCurrent: boolean;
}

export interface Semester {
  id: ID;
  academicYearId: ID;
  number: 1 | 2;
  name: string;
  startDate: ISODate;
  endDate: ISODate;
  isCurrent: boolean;
}

export type SubjectColor = 'violet' | 'pink' | 'sky' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'teal' | 'orange' | 'cyan';

export interface Subject {
  id: ID;
  name: string;
  code: string;
  credits: number;
  departmentId?: ID | null;
  color: SubjectColor;
  hours: { lecture: number; practice: number; lab: number };
  description?: string;
}

/** Ball taqsimoti: JN + ON + YN = 100 */
export interface GradingScheme {
  current: number;
  midterm: number;
  final: number;
}

/** O'qituvchi yuklamasi: fan + o'qituvchi + guruh(lar) + semestr */
export interface Course {
  id: ID;
  subjectId: ID;
  teacherId: ID;
  groupIds: ID[];
  semesterId: ID;
  grading: GradingScheme;
  createdAt: ISODate;
}

/* ───────────────────────── Learning ───────────────────────── */

export type LessonType = 'lecture' | 'practice' | 'lab' | 'seminar';

/** Dars mavzusi (sillabus bandi) */
export interface Topic {
  id: ID;
  courseId: ID;
  order: number;
  title: string;
  description?: string;
  type: LessonType;
  hours: number;
  plannedDate?: ISODate | null;
  status: 'planned' | 'done';
}

export type FileKind = 'video' | 'image' | 'pdf' | 'document' | 'presentation' | 'spreadsheet' | 'archive' | 'audio' | 'other';

export interface FileRef {
  id: ID;
  name: string;
  size: number;
  mime: string;
  kind: FileKind;
  /** Public URL. In mock mode `idb://<id>` points to an IndexedDB blob. */
  url: string;
  uploadedAt: ISODate;
  uploadedBy: ID;
}

export type MaterialKind = FileKind | 'link';

export interface Material {
  id: ID;
  courseId: ID;
  topicId?: ID | null;
  title: string;
  description?: string;
  kind: MaterialKind;
  file?: FileRef | null;
  url?: string | null;
  createdAt: ISODate;
  createdBy: ID;
  views: number;
}

export type AssignmentType = 'homework' | 'lab' | 'project' | 'essay' | 'practice';
export type PublishStatus = 'draft' | 'published';

export interface Assignment {
  id: ID;
  courseId: ID;
  topicId?: ID | null;
  title: string;
  description: string;
  type: AssignmentType;
  maxScore: number;
  deadline: ISODate;
  allowLate: boolean;
  /** Kechikkan topshiriq uchun jarima foizi */
  latePenalty: number;
  attachments: FileRef[];
  status: PublishStatus;
  createdAt: ISODate;
  createdBy: ID;
}

export type SubmissionStatus = 'submitted' | 'graded' | 'returned';

export interface Submission {
  id: ID;
  assignmentId: ID;
  courseId: ID;
  studentId: ID;
  text?: string;
  files: FileRef[];
  submittedAt: ISODate;
  late: boolean;
  status: SubmissionStatus;
  score?: number | null;
  feedback?: string | null;
  gradedAt?: ISODate | null;
  gradedBy?: ID | null;
  attempt: number;
}

/* ───────────────────────── Assessments ───────────────────────── */

/** current = joriy (JN), midterm = oraliq (ON), final = yakuniy (YN) */
export type AssessmentCategory = 'current' | 'midterm' | 'final';
export type AssessmentFormat = 'test' | 'written' | 'oral';
export type QuestionType = 'single' | 'multiple' | 'truefalse' | 'short';

export interface QuestionOption {
  id: ID;
  text: string;
}

export interface Question {
  id: ID;
  type: QuestionType;
  text: string;
  options: QuestionOption[];
  /** Option ids for choice questions, accepted answers for `short` */
  correct: string[];
  points: number;
  explanation?: string;
}

export interface Assessment {
  id: ID;
  courseId: ID;
  title: string;
  description?: string;
  category: AssessmentCategory;
  format: AssessmentFormat;
  maxScore: number;
  startsAt: ISODate;
  endsAt: ISODate;
  durationMin: number;
  attempts: number;
  shuffle: boolean;
  showResults: boolean;
  questions: Question[];
  status: PublishStatus;
  createdAt: ISODate;
  createdBy: ID;
}

export type AttemptStatus = 'in_progress' | 'finished' | 'graded';

export interface AssessmentResult {
  id: ID;
  assessmentId: ID;
  courseId: ID;
  studentId: ID;
  status: AttemptStatus;
  attempt: number;
  startedAt?: ISODate | null;
  finishedAt?: ISODate | null;
  /** questionId → answer values */
  answers?: Record<ID, string[]>;
  /** Randomised question order for this attempt */
  order?: ID[];
  score: number | null;
  feedback?: string | null;
}

/* ───────────────────────── Schedule & attendance ───────────────────────── */

export type WeekParity = 'all' | 'odd' | 'even';

export interface ScheduleSlot {
  id: ID;
  courseId: ID;
  groupIds: ID[];
  /** 1 = Dushanba … 6 = Shanba */
  day: number;
  /** Juftlik raqami (1..7) */
  pair: number;
  room: string;
  type: LessonType;
  week: WeekParity;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceSession {
  id: ID;
  courseId: ID;
  date: ISODate;
  topicId?: ID | null;
  records: Record<ID, AttendanceStatus>;
}

/** O'tgan semestrlar uchun yakuniy qaydnoma (transcript) yozuvi */
export interface GradeRecord {
  id: ID;
  studentId: ID;
  subjectId: ID;
  semesterId: ID;
  credits: number;
  current: number;
  midterm: number;
  final: number;
  total: number;
}

/* ───────────────────────── System ───────────────────────── */

export type NotificationType = 'assignment' | 'submission' | 'grade' | 'test' | 'schedule' | 'material' | 'system';

export interface Notification {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  read: boolean;
  createdAt: ISODate;
}

export interface PairTime {
  pair: number;
  start: string;
  end: string;
}

export interface SystemSettings {
  universityName: string;
  registration: {
    enabled: boolean;
    requireApproval: boolean;
    /** Empty = any domain allowed */
    allowedDomains: string[];
  };
  grading: GradingScheme;
  pairTimes: PairTime[];
  upload: {
    maxFileSizeMb: number;
    maxVideoSizeMb: number;
  };
}
