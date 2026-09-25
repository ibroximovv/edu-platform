import { z } from 'zod';

export const emailSchema = z.string().trim().min(1, 'Email kiriting').email("Email noto'g'ri formatda");

export const passwordSchema = z
  .string()
  .min(8, 'Kamida 8 ta belgi')
  .regex(/[A-Z]/, 'Kamida bitta katta harf')
  .regex(/[a-z]/, 'Kamida bitta kichik harf')
  .regex(/\d/, 'Kamida bitta raqam');

export function passwordStrength(p: string) {
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const levels = [
    { label: 'Juda kuchsiz', color: 'bg-rose-500' },
    { label: 'Kuchsiz', color: 'bg-rose-400' },
    { label: "O'rtacha", color: 'bg-amber-400' },
    { label: 'Yaxshi', color: 'bg-sky-500' },
    { label: 'Kuchli', color: 'bg-emerald-500' },
    { label: 'Juda kuchli', color: 'bg-emerald-600' },
  ];
  return { score, ...levels[score] };
}
