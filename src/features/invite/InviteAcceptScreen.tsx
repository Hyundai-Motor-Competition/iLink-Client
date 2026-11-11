import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Platform, Text } from 'react-native';
import { newIdempotencyKey } from '../../api/client';
import { inviteApi } from '../../api/endpoints/invite';
import { ApiError } from '../../api/errors';
import type { AuthStackParams } from '../../app/navigation/types';
import { messageFor } from '../../domain/errorCodes';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../shared/ui/Button';
import { ScreenScaffold } from '../../shared/ui/ScreenScaffold';

type Props = NativeStackScreenProps<AuthStackParams, 'InviteAccept'>;

/** C00 가족 연결 (자녀·공동 보호자 공통). 동의 항목은 서버 requiredConsents를 그대로 따른다. */
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
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(0, null);
      setError(messageFor(err.code, err.message));
    } finally {
      setBusy(false);
    }
  };

  const loadError =
    info.error instanceof ApiError
      ? messageFor(info.error.code, info.error.message)
      : null;

  return (
    <ScreenScaffold
      screenId="C00"
      title="가족 연결"
      note={
        info.data
          ? `${info.data.inviterName}님이 ${info.data.memberName}님을 초대했어요.`
          : undefined
      }
    >
      {loadError ? <Text>{loadError}</Text> : null}
      {error ? <Text>{error}</Text> : null}
      <Button
        label="동의하고 연결하기"
        disabled={!info.data || busy}
        onPress={accept}
      />
    </ScreenScaffold>
  );
}
