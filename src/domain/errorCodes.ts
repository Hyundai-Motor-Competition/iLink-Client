// 기획서 「4. 이벤트·상태」 ERR 코드와 서버 error.code 매핑. 화면 문구는 Figma 확정 후 교체.
export const errorMessages: Record<string, string> = {
  LINK_CODE_EXPIRED: '만료된 코드예요',
  LINK_CODE_INVALID: '확인할 수 없는 코드예요',
  VEHICLE_ALREADY_LINKED: '이미 연결된 차량이에요',
  SPOT_VERSION_CONFLICT: '정보가 바뀌었어요. 최신 상태를 불러올게요',
  NO_LEGAL_SPOT: '안전하게 만날 장소가 없어요',
  NO_FEASIBLE_RECOVERY: '안전한 대체 장소가 없어요',
  UNAUTHORIZED: '다시 로그인해 주세요',
  NETWORK: '연결이 불안정해요',
  // 초대 (FAM-04~06). 멤버를 해제하면 안 쓴 초대도 폐기돼 410 (2026.11.14)
  INVITE_EXPIRED: '만료된 초대 링크예요. 보호자에게 새 링크를 받아 주세요',
  INVITE_ALREADY_USED: '이미 수락한 초대예요',
};

export function messageFor(code: string, fallback?: string): string {
  return errorMessages[code] ?? fallback ?? '잠시 후 다시 시도해 주세요';
}

/**
 * 화면별 404 문구. 서버는 해제된 멤버 · 자녀에 대해 NOT_FOUND(404)를 준다 (2026.11.14).
 * - invite: 초대 조회 · 수락 → 없는 초대이거나 해제된 멤버
 * - member: 초대 발급 · 일정 등록/수정/목록 → 가족에서 해제된 자녀
 */
export function notFoundMessage(context: 'invite' | 'member'): string {
  return context === 'invite'
    ? '사용할 수 없는 초대예요. 보호자에게 새 링크를 받아 주세요'
    : '가족에서 해제된 자녀예요. 가족 목록을 확인해 주세요';
}
