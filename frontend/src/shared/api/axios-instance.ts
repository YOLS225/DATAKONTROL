import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { useUserStore, type UserSession } from '@/shared/stores/user-store';

type RefreshResponse = Partial<UserSession> & {
  token?: string;
  data?: {
    accessToken?: string;
    token?: string;
    refreshToken?: string;
  };
};

type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

type BackendErrorResponse = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9000/api';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getRefreshTokens = (payload: RefreshResponse) => {
  const accessToken =
    payload.accessToken ?? payload.token ?? payload.data?.accessToken ?? payload.data?.token;
  const refreshToken = payload.refreshToken ?? payload.data?.refreshToken;

  if (!accessToken) {
    throw new Error('Refresh response does not include an access token');
  }

  return { accessToken, refreshToken };
};

const getBackendErrorMessage = (data: unknown) => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const backendError = data as BackendErrorResponse;

  if (Array.isArray(backendError.message)) {
    return backendError.message.join('\n');
  }

  if (typeof backendError.message === 'string') {
    return backendError.message;
  }

  if (typeof backendError.error === 'string') {
    return backendError.error;
  }

  return null;
};

const getAxiosErrorMessage = (error: AxiosError) => {
  return (
    getBackendErrorMessage(error.response?.data) ??
    error.message ??
    'Une erreur est survenue'
  );
};

const toApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return new Error(getAxiosErrorMessage(error));
  }

  return error instanceof Error ? error : new Error('Une erreur est survenue');
};

const isAuthRequest = (url?: string) => {
  return Boolean(url?.includes('/auth/login') || url?.includes('/auth/register'));
};

axiosInstance.interceptors.request.use((config) => {
  const token = useUserStore.getState().session?.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const session = useUserStore.getState().session;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthRequest(originalRequest.url)
    ) {
      return Promise.reject(toApiError(error));
    }

    if (!session?.refreshToken) {
      useUserStore.getState().resetUser();
      return Promise.reject(toApiError(error));
    }

    originalRequest._retry = true;

    try {
      const refreshResponse = await axios.post<RefreshResponse>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken: session.refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const tokens = getRefreshTokens(refreshResponse.data);

      useUserStore.getState().updateTokens(tokens);

      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${tokens.accessToken}`,
      };

      return axiosInstance(originalRequest);
    } catch (refreshError) {
      useUserStore.getState().resetUser();
      return Promise.reject(toApiError(refreshError));
    }
  }
);
