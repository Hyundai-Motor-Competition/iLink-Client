import { api } from '../client';
import type { Schemas } from '../types';

// LINK-03 · LINK-04 · LINK-05 (보호자 모바일 쪽)
export const vehicleLinkApi = {
  /** P00-1: 스캔·입력 즉시 코드 확인. 연결은 만들지 않는다. */
  checkCode: (code: string) =>
    api.get<Schemas['LinkCodeInfoResponse']>(
      `/v1/vehicle-link-codes/by-code/${encodeURIComponent(code)}`,
      {
        auth: false,
      },
    ),

  /** P00-2: 동의 후 연결 승인. 응답 토큰이 보호자 로그인 토큰이 된다. */
  approve: (body: Schemas['ApproveLinkRequest'], idempotencyKey: string) =>
    api.post<Schemas['VehicleLinkResponse']>('/v1/vehicle-links', {
      body,
      idempotencyKey,
      auth: false,
    }),

  unlink: (vehicleId: number, idempotencyKey: string) =>
    api.delete<void>(`/v1/vehicle-links/${vehicleId}`, { idempotencyKey }),
};
