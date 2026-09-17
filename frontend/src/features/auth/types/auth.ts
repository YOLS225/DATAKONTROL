import type { UserSession } from '@/shared/stores/user-store';

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RefreshPayload = {
  refreshToken: string;
};

export type LogoutPayload = {
  refreshToken: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  resetToken: string;
  password: string;
};

export type ForgotPasswordResponse = {
  resetToken?: string;
};

export type AuthSessionResponse = UserSession;
