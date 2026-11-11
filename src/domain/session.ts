import type { SessionView } from '../api/types';

const TERMINAL = new Set(['COMPLETED', 'CANCELLED']);

export function isTerminal(view: SessionView | null | undefined): boolean {
  return !!view?.status?.session && TERMINAL.has(view.status.session);
}

/**
 * F4-04 · F4-07: 받은 세션이 현재보다 오래됐거나, 이미 종료된 세션을 되돌리려 하면 무시한다.
 * 프론트는 COMPLETED를 스스로 만들지 않고 서버 응답·이벤트만 반영한다.
 */
export function mergeSessionView(
  prev: SessionView | null,
  next: SessionView,
): SessionView {
  if (!prev || prev.sessionId !== next.sessionId) return next;
  if (isTerminal(prev)) return prev;
  if ((next.stateVersion ?? -1) < (prev.stateVersion ?? -1)) return prev;
  return next;
}

/**
 * QA-21: 푸시에 담긴 버전이 현재 세션보다 오래됐으면 그 푸시로 화면을 열지 않는다.
 */
export function isStalePush(
  push: { sessionId: number; stateVersion?: number; spotVersion?: number },
  current: SessionView | null,
): boolean {
  if (!current || current.sessionId !== push.sessionId) return false;
  if (isTerminal(current)) return true;
  if (
    push.spotVersion !== undefined &&
    push.spotVersion < (current.spot?.spotVersion ?? 0)
  )
    return true;
  if (
    push.stateVersion !== undefined &&
    push.stateVersion < (current.stateVersion ?? 0)
  )
    return true;
  return false;
}

export type ChildScreen = 'C01' | 'C02' | 'C03' | 'C04' | 'C05';

/**
 * 자녀 화면 결정. 서버 상태가 기준이고, 준비 알림(C02)만 로컬 수신 여부를 함께 본다.
 * swagger childPhase에는 PREPARING이 없어 DEPARTURE_NOTICE_SENT 이벤트·OS-C01 푸시 수신으로 판단한다.
 */
export function resolveChildScreen(
  view: SessionView,
  childUserId: number,
  opts: { prepNoticeReceived: boolean },
): ChildScreen {
  const s = view.status;
  const me = view.children?.find(c => c.childUserId === childUserId);

  if (s?.session === 'COMPLETED')
    return me?.phase === 'NOT_BOARDED' ? 'C04' : 'C05';
  if (s?.session === 'CANCELLED' || s?.session === 'ON_HOLD') return 'C04';
  if (view.incident?.type || me?.phase === 'NOT_BOARDED') return 'C04';
  if (s?.call === 'REVOKED' || s?.spot === 'INVALIDATED') return 'C04';
  if (me?.phase === 'CALLED' || me?.phase === 'MEETING') return 'C03';
  if (opts.prepNoticeReceived) return 'C02';
  return 'C01';
}
