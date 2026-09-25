import type {
  AuthResponse,
  ChangePasswordDto,
  CodeSentResponse,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
  User,
  VerifyEmailDto,
  VerifyEmailResponse,
} from '@edu/shared';
import { http } from '../http';

export const authApi = {
  login: (dto: LoginDto) => http.post<AuthResponse>('/auth/login', dto),
  register: (dto: RegisterDto) => http.post<CodeSentResponse>('/auth/register', dto),
  verifyEmail: (dto: VerifyEmailDto) => http.post<VerifyEmailResponse>('/auth/verify-email', dto),
  resendCode: (email: string, purpose: 'verify' | 'reset' = 'verify') => http.post<CodeSentResponse>('/auth/resend-code', { email, purpose }),
  forgotPassword: (email: string) => http.post<CodeSentResponse>('/auth/forgot-password', { email }),
  resetPassword: (dto: ResetPasswordDto) => http.post<{ ok: true }>('/auth/reset-password', dto),
  me: () => http.get<User>('/auth/me'),
  updateProfile: (dto: UpdateProfileDto) => http.patch<User>('/auth/me', dto),
  changePassword: (dto: ChangePasswordDto) => http.post<{ ok: true }>('/auth/change-password', dto),
  logout: () => http.post('/auth/logout'),
};
