import {
  parseYmd,
  seed,
  upcomingPickups,
  usePickupStore,
  weekdayIndex,
  ymd,
} from '../src/features/parent/pickupStore';

// 2026-11-10 화요일 18:20
const NOW = new Date(2026, 10, 10, 18, 20);
const days = (...on: number[]) =>
  Array.from({ length: 7 }, (_, i) => on.includes(i));
const base = {
  childId: 1,
  academy: '대치동수학임팩트 학원',
  spot: '정문',
  altSpot: '횡단보도',
  weekly: true,
  time: '18:10',
};
const st = () => usePickupStore.getState();

beforeEach(() => {
  st().resetDemo();
  usePickupStore.setState({ schedules: [], pickups: [], records: [] });
});

describe('일정 등록', () => {
  it('오늘 요일이 포함되면 오늘 픽업이 예정으로 생긴다', () => {
    const sc = st().addSchedule(
      { ...base, days: days(weekdayIndex(NOW)) },
      NOW,
    );
    expect(st().schedules).toHaveLength(1);
    expect(st().pickups).toEqual([
      expect.objectContaining({
        scheduleId: sc.id,
        date: ymd(NOW),
        status: 'scheduled',
      }),
    ]);
  });

  it('오늘 요일이 아니면 일정만 등록되고 예정 목록에 다음 날짜로 보인다', () => {
    st().addSchedule({ ...base, days: days(3) }, NOW); // 목
    expect(st().pickups).toHaveLength(0);
    const up = upcomingPickups(st().schedules, st().pickups, NOW);
    expect(up[0].date.getDate()).toBe(12);
    expect(up[0].isToday).toBe(false);
  });

  it('일정을 지우면 시작 전 픽업도 사라진다', () => {
    const sc = st().addSchedule(
      { ...base, days: days(weekdayIndex(NOW)) },
      NOW,
    );
    st().removeSchedule(sc.id);
    expect(st().schedules).toHaveLength(0);
    expect(st().pickups).toHaveLength(0);
  });
});

describe('예시 데이터', () => {
  it('지난 기록이 일정 요일대로 쌓인다', () => {
    const data = seed(NOW);
    expect(data.records.length).toBeGreaterThan(20);
    // 김현우는 월수금에만 기록이 있다
    const wooDays = new Set(
      data.records
        .filter(r => r.childId === 1)
        .map(r => weekdayIndex(parseYmd(r.date))),
    );
    expect([...wooDays].every(d => [0, 2, 4].includes(d))).toBe(true);
  });
});

describe('진행 중 픽업', () => {
  const startOne = () => {
    st().addSchedule({ ...base, days: days(weekdayIndex(NOW)) }, NOW);
    const id = st().pickups[0].id;
    st().startPickup(id);
    return id;
  };

  it('호출을 철회하면 상태가 바뀌고 기록이 남는다', () => {
    const id = startOne();
    st().setStage(id, 2, '횡단보도');
    st().cancelPickup(id, NOW);
    const p = st().pickups[0];
    expect(p.status).toBe('cancelled');
    expect(st().records).toEqual([
      expect.objectContaining({
        id: p.recordId,
        status: 'cancelled',
        place: '횡단보도',
      }),
    ]);
    // 예정 목록에는 오늘 것이 빠진다
    const up = upcomingPickups(st().schedules, st().pickups, NOW);
    expect(up.some(u => u.isToday)).toBe(false);
  });

  it('다시 호출하면 예정으로 돌아간다', () => {
    const id = startOne();
    st().cancelPickup(id, NOW);
    st().recallPickup(id);
    expect(st().pickups[0].status).toBe('scheduled');
  });

  it('탑승을 확인하면 완료 기록이 한 번만 생긴다', () => {
    const id = startOne();
    const r1 = st().completePickup(id, NOW);
    const r2 = st().completePickup(id, NOW);
    expect(r1).toBe(r2);
    expect(st().records).toHaveLength(1);
    expect(st().records[0]).toMatchObject({
      status: 'done',
      expected: '18:10',
      actual: '18:19',
      boardedAt: '18:20',
    });
  });
});
