import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { authApi } from '../api/endpoints/auth';
import { useAuthStore } from '../stores/authStore';
import { push } from './push';

/**
 * 로그인돼 있으면 FCM 토큰을 받아 서버에 등록(AUTH-03)하고, 토큰이 바뀌면 다시 등록한다.
 * 앱이 앞에 있을 때 푸시가 오면 서버 상태를 다시 받는다 (화면은 최신 세션 기준으로 그려진다).
 */
export function usePushRegistration() {
  const signedIn = useAuthStore(s => s.status === 'signedIn');
  const userId = useAuthStore(s => s.auth?.userId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!signedIn) return;
    const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
    const register = (pushToken: string) =>
      authApi.updatePushToken({ platform, pushToken }).catch(() => {
        // 실패해도 앱은 폴링으로 동작한다. 다음 실행 · 토큰 갱신 때 다시 등록
      });

    let cancelled = false;
    push.getToken().then(t => {
      if (t && !cancelled) register(t);
    });
    const offRefresh = push.onTokenRefresh(register);
    const offMessage = push.onMessage(() => {
      queryClient.invalidateQueries();
    });
    return () => {
      cancelled = true;
      offRefresh();
      offMessage();
    };
  }, [signedIn, userId, queryClient]);
}
