import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import type { Role } from '@edu/shared';
import { authApi } from '@/api/queries/auth';
import { defaultRole, useAuthStore } from '@/stores/auth.store';
import { ForbiddenPage } from '@/pages/common/ErrorPages';

/** Requires a session; refreshes the user profile once per app load. */
export function RequireAuth() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const location = useLocation();
  const { data } = useQuery({ queryKey: ['me'], queryFn: authApi.me, enabled: !!user, staleTime: 5 * 60_000 });

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

/** Only for signed-out users (login/register). */
export function GuestOnly() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.activeRole);
  if (user) return <Navigate to={`/${role ?? defaultRole(user)}`} replace />;
  return <Outlet />;
}

/** Role-scoped section: the URL is the source of truth for the active role. */
export function RequireRole({ role }: { role: Role }) {
  const user = useAuthStore((s) => s.user);
  const active = useAuthStore((s) => s.activeRole);
  const setRole = useAuthStore((s) => s.setActiveRole);
  const allowed = !!user?.roles.includes(role);

  useEffect(() => {
    if (allowed && active !== role) setRole(role);
  }, [allowed, active, role, setRole]);

  if (!allowed) return <ForbiddenPage />;
  return <Outlet />;
}

export function HomeRedirect() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.activeRole);
  return <Navigate to={user ? `/${role ?? defaultRole(user)}` : '/login'} replace />;
}
