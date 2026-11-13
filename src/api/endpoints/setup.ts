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

  /**
   * SPOT-04 픽업 장소 추천: 학원 근처 공영주차장 · 길가 정차 후보를 순위대로.
   * origin은 출발 위치 '위도,경도'. 지원 지역 밖이면 supported = false, items = [].
   * 결과에는 spotId가 없다. 보호자가 고르면 SPOT-02로 저장해야 차량이 길안내할 수 있다.
   */
  recommend: (q: {
    academyId: number;
    origin: { lat: number; lng: number };
    arriveAt?: string;
  }) =>
    api.get<Schemas['SpotRecommendationsResponse']>(
      '/v1/pickup-spot-recommendations',
      {
        query: {
          academyId: q.academyId,
          origin: `${q.origin.lat},${q.origin.lng}`,
          arriveAt: q.arriveAt,
        },
      },
    ),
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
