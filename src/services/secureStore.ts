import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const SERVICE = 'ilink.auth';
/** 키체인을 쓸 수 없는 경우(서명 없는 iOS 시뮬레이터 빌드)에만 쓰는 예비 저장소 */
const FALLBACK_KEY = 'ilink.auth.fallback';

export type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  userId: number;
  familyId: number;
  role: 'GUARDIAN' | 'CO_GUARDIAN' | 'DELEGATE' | 'TEACHER' | 'CHILD';
};

function parse(s: string | null | undefined): StoredAuth | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as StoredAuth;
  } catch {
    return null;
  }
}

export async function loadAuth(): Promise<StoredAuth | null> {
  const fromKeychain = await Keychain.getGenericPassword({ service: SERVICE })
    .then(c => (c ? parse(c.password) : null))
    .catch(() => null);
  if (fromKeychain) return fromKeychain;
  return parse(await AsyncStorage.getItem(FALLBACK_KEY).catch(() => null));
}

export async function saveAuth(auth: StoredAuth): Promise<void> {
  const value = JSON.stringify(auth);
  const ok = await Keychain.setGenericPassword('auth', value, { service: SERVICE })
    .then(r => !!r)
    .catch(() => false);
  if (ok) {
    await AsyncStorage.removeItem(FALLBACK_KEY).catch(() => {});
  } else {
    await AsyncStorage.setItem(FALLBACK_KEY, value);
  }
}

export async function clearAuth(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE }).catch(() => {});
  await AsyncStorage.removeItem(FALLBACK_KEY).catch(() => {});
}
