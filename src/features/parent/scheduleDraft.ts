import { create } from 'zustand';
import type { AcademyHit } from './data';
import { mock } from './mock';

export const DAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;

/** 대안 만날 장소: 학원에서 동(+east) · 북(+north)으로 m만큼 옮긴 곳 */
export type AltSpot = { name: string; east: number; north: number };

/** 픽업 일정 등록 단계마다 고른 값. 확인 화면 요약과 서버 등록에 그대로 쓴다. */
type Draft = {
  childId: number;
  academy: string;
  /** 서버에 등록된 학원이면 id와 위치 (SPOT-04 추천에 쓴다). 샘플 데이터로 진행 중이면 없음 */
  academyId?: number;
  academyLocation?: { lat: number; lng: number };
  /** 검색에서 고른 학원 (SET-01 결과) */
  academyHit?: AcademyHit;
  days: boolean[];
  weekly: boolean;
  time: string;
  /** 시간을 직접 골랐는지 (안 골랐으면 00:00으로 보여 주고 다음으로를 막는다) */
  timeSet: boolean;
  altSpots: AltSpot[];
  setChild(id: number): void;
  setAcademy(
    name: string,
    academyId?: number,
    location?: { lat: number; lng: number },
  ): void;
  setAcademyHit(hit: AcademyHit): void;
  toggleDay(i: number): void;
  setWeekly(v: boolean): void;
  setTime(t: string): void;
  addAlt(a: AltSpot): void;
  removeAlt(i: number): void;
  reset(): void;
};

const initial = {
  childId: mock.children[0].id,
  academy: mock.academies[0].name,
  days: [true, false, true, false, true, false, false],
  weekly: true,
  time: '18:10',
  timeSet: false,
  academyId: undefined as number | undefined,
  academyLocation: undefined as { lat: number; lng: number } | undefined,
  academyHit: undefined as AcademyHit | undefined,
  altSpots: [] as AltSpot[],
};

export const useScheduleDraft = create<Draft>(set => ({
  ...initial,
  setChild: childId => set({ childId }),
  setAcademy: (academy, academyId, academyLocation) =>
    set({ academy, academyId, academyLocation }),
  setAcademyHit: hit =>
    set({ academyHit: hit, academy: hit.name, academyLocation: hit.location }),
  toggleDay: i =>
    set(s => ({ days: s.days.map((on, j) => (j === i ? !on : on)) })),
  setWeekly: weekly => set({ weekly }),
  setTime: time => set({ time, timeSet: true }),
  addAlt: a => set(s => ({ altSpots: [...s.altSpots, a] })),
  removeAlt: i =>
    set(s => ({ altSpots: s.altSpots.filter((_, j) => j !== i) })),
  reset: () => set(initial),
}));

/** 예: "매주 월수금 18:10", "화목 18:10", 매일이면 "매일 18:10" */
export function scheduleLabel(days: boolean[], weekly: boolean, time: string) {
  const picked = DAYS.filter((_, i) => days[i]).join('');
  const dayText = picked.length === 7 ? '매일' : picked;
  return [weekly && dayText !== '매일' ? '매주' : '', dayText, time]
    .filter(Boolean)
    .join(' ');
}

/** 확인 화면용: "매주 화·목 20:00" */
export function reviewLabel(days: boolean[], weekly: boolean, time: string) {
  const picked = DAYS.filter((_, i) => days[i]);
  const dayText = picked.length === 7 ? '매일' : picked.join('·');
  return [weekly && dayText !== '매일' ? '매주' : '', dayText, time]
    .filter(Boolean)
    .join(' ');
}
