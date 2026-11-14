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
    // 키체인을 읽지 못하면(서명 없는 시뮬레이터 빌드 등) 로딩에 머물지 않고 로그아웃 상태로 시작한다
    // (응답이 없을 때도 3초 뒤에는 넘어간다)
    const auth = await Promise.race([
      loadAuth().catch(() => null),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 3000)),
    ]);
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
