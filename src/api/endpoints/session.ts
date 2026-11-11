import { api } from '../client';
import type { Schemas, SessionView } from '../types';

// SES-01·03·05·06·07·09·10, CALL-01·03·04, SIG-03·04·05, NOTI-01~03, OUT-01~04
export const sessionApi = {
  active: () =>
    api.get<Schemas['ActiveSessionResponse'] | undefined>(
      '/v1/pickup-sessions/active',
    ),

  get: (sessionId: number) =>
    api.get<SessionView>(`/v1/pickup-sessions/${sessionId}`),

  events: (sessionId: number, afterSeq: number, limit = 100) =>
    api.get<Schemas['SessionEventPageResponse']>(
      `/v1/pickup-sessions/${sessionId}/events`,
      {
        query: { afterSeq, limit },
      },
    ),

  contacts: (sessionId: number) =>
    api.get<Schemas['ContactsResponse']>(
      `/v1/pickup-sessions/${sessionId}/contacts`,
    ),

  changeSpot: (
    sessionId: number,
    body: Schemas['ChangeSpotRequest'],
    key: string,
  ) =>
    api.post<SessionView>(`/v1/pickup-sessions/${sessionId}/spot-changes`, {
      body,
      idempotencyKey: key,
    }),

  hold: (sessionId: number, body: Schemas['HoldSessionRequest'], key: string) =>
    api.put<SessionView>(`/v1/pickup-sessions/${sessionId}/hold`, {
      body,
      idempotencyKey: key,
    }),

  releaseHold: (sessionId: number, stateVersion: number, key: string) =>
    api.delete<SessionView>(`/v1/pickup-sessions/${sessionId}/hold`, {
      query: { stateVersion },
      idempotencyKey: key,
    }),

  cancel: (
    sessionId: number,
    body: Schemas['CancelSessionRequest'],
    key: string,
  ) =>
    api.post<SessionView>(`/v1/pickup-sessions/${sessionId}/cancellation`, {
      body,
      idempotencyKey: key,
    }),
};

export const callApi = {
  hold: (sessionId: number, stateVersion: number, key: string) =>
    api.put<SessionView>(`/v1/pickup-sessions/${sessionId}/call-hold`, {
      body: { stateVersion },
      idempotencyKey: key,
    }),

  releaseHold: (sessionId: number, stateVersion: number, key: string) =>
    api.delete<SessionView>(`/v1/pickup-sessions/${sessionId}/call-hold`, {
      query: { stateVersion },
      idempotencyKey: key,
    }),

  revoke: (callId: number, body: Schemas['RevokeCallRequest'], key: string) =>
    api.post<SessionView>(`/v1/calls/${callId}/revocation`, {
      body,
      idempotencyKey: key,
    }),

  /** C03: 자녀가 합류 안내를 열람 */
  acknowledge: (callId: number, key: string) =>
    api.post<Schemas['AcknowledgeCallResponse']>(
      `/v1/calls/${callId}/acknowledgement`,
      { idempotencyKey: key },
    ),
};

export const childSignalApi = {
  extendPrepTime: (sessionId: number, minutes: 5 | 10 | 15, key: string) =>
    api.post<Schemas['PrepExtensionResponse']>(
      `/v1/pickup-sessions/${sessionId}/prep-time-extensions`,
      {
        body: { minutes },
        idempotencyKey: key,
      },
    ),

  requestHelp: (sessionId: number, type: string, key: string) =>
    api.post<Schemas['HelpRequestResponse']>(
      `/v1/pickup-sessions/${sessionId}/help-requests`,
      {
        body: { type },
        idempotencyKey: key,
      },
    ),

  sendLocation: (sessionId: number, body: Schemas['ChildLocationRequest']) =>
    api.post<void>(`/v1/pickup-sessions/${sessionId}/child-locations`, {
      body,
    }),
};

export const notificationApi = {
  list: (sessionId: number) =>
    api.get<Schemas['NotificationsResponse']>(
      `/v1/pickup-sessions/${sessionId}/notifications`,
    ),

  receipt: (notificationId: number, receivedAt: string) =>
    api.post<void>(`/v1/notifications/${notificationId}/delivery-receipt`, {
      body: { receivedAt },
    }),

  resend: (notificationId: number, key: string) =>
    api.post<Schemas['ResendResponse']>(
      `/v1/notifications/${notificationId}/resend`,
      { idempotencyKey: key },
    ),
};

export const outcomeApi = {
  get: (sessionId: number) =>
    api.get<Schemas['OutcomeResponse']>(
      `/v1/pickup-sessions/${sessionId}/outcome`,
    ),

  correct: (sessionId: number, body: Schemas['CorrectOutcomeRequest']) =>
    api.put<Schemas['OutcomeResponse']>(
      `/v1/pickup-sessions/${sessionId}/outcome/correction`,
      { body },
    ),

  history: (childId: number, month: string) =>
    api.get<Schemas['PickupHistoryResponse']>(
      `/v1/children/${childId}/pickup-history`,
      { query: { month } },
    ),

  updateDataSettings: (learningConsent: boolean) =>
    api.put<Schemas['DataSettingsResponse']>('/v1/guardians/me/data-settings', {
      body: { learningConsent },
    }),
};
