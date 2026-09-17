import { axiosInstance } from '@/shared/api/axios-instance';
import type {
  AuthSessionResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  LogoutPayload,
  RefreshPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from '@/features/auth/types/auth';

class AuthService {
  async register(data: RegisterPayload) {
    return axiosInstance.post<void>('/auth/register', data);
  }

  async login(data: LoginPayload) {
    return axiosInstance.post<AuthSessionResponse>('/auth/login', data);
  }

  async refresh(data: RefreshPayload) {
    return axiosInstance.post<AuthSessionResponse>('/auth/refresh', data);
  }

  async logout(data: LogoutPayload) {
    return axiosInstance.post('/auth/logout', data);
  }

  async forgotPassword(data: ForgotPasswordPayload) {
    return axiosInstance.post<ForgotPasswordResponse>('/auth/forgot-password', data);
  }

  async resetPassword(data: ResetPasswordPayload) {
    return axiosInstance.post<void>('/auth/reset-password', data);
  }
}

export const authService = new AuthService();
