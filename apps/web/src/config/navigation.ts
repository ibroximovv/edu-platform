import {
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  FolderOpen,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Library,
  ListChecks,
  NotebookPen,
  Presentation,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@edu/shared';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: 'pendingReviews' | 'pendingUsers' | 'pendingAssignments';
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const ROLE_META: Record<Role, { label: string; icon: LucideIcon; tone: string; description: string }> = {
  admin: { label: 'Administrator', icon: ShieldCheck, tone: 'from-rose-500 to-orange-400', description: 'Tizimni boshqarish' },
  teacher: { label: "O'qituvchi", icon: Presentation, tone: 'from-sky-500 to-indigo-500', description: 'Kurslar va baholash' },
  student: { label: 'Talaba', icon: GraduationCap, tone: 'from-brand-500 to-fuchsia-500', description: "O'qish va topshiriqlar" },
};

export const NAVIGATION: Record<Role, NavSection[]> = {
  student: [
    {
      title: 'Umumiy',
      items: [
        { to: '/student', label: 'Bosh sahifa', icon: LayoutDashboard, end: true },
        { to: '/student/courses', label: 'Fanlarim', icon: BookOpen },
        { to: '/student/schedule', label: 'Dars jadvali', icon: CalendarDays },
      ],
    },
    {
      title: "O'qish",
      items: [
        { to: '/student/assignments', label: 'Topshiriqlar', icon: ClipboardList, badge: 'pendingAssignments' },
        { to: '/student/tests', label: 'Test va nazorat', icon: ListChecks },
        { to: '/student/materials', label: 'Materiallar', icon: FolderOpen },
      ],
    },
    {
      title: 'Natijalar',
      items: [
        { to: '/student/grades', label: 'Baholarim', icon: Award },
        { to: '/student/rating', label: 'Reyting', icon: Trophy },
      ],
    },
  ],
  teacher: [
    {
      title: 'Umumiy',
      items: [
        { to: '/teacher', label: 'Bosh sahifa', icon: LayoutDashboard, end: true },
        { to: '/teacher/courses', label: 'Kurslarim', icon: BookOpen },
        { to: '/teacher/schedule', label: 'Dars jadvali', icon: CalendarDays },
      ],
    },
    {
      title: "O'quv jarayoni",
      items: [
        { to: '/teacher/reviews', label: 'Tekshirish', icon: ClipboardCheck, badge: 'pendingReviews' },
        { to: '/teacher/assignments', label: 'Topshiriqlar', icon: ClipboardList },
        { to: '/teacher/tests', label: 'Test va nazorat', icon: ListChecks },
        { to: '/teacher/journal', label: 'Jurnal', icon: NotebookPen },
        { to: '/teacher/materials', label: 'Materiallar', icon: FolderOpen },
      ],
    },
  ],
  admin: [
    {
      title: 'Umumiy',
      items: [{ to: '/admin', label: 'Boshqaruv paneli', icon: LayoutDashboard, end: true }],
    },
    {
      title: 'Foydalanuvchilar',
      items: [
        { to: '/admin/users', label: 'Foydalanuvchilar', icon: Users, badge: 'pendingUsers' },
        { to: '/admin/groups', label: 'Guruhlar', icon: UsersRound },
        { to: '/admin/teachers', label: "O'qituvchilar", icon: Presentation },
      ],
    },
    {
      title: "O'quv jarayoni",
      items: [
        { to: '/admin/subjects', label: 'Fanlar', icon: Library },
        { to: '/admin/courses', label: 'Kurslar (yuklama)', icon: Layers },
        { to: '/admin/schedule', label: 'Dars jadvali', icon: CalendarDays },
        { to: '/admin/academic-years', label: "O'quv yillari", icon: CalendarRange },
        { to: '/admin/structure', label: 'Fakultet va kafedra', icon: Building2 },
      ],
    },
    {
      title: 'Tahlil',
      items: [
        { to: '/admin/rating', label: 'Reyting', icon: Trophy },
        { to: '/admin/settings', label: 'Sozlamalar', icon: Settings },
      ],
    },
  ],
};
