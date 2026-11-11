import * as Keychain from 'react-native-keychain';

const SERVICE = 'ilink.auth';

export type StoredAuth = {
  accessToken: string;
  refreshToken: string;
  userId: number;
  familyId: number;
  role: 'GUARDIAN' | 'CO_GUARDIAN' | 'DELEGATE' | 'TEACHER' | 'CHILD';
};

export async function loadAuth(): Promise<StoredAuth | null> {
  const c = await Keychain.getGenericPassword({ service: SERVICE });
  if (!c) return null;
  try {
    return JSON.parse(c.password) as StoredAuth;
  } catch {
    return null;
  }
}

export async function saveAuth(auth: StoredAuth): Promise<void> {
  await Keychain.setGenericPassword('auth', JSON.stringify(auth), {
    service: SERVICE,
  });
}

export async function clearAuth(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
