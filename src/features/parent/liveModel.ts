import type { ImageSourcePropType } from 'react-native';
import type { SessionEvent, SessionView } from '../../api/types';
import { photoFor } from './children';
import { hhmm, isEnded } from './data';

/*
 * 진행 중인 픽업 화면 모델. 서버 세션(SES-03 + SES-09 이벤트)과 데모 픽업(pickupStore)을 같은 모양으로 바꿔
 * 메인 · 현황 · 진행 중인 픽업 화면이 함께 쓴다.
 */

export type StepState = 'done' | 'active' | 'pending' | 'failed';
export type StepVM = { title: string; desc?: string; state: StepState };

export type LiveVM = {
  key: string;
  childName: string;
  photo: ImageSourcePropType | null;
  academy: string;
  spotName?: string;
  /** 목표 픽업 시각 HH:mm */
  pickupTime?: string;
  /** 정차 예상 HH:mm */
  arriveTime?: string;
  remainMin?: number;
  arrived: boolean;
  /** 0~1 (출발 → 도착) */
  progress: number;
  /** 서버가 받은 차 위치 (지도 카드). 아직 없으면 undefined */
  vehicle?: { lat: number; lng: number };
  steps: StepVM[];
  held: boolean;
  callId?: number;
  /** 정차 실패로 경로 이탈 팝업을 띄울지 */
  stopFailed: boolean;
  boarded: boolean;
  ended: boolean;
};

const has = (events: SessionEvent[], type: SessionEvent['type']) =>
  events.some(e => e.type === type);
const at = (events: SessionEvent[], type: SessionEvent['type']) =>
  events.find(e => e.type === type)?.occurredAt;

/** 처음 본 남은 거리 · 시간을 기억해 진행률을 낸다 (세션마다) */
const firstRemain = new Map<number, number>();

export function fromSession(
  v: SessionView,
  events: SessionEvent[],
  extra: { academy?: string; pickupTime?: string },
): LiveVM {
  const child = v.children?.[0];
  const name = child?.name ?? '자녀';
  const stopped = v.status?.vehicle === 'STOPPED';
  const callSent =
    !!v.call?.callId ||
    !!v.call?.progress?.sentAt ||
    child?.phase === 'CALLED' ||
    child?.phase === 'MEETING';
  const acked = !!child?.acknowledgedAt || child?.phase === 'MEETING';
  const incidentNow = !!v.incident?.type;
  const hadIncident = incidentNow || has(events, 'INCIDENT_OPENED');
  const changed = has(events, 'SPOT_CHANGED');
  const boarded =
    !!v.boarding?.detectedAt ||
    v.status?.session === 'COMPLETED' ||
    !!child?.boardedAt;
  const departed =
    at(events, 'DEPARTURE_NOTICE_SENT') ??
    at(events, 'SPOT_CONFIRMED') ??
    at(events, 'SESSION_STARTED');

  const remainSec = v.eta?.remainingSeconds;
  const remainM = v.route?.remainingMeters;
  const id = v.sessionId ?? 0;
  const basis = remainM ?? remainSec;
  if (basis !== undefined && basis > 0 && !firstRemain.has(id)) {
    firstRemain.set(id, basis);
  }
  const first = firstRemain.get(id);
  const progress = stopped
    ? 1
    : first && basis !== undefined
    ? Math.max(0.05, Math.min(0.95, 1 - basis / first))
    : 0.1;

  const steps: StepVM[] = [
    { title: '부모님 출발', desc: hhmm(departed), state: 'done' },
  ];
  if (!callSent && !hadIncident && !boarded) {
    steps.push({
      title: '안에서 준비하기',
      desc:
        child?.extraPrepMinutes && child.extraPrepMinutes > 0
          ? `준비 시간을 ${child.extraPrepMinutes}분 늘렸어요`
          : '가방을 챙기고 건물 안에서 기다려요',
      state: 'active',
    });
  } else {
    steps.push({
      title: '준비 완료',
      desc: '자녀가 건물 안에서 기다려요',
      state: 'done',
    });
  }
  const spot = v.spot?.name ?? '만날 장소';
  if (hadIncident) {
    steps.push({
      title: '정차하지 못했어요.',
      desc: changed
        ? '대안 장소로 재안내를 보냈어요.'
        : '안내를 위해 다음 행동을 골라 주세요.',
      state: 'failed',
    });
    steps.push(
      changed && stopped
        ? {
            title: '대안 장소에 정차했어요.',
            desc: '대안 장소에 도착 후 알림을 보냈어요.',
            state: 'done',
          }
        : {
            title: '대안 장소로 가기',
            desc: changed
              ? `${spot} · 도착하면 알림을 보낼게요.`
              : '대안 장소에 도착하면 알림을 보낼게요.',
            state: changed ? 'active' : 'pending',
          },
    );
  } else {
    steps.push({
      title: '만나는 곳으로 가기',
      desc: acked
        ? `${spot}으로 가고 있어요`
        : callSent
        ? `${spot}으로 오라고 알렸어요`
        : `${spot} · 차가 정차하면 알려줄게요`,
      state: acked || boarded ? 'done' : callSent ? 'active' : 'pending',
    });
  }
  if (boarded) {
    steps.push({
      title: '자녀가 차량에 탑승했어요.',
      desc: '픽업 일정을 종료해요.',
      state: 'done',
    });
  }
  if (v.status?.session === 'CANCELLED') {
    steps.push({
      title: '픽업을 취소했어요.',
      desc: '자녀에게 건물 안에서 기다리라고 안내했어요.',
      state: 'failed',
    });
  }

  return {
    key: `s-${id}`,
    childName: name,
    photo: photoFor(name),
    academy: extra.academy ?? spot,
    spotName: spot,
    pickupTime: extra.pickupTime,
    arriveTime: hhmm(v.eta?.stopEtaAt),
    remainMin:
      remainSec !== undefined
        ? Math.max(0, Math.ceil(remainSec / 60))
        : undefined,
    arrived: stopped,
    progress,
    vehicle:
      v.vehicleLocation?.lat != null && v.vehicleLocation?.lng != null
        ? { lat: v.vehicleLocation.lat, lng: v.vehicleLocation.lng }
        : undefined,
    steps,
    held: !!v.call?.held,
    callId: v.call?.callId,
    stopFailed: incidentNow && v.incident?.type === 'STOP_FAILED' && !changed,
    boarded,
    ended: isEnded(v),
  };
}
