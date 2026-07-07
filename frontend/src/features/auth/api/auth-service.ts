import { axiosInstance } from '@/shared/api/axios-instance';
import type {
  AuthSessionResponse,
  LoginPayload,
  LogoutPayload,
  RefreshPayload,
  RegisterPayload,
} from '@/features/auth/types/auth';

class AuthService {
  async register(data: RegisterPayload) {
    return axiosInstance.post<AuthSessionResponse>('/auth/register', data);
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
}

export const authService = new AuthService();
