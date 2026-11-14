import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Platform } from 'react-native';
import { newIdempotencyKey } from '../../api/client';
import { inviteApi } from '../../api/endpoints/invite';
import { ApiError } from '../../api/errors';
import type { AuthStackParams } from '../../app/navigation/types';
import { messageFor, notFoundMessage } from '../../domain/errorCodes';
import { useAuthStore } from '../../stores/authStore';
import { ChildInviteView } from '../child/ChildViews';
import { useChildUi } from '../child/childUiStore';
import { askLocationPermission } from '../child/useChildLocation';

type Props = NativeStackScreenProps<AuthStackParams, 'InviteAccept'>;

/**
 * C00 가족 연결 (자녀 · 공동 보호자 공통, 3차 시안 design/child2/C00_invite.png).
 * 서버 필수 동의(requiredConsents)는 화면의 필수 항목(위치 · 알림)에 동의하면 함께 보낸다.
 */
export function InviteAcceptScreen({ route }: Props) {
  const { token } = route.params;
  const signIn = useAuthStore(s => s.signIn);
  const key = useRef(newIdempotencyKey());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const info = useQuery({
    queryKey: ['invite', token],
    queryFn: () => inviteApi.info(token),
  });

  const accept = async () => {
    if (!info.data) return;
    setBusy(true);
    setError(null);
    // 위치 공유 동의: 기기 권한도 이때 묻는다 (거절해도 연결은 된다. 지도에 내 위치만 빠진다)
    await askLocationPermission().catch(() => false);
    try {
      const res = await inviteApi.accept(
        token,
        {
          consents: (info.data.requiredConsents ?? []).map(type => ({
            type: type as never,
            agreed: true,
          })),
          platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        },
        key.current,
      );
      await signIn({
        accessToken: res.accessToken!,
        refreshToken: res.refreshToken!,
        userId: res.userId!,
        familyId: res.familyId!,
        role: res.role ?? 'CHILD',
      });
      useChildUi.getState().showConnected('faces');
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(0, null);
      setError(
        err.status === 404
          ? notFoundMessage('invite')
          : messageFor(err.code, err.message),
      );
    } finally {
      setBusy(false);
    }
  };

  const loadError =
    info.error instanceof ApiError
      ? info.error.status === 404
        ? notFoundMessage('invite')
        : messageFor(info.error.code, info.error.message)
      : null;

  return (
    <ChildInviteView
      childName={info.data?.memberName ?? ''}
      inviterName={info.data?.inviterName ?? ''}
      busy={!info.data || busy}
      error={loadError ?? error}
      onConnect={accept}
    />
  );
}
