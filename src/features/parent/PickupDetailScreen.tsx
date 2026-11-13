import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  type ImageSourcePropType,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../../api/errors';
import type { DemoStackParams } from '../../app/navigation/types';
import { messageFor } from '../../domain/errorCodes';
import { pretendard as pf } from '../../shared/theme/tokens';
import { useSessionActions, useSpots } from './data';
import { ALT_STAGE, fromMock, STAGES, useServerLive } from './liveHooks';
import type { LiveVM, StepVM } from './liveModel';
import { mock } from './mock';
import { usePickupStore } from './pickupStore';

type P = NativeStackScreenProps<DemoStackParams, 'PPickupLive'>;

/*
 * 현황메뉴 - 진행 중 2~7 (assets, 780x1688 @2x → 390pt).
 * route.params.id === 'server'면 서버 세션(SES-03 5초 폴링)을, 아니면 데모 픽업을 그린다.
 *   대체 장소: SES-05 · 직접 연락: SES-10 · 호출 철회: CALL-03 · 다음 알림 보류: CALL-01
 */
const img = {
  back: require('../../assets/images/v2/ic_back.png'),
  spot: require('../../assets/images/v2/act_spot.png'),
  call: require('../../assets/images/v2/act_call.png'),
  revoke: require('../../assets/images/v2/act_revoke.png'),
  done: require('../../assets/images/v2/step_done.png'),
  alert: require('../../assets/images/v2/alert_route.png'),
  car: require('../../assets/images/v2/done_car.png'),
};

const C = {
  ink: '#181A1C',
  text: '#2B2D33',
  sub: '#6F7178',
  muted: '#8E9199',
  faint: '#B9BCC2',
  blue: '#1040CA',
  blueLine: '#A7B6E9',
  red: '#E51B1B',
  line: '#E5E5E5',
  button: '#43454D',
};

export function PickupLiveScreen({ navigation, route }: P) {
  return route.params.id === 'server' ? (
    <ServerDetail navigation={navigation} route={route} />
  ) : (
    <MockDetail navigation={navigation} route={route} />
  );
}

/* ---------- 서버 세션 ---------- */

function ServerDetail({ navigation }: P) {
  const { live, view, loading } = useServerLive();
  const act = useSessionActions(view);
  const spots = useSpots();
  const [sheet, setSheet] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (f: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    try {
      await f();
    } catch (e) {
      Alert.alert(
        '처리하지 못했어요',
        e instanceof ApiError
          ? messageFor(e.code, e.message)
          : '잠시 후 다시 시도해 주세요',
      );
    } finally {
      setBusy(false);
    }
  };

  // 현재 장소와 같은 학원의 다른 장소 = 대안 장소
  const academy = spots.data?.academies?.find(a =>
    a.spots?.some(sp => sp.spotId === view?.spot?.spotId),
  );
  const alts = (academy?.spots ?? []).filter(
    sp => sp.spotId !== view?.spot?.spotId,
  );

  const callChild = () =>
    run(async () => {
      const list = await act.contacts();
      const phone = list.find(c => c.role === 'CHILD')?.phone ?? list[0]?.phone;
      if (!phone) throw new Error('no phone');
      await Linking.openURL(`tel:${phone}`);
    });

  if (!live) {
    return (
      <DetailFrame onBack={navigation.goBack}>
        <Text style={s.empty}>
          {loading ? '불러오는 중이에요…' : '진행 중인 픽업이 없어요.'}
        </Text>
      </DetailFrame>
    );
  }
  return (
    <>
      <DetailView
        live={live}
        onBack={navigation.goBack}
        onSpot={() => setSheet(true)}
        onCall={callChild}
        onRevoke={
          live.callId
            ? () =>
                Alert.alert(
                  '호출을 철회할까요?',
                  '자녀에게 건물 안에서 기다리라고 안내해요.',
                  [
                    { text: '계속 진행', style: 'cancel' },
                    {
                      text: '철회하기',
                      style: 'destructive',
                      onPress: () => run(act.revoke),
                    },
                  ],
                )
            : undefined
        }
        footer={
          live.ended || live.boarded ? undefined : (
            <FooterButton
              label={live.held ? '다음 알림 다시 받기' : '다음 알림 보류하기'}
              onPress={() => run(act.toggleHold)}
            />
          )
        }
      />
      <AltSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        spots={alts.map(sp => ({
          key: String(sp.spotId),
          name: sp.name ?? '-',
          meta: sp.memo ?? (sp.walkMinutes ? `걸어서 ${sp.walkMinutes}분` : ''),
        }))}
        onPick={key => {
          setSheet(false);
          run(() => act.changeSpot(Number(key)));
        }}
      />
      <DetourDialog
        visible={live.stopFailed && !dismissed}
        onClose={() => setDismissed(true)}
        onReenter={() => setDismissed(true)}
        onAlt={
          alts[0]?.spotId
            ? () => {
                setDismissed(true);
                run(() => act.changeSpot(alts[0].spotId!));
              }
            : undefined
        }
      />
      <BoardedDialog
        visible={live.boarded}
        onClose={() => navigation.goBack()}
      />
    </>
  );
}

/* ---------- 데모 픽업 ---------- */

function MockDetail({ navigation, route }: P) {
  const { id } = route.params;
  const pickup = usePickupStore(st => st.pickups.find(p => p.id === id));
  const saveStage = usePickupStore(st => st.setStage);
  const cancelPickup = usePickupStore(st => st.cancelPickup);
  const completePickup = usePickupStore(st => st.completePickup);
  const [hold, setHold] = useState(false);
  const [sheet, setSheet] = useState(false);
  const stage = Math.min(pickup?.stage ?? 0, STAGES.length - 1);
  const cur = STAGES[stage];
  const live = pickup?.status === 'live';
  const paused = sheet || !live;

  // 팝업 · 시트가 없으면 4초 뒤 다음 단계로
  useEffect(() => {
    if (paused || cur.dialog || stage >= STAGES.length - 1) return;
    const t = setTimeout(() => saveStage(id, stage + 1), 4000);
    return () => clearTimeout(t);
  }, [id, stage, cur.dialog, paused, saveStage]);

  if (!pickup) {
    return (
      <DetailFrame onBack={navigation.goBack}>
        <Text style={s.empty}>픽업 정보를 찾을 수 없어요.</Text>
      </DetailFrame>
    );
  }
  const vm = { ...fromMock(pickup), held: hold };
  const showResult = () => {
    const recordId = completePickup(id);
    if (recordId) navigation.replace('POutcome', { recordId });
    else navigation.goBack();
  };
  return (
    <>
      <DetailView
        live={vm}
        onBack={navigation.goBack}
        onSpot={vm.ended ? undefined : () => setSheet(true)}
        onCall={() => Linking.openURL('tel:01000000000')}
        onRevoke={
          vm.ended
            ? undefined
            : () =>
                Alert.alert(
                  '호출을 철회할까요?',
                  '자녀에게 건물 안에서 기다리라고 안내해요.',
                  [
                    { text: '계속 진행', style: 'cancel' },
                    {
                      text: '철회하기',
                      style: 'destructive',
                      onPress: () => cancelPickup(id),
                    },
                  ],
                )
        }
        footer={
          vm.ended ? undefined : (
            <FooterButton
              label={hold ? '다음 알림 다시 받기' : '다음 알림 보류하기'}
              onPress={() => setHold(h => !h)}
            />
          )
        }
      />
      <AltSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        spots={mock.spots.map(sp => ({
          key: sp.name,
          name: sp.name,
          meta: sp.meta,
        }))}
        onPick={name => {
          saveStage(id, Math.max(stage, ALT_STAGE), name);
          setSheet(false);
        }}
      />
      <DetourDialog
        visible={cur.dialog === 'detour' && !paused}
        onClose={() => saveStage(id, 3)}
        onReenter={() => saveStage(id, 3)}
        onAlt={() => saveStage(id, ALT_STAGE)}
      />
      <BoardedDialog visible={cur.dialog === 'boarded'} onClose={showResult} />
    </>
  );
}

/* ---------- 화면 조각 ---------- */

function DetailFrame({
  onBack,
  children,
  footer,
}: {
  onBack(): void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  // 시안은 iPhone(상태 표시줄 47pt) 기준 절대 위치
  const top = Math.max(insets.top, 47);
  return (
    <View style={[s.root, { paddingTop: top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          hitSlop={12}
          onPress={onBack}
          style={s.back}
        >
          <Image source={img.back} style={s.backIcon} />
        </Pressable>
        <Text style={s.headerTitle}>진행 중인 픽업</Text>
      </View>
      <ScrollView style={s.flex} contentContainerStyle={s.body}>
        {children}
      </ScrollView>
      {footer ? (
        <View
          style={[s.footer, { paddingBottom: Math.max(insets.bottom, 21) }]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

function DetailView({
  live,
  onBack,
  onSpot,
  onCall,
  onRevoke,
  footer,
}: {
  live: LiveVM;
  onBack(): void;
  onSpot?(): void;
  onCall?(): void;
  onRevoke?(): void;
  footer?: React.ReactNode;
}) {
  return (
    <DetailFrame onBack={onBack} footer={footer}>
      <View style={s.hero}>
        {live.photo ? (
          <Image source={live.photo} style={s.photo} />
        ) : (
          <View style={[s.photo, s.photoEmpty]} />
        )}
        <Text style={s.name}>{live.childName}</Text>
        <Text style={s.academy}>{live.academy}</Text>
      </View>
      <View style={s.actions}>
        <Action icon={img.spot} label="대체 장소" onPress={onSpot} />
        <Action icon={img.call} label="직접 연락" onPress={onCall} />
        <Action icon={img.revoke} label="호출 철회" onPress={onRevoke} />
      </View>
      <View style={s.divider} />
      <Text style={s.section}>진행 상황</Text>
      <View style={s.steps}>
        {live.steps.map((st, i) => (
          <StepRow
            key={`${st.title}-${i}`}
            step={st}
            last={i === live.steps.length - 1}
          />
        ))}
      </View>
    </DetailFrame>
  );
}

function Action({
  icon,
  label,
  onPress,
}: {
  icon: ImageSourcePropType;
  label: string;
  onPress?(): void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        s.action,
        !onPress && s.disabled,
        pressed && s.pressed,
      ]}
    >
      <Image source={icon} style={s.actionIcon} />
      <Text style={s.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function StepRow({ step, last }: { step: StepVM; last: boolean }) {
  const { state } = step;
  return (
    <View style={s.step}>
      <View style={s.rail}>
        {state === 'done' ? (
          <Image source={img.done} style={s.marker} />
        ) : (
          <View
            style={[
              s.marker,
              s.ring,
              state === 'active' && s.ringBlue,
              state === 'failed' && s.ringRed,
            ]}
          >
            {state === 'active' || state === 'failed' ? (
              <View
                style={[s.dot, state === 'failed' ? s.dotRed : s.dotBlue]}
              />
            ) : null}
          </View>
        )}
        {!last ? <View style={s.dash} /> : null}
      </View>
      <View style={s.stepText}>
        <Text
          style={[
            s.stepTitle,
            state === 'active' && s.stepTitleActive,
            state === 'failed' && s.stepTitleFailed,
            state === 'pending' && s.stepTitlePending,
          ]}
        >
          {step.title}
        </Text>
        {step.desc ? (
          <Text style={[s.stepDesc, state === 'pending' && s.stepDescPending]}>
            {step.desc}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function FooterButton({ label, onPress }: { label: string; onPress(): void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.footBtn, pressed && s.pressed]}
    >
      <Text style={s.footBtnText}>{label}</Text>
    </Pressable>
  );
}

function Dim({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose(): void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.dim}>{children}</View>
    </Modal>
  );
}

/** 현황메뉴 3 · 경로 이탈 감지 */
function DetourDialog({
  visible,
  onClose,
  onReenter,
  onAlt,
}: {
  visible: boolean;
  onClose(): void;
  onReenter(): void;
  onAlt?(): void;
}) {
  return (
    <Dim visible={visible} onClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="닫기"
        onPress={onClose}
        hitSlop={12}
        style={s.dlgClose}
      >
        <View style={[s.closeLine, s.closeA]} />
        <View style={[s.closeLine, s.closeB]} />
      </Pressable>
      <View style={[s.dlg, s.dlgDetour]}>
        <Image source={img.alert} style={s.alertIcon} />
        <Text style={s.dlgEyebrowRed}>경로 이탈 감지</Text>
        <Text style={s.dlgTitle}>정차할 장소를 지나쳤어요.</Text>
        <Text style={s.dlgSub}>안내를 위해 다음 중 선택해주세요.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onReenter}
          style={({ pressed }) => [s.dlgBtnOutline, pressed && s.pressed]}
        >
          <Text style={s.dlgBtnOutlineText}>해당 장소로 재진입할거에요.</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!onAlt}
          onPress={onAlt}
          style={({ pressed }) => [
            s.dlgBtn,
            !onAlt && s.disabled,
            pressed && s.pressed,
          ]}
        >
          <Text style={s.dlgBtnText}>두번째 대안 장소로 이동할게요.</Text>
        </Pressable>
      </View>
    </Dim>
  );
}

/** 현황메뉴 6 · 자녀 탑승 확인 */
function BoardedDialog({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose(): void;
}) {
  return (
    <Dim visible={visible} onClose={onClose}>
      <Pressable style={[s.dlg, s.dlgBoarded]} onPress={onClose}>
        <Text style={s.dlgEyebrowBlue}>자녀 탑승 확인</Text>
        <Image source={img.car} style={s.carImg} />
        <Text style={s.dlgTitle}>픽업을 종료하고 귀가할게요.</Text>
        <Text style={s.dlgSub}>안전한 탑승을 확인했어요.</Text>
      </Pressable>
    </Dim>
  );
}

/** 대체 장소 고르기 */
function AltSheet({
  visible,
  onClose,
  spots,
  onPick,
}: {
  visible: boolean;
  onClose(): void;
  spots: { key: string; name: string; meta: string }[];
  onPick(key: string): void;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={s.dimFill} onPress={onClose} />
      <View style={s.sheet}>
        <Text style={s.sheetTitle}>대체 장소로 바꿀까요?</Text>
        <Text style={s.sheetSub}>자녀에게 새 장소로 가라고 바로 안내해요.</Text>
        {!spots.length ? (
          <Text style={s.empty}>등록한 대안 장소가 없어요.</Text>
        ) : null}
        {spots.map((sp, i) => (
          <Pressable
            key={sp.key}
            accessibilityRole="button"
            onPress={() => onPick(sp.key)}
            style={({ pressed }) => [s.spotRow, pressed && s.pressed]}
          >
            <View style={[s.spotNum, i > 0 && s.spotNumAlt]}>
              <Text style={s.spotNumText}>{i + 1}</Text>
            </View>
            <View style={s.flex}>
              <Text style={s.spotName}>{sp.name}</Text>
              {sp.meta ? <Text style={s.spotMeta}>{sp.meta}</Text> : null}
            </View>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

/* 시안(780x1688 @2x)의 픽셀 ÷ 2. 위 47pt(iPhone 상태 표시줄) 기준 */
const s = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  empty: {
    marginTop: 24,
    textAlign: 'center',
    fontFamily: pf.regular,
    fontSize: 15,
    color: C.sub,
  },
  header: { height: 52, justifyContent: 'center', alignItems: 'center' },
  back: { position: 'absolute', left: 18, top: 16, width: 20, height: 20 },
  backIcon: { width: 23, height: 20, tintColor: C.ink },
  headerTitle: {
    fontFamily: pf.bold,
    fontSize: 18,
    letterSpacing: -0.4,
    color: C.ink,
  },
  body: { paddingHorizontal: 16, paddingBottom: 24 },
  hero: { alignItems: 'center', marginTop: 30 },
  photo: { width: 80, height: 80, borderRadius: 40 },
  photoEmpty: { backgroundColor: '#E6E8EB' },
  name: {
    marginTop: 15,
    fontFamily: pf.medium,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.4,
    color: C.text,
  },
  academy: {
    marginTop: 1,
    fontFamily: pf.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.3,
    color: C.muted,
  },
  actions: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  action: { width: 60, alignItems: 'center' },
  actionIcon: { width: 60, height: 60, borderRadius: 30 },
  actionLabel: {
    marginTop: 8,
    width: 80,
    textAlign: 'center',
    fontFamily: pf.regular,
    fontSize: 14,
    letterSpacing: -0.3,
    color: C.text,
  },
  divider: { marginTop: 32, height: 1, backgroundColor: C.line },
  section: {
    marginTop: 33,
    fontFamily: pf.bold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.3,
    color: C.ink,
  },
  steps: { marginTop: 16 },
  step: { flexDirection: 'row', minHeight: 58 },
  rail: { width: 22, alignItems: 'center' },
  marker: { width: 22, height: 22, borderRadius: 11 },
  ring: {
    borderWidth: 1.5,
    borderColor: '#C9CCD1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringBlue: { borderWidth: 2, borderColor: C.blue },
  ringRed: { borderWidth: 2, borderColor: C.red },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotBlue: { backgroundColor: C.blue },
  dotRed: { backgroundColor: C.red },
  dash: {
    flex: 1,
    width: 0,
    marginVertical: 2,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.blueLine,
  },
  stepText: { flex: 1, marginLeft: 12, paddingBottom: 14 },
  stepTitle: {
    fontFamily: pf.regular,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.4,
    color: C.text,
  },
  stepTitleActive: { color: C.blue, fontFamily: pf.semibold },
  stepTitleFailed: { color: C.text, fontFamily: pf.semibold },
  stepTitlePending: { color: C.faint },
  stepDesc: {
    marginTop: 2,
    fontFamily: pf.regular,
    fontSize: 13.5,
    lineHeight: 18,
    letterSpacing: -0.3,
    color: C.sub,
  },
  stepDescPending: { color: C.faint },
  footer: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: '#FFFFFF' },
  footBtn: {
    height: 60,
    borderRadius: 12,
    backgroundColor: C.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footBtnText: {
    fontFamily: pf.semibold,
    fontSize: 19,
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },

  // 팝업
  dim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  dimFill: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  dlg: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  dlgDetour: { paddingTop: 76, paddingBottom: 18 },
  dlgBoarded: { paddingTop: 40, paddingBottom: 42 },
  dlgClose: {
    alignSelf: 'flex-end',
    marginRight: -14,
    marginBottom: 16,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLine: {
    position: 'absolute',
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  closeA: { transform: [{ rotate: '45deg' }] },
  closeB: { transform: [{ rotate: '-45deg' }] },
  alertIcon: { width: 71, height: 72, marginTop: -2 },
  dlgEyebrowRed: {
    marginTop: 26,
    fontFamily: pf.bold,
    fontSize: 16,
    color: C.red,
  },
  dlgEyebrowBlue: {
    fontFamily: pf.bold,
    fontSize: 16,
    color: C.blue,
  },
  dlgTitle: {
    marginTop: 30,
    fontFamily: pf.bold,
    fontSize: 21,
    letterSpacing: -0.5,
    color: C.ink,
  },
  dlgSub: {
    marginTop: 6,
    fontFamily: pf.medium,
    fontSize: 14.5,
    letterSpacing: -0.3,
    color: '#A0A3A8',
  },
  dlgBtnOutline: {
    marginTop: 46,
    alignSelf: 'stretch',
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C9CCD1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dlgBtnOutlineText: {
    fontFamily: pf.medium,
    fontSize: 16,
    letterSpacing: -0.3,
    color: C.ink,
  },
  dlgBtn: {
    marginTop: 10,
    alignSelf: 'stretch',
    height: 60,
    borderRadius: 12,
    backgroundColor: C.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dlgBtnText: {
    fontFamily: pf.semibold,
    fontSize: 16,
    letterSpacing: -0.3,
    color: '#FFFFFF',
  },
  carImg: { width: 154, height: 158, marginTop: 52 },

  // 대체 장소 시트
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 10,
  },
  sheetTitle: {
    fontFamily: pf.bold,
    fontSize: 19,
    color: C.ink,
  },
  sheetSub: {
    fontFamily: pf.regular,
    fontSize: 14.5,
    color: C.sub,
    marginBottom: 6,
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  spotNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotNumAlt: { backgroundColor: '#6F7178' },
  spotNumText: { fontFamily: pf.bold, fontSize: 13, color: '#FFFFFF' },
  spotName: { fontFamily: pf.semibold, fontSize: 16, color: C.ink },
  spotMeta: {
    marginTop: 2,
    fontFamily: pf.regular,
    fontSize: 13.5,
    color: C.sub,
  },
});
