import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { newIdempotencyKey } from '../../api/client';
import { familyApi } from '../../api/endpoints/family';
import { callApi, sessionApi } from '../../api/endpoints/session';
import { scheduleApi, setupApi, spotApi } from '../../api/endpoints/setup';
import { vehicleLinkApi } from '../../api/endpoints/vehicleLink';
import { ApiError } from '../../api/errors';
import type { Schemas, SessionView } from '../../api/types';
import { env } from '../../config/env';
import { isGuardianRole, useAuthStore } from '../../stores/authStore';

/*
 * 부모 화면 ↔ 서버(Swagger) 연결.
 * 로그인(차량 연결 LINK-04) 전에는 화면들이 목업(pickupStore)으로 동작하고,
 * 보호자 토큰이 생기면 아래 훅 · 함수로 서버 데이터를 읽고 쓴다.
 */

export const WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

/** 보호자 토큰이 있는지 (서버 모드) */
export function useServerMode() {
  const auth = useAuthStore(s => s.auth);
  return !!auth && isGuardianRole(auth.role);
}

export const qk = {
  family: ['family'] as const,
  schedules: (childId: number) => ['schedules', childId] as const,
  spots: (academyId?: number) => ['spots', academyId ?? 'all'] as const,
  active: ['session', 'active'] as const,
  session: (id: number) => ['session', id] as const,
  events: (id: number) => ['session', id, 'events'] as const,
};

/* ---------- 연결 (LINK-03 · LINK-04) ---------- */

export type LinkInfo = Schemas['LinkCodeInfoResponse'] & { code: string };

export async function checkLinkCode(code: string): Promise<LinkInfo> {
  const info = await vehicleLinkApi.checkCode(code.trim());
  return { ...info, code: code.trim() };
}

/** 약관 화면 체크 → 서버 동의 항목 */
export function consentsFrom(locationOk: boolean, pushOk: boolean) {
  return [
    { type: 'TERMS' as const, agreed: true },
    { type: 'PRIVACY' as const, agreed: true },
    { type: 'LOCATION' as const, agreed: locationOk },
    { type: 'PUSH' as const, agreed: pushOk },
  ];
}

export async function approveLink(
  link: LinkInfo,
  name: string,
  consents: ReturnType<typeof consentsFrom>,
  key: string,
) {
  const res = await vehicleLinkApi.approve(
    {
      code: link.code,
      mode: link.status === 'RELINK' ? 'RELINK' : 'NEW',
      name: name.trim() || undefined,
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      consents,
    },
    key,
  );
  await useAuthStore.getState().signIn({
    accessToken: res.accessToken!,
    refreshToken: res.refreshToken!,
    userId: res.userId!,
    familyId: res.familyId!,
    role: 'GUARDIAN',
  });
  return res;
}

/**
 * 에뮬레이터에는 카메라가 없어 차량 QR을 읽을 수 없다.
 * 개발 빌드에서 'QR 촬영'을 누르면 시험용 차량 기기(AUTH-02)로 연결 코드(LINK-01)를 받아 스캔한 것처럼 쓴다.
 * 실제 차량과 연결하려면 '인증 번호로 등록할래요'에 차량 화면의 번호를 넣는다.
 */
export async function issueTestLinkCode(): Promise<string> {
  const vin = testVin();
  const dev = await rawPost<{ deviceToken?: string }>('/v1/vehicle-devices', {
    model: 'PLEOS_CONNECT_TEST',
    vin,
  });
  const code = await rawPost<{ code?: string }>(
    '/v1/vehicle-link-codes',
    undefined,
    dev.deviceToken,
  );
  if (!code.code) throw new ApiError(0, null);
  return code.code;
}

/** VIN: 17자, I·O·Q 제외 */
function testVin() {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let s = 'KMH';
  while (s.length < 17) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function rawPost<T>(path: string, body?: unknown, token?: string) {
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Idempotency-Key': newIdempotencyKey(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new ApiError(res.status, json);
  return json as T;
}

/* ---------- 가족 (FAM) ---------- */

export function useFamily() {
  const on = useServerMode();
  return useQuery({
    queryKey: qk.family,
    queryFn: familyApi.me,
    enabled: on,
  });
}

export type ChildLite = { id: number; name: string; status?: string };

export function childrenOf(f?: Schemas['FamilyResponse']): ChildLite[] {
  return (f?.members ?? [])
    .filter(m => m.role === 'CHILD' && m.userId !== undefined)
    .map(m => ({
      id: m.userId!,
      name: m.name ?? '자녀',
      status: m.deviceStatus,
    }));
}

/** 보호자 호칭 저장 (FAM-03) */
export async function saveGuardianName(userId: number, name: string) {
  if (!name.trim()) return;
  await familyApi.updateMember(userId, { name: name.trim() });
}

/** 자녀 등록 (FAM-02) → userId */
export async function registerChild(name: string, key: string) {
  const r = await familyApi.registerMember(
    { role: 'CHILD', name: name.trim() },
    key,
  );
  return r.userId!;
}

export async function issueInvite(childId: number, key: string) {
  const r = await familyApi.issueInvite(childId, { replaceDevice: false }, key);
  return r.inviteUrl ?? '';
}

/* ---------- 일정 · 장소 (SET · SPOT) ---------- */

export type AcademyHit = {
  externalPlaceId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
};

export async function searchAcademies(query: string): Promise<AcademyHit[]> {
  const r = await scheduleApi.searchAcademies(query);
  return (r.items ?? [])
    .filter(i => i.name && i.location)
    .map(i => ({
      externalPlaceId: i.externalPlaceId ?? `${i.name}-${i.address}`,
      name: i.name!,
      address: i.address ?? '',
      location: {
        lat: i.location!.lat ?? 0,
        lng: i.location!.lng ?? 0,
      },
    }));
}

export type SpotDraft = {
  name: string;
  /** 학원 기준 이동량(m). 동(+x) · 북(+y) */
  offset: { east: number; north: number };
  isDefault?: boolean;
};

const M_PER_DEG_LAT = 111_000;

export function moveBy(
  p: { lat: number; lng: number },
  east: number,
  north: number,
) {
  return {
    lat: p.lat + north / M_PER_DEG_LAT,
    lng: p.lng + east / (M_PER_DEG_LAT * Math.cos((p.lat * Math.PI) / 180)),
  };
}

export type ScheduleInput = {
  childId: number;
  academy: AcademyHit;
  /** 월~일 */
  days: boolean[];
  /** HH:mm */
  time: string;
  spots: SpotDraft[];
};

/**
 * 일정 등록: SET-02 일정 → SPOT-02 장소(기본 + 대안) → SET-03 다시 저장(READY) → SET-07/08 설정 완료.
 * 서버는 학원 입구 좌표가 있어야 일정을 READY로 만든다.
 */
export async function registerSchedule(input: ScheduleInput) {
  const academy = {
    externalPlaceId: input.academy.externalPlaceId,
    name: input.academy.name,
    address: input.academy.address,
    location: input.academy.location,
    entrance: moveBy(input.academy.location, 0, 10),
  };
  const body: Schemas['ScheduleRequest'] = {
    academy,
    weekdays: WEEK.filter((_, i) => input.days[i]),
    classEndTime: input.time,
    // 수업 끝나는 시각에 맞춰 픽업한다 (기획: 수업 끝나는 시간만 받는다)
    targetPickup: 0,
  };
  const sc = await scheduleApi.create(input.childId, body, newIdempotencyKey());
  const academyId = sc.academyId!;
  for (const sp of input.spots) {
    const stop = moveBy(academy.location, sp.offset.east, sp.offset.north);
    await spotApi.add(
      {
        academyId,
        name: sp.name,
        stopPoint: stop,
        meetingPoint: moveBy(stop, 0, 5),
        isDefault: sp.isDefault,
      },
      newIdempotencyKey(),
    );
  }
  if (sc.scheduleId) await scheduleApi.update(sc.scheduleId, body);
  try {
    // 자녀가 동의한 위치 공유(C00)를 픽업 중 지도에 쓰도록 켠다 (SET-11, 기본 꺼짐)
    await setupApi.childLocation(true).catch(() => {});
    const sum = await setupApi.summary(input.childId);
    await setupApi.complete(
      input.childId,
      sum.settingsVersion ?? 1,
      newIdempotencyKey(),
    );
  } catch {
    // 자녀 기기 연결 전이면 설정 완료가 막힌다(CHILD_DEVICE). 일정 · 장소는 저장됐다
  }
  return sc;
}

export function useSchedules(childIds: number[]) {
  const on = useServerMode();
  return useQuery({
    queryKey: ['schedules', ...childIds],
    enabled: on && childIds.length > 0,
    queryFn: async () => {
      // 해제된 자녀는 404 (2026.11.14). 그 자녀만 빈 목록으로 두고 나머지는 보여 준다
      const lists = await Promise.all(
        childIds.map(async id => {
          try {
            return {
              childId: id,
              items: (await scheduleApi.list(id)).items ?? [],
            };
          } catch (e) {
            if (e instanceof ApiError && e.status === 404)
              return { childId: id, items: [] };
            throw e;
          }
        }),
      );
      return lists;
    },
  });
}

export function useSpots() {
  const on = useServerMode();
  return useQuery({
    queryKey: qk.spots(),
    queryFn: () => spotApi.list(),
    enabled: on,
  });
}

/* ---------- 진행 중 픽업 (SES · CALL) ---------- */

/** SES-01 → SES-03 5초 폴링. 끝나면 멈춘다 */
export function useActiveSession() {
  const on = useServerMode();
  const active = useQuery({
    queryKey: qk.active,
    queryFn: async () => (await sessionApi.active()) ?? null,
    enabled: on,
    refetchInterval: env.sessionPollMs,
  });
  const id = active.data?.sessionId;
  const view = useQuery({
    queryKey: qk.session(id ?? 0),
    queryFn: () => sessionApi.get(id!),
    enabled: on && !!id,
    refetchInterval: q => (isEnded(q.state.data) ? false : env.sessionPollMs),
  });
  const events = useQuery({
    queryKey: qk.events(id ?? 0),
    queryFn: async () => (await sessionApi.events(id!, 0)).items ?? [],
    enabled: on && !!id,
    refetchInterval: env.sessionPollMs,
  });
  return {
    id,
    view: view.data,
    events: events.data ?? [],
    loading: active.isLoading,
  };
}

export const isEnded = (v?: SessionView) =>
  v?.status?.session === 'COMPLETED' || v?.status?.session === 'CANCELLED';

export function useSessionActions(view?: SessionView) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['session'] });
  const id = view?.sessionId;
  const ver = view?.stateVersion ?? 0;
  return {
    /** 대체 장소 (SES-05) */
    async changeSpot(spotId: number) {
      if (!id) return;
      await sessionApi.changeSpot(
        id,
        {
          spotId,
          stateVersion: ver,
          spotVersion: view?.spot?.spotVersion ?? 0,
        },
        newIdempotencyKey(),
      );
      await refresh();
    },
    /** 호출 철회 (CALL-03) */
    async revoke() {
      const callId = view?.call?.callId;
      if (!callId) return;
      await callApi.revoke(
        callId,
        { stateVersion: ver, reason: 'GUARDIAN_REVOKED' },
        newIdempotencyKey(),
      );
      await refresh();
    },
    /** 다음 알림 보류 (CALL-01) · 해제 */
    async toggleHold() {
      if (!id) return;
      if (view?.call?.held) {
        await callApi.releaseHold(id, ver, newIdempotencyKey());
      } else {
        await callApi.hold(id, ver, newIdempotencyKey());
      }
      await refresh();
    },
    async contacts() {
      if (!id) return [];
      return (await sessionApi.contacts(id)).items ?? [];
    },
  };
}

export const hhmm = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
};
