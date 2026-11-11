import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Text } from 'react-native';
import { familyApi } from '../../api/endpoints/family';
import type { GuardianStackParams } from '../../app/navigation/types';
import { Button } from '../../shared/ui/Button';
import { ScreenScaffold } from '../../shared/ui/ScreenScaffold';
import { useAuthStore } from '../../stores/authStore';
import { useActiveSession } from './useSession';

type Props = NativeStackScreenProps<GuardianStackParams, 'GuardianHome'>;

export function GuardianHomeScreen({ navigation }: Props) {
  const signOut = useAuthStore(s => s.signOut);
  const family = useQuery({ queryKey: ['family'], queryFn: familyApi.me });
  const active = useActiveSession();
  const child = family.data?.members?.find(m => m.role === 'CHILD');

  return (
    <ScreenScaffold screenId="HOME" title="오늘의 픽업">
      {active.data?.sessionId ? (
        <Button
          label="진행 중인 픽업 보기"
          onPress={() =>
            navigation.navigate('PickupProgress', {
              sessionId: active.data!.sessionId!,
            })
          }
        />
      ) : (
        <Text>진행 중인 픽업이 없어요.</Text>
      )}
      <Button
        variant="ghost"
        label="가족 프로필"
        onPress={() => navigation.navigate('FamilyProfile')}
      />
      {child?.userId ? (
        <Button
          variant="ghost"
          label="설정 확인"
          onPress={() =>
            navigation.navigate('SetupReview', { childId: child.userId! })
          }
        />
      ) : null}
      <Button variant="ghost" label="로그아웃" onPress={signOut} />
    </ScreenScaffold>
  );
}
