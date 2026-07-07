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

export type AuthSessionResponse = UserSession;
