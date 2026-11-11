import { useQuery } from '@tanstack/react-query';
import { sessionApi } from '../../api/endpoints/session';
import { env } from '../../config/env';

/**
 * 준비 알림(OS-C01) 수신 여부. 세션 이벤트 목록에 DEPARTURE_NOTICE_SENT가 있으면 C02로 본다.
 * 푸시 연동 후에는 푸시 수신도 같은 값을 갱신하도록 바꾼다.
 */
export function useChildPrepNotice(sessionId: number | undefined): boolean {
  const { data } = useQuery({
    queryKey: ['session', sessionId, 'prepNotice'],
    enabled: sessionId !== undefined,
    queryFn: async () => {
      const page = await sessionApi.events(sessionId!, 0);
      return (page.items ?? []).some(e => e.type === 'DEPARTURE_NOTICE_SENT');
    },
    refetchInterval: env.sessionPollMs * 2,
  });
  return data ?? false;
}
