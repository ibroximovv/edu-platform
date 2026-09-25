import type { ChangePasswordDto, LoginDto, RegisterDto, ResetPasswordDto, UpdateProfileDto, VerifyEmailDto } from '@edu/shared';
import { getDb, hashPassword, touch, uid, type DbUser, type PendingCode } from '../db';
import { logActivity, notify, publicUser } from '../helpers';
import { fail, issueToken, route } from '../server';

const CODE_TTL = 10 * 60_000;
const norm = (e: string) => e.trim().toLowerCase();

function createCode(email: string, purpose: PendingCode['purpose']) {
  const db = getDb();
  db.codes = db.codes.filter((c) => !(c.email === email && c.purpose === purpose) && c.expiresAt > Date.now());
  const code = String(Math.floor(100000 + Math.random() * 900000));
  db.codes.push({ email, code, purpose, expiresAt: Date.now() + CODE_TTL, attempts: 0 });
  return { email, expiresInSec: CODE_TTL / 1000, devCode: code };
}

function consumeCode(email: string, code: string, purpose: PendingCode['purpose']) {
  const db = getDb();
  const entry = db.codes.find((c) => c.email === email && c.purpose === purpose);
  if (!entry || entry.expiresAt < Date.now()) fail(400, "Kod muddati tugagan. Yangi kod so'rang", { code: 'Kod eskirgan' });
  if (entry!.attempts >= 5) fail(429, "Juda ko'p urinish. Yangi kod so'rang");
  if (entry!.code !== code.trim()) {
    entry!.attempts++;
    fail(400, "Tasdiqlash kodi noto'g'ri", { code: "Kod noto'g'ri" });
  }
  db.codes = db.codes.filter((c) => c !== entry);
}

function session(u: DbUser) {
  u.lastLoginAt = new Date().toISOString();
  return { user: publicUser(u), tokens: issueToken(u.id) };
}

route(
  'POST',
  '/auth/login',
  async ({ body }) => {
    const { email, password } = body as LoginDto;
    const u = getDb().users.find((x) => x.email === norm(email));
    if (!u || u.passwordHash !== (await hashPassword(password))) fail(401, "Email yoki parol noto'g'ri");
    if (!u!.emailVerified) fail(403, 'Email tasdiqlanmagan');
    if (u!.status === 'pending') fail(403, "Hisobingiz administrator tasdig'ini kutmoqda");
    if (u!.status === 'blocked') fail(403, 'Hisobingiz bloklangan. Administratorga murojaat qiling');
    return session(u!);
  },
  false,
);

route(
  'POST',
  '/auth/register',
  async ({ body }) => {
    const dto = body as RegisterDto;
    const db = getDb();
    const email = norm(dto.email);
    if (!db.settings.registration.enabled) fail(403, "Ro'yxatdan o'tish vaqtincha yopilgan");
    const domains = db.settings.registration.allowedDomains;
    if (domains.length && !domains.some((d) => email.endsWith(`@${d}`))) fail(400, `Faqat ${domains.join(', ')} domenlari ruxsat etilgan`, { email: 'Domen ruxsat etilmagan' });
    const existing = db.users.find((u) => u.email === email);
    if (existing?.emailVerified) fail(409, "Bu email allaqachon ro'yxatdan o'tgan", { email: 'Email band' });
    const passwordHash = await hashPassword(dto.password);
    if (existing) {
      Object.assign(existing, { firstName: dto.firstName.trim(), lastName: dto.lastName.trim(), passwordHash });
    } else {
      db.users.push({
        id: uid('u'),
        email,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        roles: ['student'],
        status: 'pending',
        emailVerified: false,
        createdAt: new Date().toISOString(),
        passwordHash,
        avatarUrl: null,
        student: { groupId: null, recordBook: '', enrollmentYear: new Date().getFullYear() },
        teacher: null,
      });
      touch();
    }
    return createCode(email, 'verify');
  },
  false,
);

route(
  'POST',
  '/auth/resend-code',
  ({ body }) => {
    const email = norm(body.email);
    const purpose = (body.purpose ?? 'verify') as PendingCode['purpose'];
    const u = getDb().users.find((x) => x.email === email);
    if (!u) fail(404, 'Foydalanuvchi topilmadi');
    return createCode(email, purpose);
  },
  false,
);

route(
  'POST',
  '/auth/verify-email',
  ({ body }) => {
    const { email: raw, code } = body as VerifyEmailDto;
    const email = norm(raw);
    const db = getDb();
    const u = db.users.find((x) => x.email === email);
    if (!u) fail(404, 'Foydalanuvchi topilmadi');
    consumeCode(email, code, 'verify');
    u!.emailVerified = true;
    if (!db.settings.registration.requireApproval) u!.status = 'active';
    logActivity(`Yangi foydalanuvchi ro'yxatdan o'tdi: ${u!.firstName} ${u!.lastName}`, 'user');
    if (u!.status === 'pending') {
      notify(
        db.users.filter((x) => x.roles.includes('admin')).map((x) => x.id),
        'system',
        'Yangi foydalanuvchi',
        `${u!.firstName} ${u!.lastName} (${email}) tasdiqlashni kutmoqda`,
        '/admin/users?status=pending',
      );
      return { pendingApproval: true, email };
    }
    return session(u!);
  },
  false,
);

route(
  'POST',
  '/auth/forgot-password',
  ({ body }) => {
    const email = norm(body.email);
    const u = getDb().users.find((x) => x.email === email && x.emailVerified);
    // Do not reveal whether the account exists
    if (!u) return { email, expiresInSec: CODE_TTL / 1000 };
    return createCode(email, 'reset');
  },
  false,
);

route(
  'POST',
  '/auth/reset-password',
  async ({ body }) => {
    const dto = body as ResetPasswordDto;
    const email = norm(dto.email);
    const u = getDb().users.find((x) => x.email === email);
    if (!u) fail(400, "Kod noto'g'ri", { code: "Kod noto'g'ri" });
    consumeCode(email, dto.code, 'reset');
    u!.passwordHash = await hashPassword(dto.password);
    return { ok: true };
  },
  false,
);

route('GET', '/auth/me', ({ me }) => publicUser(me));
route('POST', '/auth/logout', () => ({ ok: true }));

route('PATCH', '/auth/me', ({ me, body }) => {
  const dto = body as UpdateProfileDto;
  for (const k of ['firstName', 'lastName', 'middleName', 'phone', 'avatarUrl'] as const) {
    if (dto[k] !== undefined) (me as unknown as Record<string, unknown>)[k] = typeof dto[k] === 'string' ? dto[k]!.trim() : dto[k];
  }
  touch();
  return publicUser(me);
});

route('POST', '/auth/change-password', async ({ me, body }) => {
  const dto = body as ChangePasswordDto;
  if (me.passwordHash !== (await hashPassword(dto.currentPassword))) fail(400, "Joriy parol noto'g'ri", { currentPassword: "Parol noto'g'ri" });
  me.passwordHash = await hashPassword(dto.newPassword);
  return { ok: true };
});
