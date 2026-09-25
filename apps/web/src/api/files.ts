/**
 * File uploads.
 *  - http: multipart/form-data → POST /files (NestJS + multer), real XHR progress.
 *  - mock: blob stored in IndexedDB, progress is simulated; url = `idb://<id>`.
 */
import { createStore, get, set, del } from 'idb-keyval';
import { useEffect, useState } from 'react';
import type { FileRef } from '@edu/shared';
import { API_URL, IS_MOCK } from '@/config/app';
import { detectKind } from '@/lib/files';
import { useAuthStore } from '@/stores/auth.store';
import { ApiError } from './http';

const blobStore = typeof indexedDB !== 'undefined' ? createStore('edu-mock-files', 'blobs') : undefined;

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export const MAX_UPLOAD_MB = { default: 50, video: 500 };

export function validateFile(file: File) {
  const kind = detectKind(file.name, file.type);
  const limit = kind === 'video' ? MAX_UPLOAD_MB.video : MAX_UPLOAD_MB.default;
  if (file.size > limit * 1024 * 1024) return `«${file.name}» hajmi ${limit} MB dan oshmasligi kerak`;
  if (file.size === 0) return `«${file.name}» bo'sh fayl`;
  return null;
}

export async function uploadFile(file: File, opts: UploadOptions = {}): Promise<FileRef> {
  const err = validateFile(file);
  if (err) throw new ApiError(400, err);
  return IS_MOCK ? mockUpload(file, opts) : httpUpload(file, opts);
}

function httpUpload(file: File, { onProgress, signal }: UploadOptions) {
  return new Promise<FileRef>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file);
    xhr.open('POST', `${API_URL}/files`);
    const token = useAuthStore.getState().tokens?.accessToken;
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
      else reject(new ApiError(xhr.status, 'Yuklashda xatolik'));
    };
    xhr.onerror = () => reject(new ApiError(0, 'Tarmoq xatosi'));
    signal?.addEventListener('abort', () => {
      xhr.abort();
      reject(new DOMException('Bekor qilindi', 'AbortError'));
    });
    xhr.send(form);
  });
}

async function mockUpload(file: File, { onProgress, signal }: UploadOptions): Promise<FileRef> {
  const id = `f_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  // Simulated throughput ~12 MB/s, min 600ms, max 4s
  const duration = Math.min(4000, Math.max(600, (file.size / (12 * 1024 * 1024)) * 1000));
  const started = performance.now();
  await new Promise<void>((resolve, reject) => {
    const tick = () => {
      if (signal?.aborted) return reject(new DOMException('Bekor qilindi', 'AbortError'));
      const p = Math.min(1, (performance.now() - started) / duration);
      onProgress?.(Math.round(p * 97));
      if (p >= 1) resolve();
      else setTimeout(tick, 60);
    };
    tick();
  });
  await set(id, file, blobStore);
  onProgress?.(100);
  return {
    id,
    name: file.name,
    size: file.size,
    mime: file.type || 'application/octet-stream',
    kind: detectKind(file.name, file.type),
    url: `idb://${id}`,
    uploadedAt: new Date().toISOString(),
    uploadedBy: useAuthStore.getState().user?.id ?? 'unknown',
  };
}

export async function deleteLocalFile(ref: FileRef) {
  if (ref.url.startsWith('idb://')) await del(ref.url.slice(6), blobStore).catch(() => undefined);
}

const objectUrls = new Map<string, string>();

export async function resolveFileUrl(url: string): Promise<string | null> {
  if (!url.startsWith('idb://')) return url;
  const cached = objectUrls.get(url);
  if (cached) return cached;
  const blob = await get<Blob>(url.slice(6), blobStore).catch(() => undefined);
  if (!blob) return null;
  const obj = URL.createObjectURL(blob);
  objectUrls.set(url, obj);
  return obj;
}

/** Resolves `idb://` refs into object URLs; passes through normal URLs. */
export function useFileUrl(url?: string | null) {
  const [resolved, setResolved] = useState<string | null>(url && !url.startsWith('idb://') ? url : null);
  useEffect(() => {
    let alive = true;
    if (!url) return setResolved(null);
    if (!url.startsWith('idb://')) return setResolved(url);
    resolveFileUrl(url).then((u) => alive && setResolved(u));
    return () => {
      alive = false;
    };
  }, [url]);
  return resolved;
}

export async function downloadFile(ref: Pick<FileRef, 'url' | 'name'>) {
  const url = await resolveFileUrl(ref.url);
  if (!url) throw new Error('Fayl topilmadi');
  const a = document.createElement('a');
  a.href = url;
  a.download = ref.name;
  a.target = '_blank';
  a.rel = 'noopener';
  a.click();
}
