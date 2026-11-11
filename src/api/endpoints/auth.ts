import { api } from '../client';
import type { Schemas } from '../types';

// AUTH-01 · AUTH-03
export const authApi = {
  refresh: (refreshToken: string) =>
    api.post<Schemas['TokenResponse']>('/v1/auth/refresh', {
      body: { refreshToken },
      auth: false,
    }),

  updatePushToken: (body: Schemas['UpdatePushTokenRequest']) =>
    api.put<void>('/v1/devices/me/push-token', { body }),
};
