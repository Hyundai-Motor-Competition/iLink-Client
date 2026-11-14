import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Platform,
  Settings,
  StyleSheet,
  View,
} from 'react-native';
import { isGuardianRole, useAuthStore } from '../../stores/authStore';
import { DemoNavigator } from './DemoNavigator';
import { GuardianHomeScreen } from '../../features/session/GuardianHomeScreen';
import { FamilyProfileScreen } from '../../features/family/FamilyProfileScreen';
import { ScheduleScreen } from '../../features/schedule/ScheduleScreen';
import { SpotApprovalScreen } from '../../features/spot/SpotApprovalScreen';
import { SetupReviewScreen } from '../../features/setup/SetupReviewScreen';
import { PickupProgressScreen } from '../../features/session/PickupProgressScreen';
import { PickupExceptionScreen } from '../../features/session/PickupExceptionScreen';
import { PickupOutcomeScreen } from '../../features/outcome/PickupOutcomeScreen';
import { ChildSessionScreen } from '../../features/child/ChildSessionScreen';
import type { ChildStackParams, GuardianStackParams } from './types';

const DEMO_ROUTES = new Set(['PMain', 'CInvite', 'CWaiting', 'CDeparted', 'CMeet', 'CHelp', 'CDone']);

const Guardian = createNativeStackNavigator<GuardianStackParams>();
const Child = createNativeStackNavigator<ChildStackParams>();

export function RootNavigator() {
  const { status, auth } = useAuthStore();

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  // 로그인 전(데모)과 보호자 로그인 뒤 모두 디자인 화면을 쓴다.
  // 같은 자리의 같은 컴포넌트라 가족 프로필 등록 중 로그인(LINK-04)해도 화면 이동 기록이 이어진다.
  if (status === 'signedOut' || !auth || isGuardianRole(auth.role)) {
    // 시연 · 캡처용: iOS 실행 인자 `-demoRoute PMain`이면 로그인 없이 메인(데모 데이터)으로 시작
    // 화면 확인용: `-demoRoute CMeet` 처럼 데모 화면 이름을 주면 그 화면으로 시작
    const demoRoute =
      Platform.OS === 'ios' ? (Settings.get('demoRoute') as string | undefined) : undefined;
    const start = auth ? 'PMain' : demoRoute && DEMO_ROUTES.has(demoRoute) ? demoRoute : 'Landing';
    return <DemoNavigator initialRouteName={start as never} />;
  }

  if (isGuardianRole(auth.role)) {
    return (
      <Guardian.Navigator>
        <Guardian.Screen
          name="GuardianHome"
          component={GuardianHomeScreen}
          options={{ title: '홈' }}
        />
        <Guardian.Screen
          name="FamilyProfile"
          component={FamilyProfileScreen}
          options={{ title: '가족 프로필' }}
        />
        <Guardian.Screen
          name="Schedule"
          component={ScheduleScreen}
          options={{ title: '학원·픽업 일정' }}
        />
        <Guardian.Screen
          name="SpotApproval"
          component={SpotApprovalScreen}
          options={{ title: '픽업 장소' }}
        />
        <Guardian.Screen
          name="SetupReview"
          component={SetupReviewScreen}
          options={{ title: '설정 확인' }}
        />
        <Guardian.Screen
          name="PickupProgress"
          component={PickupProgressScreen}
          options={{ title: '픽업 진행' }}
        />
        <Guardian.Screen
          name="PickupException"
          component={PickupExceptionScreen}
          options={{ title: '예외 대응' }}
        />
        <Guardian.Screen
          name="PickupOutcome"
          component={PickupOutcomeScreen}
          options={{ title: '픽업 결과' }}
        />
      </Guardian.Navigator>
    );
  }

  return (
    <Child.Navigator screenOptions={{ headerShown: false }}>
      <Child.Screen name="ChildSession" component={ChildSessionScreen} />
    </Child.Navigator>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
