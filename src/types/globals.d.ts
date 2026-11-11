// react-native-get-random-values가 채워 주는 전역 crypto
declare const crypto: {
  getRandomValues<T extends ArrayBufferView | null>(array: T): T;
};
