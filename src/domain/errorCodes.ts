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
};

export function messageFor(code: string, fallback?: string): string {
  return errorMessages[code] ?? fallback ?? '잠시 후 다시 시도해 주세요';
}
