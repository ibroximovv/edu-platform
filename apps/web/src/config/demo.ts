import type { Role } from '@edu/shared';

/** Demo accounts available in mock mode (see api/mock/seed.ts). */
export const DEMO_ACCOUNTS: { label: string; email: string; password: string; roles: Role[] }[] = [
  { label: 'Administrator', email: 'ibroximov@gmail.com', password: 'Ibroximov@1', roles: ['admin', 'teacher', 'student'] },
  { label: "O'qituvchi", email: 'teacher@bilimdon.uz', password: 'Demo@1234', roles: ['teacher'] },
  { label: 'Talaba', email: 'student@bilimdon.uz', password: 'Demo@1234', roles: ['student'] },
];
