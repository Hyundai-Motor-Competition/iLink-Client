import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { newIdempotencyKey } from '../../api/client';
import { childApi } from '../../api/endpoints/child';
import {
  callApi,
  childSignalApi,
  sessionApi,
} from '../../api/endpoints/session';
import { ApiError } from '../../api/errors';
import type { SessionView } from '../../api/types';
import { messageFor } from '../../domain/errorCodes';
import { resolveChildScreen } from '../../domain/session';
import { useChildLiveActivity } from '../../services/liveActivity';
import { useAuthStore } from '../../stores/authStore';
import { useActiveSession, useSessionView } from '../session/useSession';
import {
  ChildDepartedView,
  ChildDoneView,
  ChildHelpView,
  ChildMeetView,
  ChildWaitingView,
  hhmm,
  koreanTime,
} from './ChildViews';
import { useChildLocation } from './useChildLocation';
import { useChildPrepNotice } from './useChildPrepNotice';
import { useChildUi } from './childUiStore';

/**
 * 자녀 C01~C05. 서버 세션 상태로 화면이 바뀐다 (사용자가 단계를 넘기지 않는다).
 *  C01 실내 대기(세션 없음 · 출발 전) → C02 보호자 출발 → C03 합류 안내(지도) → C05 탑승 완료
 *  C04: 안내 취소 · 장소 무효 · 보류 · 미탑승
 */
export function ChildSessionScreen() {
  const userId = useAuthStore(s => s.auth?.userId);
  const signOut = useAuthStore(s => s.signOut);
  const active = useActiveSession();
  const [doneSession, setDoneSession] = useState<number | null>(null);
  // 끝난 세션을 '확인'하기 전까지 C05를 보여 주기 위해 마지막 세션 번호를 기억한다
  const lastSession = useRef<number | undefined>(undefined);
  if (active.data?.sessionId) lastSession.current = active.data.sessionId;
  const sessionId = active.data?.sessionId ?? lastSession.current;
  const { data, apply, refetch } = useSessionView(
    sessionId !== undefined && sessionId !== doneSession ? sessionId : undefined,
  );
  const prepNotice = useChildPrepNotice(sessionId);
  useChildLiveActivity(data);

  const next = useQuery({
    queryKey: ['child', 'next-pickup'],
    queryFn: async () => (await childApi.nextPickup()) ?? null,
    refetchInterval: 20_000, // 보호자가 일정을 바꾸면 곧 보이게
  });

  const dialog = useChildUi(s => s.dialog);
  const closeDialog = useChildUi(s => s.closeDialog);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // 취소된 세션은 기다리던 화면(C01)으로 돌아간다
  const view =
    data && sessionId !== doneSession && data.status?.session !== 'CANCELLED' ? data : null;
  const screen = view && userId ? resolveChildScreen(view, userId, { prepNoticeReceived: prepNotice }) : 'C01';
  const me = view?.children?.find(c => c.childUserId === userId);
  const myLocation = useChildLocation(
    view?.sessionId,
    screen === 'C03' && (me?.phase === 'CALLED' || me?.phase === 'MEETING'),
  );

  // C03을 처음 보면 합류 안내를 '확인'으로 알린다 (보호자 · 차량 화면에 확인 표시)
  const acked = useRef<number | null>(null);
  useEffect(() => {
    const callId = view?.call?.callId;
    if (screen !== 'C03' || !callId || me?.acknowledgedAt || acked.current === callId) return;
    acked.current = callId;
    callApi.acknowledge(callId, newIdempotencyKey()).then(() => refetch(), () => {});
  }, [screen, view?.call?.callId, me?.acknowledgedAt, refetch]);

  useEffect(() => setNotice(null), [screen]);

  const onProfile = useCallback(() => {
    Alert.alert('내 정보', '이 기기의 iLink 연결을 해제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '연결 해제', style: 'destructive', onPress: () => signOut() },
    ]);
  }, [signOut]);

  const fail = (e: unknown) => {
    const err = e instanceof ApiError ? e : null;
    setNotice(err ? messageFor(err.code, err.message) : '잠시 후 다시 시도해 주세요');
  };

  if (screen === 'C05' && view) {
    const boarded = me?.boardedAt ? new Date(me.boardedAt) : new Date();
    return (
      <ChildDoneView
        place={next.data?.academyName ?? view.spot?.name ?? '만나는 곳'}
        boardedAt={koreanTime(boarded)}
        onConfirm={() => {
          setDoneSession(view.sessionId ?? null);
          next.refetch();
        }}
        onProfile={onProfile}
      />
    );
  }

  if (screen === 'C04' && view) {
    const revoked = view.status?.call === 'REVOKED' || view.status?.spot === 'INVALIDATED';
    return (
      <ChildHelpView
        desc={
          revoked
            ? '아까 받은 안내는 취소됐어요.\n새 장소가 정해지면 다시 알려줄게요.'
            : '부모님이 확인하고 있어요.\n다시 안내할 때까지 기다려 주세요.'
        }
        banner={revoked ? '부모님이 다시 정차 위치를 확인중' : '부모님이 상황을 확인하고 있어요'}
        busy={busy}
        onContact={() => callGuardian(view, setBusy, fail)}
        onProfile={onProfile}
      />
    );
  }

  if (screen === 'C03' && view) {
    const remain = view.eta?.remainingSeconds;
    const vehicle = view.vehicleLocation?.lat != null ? { lat: view.vehicleLocation.lat!, lng: view.vehicleLocation.lng! } : null;
    const childAt = myLocation ?? (me?.location?.lat != null ? { lat: me.location.lat!, lng: me.location.lng! } : null);
    const stopped = view.status?.vehicle === 'STOPPED';
    return (
      <ChildMeetView
        academy={next.data?.academyName ?? view.spot?.name ?? '만나는 곳'}
        spot={view.spot?.name ?? ''}
        minutes={stopped ? 0 : remain != null ? Math.max(1, Math.round(remain / 60)) : null}
        child={childAt}
        vehicle={vehicle}
        pos={stopped ? 0.82 : 0.65}
        notice={notice}
        busy={busy}
        onHelp={async () => {
          setBusy(true);
          try {
            await childSignalApi.requestHelp(view.sessionId!, 'CANT_FIND_CAR', newIdempotencyKey());
            setNotice('부모님께 차를 못 찾겠다고 알렸어요');
          } catch (e) {
            fail(e);
          } finally {
            setBusy(false);
          }
        }}
        onProfile={onProfile}
      />
    );
  }

  if (screen === 'C02' && view) {
    const etaAt = view.eta?.stopEtaAt ? new Date(view.eta.stopEtaAt) : null;
    const total = view.route?.totalMeters ?? 0;
    const remainM = view.route?.remainingMeters ?? total;
    const pos = total > 0 ? Math.min(0.45, Math.max(0.08, (1 - remainM / total) * 0.5)) : 0.25;
    return (
      <ChildDepartedView
        who={subject(view.driver?.name)}
        eta={etaAt ? hhmm(etaAt) : '--:--'}
        pos={pos}
        extraUsed={me?.extraPrepMinutes ?? 0}
        busy={busy}
        notice={notice}
        onAddTime={async m => {
          setBusy(true);
          try {
            await childSignalApi.extendPrepTime(view.sessionId!, m, newIdempotencyKey());
            apply(await sessionApi.get(view.sessionId!));
            setNotice(`준비 시간 +${m}분을 보호자에게 알렸어요`);
          } catch (e) {
            fail(e);
          } finally {
            setBusy(false);
          }
        }}
        onProfile={onProfile}
      />
    );
  }

  // C01: 진행 중 세션이 없거나 보호자 출발 전
  const target = next.data?.targetAt ? new Date(next.data.targetAt) : null;
  return (
    <ChildWaitingView
      place={next.data?.academyName ?? (next.isLoading ? '불러오는 중' : '일정 없음')}
      time={target ? koreanTime(target) : next.isLoading ? '-' : '일정 없음'}
      dialog={dialog}
      onCloseDialog={closeDialog}
      onProfile={onProfile}
    />
  );
}

/** '엄마' → '엄마가', '김현대' → '김현대님이' */
function subject(name?: string | null) {
  if (!name) return '보호자가';
  if (/(엄마|아빠|할머니|할아버지|이모|삼촌|고모|누나|언니|형|오빠)$/.test(name)) return `${name}가`;
  return `${name}님이`;
}

async function callGuardian(view: SessionView, setBusy: (b: boolean) => void, fail: (e: unknown) => void) {
  setBusy(true);
  try {
    const list = (await sessionApi.contacts(view.sessionId!)).items ?? [];
    const g = list.find(c => c.role === 'GUARDIAN' && c.phone) ?? list.find(c => c.phone);
    if (!g?.phone) {
      Alert.alert('연락처가 없어요', '보호자 전화번호가 등록되어 있지 않아요.');
      return;
    }
    await Linking.openURL(`tel:${g.phone}`);
  } catch (e) {
    fail(e);
  } finally {
    setBusy(false);
  }
}
