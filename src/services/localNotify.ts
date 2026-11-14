import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { NativeModules, Platform } from 'react-native';
import { sessionApi } from '../api/endpoints/session';
import { isGuardianRole, useAuthStore } from '../stores/authStore';
import { useChildLiveActivity } from './liveActivity';

/*
 * iOS 보호자 앱 픽업 알림.
 * iOS 원격 푸시는 Firebase iOS 설정(GoogleService-Info.plist)과 APNs 키를 받은 뒤 켠다.
 * 그 전까지는 세션 이벤트(SES-09)를 3초마다 확인해 새 이벤트(앱을 켠 뒤 생긴 것)를 기기 알림으로 띄운다.
 * (서버는 푸시 토큰이 없는 보호자에게는 알림 기록(NOTI-02)을 만들지 않는다)
 * Android는 FCM 푸시가 바로 오므로 쓰지 않는다.
 */

const Native = NativeModules.ILinkLocalNotify as
  | {
      requestPermission(): Promise<boolean>;
      show(id: string, title: string, body: string): Promise<void>;
    }
  | undefined;

/** 세션 이벤트(SES-09) → 보호자 알림 문구. {c}는 아이 이름 */
const EVENT_TEXT: Record<string, [string, string]> = {
  SPOT_CONFIRMED: ['픽업 출발', '{c}에게 출발 알림을 보냈어요'],
  PREPARE_NOTICE_SENT: ['곧 도착해요', '{c}에게 나갈 준비 알림을 보냈어요'],
  PREP_TIME_EXTENDED: ['준비 시간 추가', '{c}가 준비 시간을 늘렸어요'],
  CHILD_READY: ['준비 완료', '{c}가 준비를 마쳤어요'],
  VEHICLE_STOPPED: ['도착', '만나는 곳에 도착했어요'],
  CALL_SENT: ['합류 안내', '{c}에게 합류 안내를 보냈어요'],
  CALL_ACKNOWLEDGED: ['합류 안내 확인', '{c}가 합류 안내를 확인했어요'],
  HELP_REQUESTED: ['도움 요청', '{c}가 차를 찾지 못하고 있어요'],
  SPOT_CHANGED: ['장소 변경', '만나는 곳이 바뀌었어요'],
  BOARDING_DETECTED: ['탑승 확인 중', '{c}가 차에 탔어요'],
  SESSION_COMPLETED: ['탑승 완료', '{c}가 안전하게 탑승했어요'],
  SESSION_CANCELLED: ['픽업 취소', '오늘 픽업이 취소됐어요'],
};

export function useGuardianLocalNotifications() {
  const auth = useAuthStore(s => s.auth);
  const on = Platform.OS === 'ios' && !!Native && !!auth && isGuardianRole(auth.role);
  const seen = useRef<Set<string> | null>(null);
  // 세션이 끝나 active가 비어도 마지막 세션을 계속 봐서 종료 상태로 Live Activity를 끝낸다
  const lastId = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (on) Native!.requestPermission().catch(() => false);
  }, [on]);

  const active = useQuery({
    queryKey: ['localNotify', 'active'],
    enabled: on,
    queryFn: async () => (await sessionApi.active()) ?? null,
    refetchInterval: 3000,
  });
  const sessionId = active.data?.sessionId;
  if (sessionId !== undefined) lastId.current = sessionId;
  const liveId = sessionId ?? lastId.current;

  // 잠금화면 · 다이나믹 아일랜드 (보호자 시점 문구)
  const view = useQuery({
    queryKey: ['localNotify', 'view', liveId],
    enabled: on && liveId !== undefined,
    queryFn: () => sessionApi.get(liveId!),
    refetchInterval: q => {
      const st = q.state.data?.status?.session;
      return st === 'COMPLETED' || st === 'CANCELLED' ? false : 3000;
    },
  });
  useChildLiveActivity(view.data, 'guardian');

  // 세션 이벤트를 순서대로 받아 새 이벤트만 알림으로 띄운다. 앱을 켜기 전 이벤트는 띄우지 않는다
  const events = useQuery({
    queryKey: ['localNotify', 'events', liveId],
    enabled: on && liveId !== undefined,
    queryFn: async () => (await sessionApi.events(liveId!, 0)).items ?? [],
    refetchInterval: q =>
      q.state.data?.some(e => e.type === 'SESSION_COMPLETED' || e.type === 'SESSION_CANCELLED')
        ? false
        : 3000,
  });

  const since = useRef(Date.now() - 60_000);
  useEffect(() => {
    if (!on || !events.data) return;
    seen.current ??= new Set();
    const child = view.data?.children?.[0]?.name ?? '아이';
    for (const e of events.data) {
      const key = `${liveId}-${e.seq ?? e.eventId}`;
      if (seen.current.has(key)) continue;
      seen.current.add(key);
      const text = EVENT_TEXT[e.type ?? ''];
      const at = e.occurredAt ? Date.parse(e.occurredAt) : Date.now();
      if (!text || at < since.current) continue;
      Native!.show(`pickup-${key}`, text[0], text[1].replace('{c}', child)).catch(() => {});
    }
  }, [on, events.data, view.data, liveId]);
}
