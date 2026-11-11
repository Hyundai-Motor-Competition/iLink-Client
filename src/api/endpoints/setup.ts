import { api } from '../client';
import type { Schemas } from '../types';

// SET-01~08 · SPOT-01~03 (P02 · P03 · P06)
export const scheduleApi = {
  searchAcademies: (query: string) =>
    api.get<Schemas['AcademySearchResponse']>('/v1/places/academies', {
      query: { query },
    }),

  list: (childId: number) =>
    api.get<Schemas['ScheduleListResponse']>(
      `/v1/children/${childId}/schedules`,
    ),

  create: (
    childId: number,
    body: Schemas['ScheduleRequest'],
    idempotencyKey: string,
  ) =>
    api.post<Schemas['ScheduleResponse']>(`/v1/children/${childId}/schedules`, {
      body,
      idempotencyKey,
    }),

  update: (scheduleId: number, body: Schemas['ScheduleRequest']) =>
    api.put<Schemas['ScheduleResponse']>(`/v1/schedules/${scheduleId}`, {
      body,
    }),
};

export const spotApi = {
  list: (q?: { academyId?: number; near?: string; radiusM?: number }) =>
    api.get<Schemas['PickupSpotsResponse']>('/v1/families/me/pickup-spots', {
      query: q,
    }),

  add: (body: Schemas['AddSpotRequest'], idempotencyKey: string) =>
    api.post<Schemas['AddSpotResponse']>('/v1/families/me/pickup-spots', {
      body,
      idempotencyKey,
    }),

  update: (spotId: number, body: Schemas['UpdateSpotRequest']) =>
    api.patch<Schemas['SpotResponse']>(`/v1/pickup-spots/${spotId}`, { body }),

  remove: (spotId: number, idempotencyKey: string) =>
    api.delete<void>(`/v1/pickup-spots/${spotId}`, { idempotencyKey }),
};

export const setupApi = {
  summary: (childId: number) =>
    api.get<Schemas['SetupSummaryResponse']>(
      `/v1/children/${childId}/setup-summary`,
    ),

  complete: (
    childId: number,
    settingsVersion: number,
    idempotencyKey: string,
  ) =>
    api.post<Schemas['SetupCompletionResponse']>(
      `/v1/children/${childId}/setup-completion`,
      {
        body: { settingsVersion },
        idempotencyKey,
      },
    ),
};
