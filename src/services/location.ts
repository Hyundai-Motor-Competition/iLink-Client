// 자녀 위치 공유(SIG-04). 세션 ACTIVE 동안만 보내고 COMPLETED·CANCELLED에서 즉시 중단한다.
export interface ChildLocationService {
  start(sessionId: number): void;
  stop(): void;
}
