import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import type { DemoStackParams } from '../../app/navigation/types';
import {
  ChildDepartedView,
  ChildDoneView,
  ChildHelpView,
  ChildInviteView,
  ChildMeetView,
  ChildWaitingView,
} from '../child/ChildViews';

type P<K extends keyof DemoStackParams> = NativeStackScreenProps<
  DemoStackParams,
  K
>;

/*
 * 로그인 없이 보는 자녀 C00~C05 (랜딩 → 자녀). 3차 시안 그대로, 데이터는 예시 값.
 * 실제 앱은 features/child/ChildSessionScreen이 같은 화면을 서버 상태로 그린다.
 * 데모에서는 오른쪽 위 프로필 버튼으로 다음 화면으로 넘어간다.
 */

const PLACE = '수학 임팩트 학원';
// 강남역 근처 예시 좌표 (학원 앞 · 차량)
const CHILD_AT = { lat: 37.4995, lng: 127.0289 };
const CAR_AT = { lat: 37.4972, lng: 127.0262 };

export function ChildInviteScreen({ navigation }: P<'CInvite'>) {
  return (
    <ChildInviteView
      childName="김민지"
      inviterName="김현대"
      onConnect={() =>
        navigation.reset({ index: 0, routes: [{ name: 'CWaiting' }] })
      }
    />
  );
}

export function ChildWaitingScreen({ navigation }: P<'CWaiting'>) {
  const [dialog, setDialog] = useState<'faces' | null>('faces');
  return (
    <ChildWaitingView
      place={PLACE}
      time="오후 8시 10분"
      dialog={dialog}
      onCloseDialog={() => setDialog(null)}
      onProfile={() => navigation.navigate('CDeparted')}
    />
  );
}

export function ChildDepartedScreen({ navigation }: P<'CDeparted'>) {
  const [extra, setExtra] = useState(0);
  return (
    <ChildDepartedView
      who="엄마가"
      eta="20:10"
      pos={0.25}
      extraUsed={extra}
      notice={extra ? `준비 시간 +${extra}분을 보호자에게 알렸어요` : null}
      onAddTime={m => setExtra(v => v + m)}
      onProfile={() => navigation.navigate('CMeet')}
    />
  );
}

export function ChildMeetScreen({ navigation }: P<'CMeet'>) {
  return (
    <ChildMeetView
      academy={PLACE}
      spot="건물 바로 앞"
      minutes={3}
      child={CHILD_AT}
      vehicle={CAR_AT}
      pos={0.65}
      onHelp={() => navigation.navigate('CHelp')}
      onProfile={() => navigation.navigate('CDone')}
    />
  );
}

export function ChildHelpScreen({ navigation }: P<'CHelp'>) {
  return (
    <ChildHelpView
      onContact={() => {}}
      onProfile={() => navigation.navigate('CDone')}
    />
  );
}

export function ChildDoneScreen({ navigation }: P<'CDone'>) {
  return (
    <ChildDoneView
      place={PLACE}
      boardedAt="오후 8시 10분"
      onConfirm={() =>
        navigation.reset({ index: 0, routes: [{ name: 'Landing' }] })
      }
    />
  );
}
