import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '../../app/navigation/types';
import { Button } from '../../shared/ui/Button';
import { ScreenScaffold } from '../../shared/ui/ScreenScaffold';

type Props = NativeStackScreenProps<AuthStackParams, 'Welcome'>;

// 보호자는 차량 QR로, 자녀는 보호자가 보낸 초대 링크(딥링크)로 들어온다.
export function WelcomeScreen({ navigation }: Props) {
  return (
    <ScreenScaffold
      screenId="-"
      title="iLink"
      note="차량 화면의 QR을 스캔해 연결을 시작하세요."
    >
      <Button
        label="차량 연결하기"
        onPress={() => navigation.navigate('LinkScan')}
      />
    </ScreenScaffold>
  );
}
