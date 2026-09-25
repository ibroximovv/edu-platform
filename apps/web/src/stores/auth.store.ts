import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse, AuthTokens, Role, User } from '@edu/shared';
import { API_URL, IS_MOCK } from '@/config/app';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  activeRole: Role | null;
  setSession: (session: AuthResponse) => void;
  setUser: (user: User) => void;
  setActiveRole: (role: Role) => void;
  logout: () => void;
  refresh: () => Promise<boolean>;
}

const ROLE_PRIORITY: Role[] = ['admin', 'teacher', 'student'];

export function defaultRole(user: User): Role {
  return ROLE_PRIORITY.find((r) => user.roles.includes(r)) ?? 'student';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      activeRole: null,
      setSession: ({ user, tokens }) => {
        const prev = get().activeRole;
        set({ user, tokens, activeRole: prev && user.roles.includes(prev) ? prev : defaultRole(user) });
      },
      setUser: (user) => {
        const role = get().activeRole;
        set({ user, activeRole: role && user.roles.includes(role) ? role : defaultRole(user) });
      },
      setActiveRole: (role) => {
        const user = get().user;
        if (user?.roles.includes(role)) set({ activeRole: role });
      },
      logout: () => set({ user: null, tokens: null }),
      refresh: async () => {
        const refreshToken = get().tokens?.refreshToken;
        if (IS_MOCK || !refreshToken) return false;
        try {
          const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (!res.ok) return false;
          set({ tokens: (await res.json()) as AuthTokens });
          return true;
        } catch {
          return false;
        }
      },
    }),
    { name: 'edu-auth', version: 1 },
  ),
);

export const useCurrentUser = () => useAuthStore((s) => s.user);
