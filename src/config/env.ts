// 빌드 환경별 설정. 운영 값은 추후 react-native-config 등으로 분리.
export const env = {
  apiBaseUrl: 'https://ilink-api-dev.chisanw.com',
  requestTimeoutMs: 10_000,
  sessionPollMs: 5_000,
} as const;
