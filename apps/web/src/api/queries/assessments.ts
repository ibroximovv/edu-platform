import { useQuery } from '@tanstack/react-query';
import type { AssessmentResult, AssessmentView, AttemptReview, AttemptView, UpsertAssessmentDto, UserBrief } from '@edu/shared';
import { http } from '../http';
import { useApiMutation } from './utils';
import type { ViewAs } from './learning';

export interface ResultRow {
  student: UserBrief & { groupName: string };
  result: AssessmentResult | null;
  attempts: number;
}

export const assessmentsApi = {
  list: (q: { as?: ViewAs; courseId?: string; category?: string; format?: string }) => http.get<AssessmentView[]>('/assessments', q),
  get: (id: string) => http.get<AssessmentView>(`/assessments/${id}`),
  results: (id: string) => http.get<ResultRow[]>(`/assessments/${id}/results`),
  start: (id: string) => http.post<AttemptView>(`/assessments/${id}/start`),
  attempt: (id: string) => http.get<AttemptView>(`/attempts/${id}`),
  saveAnswers: (id: string, answers: Record<string, string[]>) => http.put<{ savedAt: string; status: string }>(`/attempts/${id}/answers`, { answers }),
  finish: (id: string, answers?: Record<string, string[]>) => http.post<AttemptReview>(`/attempts/${id}/finish`, { answers }),
  review: (id: string) => http.get<AttemptReview>(`/attempts/${id}/review`),
};

export const useAssessments = (q: Parameters<typeof assessmentsApi.list>[0], enabled = true) => useQuery({ queryKey: ['assessments', q], queryFn: () => assessmentsApi.list(q), enabled });
export const useAssessment = (id?: string) => useQuery({ queryKey: ['assessments', 'detail', id], queryFn: () => assessmentsApi.get(id!), enabled: !!id });
export const useAssessmentResults = (id?: string) => useQuery({ queryKey: ['assessments', 'results', id], queryFn: () => assessmentsApi.results(id!), enabled: !!id });
export const useAttempt = (id?: string) => useQuery({ queryKey: ['attempt', id], queryFn: () => assessmentsApi.attempt(id!), enabled: !!id, staleTime: Infinity, refetchOnWindowFocus: false });
export const useAttemptReview = (id?: string) => useQuery({ queryKey: ['attempt', 'review', id], queryFn: () => assessmentsApi.review(id!), enabled: !!id });

const KEYS = [['assessments'], ['dashboard'], ['gradebook'], ['grades'], ['courses']];

export const useSaveAssessment = () =>
  useApiMutation((dto: UpsertAssessmentDto & { id?: string }) => (dto.id ? http.patch<AssessmentView>(`/assessments/${dto.id}`, dto) : http.post<AssessmentView>('/assessments', dto)), {
    invalidate: KEYS,
    success: (_, v) => (v.id ? 'Saqlandi' : v.status === 'published' ? "E'lon qilindi" : 'Qoralama saqlandi'),
  });
export const useDeleteAssessment = () => useApiMutation((id: string) => http.delete(`/assessments/${id}`), { invalidate: KEYS, success: "O'chirildi" });
export const useStartAttempt = () => useApiMutation((id: string) => assessmentsApi.start(id), { invalidate: [['assessments']] });
export const useFinishAttempt = () => useApiMutation(({ id, answers }: { id: string; answers?: Record<string, string[]> }) => assessmentsApi.finish(id, answers), { invalidate: KEYS, success: 'Test yakunlandi' });
export const useSaveScores = () =>
  useApiMutation(({ id, scores }: { id: string; scores: Record<string, number | null> }) => http.put<{ updated: number }>(`/assessments/${id}/scores`, { scores }), {
    invalidate: KEYS,
    success: (d) => `${d.updated} ta natija saqlandi`,
  });
