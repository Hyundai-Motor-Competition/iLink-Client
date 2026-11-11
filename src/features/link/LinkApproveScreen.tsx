import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { newIdempotencyKey } from '../../api/client';
import { vehicleLinkApi } from '../../api/endpoints/vehicleLink';
import { ApiError } from '../../api/errors';
import type { ConsentType } from '../../api/types';
import type { AuthStackParams } from '../../app/navigation/types';
import { messageFor } from '../../domain/errorCodes';
import { useAuthStore } from '../../stores/authStore';
import { colors, font } from '../../shared/theme/tokens';
import { Button } from '../../shared/ui/Button';
import { ScreenScaffold } from '../../shared/ui/ScreenScaffold';

type Props = NativeStackScreenProps<AuthStackParams, 'LinkApprove'>;

// 기획서: 필수 2 · 선택 1. 실제 필수 목록은 서버와 확정 필요.
const CONSENTS: { type: ConsentType; label: string; required: boolean }[] = [
  { type: 'TERMS', label: '서비스 이용약관 (필수)', required: true },
  { type: 'PRIVACY', label: '개인정보 수집·이용 (필수)', required: true },
  { type: 'MARKETING', label: '마케팅 정보 수신 (선택)', required: false },
];

/** P00-2 로그인·차량 연결. 별도 로그인 API 없이 LINK-04 응답 토큰으로 보호자 계정이 만들어진다. */
export function LinkApproveScreen({ navigation, route }: Props) {
  const { code, info } = route.params;
  const signIn = useAuthStore(s => s.signIn);
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 같은 승인 동작의 재시도는 같은 키로 보낸다 (중복 탭·네트워크 재시도)
  const key = useRef(newIdempotencyKey());

  const isNew = info.status === 'NEW';
  const requiredOk = CONSENTS.every(c => !c.required || agreed[c.type]);
  const canSubmit = requiredOk && (!isNew || name.trim().length > 0) && !busy;

  const approve = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await vehicleLinkApi.approve(
        {
          code,
          mode: isNew ? 'NEW' : 'RELINK',
          name: isNew ? name.trim() : undefined,
          platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
          consents: CONSENTS.map(c => ({
            type: c.type,
            agreed: !!agreed[c.type],
          })),
        },
        key.current,
      );
      await signIn({
        accessToken: res.accessToken!,
        refreshToken: res.refreshToken!,
        userId: res.userId!,
        familyId: res.familyId!,
        role: 'GUARDIAN',
      });
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(0, null);
      if (err.code === 'LINK_CODE_EXPIRED') {
        navigation.replace('LinkScan');
        return;
      }
      setError(messageFor(err.code, err.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenScaffold
      screenId="P00-2"
      title="차량 연결 승인"
      note={`${info.vehicleModel ?? ''} ${info.plateNumberMasked ?? ''}`.trim()}
    >
      {isNew ? (
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="보호자 이름"
          maxLength={20}
          style={styles.input}
        />
      ) : null}
      {CONSENTS.map(c => (
        <View key={c.type} style={styles.row}>
          <Text style={styles.label}>{c.label}</Text>
          <Switch
            value={!!agreed[c.type]}
            onValueChange={v => setAgreed(a => ({ ...a, [c.type]: v }))}
          />
        </View>
      ))}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        label={busy ? '연결 중…' : '연결 승인'}
        disabled={!canSubmit}
        onPress={approve}
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
    fontSize: font.body,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: { fontSize: font.body, color: colors.text, flex: 1 },
  error: { color: colors.danger, fontSize: font.body },
});
