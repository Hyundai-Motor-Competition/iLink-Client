// OS 푸시(OS-P01, OS-C01~03). FCM 연동은 google-services.json 확보 후 @react-native-firebase/messaging으로 구현.
// 수신 시 반드시 최신 세션을 조회하고 domain/session.isStalePush로 만료 여부를 확인한 뒤 화면을 연다.
export type PushPayload = {
  type: string;
  sessionId: number;
  notificationId?: number;
  stateVersion?: number;
  spotVersion?: number;
};

export interface PushService {
  getToken(): Promise<string | null>;
  onTokenRefresh(cb: (token: string) => void): () => void;
  onMessage(cb: (payload: PushPayload) => void): () => void;
}
