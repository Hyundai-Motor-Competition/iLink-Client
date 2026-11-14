import { Text } from 'react-native';
import { resolveChildScreen, type ChildScreen } from '../../domain/session';
import { useAuthStore } from '../../stores/authStore';
import { ScreenScaffold } from '../../shared/ui/ScreenScaffold';
import { useActiveSession, useSessionView } from '../session/useSession';
import { useChildPrepNotice } from './useChildPrepNotice';
import { useChildLiveActivity } from '../../services/liveActivity';

const TITLES: Record<ChildScreen, string> = {
  C01: '실내에서 기다려요',
  C02: '가방을 정리해요',
  C03: '만남 장소로 이동해요',
  C04: '지금 있는 곳에서 기다려요',
  C05: '픽업 완료',
};

/** C01~C05는 한 화면에서 서버 상태에 따라 전환한다. 사용자가 단계를 직접 넘기지 않는다. */
export function ChildSessionScreen() {
  const userId = useAuthStore(s => s.auth?.userId);
  const active = useActiveSession();
  const sessionId = active.data?.sessionId;
  const { data } = useSessionView(sessionId);
  const prepNoticeReceived = useChildPrepNotice(sessionId);
  // 보호자가 출발하면 잠금화면 · 다이나믹 아일랜드에 진행 상황 (iOS)
  useChildLiveActivity(data);

  if (!data || !userId) {
    return (
      <ScreenScaffold screenId="C01" title="오늘 픽업을 기다리고 있어요" />
    );
  }

  const screen = resolveChildScreen(data, userId, { prepNoticeReceived });
  return (
    <ScreenScaffold screenId={screen} title={TITLES[screen]}>
      <Text>만날 장소: {data.spot?.name ?? '-'}</Text>
    </ScreenScaffold>
  );
}
