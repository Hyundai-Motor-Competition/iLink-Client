import { api } from '../client';
import type { Schemas } from '../types';

// FAM-05 · FAM-06 (C00 자녀 · 공동 보호자 초대 수락, 인증 없음)
export const inviteApi = {
  info: (token: string) =>
    api.get<Schemas['InviteInfoResponse']>(
      `/v1/invites/${encodeURIComponent(token)}`,
      { auth: false },
    ),

  accept: (
    token: string,
    body: Schemas['AcceptInviteRequest'],
    idempotencyKey: string,
  ) =>
    api.post<Schemas['AcceptInviteResponse']>(
      `/v1/invites/${encodeURIComponent(token)}/acceptance`,
      {
        body,
        idempotencyKey,
        auth: false,
      },
    ),
};
