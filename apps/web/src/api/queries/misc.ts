import { useQuery } from '@tanstack/react-query';
import type { AdminDashboard, Notification, ScheduleItem, ScheduleSlot, SearchResult, StudentDashboard, TeacherDashboard } from '@edu/shared';
import { http } from '../http';
import { useApiMutation } from './utils';
import type { ViewAs } from './learning';

export const miscApi = {
  schedule: (q: { as?: ViewAs; groupId?: string; teacherId?: string; room?: string }) => http.get<ScheduleItem[]>('/schedule', q),
  notifications: (q?: { unread?: boolean; limit?: number }) => http.get<{ items: Notification[]; unread: number; total: number }>('/notifications', q),
  studentDashboard: () => http.get<StudentDashboard>('/dashboard/student'),
  teacherDashboard: () => http.get<TeacherDashboard>('/dashboard/teacher'),
  adminDashboard: () => http.get<AdminDashboard>('/dashboard/admin'),
  search: (q: string, as: ViewAs) => http.get<SearchResult[]>('/search', { q, as }),
};

export const useSchedule = (q: Parameters<typeof miscApi.schedule>[0], enabled = true) => useQuery({ queryKey: ['schedule', q], queryFn: () => miscApi.schedule(q), enabled });
export const useNotifications = (q?: { unread?: boolean; limit?: number }) => useQuery({ queryKey: ['notifications', q], queryFn: () => miscApi.notifications(q), refetchInterval: 60_000 });
export const useStudentDashboard = () => useQuery({ queryKey: ['dashboard', 'student'], queryFn: miscApi.studentDashboard });
export const useTeacherDashboard = () => useQuery({ queryKey: ['dashboard', 'teacher'], queryFn: miscApi.teacherDashboard });
export const useAdminDashboard = () => useQuery({ queryKey: ['dashboard', 'admin'], queryFn: miscApi.adminDashboard });
export const useSearch = (q: string, as: ViewAs) => useQuery({ queryKey: ['search', q, as], queryFn: () => miscApi.search(q, as), enabled: q.trim().length >= 2, staleTime: 30_000 });

export const useMarkRead = () => useApiMutation((id: string) => http.patch(`/notifications/${id}/read`), { invalidate: [['notifications']], silentError: true });
export const useMarkAllRead = () => useApiMutation(() => http.post('/notifications/read-all'), { invalidate: [['notifications']], success: "Barchasi o'qildi deb belgilandi" });
export const useDeleteNotification = () => useApiMutation((id: string) => http.delete(`/notifications/${id}`), { invalidate: [['notifications']] });

export const useSaveSlot = () =>
  useApiMutation((dto: Omit<ScheduleSlot, 'id'> & { id?: string }) => (dto.id ? http.patch<ScheduleItem>(`/schedule/${dto.id}`, dto) : http.post<ScheduleItem>('/schedule', dto)), {
    invalidate: [['schedule'], ['dashboard'], ['teachers']],
    success: (_, v) => (v.id ? 'Dars yangilandi' : "Dars jadvalga qo'shildi"),
  });
export const useDeleteSlot = () => useApiMutation((id: string) => http.delete(`/schedule/${id}`), { invalidate: [['schedule'], ['dashboard']], success: "Dars jadvaldan o'chirildi" });

export type Counters = Partial<Record<'pendingReviews' | 'pendingUsers' | 'pendingAssignments', number>>;
export const useCounters = (as: ViewAs | null) => useQuery({ queryKey: ['counters', as], queryFn: () => http.get<Counters>('/me/counters', { as: as ?? undefined }), enabled: !!as, refetchInterval: 60_000 });
