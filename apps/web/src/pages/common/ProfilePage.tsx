import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Box, Camera, KeyRound, Monitor, Moon, Palette, Sun, UserRound } from 'lucide-react';
import { ROLE_META } from '@/config/navigation';
import { fmtDate } from '@/lib/format';
import { POSITION } from '@/lib/labels';
import { authApi } from '@/api/queries/auth';
import { uploadFile } from '@/api/files';
import { errorMessage } from '@/api/http';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { useTheme } from '@/contexts/ThemeProvider';
import { useDepartments, useGroups } from '@/api/queries/admin';
import { passwordSchema } from '@/pages/auth/schemas';
import { Avatar, Badge, Button, Card, CardHeader, Field, Input, Page, PageHeader, PasswordInput, Segmented, Spinner, Switch } from '@/components/ui';

const profileSchema = z.object({ firstName: z.string().trim().min(2), lastName: z.string().trim().min(2), middleName: z.string().optional(), phone: z.string().optional() });
const pwdSchema = z
  .object({ currentPassword: z.string().min(1, 'Joriy parolni kiriting'), newPassword: passwordSchema, confirm: z.string() })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'Parollar mos emas' });

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)!;
  const setUser = useAuthStore((s) => s.setUser);
  const { mode, setMode } = useTheme();
  const enable3d = useUIStore((s) => s.enable3d);
  const setEnable3d = useUIStore((s) => s.setEnable3d);
  const { data: groups } = useGroups();
  const { data: departments } = useDepartments();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const profile = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema), defaultValues: { firstName: user.firstName, lastName: user.lastName, middleName: user.middleName ?? '', phone: user.phone ?? '' } });
  const pwd = useForm<z.infer<typeof pwdSchema>>({ resolver: zodResolver(pwdSchema), defaultValues: { currentPassword: '', newPassword: '', confirm: '' } });

  const saveProfile = profile.handleSubmit(async (v) => {
    try {
      setUser(await authApi.updateProfile(v));
      toast.success("Ma'lumotlar saqlandi");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  });

  const savePwd = pwd.handleSubmit(async (v) => {
    try {
      await authApi.changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword });
      pwd.reset();
      toast.success('Parol yangilandi');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  });

  const changeAvatar = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Faqat rasm yuklash mumkin');
    setUploading(true);
    try {
      const ref = await uploadFile(file);
      setUser(await authApi.updateProfile({ avatarUrl: ref.url }));
      toast.success('Avatar yangilandi');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const group = groups?.find((g) => g.id === user.student?.groupId);
  const dept = departments?.find((d) => d.id === user.teacher?.departmentId);

  return (
    <Page className="mx-auto max-w-5xl">
      <PageHeader title="Profil sozlamalari" />
      <Card className="relative overflow-hidden p-0">
        <div className="h-32 bg-gradient-to-r from-brand-500 via-fuchsia-500 to-sky-400" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
          <div className="relative -mt-14">
            <Avatar user={user} size="2xl" className="size-28 rounded-full ring-4 ring-card" />
            <button onClick={() => fileRef.current?.click()} className="absolute bottom-1 right-1 grid size-9 place-items-center rounded-full bg-brand-600 text-white shadow-brand ring-4 ring-card transition hover:bg-brand-700" aria-label="Avatarni o'zgartirish">
              {uploading ? <Spinner className="size-4 text-white" /> : <Camera className="size-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => changeAvatar(e.target.files?.[0])} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold text-fg">
              {user.lastName} {user.firstName}
            </h2>
            <div className="text-sm text-muted">{user.email}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {user.roles.map((r) => (
                <Badge key={r} tone={r === 'admin' ? 'red' : r === 'teacher' ? 'sky' : 'violet'}>
                  {ROLE_META[r].label}
                </Badge>
              ))}
              {group && <Badge tone="brand">{group.name} guruhi</Badge>}
              {user.teacher && <Badge>{POSITION[user.teacher.position]}</Badge>}
            </div>
          </div>
          <div className="text-right text-xs text-muted">
            Ro'yxatdan o'tgan: {fmtDate(user.createdAt)}
            {user.student?.recordBook && <div>Daftarcha: {user.student.recordBook}</div>}
            {dept && <div>{dept.name}</div>}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <CardHeader title="Shaxsiy ma'lumotlar" icon={<UserRound />} />
          <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
            <Field label="Familiya">
              <Input {...profile.register('lastName')} />
            </Field>
            <Field label="Ism">
              <Input {...profile.register('firstName')} />
            </Field>
            <Field label="Otasining ismi">
              <Input {...profile.register('middleName')} />
            </Field>
            <Field label="Telefon">
              <Input {...profile.register('phone')} placeholder="+998" />
            </Field>
            <Field label="Email" hint="Email o'zgartirish uchun administratorga murojaat qiling" className="sm:col-span-2">
              <Input value={user.email} disabled />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" loading={profile.formState.isSubmitting}>
                Saqlash
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader title="Xavfsizlik" icon={<KeyRound />} subtitle="Parolni o'zgartirish" />
            <form onSubmit={savePwd} className="space-y-4">
              <Field label="Joriy parol" error={pwd.formState.errors.currentPassword?.message}>
                <PasswordInput autoComplete="current-password" {...pwd.register('currentPassword')} />
              </Field>
              <Field label="Yangi parol" error={pwd.formState.errors.newPassword?.message}>
                <PasswordInput autoComplete="new-password" {...pwd.register('newPassword')} />
              </Field>
              <Field label="Yangi parolni tasdiqlang" error={pwd.formState.errors.confirm?.message}>
                <PasswordInput autoComplete="new-password" {...pwd.register('confirm')} />
              </Field>
              <Button type="submit" variant="outline" loading={pwd.formState.isSubmitting}>
                Parolni yangilash
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <CardHeader title="Ko'rinish" icon={<Palette />} />
            <div className="space-y-5">
              <Segmented
                value={mode}
                onChange={setMode}
                items={[
                  { value: 'light', label: "Yorug'", icon: <Sun /> },
                  { value: 'dark', label: "Qorong'i", icon: <Moon /> },
                  { value: 'system', label: 'Tizim', icon: <Monitor /> },
                ]}
              />
              <Switch checked={enable3d} onChange={setEnable3d} label={<span className="flex items-center gap-1.5"><Box className="size-4" /> 3D effektlar</span>} description="WebGL sahnalarni yoqish/o'chirish" />
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
