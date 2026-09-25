import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Gradebook, RatingEntry, RatingScope, Semester, StudentGrades } from '@edu/shared';
import { http } from '../http';

export interface RatingResponse {
  scope: RatingScope;
  label: string;
  semester: Semester;
  entries: RatingEntry[];
  me: RatingEntry | null;
}

export interface GradeHistoryItem {
  semester: Semester;
  average: number;
  gpa: number;
  credits: number;
}

export const journalApi = {
  gradebook: (courseId: string) => http.get<Gradebook>(`/courses/${courseId}/gradebook`),
  myGrades: (semesterId?: string) => http.get<StudentGrades>('/grades/me', { semesterId }),
  history: () => http.get<GradeHistoryItem[]>('/grades/history'),
  rating: (q: { scope: RatingScope; semesterId?: string; groupId?: string; facultyId?: string; course?: number }) => http.get<RatingResponse>('/rating', q),
};

export const useGradebook = (courseId?: string) => useQuery({ queryKey: ['gradebook', courseId], queryFn: () => journalApi.gradebook(courseId!), enabled: !!courseId });
export const useMyGrades = (semesterId?: string) => useQuery({ queryKey: ['grades', 'me', semesterId], queryFn: () => journalApi.myGrades(semesterId), placeholderData: keepPreviousData });
export const useGradeHistory = () => useQuery({ queryKey: ['grades', 'history'], queryFn: journalApi.history });
export const useRating = (q: Parameters<typeof journalApi.rating>[0]) => useQuery({ queryKey: ['rating', q], queryFn: () => journalApi.rating(q), placeholderData: keepPreviousData });
