import { API_URL, IS_MOCK } from '@/config/app';
import { useAuthStore } from '@/stores/auth.store';

export type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
export type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  params?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildQuery(params?: Query) {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

async function request<T>(method: Method, url: string, opts: RequestOptions = {}): Promise<T> {
  const token = useAuthStore.getState().tokens?.accessToken ?? null;

  if (IS_MOCK) {
    // Mock server is code-split: it never ships in `http` builds' critical path.
    const { mockFetch } = await import('./mock/server');
    try {
      return await mockFetch<T>({ method, url, params: opts.params, body: opts.body, token });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401 && token) useAuthStore.getState().logout();
      throw e;
    }
  }

  const res = await fetch(`${API_URL}${url}${buildQuery(opts.params)}`, {
    method,
    signal: opts.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && token) {
    const refreshed = await useAuthStore.getState().refresh();
    if (refreshed) return request<T>(method, url, opts);
    useAuthStore.getState().logout();
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? res.statusText, data?.details);
  }
  return data as T;
}

export const http = {
  get: <T>(url: string, params?: Query, signal?: AbortSignal) => request<T>('GET', url, { params, signal }),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, { body }),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, { body }),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, { body }),
  delete: <T = void>(url: string) => request<T>('DELETE', url),
};

export function errorMessage(e: unknown) {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Noma'lum xatolik yuz berdi";
}
