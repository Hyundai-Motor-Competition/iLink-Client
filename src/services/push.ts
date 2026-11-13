// OS 푸시(OS-P01, OS-C01~03) — FCM (@react-native-firebase/messaging).
// 수신 시 반드시 최신 세션을 조회하고 domain/session.isStalePush로 만료 여부를 확인한 뒤 화면을 연다.
// Android만 설정되어 있다(android/app/google-services.json). iOS는 GoogleService-Info.plist를 받은 뒤 켠다.
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

export type PushPayload = {
  type: string;
  sessionId: number;
  notificationId?: number;
  stateVersion?: number;
  spotVersion?: number;
};

export interface PushService {
  /** 알림 권한을 묻고 FCM 토큰을 받는다. 권한 거부 · 미지원이면 null */
  getToken(): Promise<string | null>;
  onTokenRefresh(cb: (token: string) => void): () => void;
  onMessage(cb: (payload: PushPayload) => void): () => void;
}

/** 서버가 data에 넣어 주는 값(문자열)을 숫자로 바꾼다. sessionId가 없으면 화면과 무관한 푸시로 본다 */
export function toPayload(msg: {
  data?: Record<string, unknown>;
}): PushPayload | null {
  const d = msg.data ?? {};
  const num = (v: unknown) =>
    v === undefined || v === null || v === '' ? undefined : Number(v);
  const sessionId = num(d.sessionId);
  if (sessionId === undefined || Number.isNaN(sessionId)) return null;
  return {
    type: String(d.type ?? ''),
    sessionId,
    notificationId: num(d.notificationId),
    stateVersion: num(d.stateVersion),
    spotVersion: num(d.spotVersion),
  };
}

const supported = Platform.OS === 'android';

async function askPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (Platform.Version < 33) return true;
  const r = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  return r === PermissionsAndroid.RESULTS.GRANTED;
}

export const push: PushService = {
  async getToken() {
    if (!supported) return null;
    // 권한이 없어도 토큰은 받을 수 있지만, 알림이 보이지 않으므로 먼저 묻는다
    await askPermission();
    try {
      return await getToken(getMessaging(getApp()));
    } catch {
      return null;
    }
  },
  onTokenRefresh(cb) {
    if (!supported) return () => {};
    return onTokenRefresh(getMessaging(getApp()), cb);
  },
  onMessage(cb) {
    if (!supported) return () => {};
    return onMessage(getMessaging(getApp()), msg => {
      const p = toPayload(msg);
      if (p) cb(p);
    });
  },
};

/** 앱이 꺼져 있거나 뒤에 있을 때 온 푸시. 화면은 사용자가 알림을 누를 때 연다 (index.js에서 한 번 등록) */
export function registerBackgroundHandler() {
  if (!supported) return;
  setBackgroundMessageHandler(getMessaging(getApp()), async () => {});
}
