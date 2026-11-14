// iOS Live Activity (잠금화면 LA-01 · 다이나믹 아일랜드 DI-01/02). 네이티브: ios/ILinkMobile/LiveActivityModule.swift
// 자녀 폰에서 보호자가 출발하면 시작 → ETA가 바뀌면 갱신 → 탑승 완료 · 취소면 끝낸다. Android에서는 아무것도 하지 않는다.
import { useEffect, useRef } from 'react';
import { NativeModules, Platform, Settings } from 'react-native';
import type { SessionView } from '../api/types';

export type LiveState = {
  minutesLeft: number;
  /** 'HH:mm' 도착 예정 */
  etaText: string;
  /** 0 차량 출발 · 1 곧 도착 · 2 탑승하기 */
  stage: number;
  /** 0~1 출발 → 도착 */
  progress: number;
  headline: string;
};

type Native = {
  start(placeName: string, state: LiveState): Promise<string | null>;
  update(state: LiveState): Promise<void>;
  end(state: LiveState | null): Promise<void>;
};

const native: Native | undefined =
  Platform.OS === 'ios' ? NativeModules.ILinkLiveActivity : undefined;

export const liveActivity = {
  supported: !!native,
  start: (place: string, s: LiveState) =>
    native?.start(place, s).catch(() => null) ?? Promise.resolve(null),
  update: (s: LiveState) =>
    native?.update(s).catch(() => {}) ?? Promise.resolve(),
  end: (s: LiveState | null = null) =>
    native?.end(s).catch(() => {}) ?? Promise.resolve(),
};

const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (iso?: string) => {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '--:--'
    : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 서버 실내 준비 알림 기준과 같다: 3분 또는 700m 안이면 '곧 도착' */
const NEAR_SECONDS = 180;
const NEAR_METERS = 700;

/** 세션 → Live Activity 내용. 출발 전(장소 확정 전)이거나 끝났으면 null */
export function liveStateOf(
  v: SessionView | undefined,
  perspective: 'child' | 'guardian' = 'child',
): LiveState | null {
  if (!v?.status || v.status.spot !== 'CONFIRMED') return null;
  if (v.status.session === 'COMPLETED' || v.status.session === 'CANCELLED')
    return null;
  const left = v.eta?.remainingSeconds ?? undefined;
  const remain = v.route?.remainingMeters ?? undefined;
  const total = v.route?.totalMeters ?? undefined;
  const stopped = v.status.vehicle === 'STOPPED';
  const near =
    (left !== undefined && left <= NEAR_SECONDS) ||
    (remain !== undefined && remain <= NEAR_METERS);
  const progress = stopped
    ? 1
    : total && remain !== undefined
    ? Math.min(1, Math.max(0, 1 - remain / total))
    : 0.1;
  const driver = v.driver?.name;
  return {
    minutesLeft: stopped ? 0 : Math.max(1, Math.ceil((left ?? 0) / 60)),
    etaText: hhmm(v.eta?.stopEtaAt),
    stage: stopped || v.call?.callId ? 2 : near ? 1 : 0,
    progress,
    headline:
      perspective === 'guardian'
        ? guardianHeadline(v, stopped)
        : stopped
        ? '차가 도착했어요'
        : `${driver ? `${driver}님이` : '보호자가'} 출발했어요`,
  };
}

/** 보호자 폰: 아이 이름 기준 문구 */
function guardianHeadline(v: SessionView, stopped: boolean) {
  const child = v.children?.[0]?.name ?? '아이';
  if (v.boarding?.detectedAt) return `${child} 탑승을 확인하고 있어요`;
  if (stopped) return v.call?.callId ? `${child}에게 합류 안내를 보냈어요` : '도착했어요';
  return `${child} 픽업 가는 중`;
}

/**
 * 자녀 화면에서 세션을 따라 Live Activity를 켜고 끈다.
 * iOS 시뮬레이터 · 시연용: 실행 인자 `-demoLiveActivity YES`면 서버 없이 예시 내용으로 띄운다.
 */
export function useChildLiveActivity(
  v: SessionView | undefined,
  perspective: 'child' | 'guardian' = 'child',
) {
  const started = useRef(false);
  const s = liveStateOf(v, perspective);
  const key = s ? JSON.stringify(s) : null;
  useEffect(() => {
    if (!liveActivity.supported) return;
    if (s && v) {
      if (!started.current) {
        started.current = true;
        liveActivity.start(v.spot?.name ?? '만날 장소', s);
      } else {
        liveActivity.update(s);
      }
    } else if (started.current && v?.status?.session) {
      started.current = false;
      liveActivity.end(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, v?.status?.session]);
}

/** 시연: `xcrun simctl launch <기기> com.ilink.mobile -demoLiveActivity YES` */
export function startDemoLiveActivityIfAsked() {
  if (Platform.OS !== 'ios' || !Settings.get('demoLiveActivity')) return;
  const eta = new Date(Date.now() + 8 * 60_000);
  liveActivity.start('수학 임팩트 학원', {
    minutesLeft: 8,
    etaText: `${pad(eta.getHours())}:${pad(eta.getMinutes())}`,
    stage: 0,
    progress: 0.3,
    headline: '엄마가 출발했어요',
  });
}
