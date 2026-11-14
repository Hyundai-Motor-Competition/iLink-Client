import Geolocation from '@react-native-community/geolocation';
import { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { childSignalApi } from '../../api/endpoints/session';
import type { LatLng } from '../../shared/ui/TileMap';

const SEND_EVERY_MS = 10_000;

/** 위치 권한 (C00 '위치 공유' 동의 때 묻는다) */
export async function askLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const r = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return r === PermissionsAndroid.RESULTS.GRANTED;
}

/**
 * 합류 안내(C03) 중 내 위치를 지도에 쓰고, 10초마다 서버로 보낸다(SIG-04).
 * 서버는 합류 안내를 받은 뒤 · 보호자가 위치 사용을 켠 경우(SET-11)에만 받는다. 실패해도 화면은 그대로 쓴다.
 */
export function useChildLocation(
  sessionId: number | undefined,
  active: boolean,
): LatLng | null {
  const [pos, setPos] = useState<(LatLng & { acc?: number }) | null>(null);

  useEffect(() => {
    if (!active) return;
    let id: number | null = null;
    let cancelled = false;
    askLocationPermission().then(ok => {
      if (!ok || cancelled) return;
      id = Geolocation.watchPosition(
        p =>
          setPos({
            lat: p.coords.latitude,
            lng: p.coords.longitude,
            acc: p.coords.accuracy ?? undefined,
          }),
        () => {},
        { enableHighAccuracy: true, distanceFilter: 3, interval: 5000 },
      );
    });
    return () => {
      cancelled = true;
      if (id !== null) Geolocation.clearWatch(id);
    };
  }, [active]);

  // 위치가 그대로여도(실내 · 에뮬레이터) 10초마다 보낸다
  const latest = useRef(pos);
  latest.current = pos;
  useEffect(() => {
    if (!active || sessionId === undefined) return;
    const send = () => {
      const p = latest.current;
      if (!p) return;
      childSignalApi
        .sendLocation(sessionId, {
          at: new Date().toISOString(),
          lat: p.lat,
          lng: p.lng,
          accuracyM: p.acc ? Math.round(p.acc) : undefined,
        } as never)
        .catch(() => {});
    };
    const first = setTimeout(send, 1500);
    const t = setInterval(send, SEND_EVERY_MS);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [active, sessionId]);

  return pos ? { lat: pos.lat, lng: pos.lng } : null;
}
