import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import type { GuardianStackParams } from '../../app/navigation/types';
import { formatClock } from '../../shared/utils/time';
import { Button } from '../../shared/ui/Button';
import { ScreenScaffold } from '../../shared/ui/ScreenScaffold';
import { useSessionView } from './useSession';

type Props = NativeStackScreenProps<GuardianStackParams, 'PickupProgress'>;

/** P07 픽업 진행 현황 */
export function PickupProgressScreen({ navigation, route }: Props) {
  const { sessionId } = route.params;
  const { data } = useSessionView(sessionId);

  return (
    <ScreenScaffold screenId="P07" title="픽업 진행 현황">
      <Text>장소: {data?.spot?.name ?? '-'}</Text>
      <Text>
        정차 예상: {formatClock(data?.eta?.stopEtaAt)}{' '}
        {data?.eta?.stale ? '(도착 시간 확인 중)' : ''}
      </Text>
      <Text>합류 안내: {data?.status?.call ?? '-'}</Text>
      {data?.children?.map(c => (
        <Text key={c.childUserId}>
          {c.name}: {c.phase}{' '}
          {c.extraPrepMinutes ? `(+${c.extraPrepMinutes}분)` : ''}
        </Text>
      ))}
      <Button
        variant="ghost"
        label="예외 대응"
        onPress={() => navigation.navigate('PickupException', { sessionId })}
      />
      {data?.status?.session === 'COMPLETED' ? (
        <Button
          label="결과 보기"
          onPress={() => navigation.navigate('PickupOutcome', { sessionId })}
        />
      ) : null}
    </ScreenScaffold>
  );
}
