import {
  scheduleLabel,
  useScheduleDraft,
} from '../src/features/parent/scheduleDraft';

describe('픽업 일정 요약', () => {
  it('고른 요일을 그대로 보여준다', () => {
    const d = [false, true, false, true, false, false, false];
    expect(scheduleLabel(d, true, '18:10')).toBe('매주 화목 18:10');
    expect(scheduleLabel(d, false, '18:10')).toBe('화목 18:10');
  });

  it('모든 요일이면 매일로 보여준다', () => {
    expect(scheduleLabel(Array(7).fill(true), true, '18:10')).toBe(
      '매일 18:10',
    );
  });

  it('요일을 누르면 저장된 값이 바뀐다', () => {
    const s = useScheduleDraft.getState();
    s.reset();
    s.toggleDay(0); // 월 끄기
    s.toggleDay(5); // 토 켜기
    const { days, weekly, time } = useScheduleDraft.getState();
    expect(scheduleLabel(days, weekly, time)).toBe('매주 수금토 18:10');
  });
});
