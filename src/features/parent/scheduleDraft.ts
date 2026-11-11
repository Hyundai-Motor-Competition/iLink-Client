import { create } from 'zustand';
import { mock } from './mock';

export const DAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;

/** 픽업 일정 등록 Step 1~4에서 고른 값. 완료 화면 요약에 그대로 쓴다. */
type Draft = {
  childId: number;
  academy: string;
  days: boolean[];
  weekly: boolean;
  time: string;
  setChild(id: number): void;
  setAcademy(name: string): void;
  toggleDay(i: number): void;
  setWeekly(v: boolean): void;
  reset(): void;
};

const initial = {
  childId: mock.children[0].id,
  academy: mock.academies[0].name,
  days: [true, false, true, false, true, false, false],
  weekly: true,
  time: '18:10',
};

export const useScheduleDraft = create<Draft>(set => ({
  ...initial,
  setChild: childId => set({ childId }),
  setAcademy: academy => set({ academy }),
  toggleDay: i =>
    set(s => ({ days: s.days.map((on, j) => (j === i ? !on : on)) })),
  setWeekly: weekly => set({ weekly }),
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
