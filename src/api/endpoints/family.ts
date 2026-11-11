import { api } from '../client';
import type { Schemas } from '../types';

// FAM-01~07 · SET-06
export const familyApi = {
  me: () => api.get<Schemas['FamilyResponse']>('/v1/families/me'),

  registerMember: (
    body: Schemas['RegisterMemberRequest'],
    idempotencyKey: string,
  ) =>
    api.post<Schemas['RegisterMemberResponse']>('/v1/families/me/members', {
      body,
      idempotencyKey,
    }),

  updateMember: (userId: number, body: Schemas['UpdateMemberRequest']) =>
    api.patch<Schemas['MemberResponse']>(`/v1/families/me/members/${userId}`, {
      body,
    }),

  removeMember: (userId: number, idempotencyKey: string) =>
    api.delete<void>(`/v1/families/me/members/${userId}`, { idempotencyKey }),

  issueInvite: (
    userId: number,
    body: Schemas['IssueInviteRequest'],
    idempotencyKey: string,
  ) =>
    api.post<Schemas['InviteResponse']>(
      `/v1/families/me/members/${userId}/invites`,
      { body, idempotencyKey },
    ),

  changeCallMode: (
    joinCallMode: Schemas['ChangeCallModeRequest']['joinCallMode'],
  ) =>
    api.put<Schemas['CallModeResponse']>('/v1/families/me/call-mode', {
      body: { joinCallMode },
    }),
};
