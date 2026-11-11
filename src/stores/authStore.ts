import { create } from 'zustand';
import { setTokenProvider } from '../api/client';
import { authApi } from '../api/endpoints/auth';
import {
  clearAuth,
  loadAuth,
  saveAuth,
  type StoredAuth,
} from '../services/secureStore';

type AuthState = {
  status: 'loading' | 'signedOut' | 'signedIn';
  auth: StoredAuth | null;
  restore(): Promise<void>;
  signIn(auth: StoredAuth): Promise<void>;
  signOut(): Promise<void>;
};

export const useAuthStore = create<AuthState>(set => ({
  status: 'loading',
  auth: null,
  async restore() {
    const auth = await loadAuth();
    set({ auth, status: auth ? 'signedIn' : 'signedOut' });
  },
  async signIn(auth) {
    await saveAuth(auth);
    set({ auth, status: 'signedIn' });
  },
  async signOut() {
    await clearAuth();
    set({ auth: null, status: 'signedOut' });
  },
}));

export const isGuardianRole = (role?: StoredAuth['role']) =>
  role !== undefined && role !== 'CHILD';

// refresh 동시 호출을 하나로 묶는다.
let refreshing: Promise<string | null> | null = null;

setTokenProvider({
  getAccessToken: () => useAuthStore.getState().auth?.accessToken ?? null,
  refresh() {
    refreshing ??= (async () => {
      const { auth, signIn, signOut } = useAuthStore.getState();
      if (!auth) return null;
      try {
        const t = await authApi.refresh(auth.refreshToken);
        if (!t.accessToken || !t.refreshToken) throw new Error('empty token');
        await signIn({
          ...auth,
          accessToken: t.accessToken,
          refreshToken: t.refreshToken,
        });
        return t.accessToken;
      } catch {
        await signOut();
        return null;
      }
    })().finally(() => {
      refreshing = null;
    });
    return refreshing;
  },
});
