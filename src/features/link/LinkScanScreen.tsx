import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { vehicleLinkApi } from '../../api/endpoints/vehicleLink';
import { ApiError } from '../../api/errors';
import type { AuthStackParams } from '../../app/navigation/types';
import { messageFor } from '../../domain/errorCodes';
import { colors, font } from '../../shared/theme/tokens';
import { Button } from '../../shared/ui/Button';
import { ScreenScaffold } from '../../shared/ui/ScreenScaffold';

type Props = NativeStackScreenProps<AuthStackParams, 'LinkScan'>;

const CODE_LENGTH = 8;

/**
 * P00-1 QR 스캔·연결 요청. 카메라 스캔(react-native-vision-camera)은 화면 구현 단계에서 붙인다.
 * 지금은 딥링크(pickup://link?code=)와 8자 직접 입력 경로만 연결돼 있다.
 */
export function LinkScanScreen({ navigation, route }: Props) {
  const [code, setCode] = useState(route.params?.code ?? '');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = async (value: string) => {
    setChecking(true);
    setError(null);
    try {
      const info = await vehicleLinkApi.checkCode(value);
      navigation.replace('LinkApprove', { code: value, info });
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(0, null);
      // 429: 연속 실패 제한 (QA-41)
      const wait =
        err.status === 429 && err.retryAfterSeconds
          ? ` (${err.retryAfterSeconds}초 후)`
          : '';
      setError(messageFor(err.code, err.message) + wait);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (route.params?.code) check(route.params.code);
    // 딥링크로 들어온 경우 1회만 확인
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.code]);

  return (
    <ScreenScaffold
      screenId="P00-1"
      title="차량 연결"
      note="차량 화면의 연결 코드 8자리를 입력하세요."
    >
      <TextInput
        value={code}
        onChangeText={t => setCode(t.toUpperCase().slice(0, CODE_LENGTH))}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="연결 코드"
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        label={checking ? '확인 중…' : '확인'}
        disabled={checking || code.length !== CODE_LENGTH}
        onPress={() => check(code)}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: font.title,
    letterSpacing: 4,
  },
  error: { color: colors.danger, fontSize: font.body },
});
