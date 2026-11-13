import { useQuery } from '@tanstack/react-query';
import { spotApi } from '../../api/endpoints/setup';
import type { Schemas } from '../../api/types';

export type SpotCandidate = {
  key: string;
  name: string;
  /** 예: '길가 정차 · 걸어서 2분 · 운전 5분' */
  meta: string;
  /** 예: ['단속 카메라 근처'] */
  cautions: string[];
  location?: { lat: number; lng: number };
};

const KIND: Record<string, string> = {
  CURB_STOP: '길가 정차',
  PUBLIC_PARKING: '공영주차장',
  PARKING: '주차장',
};

const CAUTION: Record<string, string | null> = {
  ENFORCEMENT_CAMERA_NEAR: '단속 카메라 근처',
  // 서버 데이터 기준 안내라 사용자에게는 보여 주지 않는다
  LINE_DATA_2021: null,
};

const minutes = (s?: number) =>
  s === undefined ? undefined : Math.max(1, Math.round(s / 60));

export function toCandidate(
  item: Schemas['RecommendedSpotResponse'],
): SpotCandidate {
  const walk = minutes(item.walkSeconds);
  const drive = minutes(item.driveSeconds);
  return {
    key: `${item.rank}-${item.name}`,
    name: item.name ?? '이름 없는 장소',
    meta: [
      item.kind ? KIND[item.kind] ?? item.kind : null,
      walk !== undefined ? `걸어서 ${walk}분` : null,
      drive !== undefined ? `운전 ${drive}분` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    cautions: (item.cautions ?? [])
      .map(c => (c in CAUTION ? CAUTION[c] : c))
      .filter((c): c is string => !!c),
    location: item.location as SpotCandidate['location'],
  };
}

/**
 * SPOT-04 추천 후보. 학원 id와 출발 위치가 있어야 부른다.
 * 출발 위치를 모르면 학원 위치를 넣는다 (걷는 거리 순 비교용, 운전 시간은 짧게 나온다).
 */
export function useSpotRecommendations(
  academyId?: number,
  origin?: { lat: number; lng: number },
) {
  return useQuery({
    queryKey: ['spot-recommendations', academyId, origin?.lat, origin?.lng],
    enabled: academyId !== undefined && origin !== undefined,
    queryFn: async () => {
      const r = await spotApi.recommend({
        academyId: academyId!,
        origin: origin!,
      });
      return {
        supported: r.supported ?? false,
        items: (r.items ?? []).map(toCandidate),
      };
    },
    staleTime: 5 * 60_000,
  });
}
