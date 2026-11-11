import { ScreenScaffold } from '../../shared/ui/ScreenScaffold';

export function ScheduleScreen() {
  return (
    <ScreenScaffold
      screenId="P02"
      title="학원·픽업 일정"
      note="학원 검색, 반복 요일, 수업 종료시각(필수), 목표 픽업시각(선택) (SET-01~04)"
    />
  );
}
