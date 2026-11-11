import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LandingScreen } from '../../features/landing/LandingScreen';
import { LinkScanScreen } from '../../features/link/LinkScanScreen';
import { LinkApproveScreen } from '../../features/link/LinkApproveScreen';
import { InviteAcceptScreen } from '../../features/invite/InviteAcceptScreen';
import {
  CarConfirmScreen,
  ChildProfileScreen,
  FamilyDoneScreen,
  GuardianProfileScreen,
  QrScanScreen,
  TermsScreen,
} from '../../features/parent/OnboardingScreens';
import { ParentMainScreen } from '../../features/parent/ParentMainScreen';
import {
  ScheduleAcademyScreen,
  ScheduleChildScreen,
  ScheduleDoneScreen,
  ScheduleIntroScreen,
  ScheduleSpotScreen,
  ScheduleTimeScreen,
} from '../../features/parent/ScheduleScreens';
import {
  OutcomeScreen,
  PickupLiveScreen,
} from '../../features/parent/PickupLiveScreens';
import {
  ChildDepartedScreen,
  ChildDoneScreen,
  ChildHelpScreen,
  ChildInviteScreen,
  ChildMeetScreen,
  ChildWaitingScreen,
} from '../../features/childui/ChildScreens';
import type { AuthStackParams, DemoStackParams } from './types';

type Params = DemoStackParams & Omit<AuthStackParams, 'Welcome'>;
const Stack = createNativeStackNavigator<Params>();

/** 로그인 전: 랜딩(부모/자녀 선택) → Figma 기준 화면. 딥링크용 연결·초대 화면도 함께 둔다. */
export function DemoNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />

      <Stack.Screen name="PQrScan" component={QrScanScreen} />
      <Stack.Screen name="PCarConfirm" component={CarConfirmScreen} />
      <Stack.Screen name="PTerms" component={TermsScreen} />
      <Stack.Screen name="PGuardianProfile" component={GuardianProfileScreen} />
      <Stack.Screen name="PChildProfile" component={ChildProfileScreen} />
      <Stack.Screen name="PFamilyDone" component={FamilyDoneScreen} />
      <Stack.Screen name="PMain" component={ParentMainScreen} />
      <Stack.Screen name="PScheduleIntro" component={ScheduleIntroScreen} />
      <Stack.Screen name="PScheduleChild" component={ScheduleChildScreen} />
      <Stack.Screen name="PScheduleAcademy" component={ScheduleAcademyScreen} />
      <Stack.Screen name="PScheduleSpot" component={ScheduleSpotScreen} />
      <Stack.Screen name="PScheduleTime" component={ScheduleTimeScreen} />
      {/* 저장이 끝난 뒤라 뒤로 밀어서 Step 4로 돌아가 중복 등록되지 않게 막는다 */}
      <Stack.Screen
        name="PScheduleDone"
        component={ScheduleDoneScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="PPickupLive" component={PickupLiveScreen} />
      <Stack.Screen name="POutcome" component={OutcomeScreen} />

      <Stack.Screen name="CInvite" component={ChildInviteScreen} />
      <Stack.Screen name="CWaiting" component={ChildWaitingScreen} />
      <Stack.Screen name="CDeparted" component={ChildDepartedScreen} />
      <Stack.Screen name="CMeet" component={ChildMeetScreen} />
      <Stack.Screen name="CHelp" component={ChildHelpScreen} />
      <Stack.Screen name="CDone" component={ChildDoneScreen} />

      {/* API 연결 화면 (딥링크 pickup://link, invite/:token) */}
      <Stack.Screen name="LinkScan" component={LinkScanScreen as never} />
      <Stack.Screen name="LinkApprove" component={LinkApproveScreen as never} />
      <Stack.Screen
        name="InviteAccept"
        component={InviteAcceptScreen as never}
      />
    </Stack.Navigator>
  );
}
