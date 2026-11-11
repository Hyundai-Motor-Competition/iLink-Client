import type { LinkingOptions } from '@react-navigation/native';
import type { AuthStackParams } from './types';

/**
 * 차량 QR: pickup://link?code={code} (LINK-01 qrPayload)
 * 초대 링크: 서버 inviteUrl 형식 확정 후 prefixes·path 수정 필요
 */
export const linking: LinkingOptions<AuthStackParams> = {
  prefixes: ['pickup://'],
  config: {
    screens: {
      LinkScan: 'link',
      InviteAccept: 'invite/:token',
    },
  },
};
