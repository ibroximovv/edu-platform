export const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
export const MONTHS_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
/** Index 1..7 = Dushanba..Yakshanba */
export const WEEKDAYS = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
export const WEEKDAYS_SHORT = ['', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

const pad = (n: number) => String(n).padStart(2, '0');

export function toDate(v: string | number | Date) {
  return v instanceof Date ? v : new Date(v);
}

/** 25 Sen */
export function fmtDay(v: string | Date) {
  const d = toDate(v);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** 25 Sentabr 2026 */
export function fmtDate(v: string | Date, withYear = true) {
  const d = toDate(v);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`;
}

/** 25.09.2026 */
export function fmtNumericDate(v: string | Date) {
  const d = toDate(v);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function fmtTime(v: string | Date) {
  const d = toDate(v);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 25 Sen, 14:30 */
export function fmtDateTime(v: string | Date) {
  return `${fmtDay(v)}, ${fmtTime(v)}`;
}

/** ISO → value for <input type="datetime-local"> */
export function toInputDateTime(v: string | Date) {
  const d = toDate(v);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toInputDate(v: string | Date) {
  return toInputDateTime(v).slice(0, 10);
}

const UNITS: [number, string][] = [
  [60, 'soniya'],
  [60, 'daqiqa'],
  [24, 'soat'],
  [7, 'kun'],
  [4.345, 'hafta'],
  [12, 'oy'],
  [Infinity, 'yil'],
];

/** "3 soat oldin" / "2 kundan so'ng" */
export function fmtRelative(v: string | Date, now = Date.now()) {
  let diff = (toDate(v).getTime() - now) / 1000;
  const future = diff > 0;
  diff = Math.abs(diff);
  if (diff < 45) return 'hozirgina';
  for (const [size, unit] of UNITS) {
    if (diff < size) {
      const n = Math.round(diff);
      return future ? `${n} ${unit}dan so'ng` : `${n} ${unit} oldin`;
    }
    diff /= size;
  }
  return '';
}

/** Time left until deadline: "2 kun 4 soat", "35 daqiqa" or null if passed */
export function fmtTimeLeft(v: string | Date, now = Date.now()) {
  const ms = toDate(v).getTime() - now;
  if (ms <= 0) return null;
  const m = Math.floor(ms / 60000);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  if (d > 0) return h ? `${d} kun ${h} soat` : `${d} kun`;
  if (h > 0) return `${h} soat ${m % 60} daqiqa`;
  return `${Math.max(1, m)} daqiqa`;
}

export function fmtDuration(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h ? `${h}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
}

export function fmtBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const v = bytes / 1024 ** i;
  return `${v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

export function fmtNumber(n: number, digits = 0) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).replace(/,/g, '.');
}

export function fullName(u?: { firstName: string; lastName: string } | null) {
  return u ? `${u.lastName} ${u.firstName}` : '—';
}

export function shortName(u?: { firstName: string; lastName: string } | null) {
  return u ? `${u.firstName} ${u.lastName.charAt(0)}.` : '—';
}

export function initials(u?: { firstName: string; lastName: string } | null) {
  return u ? `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase() : '?';
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Xayrli tun';
  if (h < 12) return 'Xayrli tong';
  if (h < 18) return 'Xayrli kun';
  return 'Xayrli kech';
}

/** ISO weekday 1..7 */
export function isoWeekday(d = new Date()) {
  return ((d.getDay() + 6) % 7) + 1;
}

export function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isSameDay(a: string | Date, b: string | Date) {
  const x = toDate(a);
  const y = toDate(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

/** ISO week number parity relative to semester start: 1-based */
export function weekNumberSince(start: string | Date, d = new Date()) {
  const s = startOfDay(toDate(start));
  const monday = new Date(s);
  monday.setDate(s.getDate() - (isoWeekday(s) - 1));
  return Math.floor((startOfDay(d).getTime() - monday.getTime()) / (7 * 86400000)) + 1;
}
