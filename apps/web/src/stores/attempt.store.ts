import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Local copy of in-progress test answers. Survives reloads (sessionStorage)
 * and is synced to the server with debounce, so network hiccups never lose answers.
 */
interface AttemptState {
  answers: Record<string, Record<string, string[]>>;
  flagged: Record<string, string[]>;
  setAnswer: (attemptId: string, questionId: string, value: string[]) => void;
  toggleFlag: (attemptId: string, questionId: string) => void;
  hydrate: (attemptId: string, answers: Record<string, string[]>) => void;
  clear: (attemptId: string) => void;
}

export const useAttemptStore = create<AttemptState>()(
  persist(
    (set) => ({
      answers: {},
      flagged: {},
      setAnswer: (attemptId, questionId, value) =>
        set((s) => ({ answers: { ...s.answers, [attemptId]: { ...s.answers[attemptId], [questionId]: value } } })),
      toggleFlag: (attemptId, questionId) =>
        set((s) => {
          const cur = s.flagged[attemptId] ?? [];
          return {
            flagged: {
              ...s.flagged,
              [attemptId]: cur.includes(questionId) ? cur.filter((q) => q !== questionId) : [...cur, questionId],
            },
          };
        }),
      hydrate: (attemptId, answers) =>
        set((s) => ({ answers: { ...s.answers, [attemptId]: { ...answers, ...s.answers[attemptId] } } })),
      clear: (attemptId) =>
        set((s) => {
          const answers = { ...s.answers };
          const flagged = { ...s.flagged };
          delete answers[attemptId];
          delete flagged[attemptId];
          return { answers, flagged };
        }),
    }),
    { name: 'edu-attempts', storage: createJSONStorage(() => sessionStorage) },
  ),
);
