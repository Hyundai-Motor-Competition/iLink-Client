import { api } from '../client';
import type { Schemas } from '../types';

// SET-12 (자녀 전용)
export const childApi = {
  /** 지금 이후 가장 가까운 픽업. 남은 일정이 없으면 null */
  nextPickup: () =>
    api.get<Schemas['NextPickupResponse'] | null | undefined>(
      '/v1/children/me/next-pickup',
    ),
};
