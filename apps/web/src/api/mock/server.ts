/**
 * In-browser fake REST server. Mirrors the future NestJS API contract so that
 * switching VITE_API_MODE=http requires no changes in UI code.
 */
import type { Role } from '@edu/shared';
import { ApiError, type Method, type Query } from '../http';
import { commit, getDb, idx, loadDb, type DbUser } from './db';

export interface Ctx {
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  user: DbUser | null;
  /** Authenticated user (throws 401 otherwise) */
  me: DbUser;
}

type Handler = (ctx: Ctx) => unknown | Promise<unknown>;

interface RouteDef {
  method: Method;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
  auth: boolean | Role[];
}

const routes: RouteDef[] = [];

export function route(method: Method, path: string, handler: Handler, auth: boolean | Role[] = true) {
  const keys: string[] = [];
  const pattern = new RegExp(
    '^' +
      path.replace(/\/:([a-zA-Z]+)/g, (_, k) => {
        keys.push(k);
        return '/([^/]+)';
      }) +
      '/?$',
  );
  routes.push({ method, pattern, keys, handler, auth });
}

export const fail = (status: number, message: string, details?: Record<string, string>): never => {
  throw new ApiError(status, message, details);
};

export function requireRole(user: DbUser, ...roles: Role[]) {
  if (!roles.some((r) => user.roles.includes(r))) fail(403, "Bu amal uchun ruxsat yo'q");
}

/* ───────────── Tokens ───────────── */

export function issueToken(userId: string) {
  const exp = Date.now() + 7 * 86_400_000;
  const payload = btoa(JSON.stringify({ uid: userId, exp }));
  return { accessToken: `mock.${payload}`, refreshToken: `mock-refresh.${payload}`, expiresAt: new Date(exp).toISOString() };
}

function userFromToken(token: string | null): DbUser | null {
  if (!token?.startsWith('mock.')) return null;
  try {
    const { uid, exp } = JSON.parse(atob(token.slice(5)));
    if (exp < Date.now()) return null;
    const u = idx().user.get(uid);
    return u && u.status === 'active' ? u : null;
  } catch {
    return null;
  }
}

/* ───────────── Fetch entry ───────────── */

let registered: Promise<void> | null = null;
function registerHandlers() {
  registered ??= Promise.all([
    import('./handlers/auth'),
    import('./handlers/admin'),
    import('./handlers/learning'),
    import('./handlers/assessments'),
    import('./handlers/journal'),
    import('./handlers/misc'),
  ]).then(() => undefined);
  return registered;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function mockFetch<T>(req: { method: Method; url: string; params?: Query; body?: unknown; token: string | null }): Promise<T> {
  await Promise.all([loadDb(), registerHandlers()]);
  // Realistic latency makes loading states visible without being annoying
  await sleep(req.method === 'GET' ? 120 + Math.random() * 180 : 250 + Math.random() * 250);

  const [path] = req.url.split('?');
  const match = routes.find((r) => r.method === req.method && r.pattern.test(path));
  if (!match) fail(404, `Mock endpoint topilmadi: ${req.method} ${path}`);
  const m = match!;

  const values = path.match(m.pattern)!.slice(1);
  const params = Object.fromEntries(m.keys.map((k, i) => [k, decodeURIComponent(values[i])]));
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.params ?? {})) if (v !== undefined && v !== null && v !== '') query[k] = String(v);

  const user = userFromToken(req.token);
  if (m.auth && !user) fail(401, 'Avtorizatsiyadan o‘tilmagan');
  if (Array.isArray(m.auth)) requireRole(user!, ...m.auth);

  const ctx: Ctx = {
    params,
    query,
    // JSON round-trip mirrors real HTTP semantics (drops `undefined`, serialises dates)
    body: req.body === undefined ? undefined : JSON.parse(JSON.stringify(req.body)),
    user,
    get me() {
      if (!user) fail(401, 'Avtorizatsiyadan o‘tilmagan');
      return user!;
    },
  };

  const result = await m.handler(ctx);
  if (req.method !== 'GET') commit();
  return (result === undefined ? null : structuredClone(result)) as T;
}

export { getDb, idx };
