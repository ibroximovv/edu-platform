/**
 * API response shapes (read models) and request DTOs.
 * The NestJS API must return exactly these shapes.
 */
import type {
  AcademicYear,
  Assessment,
  AssessmentCategory,
  AssessmentFormat,
  AssessmentResult,
  Assignment,
  AttendanceSession,
  Course,
  Department,
  Faculty,
  FileRef,
  GradingScheme,
  Group,
  ID,
  ISODate,
  LessonType,
  Material,
  Question,
  Role,
  ScheduleSlot,
  Semester,
  Subject,
  Submission,
  TeacherPosition,
  User,
  UserStatus,
} from './types';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface UserBrief {
  id: ID;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
}

/* ───────────── Auth ───────────── */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: ISODate;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/** `devCode` is only returned by the mock server (no real e-mail delivery). */
export interface CodeSentResponse {
  email: string;
  expiresInSec: number;
  devCode?: string;
}

export interface VerifyEmailDto {
  email: string;
  code: string;
}

export type VerifyEmailResponse = AuthResponse | { pendingApproval: true; email: string };

export interface ResetPasswordDto {
  email: string;
  code: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  avatarUrl?: string | null;
}

/* ───────────── Users (admin) ───────────── */

export interface UserListQuery {
  q?: string;
  role?: Role;
  status?: UserStatus;
  groupId?: ID;
  page?: number;
  limit?: number;
}

export interface UpsertUserDto {
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  roles: Role[];
  status: UserStatus;
  password?: string;
  groupId?: ID | null;
  departmentId?: ID | null;
  position?: TeacherPosition;
  degree?: string;
}

export interface UserRow extends User {
  groupName?: string | null;
  departmentName?: string | null;
}

export type BulkUserAction = 'approve' | 'block' | 'activate' | 'delete';

/* ───────────── Structure views ───────────── */

export interface GroupView extends Group {
  faculty: Faculty | null;
  curator: UserBrief | null;
  studentCount: number;
}

export interface DepartmentView extends Department {
  faculty: Faculty | null;
  teacherCount: number;
}

export interface TeacherView extends UserBrief {
  department: Department | null;
  position: string;
  degree?: string;
  courseCount: number;
  studentCount: number;
  weeklyPairs: number;
}

export interface SemesterView extends Semester {
  academicYearName: string;
}

export interface AcademicYearView extends AcademicYear {
  semesters: (Semester & { courseCount: number })[];
}

export interface GroupDetail extends GroupView {
  students: UserRow[];
  courses: CourseView[];
}

export interface UpsertCourseDto {
  subjectId: ID;
  teacherId: ID;
  groupIds: ID[];
  semesterId: ID;
  grading: GradingScheme;
}

export interface CourseStats {
  students: number;
  topicsTotal: number;
  topicsDone: number;
  assignments: number;
  pendingReviews: number;
  materials: number;
}

export interface CourseView extends Course {
  subject: Subject;
  teacher: UserBrief;
  groups: Group[];
  semester: Semester | null;
  stats: CourseStats;
  /** Present for students: personal progress 0..100 */
  myProgress?: number;
  myTotal?: number;
}

export interface MaterialView extends Material {
  courseTitle: string;
  topicTitle?: string | null;
}

export interface AssignmentView extends Assignment {
  course: { id: ID; title: string; color: Subject['color'] };
  /** Student-only: own submission */
  mySubmission?: Submission | null;
  /** Teacher-only counters */
  counts?: { submitted: number; graded: number; students: number };
}

export interface SubmissionView extends Submission {
  student: UserBrief & { groupName?: string };
  assignment: { id: ID; title: string; maxScore: number; deadline: ISODate };
  courseTitle: string;
}

export interface AssessmentView extends Omit<Assessment, 'questions'> {
  course: { id: ID; title: string; color: Subject['color'] };
  questionCount: number;
  /** Teacher sees questions with answers; student never receives this field */
  questions?: Question[];
  /** Student-only */
  myResult?: AssessmentResult | null;
  attemptsUsed?: number;
  /** Teacher-only */
  counts?: { finished: number; students: number; avgScore: number | null };
}

/** Question without correct answers — sent to students while taking a test */
export type PublicQuestion = Omit<Question, 'correct' | 'explanation'>;

export interface AttemptView {
  result: AssessmentResult;
  assessment: { id: ID; title: string; durationMin: number; maxScore: number; endsAt: ISODate; courseTitle: string };
  questions: PublicQuestion[];
  deadline: ISODate;
}

export interface AttemptReview {
  result: AssessmentResult;
  assessment: AssessmentView;
  questions?: (Question & { earned: number })[];
}

export interface UpsertAssessmentDto {
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
  status: Assessment['status'];
}

/* ───────────── Journal / grades ───────────── */

export interface GradebookColumn {
  id: ID;
  kind: 'assignment' | 'assessment';
  title: string;
  category: AssessmentCategory;
  format?: AssessmentFormat;
  maxScore: number;
  date: ISODate;
}

export interface CourseScore {
  current: number;
  midterm: number;
  final: number;
  /** Accumulated points (0..100) */
  total: number;
  /** Share of points earned among already assessed categories, 0..100 */
  percent: number;
  /** 5-point grade (forecast while the semester is in progress) */
  grade: number;
}

export interface GradebookRow {
  student: UserBrief & { groupName: string; recordBook: string };
  cells: Record<ID, number | null>;
  score: CourseScore;
  attendance: number;
}

export interface Gradebook {
  course: CourseView;
  columns: GradebookColumn[];
  rows: GradebookRow[];
}

export interface StudentCourseGrade {
  courseId: ID | null;
  subject: Subject;
  teacher: UserBrief | null;
  score: CourseScore;
  credits: number;
  items: { title: string; category: AssessmentCategory; score: number | null; maxScore: number; date: ISODate }[];
  attendance: number;
}

export interface StudentGrades {
  semester: Semester;
  courses: StudentCourseGrade[];
  gpa: number;
  average: number;
}

export interface RatingEntry {
  rank: number;
  student: UserBrief & { groupName: string; facultyShortName: string };
  average: number;
  gpa: number;
  credits: number;
  trend: number;
}

export type RatingScope = 'group' | 'faculty' | 'course' | 'university';

export interface AttendanceView {
  sessions: AttendanceSession[];
  students: (UserBrief & { groupName: string })[];
}

/* ───────────── Schedule ───────────── */

export interface ScheduleItem extends ScheduleSlot {
  subject: Pick<Subject, 'id' | 'name' | 'code' | 'color'>;
  teacher: UserBrief;
  groups: Pick<Group, 'id' | 'name'>[];
}

/* ───────────── Dashboards ───────────── */

export interface DeadlineItem {
  id: ID;
  kind: 'assignment' | 'assessment';
  title: string;
  courseTitle: string;
  color: Subject['color'];
  date: ISODate;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
}

export interface StudentDashboard {
  stats: { courses: number; pendingAssignments: number; average: number; gpa: number; rank: number; rankOf: number; attendance: number };
  courses: CourseView[];
  deadlines: DeadlineItem[];
  today: ScheduleItem[];
  weeklyActivity: { label: string; value: number }[];
  teachers: (UserBrief & { subject: string })[];
  groupmates: UserBrief[];
  recentGrades: { title: string; courseTitle: string; score: number; maxScore: number; date: ISODate }[];
}

export interface TeacherDashboard {
  stats: { courses: number; students: number; pendingReviews: number; weeklyPairs: number; avgScore: number; materials: number };
  courses: CourseView[];
  today: ScheduleItem[];
  reviewQueue: SubmissionView[];
  upcoming: DeadlineItem[];
  scoreDistribution: { label: string; value: number }[];
  submissionsByDay: { label: string; value: number }[];
}

export interface AdminDashboard {
  stats: { students: number; teachers: number; groups: number; subjects: number; courses: number; pendingUsers: number; faculties: number; materials: number };
  byFaculty: { label: string; students: number; teachers: number }[];
  gradeDistribution: { label: string; value: number }[];
  registrations: { label: string; value: number }[];
  pendingUsers: User[];
  topStudents: RatingEntry[];
  activity: { id: ID; text: string; at: ISODate; kind: string }[];
}

/* ───────────── Misc DTOs ───────────── */

export interface UpsertTopicDto {
  courseId: ID;
  title: string;
  description?: string;
  type: LessonType;
  hours: number;
  plannedDate?: ISODate | null;
  status: 'planned' | 'done';
  order?: number;
}

export interface UpsertMaterialDto {
  courseId: ID;
  topicId?: ID | null;
  title: string;
  description?: string;
  file?: FileRef | null;
  url?: string | null;
}

export interface UpsertAssignmentDto {
  courseId: ID;
  topicId?: ID | null;
  title: string;
  description: string;
  type: Assignment['type'];
  maxScore: number;
  deadline: ISODate;
  allowLate: boolean;
  latePenalty: number;
  attachments: FileRef[];
  status: Assignment['status'];
}

export interface SubmitAssignmentDto {
  text?: string;
  files: FileRef[];
}

export interface GradeSubmissionDto {
  score: number | null;
  feedback?: string;
  status: 'graded' | 'returned';
}

export interface SearchResult {
  id: ID;
  kind: 'course' | 'user' | 'group' | 'assignment' | 'material';
  title: string;
  subtitle?: string;
  link: string;
}

