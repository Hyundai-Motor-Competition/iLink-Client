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
  // 부모: 가족 프로필 등록 (차량 연결 → 약관 → 보호자 → 자녀 → 초대장)
  PFamilyIntro: undefined;
  /** 인증 번호(차량 화면의 연결 코드) 입력 */
  PCodeEntry: undefined;
  /** 차량 QR을 읽으면(pickup://link?code=) code가 들어온다 */
  PQrScan: { code?: string } | undefined;
  PCarConfirm: undefined;
  PTerms: undefined;
  PGuardianProfile: undefined;
  PGuardianPhoto: undefined;
  PChildProfile: undefined;
  PChildPhoto: undefined;
  PInviteShare: undefined;
  PInviteSent: undefined;
  // 부모: 메인(홈·현황·기록·마이)
  PMain: { tab?: 'home' | 'status' | 'records' | 'my' } | undefined;
  // 부모: 픽업 일정 등록
  /** 픽업 일정 등록 1 · 자녀 선택 */
  PScheduleChild: undefined;
  /** 픽업 일정 등록 2 · 시작. 초대장 전송 직후면 자녀 선택을 건너뛰고 바로 온다 */
  PScheduleIntro: { fromInvite?: boolean } | undefined;
  PScheduleAcademy: undefined;
  PScheduleConfirm: undefined;
  PScheduleSpot: undefined;
  PScheduleTime: undefined;
  PScheduleReview: undefined;
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
