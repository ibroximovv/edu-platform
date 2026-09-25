/**
 * Realtime events. In `http` mode this wraps a socket.io connection;
 * in `mock` mode the fake server emits events in-process.
 */
import type { Socket } from 'socket.io-client';
import type { Notification } from '@edu/shared';
import { IS_MOCK, WS_URL } from '@/config/app';

export interface RealtimeEvents {
  notification: Notification;
  'db:changed': { entity?: string };
}

type Listener<K extends keyof RealtimeEvents> = (payload: RealtimeEvents[K]) => void;

const bus = new EventTarget();
let socket: Socket | null = null;

export function emitRealtime<K extends keyof RealtimeEvents>(event: K, payload: RealtimeEvents[K]) {
  bus.dispatchEvent(new CustomEvent(event, { detail: payload }));
}

export function onRealtime<K extends keyof RealtimeEvents>(event: K, cb: Listener<K>) {
  const handler = (e: Event) => cb((e as CustomEvent).detail);
  bus.addEventListener(event, handler);
  return () => bus.removeEventListener(event, handler);
}

/** Connect to the realtime gateway (no-op in mock mode). */
export async function connectRealtime(token: string) {
  if (IS_MOCK || socket) return;
  const { io } = await import('socket.io-client');
  socket = io(WS_URL, { auth: { token }, transports: ['websocket'] });
  socket.on('notification', (n: Notification) => emitRealtime('notification', n));
  socket.on('db:changed', (p: RealtimeEvents['db:changed']) => emitRealtime('db:changed', p));
}

export function disconnectRealtime() {
  socket?.disconnect();
  socket = null;
}
