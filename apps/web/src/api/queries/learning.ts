import { useQuery } from '@tanstack/react-query';
import type {
  AssignmentView,
  AttendanceSession,
  AttendanceView,
  CourseView,
  GradeSubmissionDto,
  MaterialView,
  Submission,
  SubmissionView,
  SubmitAssignmentDto,
  Topic,
  UpsertAssignmentDto,
  UpsertCourseDto,
  UpsertMaterialDto,
  UpsertTopicDto,
  UserBrief,
} from '@edu/shared';
import { http } from '../http';
import { useApiMutation } from './utils';

export type ViewAs = 'student' | 'teacher' | 'admin';
type ListQuery = { as?: ViewAs; courseId?: string; q?: string };

export const learningApi = {
  courses: (q: { as?: ViewAs; semesterId?: string; groupId?: string; teacherId?: string; q?: string }) => http.get<CourseView[]>('/courses', q),
  course: (id: string) => http.get<CourseView>(`/courses/${id}`),
  courseStudents: (id: string) => http.get<(UserBrief & { groupName: string; recordBook: string })[]>(`/courses/${id}/students`),
  topics: (courseId: string) => http.get<Topic[]>(`/courses/${courseId}/topics`),
  materials: (q: ListQuery & { topicId?: string; kind?: string }) => http.get<MaterialView[]>('/materials', q),
  assignments: (q: ListQuery) => http.get<AssignmentView[]>('/assignments', q),
  assignment: (id: string) => http.get<AssignmentView>(`/assignments/${id}`),
  submissions: (q: ListQuery & { assignmentId?: string; status?: string }) => http.get<SubmissionView[]>('/submissions', q),
  submission: (id: string) => http.get<SubmissionView>(`/submissions/${id}`),
  attendance: (courseId: string) => http.get<AttendanceView>(`/courses/${courseId}/attendance`),
};

/* ───────────── Queries ───────────── */

export const useCourses = (q: Parameters<typeof learningApi.courses>[0], enabled = true) => useQuery({ queryKey: ['courses', q], queryFn: () => learningApi.courses(q), enabled });
export const useCourse = (id?: string) => useQuery({ queryKey: ['courses', 'detail', id], queryFn: () => learningApi.course(id!), enabled: !!id });
export const useCourseStudents = (id?: string) => useQuery({ queryKey: ['courses', 'students', id], queryFn: () => learningApi.courseStudents(id!), enabled: !!id });
export const useTopics = (courseId?: string) => useQuery({ queryKey: ['topics', courseId], queryFn: () => learningApi.topics(courseId!), enabled: !!courseId });
export const useMaterials = (q: Parameters<typeof learningApi.materials>[0], enabled = true) => useQuery({ queryKey: ['materials', q], queryFn: () => learningApi.materials(q), enabled });
export const useAssignments = (q: ListQuery, enabled = true) => useQuery({ queryKey: ['assignments', q], queryFn: () => learningApi.assignments(q), enabled });
export const useAssignment = (id?: string) => useQuery({ queryKey: ['assignments', 'detail', id], queryFn: () => learningApi.assignment(id!), enabled: !!id });
export const useSubmissions = (q: Parameters<typeof learningApi.submissions>[0], enabled = true) => useQuery({ queryKey: ['submissions', q], queryFn: () => learningApi.submissions(q), enabled });
export const useSubmission = (id?: string | null) => useQuery({ queryKey: ['submissions', 'detail', id], queryFn: () => learningApi.submission(id!), enabled: !!id });
export const useAttendance = (courseId?: string) => useQuery({ queryKey: ['attendance', courseId], queryFn: () => learningApi.attendance(courseId!), enabled: !!courseId });

/* ───────────── Mutations ───────────── */

const COURSE_KEYS = [['courses'], ['dashboard'], ['schedule']];

export const useSaveCourse = () =>
  useApiMutation((dto: UpsertCourseDto & { id?: string }) => (dto.id ? http.patch<CourseView>(`/courses/${dto.id}`, dto) : http.post<CourseView>('/courses', dto)), {
    invalidate: COURSE_KEYS,
    success: (_, v) => (v.id ? 'Kurs yangilandi' : 'Kurs yaratildi'),
  });
export const useDeleteCourse = () => useApiMutation((id: string) => http.delete(`/courses/${id}`), { invalidate: COURSE_KEYS, success: "Kurs o'chirildi" });

export const useSaveTopic = () =>
  useApiMutation((dto: UpsertTopicDto & { id?: string }) => (dto.id ? http.patch<Topic>(`/topics/${dto.id}`, dto) : http.post<Topic>('/topics', dto)), {
    invalidate: [['topics'], ['courses']],
    success: (_, v) => (v.id ? 'Mavzu yangilandi' : "Mavzu qo'shildi"),
  });
export const useDeleteTopic = () => useApiMutation((id: string) => http.delete(`/topics/${id}`), { invalidate: [['topics'], ['courses'], ['materials']], success: "Mavzu o'chirildi" });
export const useReorderTopics = () => useApiMutation(({ courseId, ids }: { courseId: string; ids: string[] }) => http.post(`/courses/${courseId}/topics/reorder`, { ids }), { invalidate: [['topics']] });

export const useSaveMaterial = () =>
  useApiMutation((dto: UpsertMaterialDto & { id?: string }) => (dto.id ? http.patch<MaterialView>(`/materials/${dto.id}`, dto) : http.post<MaterialView>('/materials', dto)), {
    invalidate: [['materials'], ['courses']],
    success: (_, v) => (v.id ? 'Material yangilandi' : 'Material yuklandi'),
  });
export const useDeleteMaterial = () => useApiMutation((id: string) => http.delete(`/materials/${id}`), { invalidate: [['materials'], ['courses']], success: "Material o'chirildi" });
export const trackMaterialView = (id: string) => http.post(`/materials/${id}/view`).catch(() => undefined);

const ASG_KEYS = [['assignments'], ['submissions'], ['courses'], ['dashboard'], ['gradebook'], ['grades']];

export const useSaveAssignment = () =>
  useApiMutation((dto: UpsertAssignmentDto & { id?: string }) => (dto.id ? http.patch<AssignmentView>(`/assignments/${dto.id}`, dto) : http.post<AssignmentView>('/assignments', dto)), {
    invalidate: ASG_KEYS,
    success: (_, v) => (v.id ? 'Topshiriq yangilandi' : v.status === 'published' ? "Topshiriq e'lon qilindi" : 'Qoralama saqlandi'),
  });
export const useDeleteAssignment = () => useApiMutation((id: string) => http.delete(`/assignments/${id}`), { invalidate: ASG_KEYS, success: "Topshiriq o'chirildi" });

export const useSubmitAssignment = () =>
  useApiMutation(({ id, ...dto }: SubmitAssignmentDto & { id: string }) => http.post<Submission>(`/assignments/${id}/submit`, dto), {
    invalidate: ASG_KEYS,
    success: 'Javobingiz yuborildi',
  });
export const useWithdrawSubmission = () => useApiMutation((id: string) => http.delete(`/submissions/${id}`), { invalidate: ASG_KEYS, success: 'Javob qaytarib olindi' });

export const useGradeSubmission = () =>
  useApiMutation(({ id, ...dto }: GradeSubmissionDto & { id: string }) => http.patch<SubmissionView>(`/submissions/${id}/grade`, dto), {
    invalidate: ASG_KEYS,
    success: (_, v) => (v.status === 'graded' ? 'Baho qo‘yildi' : 'Qayta ishlashga qaytarildi'),
  });

const ATT_KEYS = [['attendance'], ['topics'], ['gradebook'], ['courses']];
export const useCreateAttendance = () =>
  useApiMutation(({ courseId, date, topicId }: { courseId: string; date: string; topicId?: string | null }) => http.post<AttendanceSession>(`/courses/${courseId}/attendance`, { date, topicId }), {
    invalidate: ATT_KEYS,
    success: 'Yangi dars qo‘shildi',
  });
export const useUpdateAttendance = () =>
  useApiMutation(({ id, records }: { id: string; records: AttendanceSession['records'] }) => http.patch<AttendanceSession>(`/attendance/${id}`, { records }), { invalidate: [['attendance'], ['gradebook']] });
export const useDeleteAttendance = () => useApiMutation((id: string) => http.delete(`/attendance/${id}`), { invalidate: ATT_KEYS, success: "Dars o'chirildi" });
