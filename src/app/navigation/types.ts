import type { Schemas } from '../../api/types';

export type AuthStackParams = {
  Welcome: undefined;
  LinkScan: { code?: string } | undefined; // P00-1
  LinkApprove: { code: string; info: Schemas['LinkCodeInfoResponse'] }; // P00-2
  InviteAccept: { token: string }; // C00
};

export type GuardianStackParams = {
  GuardianHome: undefined;
  FamilyProfile: undefined; // P01
  Schedule: { childId: number; scheduleId?: number }; // P02
  SpotApproval: { childId: number; academyId?: number }; // P03
  SetupReview: { childId: number }; // P06
  PickupProgress: { sessionId: number }; // P07
  PickupException: { sessionId: number }; // P08
  PickupOutcome: { sessionId: number }; // P09
};

export type ChildStackParams = {
  ChildSession: undefined; // C01~C05
};

/** 랜딩(부모/자녀 선택) 이후 Figma 와이어프레임 기준 화면. 아직 목업 데이터로 동작한다. */
export type DemoStackParams = {
  Landing: undefined;
  // 부모: 차량 연결·프로필
  PQrScan: undefined;
  PCarConfirm: undefined;
  PTerms: undefined;
  PGuardianProfile: undefined;
  PChildProfile: undefined;
  PFamilyDone: undefined;
  // 부모: 메인(홈·현황·기록·마이)
  PMain: { tab?: 'home' | 'status' | 'records' | 'my' } | undefined;
  // 부모: 픽업 일정 등록
  PScheduleIntro: undefined;
  PScheduleChild: undefined;
  PScheduleAcademy: undefined;
  PScheduleSpot: undefined;
  PScheduleTime: undefined;
  PScheduleDone: undefined;
  // 부모: 진행 중 픽업 · 결과
  PPickupLive: { id: string };
  POutcome: { recordId: string };
  // 자녀
  CInvite: undefined;
  CWaiting: undefined;
  CDeparted: undefined;
  CMeet: undefined;
  CHelp: undefined;
  CDone: undefined;
};
