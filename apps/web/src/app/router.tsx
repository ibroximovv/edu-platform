import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { createBrowserRouter } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/pages/auth/AuthLayout';
import { NotFoundPage, RouteErrorPage } from '@/pages/common/ErrorPages';
import { GuestOnly, HomeRedirect, RequireAuth, RequireRole } from './guards';

/** Every page is its own chunk — loaded on first visit only. */
const L = (loader: () => Promise<{ default: ComponentType }>) => {
  const C: LazyExoticComponent<ComponentType> = lazy(loader);
  return <C />;
};

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <GuestOnly />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: 'login', element: L(() => import('@/pages/auth/LoginPage')) },
              { path: 'register', element: L(() => import('@/pages/auth/RegisterPage')) },
              { path: 'verify-email', element: L(() => import('@/pages/auth/VerifyEmailPage')) },
              { path: 'forgot-password', element: L(() => import('@/pages/auth/ForgotPasswordPage')) },
              { path: 'pending', element: L(() => import('@/pages/auth/PendingPage')) },
            ],
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          // Distraction-free test taking (no sidebar)
          { path: 'student/tests/attempt/:attemptId', element: L(() => import('@/pages/student/AttemptPage')) },
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <HomeRedirect /> },
              {
                path: 'student',
                element: <RequireRole role="student" />,
                children: [
                  { index: true, element: L(() => import('@/pages/student/DashboardPage')) },
                  { path: 'courses', element: L(() => import('@/pages/student/CoursesPage')) },
                  { path: 'courses/:id', element: L(() => import('@/pages/student/CourseDetailPage')) },
                  { path: 'assignments', element: L(() => import('@/pages/student/AssignmentsPage')) },
                  { path: 'assignments/:id', element: L(() => import('@/pages/student/AssignmentDetailPage')) },
                  { path: 'tests', element: L(() => import('@/pages/student/TestsPage')) },
                  { path: 'tests/review/:attemptId', element: L(() => import('@/pages/student/AttemptReviewPage')) },
                  { path: 'schedule', element: L(() => import('@/pages/student/SchedulePage')) },
                  { path: 'grades', element: L(() => import('@/pages/student/GradesPage')) },
                  { path: 'rating', element: L(() => import('@/pages/student/RatingPage')) },
                  { path: 'materials', element: L(() => import('@/pages/student/MaterialsPage')) },
                ],
              },
              {
                path: 'teacher',
                element: <RequireRole role="teacher" />,
                children: [
                  { index: true, element: L(() => import('@/pages/teacher/DashboardPage')) },
                  { path: 'courses', element: L(() => import('@/pages/teacher/CoursesPage')) },
                  { path: 'courses/:id', element: L(() => import('@/pages/teacher/CourseManagePage')) },
                  { path: 'reviews', element: L(() => import('@/pages/teacher/ReviewsPage')) },
                  { path: 'assignments', element: L(() => import('@/pages/teacher/AssignmentsPage')) },
                  { path: 'tests', element: L(() => import('@/pages/teacher/TestsPage')) },
                  { path: 'tests/new', element: L(() => import('@/pages/teacher/TestBuilderPage')) },
                  { path: 'tests/:id/edit', element: L(() => import('@/pages/teacher/TestBuilderPage')) },
                  { path: 'tests/:id/results', element: L(() => import('@/pages/teacher/TestResultsPage')) },
                  { path: 'journal', element: L(() => import('@/pages/teacher/JournalPage')) },
                  { path: 'schedule', element: L(() => import('@/pages/teacher/SchedulePage')) },
                  { path: 'materials', element: L(() => import('@/pages/teacher/MaterialsPage')) },
                ],
              },
              {
                path: 'admin',
                element: <RequireRole role="admin" />,
                children: [
                  { index: true, element: L(() => import('@/pages/admin/DashboardPage')) },
                  { path: 'users', element: L(() => import('@/pages/admin/UsersPage')) },
                  { path: 'groups', element: L(() => import('@/pages/admin/GroupsPage')) },
                  { path: 'groups/:id', element: L(() => import('@/pages/admin/GroupDetailPage')) },
                  { path: 'teachers', element: L(() => import('@/pages/admin/TeachersPage')) },
                  { path: 'subjects', element: L(() => import('@/pages/admin/SubjectsPage')) },
                  { path: 'courses', element: L(() => import('@/pages/admin/CoursesPage')) },
                  { path: 'schedule', element: L(() => import('@/pages/admin/SchedulePage')) },
                  { path: 'academic-years', element: L(() => import('@/pages/admin/AcademicYearsPage')) },
                  { path: 'structure', element: L(() => import('@/pages/admin/StructurePage')) },
                  { path: 'rating', element: L(() => import('@/pages/admin/RatingPage')) },
                  { path: 'settings', element: L(() => import('@/pages/admin/SettingsPage')) },
                ],
              },
              { path: 'profile', element: L(() => import('@/pages/common/ProfilePage')) },
              { path: 'notifications', element: L(() => import('@/pages/common/NotificationsPage')) },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
