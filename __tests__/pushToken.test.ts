import { cleanPushToken } from '../src/services/usePushRegistration';

jest.mock('../src/api/endpoints/auth', () => ({ authApi: {} }));
jest.mock('../src/stores/authStore', () => ({ useAuthStore: () => null }));
jest.mock('../src/services/push', () => ({ push: {} }));

const TOKEN =
  'ddEMtvROT1ug0WdNdij2CT:APA91bFzdRh9qvO7r9Is75Tf8KQBczOoDgLzaORxXnJSVed1lgu44kJs9IK1L_h1Iqdg8ZxPoNpWF4tTtqC5z0iNa43mNeUlKoSK8Q_ZeuJ3Y678rAgW6PA';

test('토큰은 그대로 보낸다', () => {
  expect(cleanPushToken(TOKEN)).toBe(TOKEN);
  expect(cleanPushToken(`  '${TOKEN}'\n`)).toBe(TOKEN);
});

test('로그 한 줄이 들어오면 토큰만 꺼낸다', () => {
  const line = `11-14 12:54:22.589  6325  6378 I ReactNativeJS: '[push] FCM token', '${TOKEN}'`;
  expect(cleanPushToken(line)).toBe(TOKEN);
});

test('토큰이 아니면 보내지 않는다', () => {
  expect(cleanPushToken('')).toBeNull();
  expect(cleanPushToken(null)).toBeNull();
  expect(cleanPushToken('hello world')).toBeNull();
});
