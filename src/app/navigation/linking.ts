import type { LinkingOptions } from '@react-navigation/native';
import type { AuthStackParams, DemoStackParams } from './types';

/**
 * 차량 QR: pickup://link?code={code} (LINK-01 qrPayload)
 * 초대 링크: 서버 inviteUrl 형식 확정 후 prefixes·path 수정 필요
 */
export const linking: LinkingOptions<DemoStackParams & AuthStackParams> = {
  prefixes: ['pickup://'],
  config: {
    screens: {
      // 차량 QR을 휴대폰 카메라로 찍으면 열리는 링크 → QR 촬영 화면이 코드를 받아 바로 확인
      PQrScan: 'link',
      InviteAccept: 'invite/:token',
    },
  },
};
