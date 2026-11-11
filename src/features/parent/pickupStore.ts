import { create } from 'zustand';
import { mock } from './mock';

/*
 * 부모 데모의 픽업 데이터(등록된 일정 · 오늘의 픽업 · 기록).
 * 서버 연결 전까지 앱 메모리에만 두고, 화면들은 모두 이 스토어를 읽고 쓴다.
 *   일정 등록 → schedules 추가, 오늘 요일이면 오늘 픽업(예정) 생성
 *   픽업 시작 → live, 진행 단계·대체 장소 저장
 *   호출 철회 → cancelled + 기록 추가 / 탑승 확인 → done + 기록 추가
 */

export type Schedule = {
  id: string;
  childId: number;
  academy: string;
  spot: string;
  altSpot: string;
  /** 월~일 */
  days: boolean[];
  weekly: boolean;
  time: string;
};

export type PickupStatus = 'scheduled' | 'live' | 'done' | 'cancelled';

export type Pickup = {
  id: string;
  scheduleId: string;
  childId: number;
  /** YYYY-MM-DD */
  date: string;
  time: string;
  place: string;
  status: PickupStatus;
  /** 진행 화면의 단계 (PickupLiveScreen STAGES 인덱스) */
  stage: number;
  altSpot?: string;
  recordId?: string;
};

export type PickupRecord = {
  id: string;
  pickupId: string;
  childId: number;
  date: string;
  place: string;
  /** 정차 예상 (= 목표 픽업 시각) */
  expected: string;
  /** 실제 정차 */
  actual?: string;
  /** 자녀 탑승 확인 */
  boardedAt?: string;
  status: 'done' | 'cancelled';
};

export type NewSchedule = Omit<Schedule, 'id'>;

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`;

const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
/** 월=0 … 일=6 */
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;
export const parseYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const minutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
/** 실제 - 예상 (분) */
export const diffMinutes = (expected: string, actual: string) =>
  minutes(actual) - minutes(expected);

function pickupFor(s: Schedule, date: Date): Pickup {
  return {
    id: uid('p'),
    scheduleId: s.id,
    childId: s.childId,
    date: ymd(date),
    time: s.time,
    place: s.academy,
    status: 'scheduled',
    stage: 0,
  };
}

type Data = {
  schedules: Schedule[];
  pickups: Pickup[];
  records: PickupRecord[];
  /** 이용 결과 · "예측 개선에 활용" */
  predictionOptIn: boolean;
};

const addMin = (t: string, n: number) => {
  const v = minutes(t) + n;
  return `${pad(Math.floor(v / 60))}:${pad(v % 60)}`;
};

/**
 * 앱을 처음 열었을 때 보이는 예시 데이터.
 * 김현지(월~금 18:10, 오늘 진행 중) · 김현우(월수금 18:30) 일정과
 * 지난 4주 동안 이 일정대로 쌓인 기록(가끔 철회)을 만든다.
 */
export function seed(now = new Date()): Data {
  const hyunjiDays = [true, true, true, true, true, false, false];
  hyunjiDays[weekdayIndex(now)] = true;
  const hyunji: Schedule = {
    id: 's-seed-2',
    childId: 2,
    academy: mock.academies[0].name,
    spot: mock.spots[0].name,
    altSpot: mock.spots[1].name,
    days: hyunjiDays,
    weekly: true,
    time: '18:10',
  };
  const hyunwoo: Schedule = {
    id: 's-seed-1',
    childId: 1,
    academy: mock.academies[1].name,
    spot: mock.academies[1].name,
    altSpot: mock.spots[1].name,
    days: [true, false, true, false, true, false, false],
    weekly: true,
    time: '18:30',
  };
  const live: Pickup = { ...pickupFor(hyunji, now), status: 'live' };

  const records: PickupRecord[] = [];
  for (let n = 27; n >= 1; n--) {
    const date = addDays(now, -n);
    for (const sc of [hyunji, hyunwoo]) {
      if (!sc.days[weekdayIndex(date)]) continue;
      // 날짜·자녀로 정해지는 -2~+4분 오차, 11번에 한 번은 철회
      const k = date.getDate() * 7 + sc.childId * 3;
      const cancelled = k % 11 === 0;
      const late = (k % 7) - 2;
      records.push({
        id: uid('r'),
        pickupId: uid('p'),
        childId: sc.childId,
        date: ymd(date),
        place: sc.academy,
        expected: sc.time,
        actual: cancelled ? undefined : addMin(sc.time, late),
        boardedAt: cancelled ? undefined : addMin(sc.time, late + 1),
        status: cancelled ? 'cancelled' : 'done',
      });
    }
  }
  return {
    schedules: [hyunji, hyunwoo],
    pickups: [live],
    records,
    predictionOptIn: true,
  };
}

type State = Data & {
  addSchedule(s: NewSchedule, now?: Date): Schedule;
  removeSchedule(id: string): void;
  startPickup(id: string): void;
  setStage(id: string, stage: number, altSpot?: string): void;
  cancelPickup(id: string, now?: Date): void;
  completePickup(id: string, now?: Date): string;
  /** 철회한 오늘 픽업을 다시 예정으로 */
  recallPickup(id: string): void;
  setPredictionOptIn(v: boolean): void;
  resetDemo(): void;
};

export const usePickupStore = create<State>((set, get) => ({
  ...seed(),

  addSchedule: (input, now = new Date()) => {
    const schedule: Schedule = { ...input, id: uid('s') };
    set(st => {
      const today = ymd(now);
      const busy = st.pickups.some(
        p =>
          p.childId === input.childId &&
          p.date === today &&
          (p.status === 'scheduled' || p.status === 'live'),
      );
      const runsToday = input.days[weekdayIndex(now)];
      return {
        schedules: [...st.schedules, schedule],
        pickups:
          runsToday && !busy
            ? [...st.pickups, pickupFor(schedule, now)]
            : st.pickups,
      };
    });
    return schedule;
  },

  removeSchedule: id =>
    set(st => ({
      schedules: st.schedules.filter(s => s.id !== id),
      // 아직 시작하지 않은 픽업만 함께 지운다
      pickups: st.pickups.filter(
        p => !(p.scheduleId === id && p.status === 'scheduled'),
      ),
    })),

  startPickup: id =>
    set(st => ({
      pickups: st.pickups.map(p =>
        p.id === id && p.status === 'scheduled'
          ? { ...p, status: 'live', stage: 0, altSpot: undefined }
          : p,
      ),
    })),

  setStage: (id, stage, altSpot) =>
    set(st => ({
      pickups: st.pickups.map(p =>
        p.id === id && p.status === 'live'
          ? { ...p, stage, altSpot: altSpot ?? p.altSpot }
          : p,
      ),
    })),

  cancelPickup: (id, now = new Date()) => {
    const p = get().pickups.find(x => x.id === id);
    if (!p || p.status === 'done' || p.status === 'cancelled') return;
    const record: PickupRecord = {
      id: uid('r'),
      pickupId: p.id,
      childId: p.childId,
      date: ymd(now),
      place: p.altSpot ?? p.place,
      expected: p.time,
      status: 'cancelled',
    };
    set(st => ({
      pickups: st.pickups.map(x =>
        x.id === id ? { ...x, status: 'cancelled', recordId: record.id } : x,
      ),
      records: [...st.records, record],
    }));
  },

  completePickup: (id, now = new Date()) => {
    const p = get().pickups.find(x => x.id === id);
    if (!p) return '';
    if (p.recordId && p.status === 'done') return p.recordId;
    const record: PickupRecord = {
      id: uid('r'),
      pickupId: p.id,
      childId: p.childId,
      date: ymd(now),
      place: p.altSpot ?? p.place,
      expected: p.time,
      // 정차 후 1분 뒤 탑승 확인으로 본다 (차량 신호 연결 전)
      actual: hhmm(new Date(now.getTime() - 60_000)),
      boardedAt: hhmm(now),
      status: 'done',
    };
    set(st => ({
      pickups: st.pickups.map(x =>
        x.id === id ? { ...x, status: 'done', recordId: record.id } : x,
      ),
      records: [...st.records, record],
    }));
    return record.id;
  },

  recallPickup: id =>
    set(st => ({
      pickups: st.pickups.map(p =>
        p.id === id && p.status === 'cancelled'
          ? {
              ...p,
              status: 'scheduled',
              stage: 0,
              altSpot: undefined,
              recordId: undefined,
            }
          : p,
      ),
    })),

  setPredictionOptIn: predictionOptIn => set({ predictionOptIn }),

  resetDemo: () => set(seed()),
}));

export type Upcoming = {
  key: string;
  schedule: Schedule;
  date: Date;
  isToday: boolean;
  pickup?: Pickup;
};

/**
 * 앞으로 7일 안의 픽업 예정. 오늘 것은 아직 시작하지 않은(scheduled) 픽업만 넣는다.
 */
export function upcomingPickups(
  schedules: Schedule[],
  pickups: Pickup[],
  now = new Date(),
): Upcoming[] {
  const today = ymd(now);
  const out: Upcoming[] = [];
  for (const s of schedules) {
    for (let n = 0; n < 7; n++) {
      const date = addDays(now, n);
      if (!s.days[weekdayIndex(date)]) continue;
      if (n === 0) {
        const p = pickups.find(x => x.scheduleId === s.id && x.date === today);
        if (!p || p.status !== 'scheduled') continue;
        out.push({ key: p.id, schedule: s, date, isToday: true, pickup: p });
      } else {
        out.push({ key: `${s.id}-${n}`, schedule: s, date, isToday: false });
      }
    }
  }
  return out.sort(
    (a, b) =>
      a.date.getTime() - b.date.getTime() ||
      minutes(a.schedule.time) - minutes(b.schedule.time),
  );
}
