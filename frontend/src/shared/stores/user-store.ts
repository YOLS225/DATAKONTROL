import { create } from 'zustand';
import { loadState, resetState, saveState } from './local-storage';

export const USER_STORAGE_KEY = 'datakontrol:user';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type UserSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

type UserStore = {
  session: UserSession | null;
  isAuthenticated: boolean;
  setSession: (session: UserSession) => void;
  updateTokens: (tokens: { accessToken: string; refreshToken?: string }) => void;
  resetUser: () => void;
};

const initialSession = loadState<UserSession>(USER_STORAGE_KEY) ?? null;

export const useUserStore = create<UserStore>((set, get) => ({
  session: initialSession,
  isAuthenticated: Boolean(initialSession?.accessToken),
  setSession: (session) => {
    saveState(USER_STORAGE_KEY, session);
    set({ session, isAuthenticated: true });
  },
  updateTokens: ({ accessToken, refreshToken }) => {
    const currentSession = get().session;

    if (!currentSession) {
      return;
    }

    const nextSession: UserSession = {
      ...currentSession,
      accessToken,
      refreshToken: refreshToken ?? currentSession.refreshToken,
    };

    saveState(USER_STORAGE_KEY, nextSession);
    set({ session: nextSession, isAuthenticated: true });
  },
  resetUser: () => {
    resetState(USER_STORAGE_KEY);
    set({ session: null, isAuthenticated: false });
  },
}));
