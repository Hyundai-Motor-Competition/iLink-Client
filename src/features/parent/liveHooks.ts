import type { SessionView } from '../../api/types';
import { childPhoto, getChild } from './children';
import {
  childrenOf,
  useActiveSession,
  useFamily,
  useSchedules,
  useServerMode,
  useSpots,
} from './data';
import { fromSession, type LiveVM, type StepVM } from './liveModel';
import { type Pickup, usePickupStore } from './pickupStore';

/*
 * 데모 픽업(pickupStore)의 진행 단계. 현황메뉴 - 진행 중 2~7 순서 그대로다.
 * 서버 연결 전에는 몇 초마다 다음 단계로 넘어가고, 경로 이탈 · 탑승 확인은 팝업으로 보여 준다.
 */
type S = { title: string; desc?: string };
const DEPART: S = { title: '부모님 출발' };
const READY: S = { title: '준비 완료', desc: '자녀가 건물 안에서 기다려요' };
const MISSED: S = {
  title: '정차하지 못했어요.',
  desc: '대안 장소로 재안내를 보냈어요.',
};
const ALT_STOP: S = {
  title: '대안 장소에 정차했어요.',
  desc: '대안 장소에 도착 후 알림을 보냈어요.',
};
const BOARDED: S = {
  title: '자녀가 차량에 탑승했어요.',
  desc: '픽업 일정을 종료해요.',
};
const CANCELLED: S = {
  title: '호출을 철회했어요.',
  desc: '자녀에게 건물 안에서 기다리라고 안내했어요.',
};
/** STAGES에서 "대안 장소로 가기" 단계 */
export const ALT_STAGE = 2;

export const STAGES: {
  steps: S[];
  dialog?: 'detour' | 'boarded';
  current?: number;
  ended?: boolean;
}[] = [
  {
    current: 1,
    steps: [
      DEPART,
      { title: '안에서 준비하기', desc: '가방을 챙기고 건물 안에서 기다려요' },
      {
        title: '만나는 곳으로 가기',
        desc: '정문 앞 · 차가 오기 3분 전에 알려줄게요',
      },
    ],
  },
  {
    dialog: 'detour',
    current: 2,
    steps: [
      DEPART,
      READY,
      MISSED,
      {
        title: '만나는 곳으로 가기',
        desc: '횡단보도 앞 · 차가 오기 3분 전에 알려줄게요',
      },
    ],
  },
  {
    current: 3,
    steps: [
      DEPART,
      READY,
      MISSED,
      {
        title: '대안 장소로 가기',
        desc: '대안 장소에 도착하면 알림을 보낼게요.',
      },
    ],
  },
  { steps: [DEPART, READY, MISSED, ALT_STOP] },
  { ended: true, steps: [DEPART, READY, MISSED, ALT_STOP, BOARDED] },
  {
    ended: true,
    dialog: 'boarded',
    steps: [DEPART, READY, MISSED, ALT_STOP, BOARDED],
  },
];

/** 데모 픽업 → 화면 모델 */
export function fromMock(p: Pickup, now = new Date()): LiveVM {
  const child = getChild(p.childId);
  const stage = Math.min(p.stage, STAGES.length - 1);
  const cur = STAGES[stage];
  const cancelled = p.status === 'cancelled';
  const curIdx = cur.current ?? cur.steps.length - 1;
  const raw = cancelled
    ? [...cur.steps.slice(0, curIdx + 1), CANCELLED]
    : cur.steps.map(st =>
        p.altSpot && st.title === '대안 장소로 가기'
          ? { ...st, desc: `${p.altSpot} · 도착하면 알림을 보낼게요.` }
          : st,
      );
  const steps: StepVM[] = raw.map((st, i) => {
    const failed = st === MISSED || (cancelled && i === raw.length - 1);
    const state: StepVM['state'] = failed
      ? 'failed'
      : cur.ended || i < curIdx
      ? 'done'
      : i === curIdx && !cancelled
      ? 'active'
      : 'pending';
    return {
      title: st.title,
      desc: st === DEPART ? p.time : st.desc,
      state,
    };
  });
  const [h, m] = p.time.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  const remain = Math.max(
    0,
    Math.round((target.getTime() - now.getTime()) / 60000),
  );
  return {
    key: p.id,
    childName: child.name,
    photo: childPhoto(child.id),
    academy: p.place,
    spotName: p.altSpot ?? '정문 앞',
    pickupTime: p.time,
    arriveTime: p.time,
    remainMin: Math.min(remain, 30),
    arrived: !!cur.ended,
    progress: Math.min(0.95, 0.25 + stage * 0.15),
    steps,
    held: false,
    stopFailed: cur.dialog === 'detour',
    boarded: !!cur.ended,
    ended: !!cur.ended || cancelled || p.status === 'done',
  };
}

/** 서버 세션 → 화면 모델 (학원 이름 · 목표 시각은 SPOT-01 · SET-04로 채운다) */
export function useServerLive(): {
  live: LiveVM | null;
  view?: SessionView;
  loading: boolean;
} {
  const server = useServerMode();
  const { view, events, loading } = useActiveSession();
  const spots = useSpots();
  const family = useFamily();
  const kids = childrenOf(family.data);
  const schedules = useSchedules(kids.map(k => k.id));
  if (!server || !view) return { live: null, view, loading };

  const academy = spots.data?.academies?.find(a =>
    a.spots?.some(sp => sp.spotId === view.spot?.spotId),
  );
  const spotHere = academy?.spots?.find(sp => sp.spotId === view.spot?.spotId);
  const spotLoc = spotHere?.stopPoint ?? spotHere?.meetingPoint;
  const childId = view.children?.[0]?.childUserId;
  const sched = schedules.data
    ?.find(x => x.childId === childId)
    ?.items.find(i => i.academy?.academyId === academy?.academyId);
  return {
    view,
    loading,
    live: fromSession(view, events, {
      academy: academy?.academyName,
      pickupTime: sched?.classEndTime?.slice(0, 5),
      spotLocation:
        spotLoc?.lat != null && spotLoc?.lng != null
          ? { lat: spotLoc.lat, lng: spotLoc.lng }
          : undefined,
    }),
  };
}

/** 진행 중 픽업 목록 (서버 모드면 세션 1건, 데모면 live 상태 픽업) */
export function useLiveList(): LiveVM[] {
  const server = useServerMode();
  const { live } = useServerLive();
  const pickups = usePickupStore(st => st.pickups);
  if (server) return live && !live.ended ? [live] : [];
  return pickups.filter(p => p.status === 'live').map(p => fromMock(p));
}
