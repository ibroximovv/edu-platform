import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type {
  AcademicYearView,
  BulkUserAction,
  Department,
  DepartmentView,
  Faculty,
  GroupDetail,
  GroupView,
  Paginated,
  Semester,
  SemesterView,
  Subject,
  SystemSettings,
  TeacherView,
  UpsertUserDto,
  UserListQuery,
  UserRow,
} from '@edu/shared';
import { http } from '../http';
import { useApiMutation } from './utils';

export const adminApi = {
  users: (q: UserListQuery) => http.get<Paginated<UserRow>>('/users', { ...q }),
  createUser: (dto: UpsertUserDto) => http.post<UserRow>('/users', dto),
  updateUser: ({ id, ...dto }: Partial<UpsertUserDto> & { id: string }) => http.patch<UserRow>(`/users/${id}`, dto),
  deleteUser: (id: string) => http.delete(`/users/${id}`),
  bulkUsers: (ids: string[], action: BulkUserAction) => http.post<{ affected: number }>('/users/bulk', { ids, action }),
  teachers: (q?: { q?: string; departmentId?: string }) => http.get<TeacherView[]>('/teachers', q),
  faculties: () => http.get<Faculty[]>('/faculties'),
  departments: () => http.get<DepartmentView[]>('/departments'),
  groups: (q?: { facultyId?: string; course?: number; q?: string }) => http.get<GroupView[]>('/groups', q),
  group: (id: string) => http.get<GroupDetail>(`/groups/${id}`),
  subjects: (q?: { q?: string }) => http.get<Subject[]>('/subjects', q),
  academicYears: () => http.get<AcademicYearView[]>('/academic-years'),
  semesters: () => http.get<SemesterView[]>('/semesters'),
  settings: () => http.get<SystemSettings>('/settings'),
};

export const useUsers = (q: UserListQuery) => useQuery({ queryKey: ['users', q], queryFn: () => adminApi.users(q), placeholderData: keepPreviousData });
export const useTeachers = (q?: { q?: string; departmentId?: string }) => useQuery({ queryKey: ['teachers', q], queryFn: () => adminApi.teachers(q) });
export const useFaculties = () => useQuery({ queryKey: ['faculties'], queryFn: adminApi.faculties, staleTime: 5 * 60_000 });
export const useDepartments = () => useQuery({ queryKey: ['departments'], queryFn: adminApi.departments, staleTime: 5 * 60_000 });
export const useGroups = (q?: { facultyId?: string; course?: number; q?: string }) => useQuery({ queryKey: ['groups', q], queryFn: () => adminApi.groups(q) });
export const useGroup = (id?: string) => useQuery({ queryKey: ['groups', 'detail', id], queryFn: () => adminApi.group(id!), enabled: !!id });
export const useSubjects = (q?: { q?: string }) => useQuery({ queryKey: ['subjects', q], queryFn: () => adminApi.subjects(q) });
export const useAcademicYears = () => useQuery({ queryKey: ['academic-years'], queryFn: adminApi.academicYears });
export const useSemesters = () => useQuery({ queryKey: ['semesters'], queryFn: adminApi.semesters, staleTime: 5 * 60_000 });
export const useSettings = () => useQuery({ queryKey: ['settings'], queryFn: adminApi.settings, staleTime: 10 * 60_000 });

const USER_KEYS = [['users'], ['teachers'], ['groups'], ['dashboard']];

export const useSaveUser = () =>
  useApiMutation((dto: Partial<UpsertUserDto> & { id?: string }) => (dto.id ? adminApi.updateUser(dto as UpsertUserDto & { id: string }) : adminApi.createUser(dto as UpsertUserDto)), {
    invalidate: USER_KEYS,
    success: (_, v) => (v.id ? 'Foydalanuvchi yangilandi' : 'Foydalanuvchi yaratildi'),
  });
export const useDeleteUser = () => useApiMutation(adminApi.deleteUser, { invalidate: USER_KEYS, success: "Foydalanuvchi o'chirildi" });
export const useBulkUsers = () =>
  useApiMutation(({ ids, action }: { ids: string[]; action: BulkUserAction }) => adminApi.bulkUsers(ids, action), {
    invalidate: USER_KEYS,
    success: (d) => `${d.affected} ta foydalanuvchi yangilandi`,
  });

/** Generic CRUD mutation factory for simple admin resources */
export function useCrud<T extends { id?: string }>(resource: string, keys: string[][], label: string) {
  const save = useApiMutation((dto: T) => (dto.id ? http.patch(`/${resource}/${dto.id}`, dto) : http.post(`/${resource}`, dto)), {
    invalidate: keys,
    success: (_, v) => (v.id ? `${label} yangilandi` : `${label} qo'shildi`),
  });
  const remove = useApiMutation((id: string) => http.delete(`/${resource}/${id}`), { invalidate: keys, success: `${label} o'chirildi` });
  return { save, remove };
}

export const useCreateYear = () => useApiMutation((startYear: number) => http.post('/academic-years', { startYear }), { invalidate: [['academic-years'], ['semesters']], success: "O'quv yili yaratildi" });
export const useDeleteYear = () => useApiMutation((id: string) => http.delete(`/academic-years/${id}`), { invalidate: [['academic-years'], ['semesters']], success: "O'quv yili o'chirildi" });
export const useActivateSemester = () => useApiMutation((id: string) => http.post<Semester>(`/semesters/${id}/activate`), { invalidate: [['academic-years'], ['semesters'], ['courses'], ['dashboard']], success: (s) => `Joriy semestr: ${s.name}` });
export const useUpdateSemester = () => useApiMutation(({ id, ...dto }: { id: string; startDate?: string; endDate?: string }) => http.patch(`/semesters/${id}`, dto), { invalidate: [['academic-years'], ['semesters']], success: 'Semestr yangilandi' });
export const useAssignStudents = () => useApiMutation(({ groupId, studentIds }: { groupId: string; studentIds: string[] }) => http.post(`/groups/${groupId}/students`, { studentIds }), { invalidate: [['groups'], ['users']], success: "Talabalar guruhga qo'shildi" });
export const useSaveSettings = () => useApiMutation((dto: Partial<SystemSettings>) => http.patch<SystemSettings>('/settings', dto), { invalidate: [['settings']], success: 'Sozlamalar saqlandi' });
export const useResetDemo = () => useApiMutation(() => http.post('/admin/reset-demo'), { success: "Demo ma'lumotlar qayta tiklandi" });

export type { Department };
