import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { sessionApi } from '../../api/endpoints/session';
import type { SessionView } from '../../api/types';
import { env } from '../../config/env';
import { isTerminal, mergeSessionView } from '../../domain/session';

export const sessionKeys = {
  active: ['session', 'active'] as const,
  detail: (id: number) => ['session', id] as const,
};

export function useActiveSession() {
  return useQuery({
    queryKey: sessionKeys.active,
    queryFn: async () => (await sessionApi.active()) ?? null,
    refetchInterval: env.sessionPollMs * 3,
  });
}

/**
 * 모바일은 SSE(SES-08, 차량 토큰 전용)를 쓸 수 없어 폴링 + 푸시 수신 시 즉시 재조회로 동기화한다.
 * 버전이 낮은 응답과 종료 후 늦은 응답은 mergeSessionView에서 걸러진다.
 */
export function useSessionView(sessionId: number | undefined) {
  const last = useRef<SessionView | null>(null);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: sessionKeys.detail(sessionId ?? -1),
    enabled: sessionId !== undefined,
    queryFn: async () => {
      const merged = mergeSessionView(
        last.current,
        await sessionApi.get(sessionId!),
      );
      last.current = merged;
      return merged;
    },
    refetchInterval: q =>
      isTerminal(q.state.data) ? false : env.sessionPollMs,
  });

  /** 명령 API가 돌려준 최신 세션을 바로 반영 */
  const apply = useCallback(
    (next: SessionView) => {
      const merged = mergeSessionView(last.current, next);
      last.current = merged;
      qc.setQueryData(sessionKeys.detail(next.sessionId!), merged);
    },
    [qc],
  );

  return { ...query, apply };
}
