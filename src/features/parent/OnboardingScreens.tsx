import Clipboard from '@react-native-clipboard/clipboard';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Keyboard,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  Platform,
  View,
} from 'react-native';
import type { DemoStackParams } from '../../app/navigation/types';
import { pretendard as pf, v2 } from '../../shared/theme/tokens';
import { BottomSheet } from '../../shared/ui/kit';
import { linkCodeFrom, QrCamera } from '../../shared/ui/QrCamera';
import {
  CenterTitle,
  OnboardScreen,
  PillButton,
  PillInput,
  ProfilePhoto,
  type TextInputRef,
} from '../../shared/ui/onboard';
import { useFamilyDraft } from './familyDraft';
import { mock } from './mock';
import { useScheduleDraft } from './scheduleDraft';
import { newIdempotencyKey } from '../../api/client';
import { ApiError } from '../../api/errors';
import { messageFor, notFoundMessage } from '../../domain/errorCodes';
import { useAuthStore } from '../../stores/authStore';
import {
  approveLink,
  checkLinkCode,
  consentsFrom,
  issueInvite,
  issueTestLinkCode,
  registerChild,
  useServerMode,
} from './data';

const img = {
  qrBg: require('../../assets/images/family/qr_bg.png'),
  car: require('../../assets/images/family/car_confirm.png'),
  envelopeOpen: require('../../assets/images/family/envelope_open.png'),
  envelopeClosed: require('../../assets/images/family/envelope_closed.png'),
  // 사진첩·카메라 연결 전까지 고르면 들어가는 예시 사진 (시안에서 잘라 냄)
  guardianSample: require('../../assets/images/family/guardian_sample.png'),
  childSample: require('../../assets/images/schedule/child_hyunji.png'),
};

type P<K extends keyof DemoStackParams> = NativeStackScreenProps<
  DemoStackParams,
  K
>;

/** 가족 프로필 등록 1 · 등록 방법 선택 */
export function FamilyIntroScreen({ navigation }: P<'PFamilyIntro'>) {
  return (
    <OnboardScreen
      footer={
        <>
          <View style={s.bullets}>
            <Bullet text="4단계만 입력해두면 바로 픽업 가능해요." />
            <Bullet text="차량에서 바로 QR 코드 스캔으로 가능해요" />
          </View>
          <PillButton
            variant="white"
            label="인증 번호로 등록할래요."
            labelStyle={s.regularLabel}
            onPress={() => navigation.navigate('PCodeEntry')}
          />
          <PillButton
            label="QR 코드로 등록할래요"
            onPress={() => navigation.navigate('PQrScan')}
          />
        </>
      }
    >
      <CenterTitle title={'원활한 픽업을 위해\n나와 자녀 프로필을 연결해요.'} />
    </OnboardScreen>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={s.bulletRow}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{text}</Text>
    </View>
  );
}

/**
 * 가족 프로필 등록 2 · QR 촬영
 * 시안 메모: 카메라 켜짐 · 카메라가 화면 전체를 차지 · 화면 하단 딤.
 * 뒤 카메라를 화면 전체에 띄우고 차량 QR을 비추면 바로 읽는다.
 * 카메라가 없는 시뮬레이터 · 권한 거부 때는 시안의 차량 실내 사진을 대신 깐다.
 * 촬영 버튼: 카메라가 없을 때 시험용 차량의 연결 코드로 넘어간다.
 */
export function QrScanScreen({ navigation, route }: P<'PQrScan'>) {
  const patch = useFamilyDraft(d => d.patch);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scanned = route.params?.code;
  // 카메라로 차량 QR을 읽으면(pickup://link?code=) 그 코드로 바로 확인한다.
  // 카메라가 없는 에뮬레이터에서 촬영 버튼만 누르면 시험용 차량의 연결 코드를 받아 스캔한 것으로 본다
  const shoot = async (code?: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const link = await checkLinkCode(code ?? (await issueTestLinkCode()));
      patch({ link });
      navigation.navigate('PCarConfirm');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  // 링크로 들어온 코드는 바로 확인 (QR을 읽은 순간)
  useEffect(() => {
    if (scanned) shoot(scanned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanned]);

  return (
    <View style={s.camRoot}>
      <StatusBar barStyle="light-content" />
      <QrCamera
        fallback={img.qrBg}
        onCode={value => {
          const code = linkCodeFrom(value);
          if (code) shoot(code);
          else setError('iLink 차량 화면의 QR 코드를 찍어주세요.');
        }}
      />
      <BottomDim />
      <View style={s.frame}>
        <View style={[s.corner, s.tl]} />
        <View style={[s.corner, s.tr]} />
        <View style={[s.corner, s.bl]} />
        <View style={[s.corner, s.br]} />
      </View>
      <View style={s.camBottom}>
        <Text style={s.camGuide}>
          {error ??
            (busy
              ? 'QR 코드를 읽는 중이에요…'
              : '화면의 QR 코드를 찍어주세요.')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="촬영"
          onPress={() => shoot(scanned)}
          style={({ pressed }) => [s.shutter, pressed && s.shutterPressed]}
        >
          <View style={s.shutterInner} />
        </Pressable>
      </View>
    </View>
  );
}

/** 화면 아래 딤: 위는 투명, 아래로 갈수록 #0F1000 (시안 기준 528pt부터) */
const DIM_STEPS = 24;
function BottomDim() {
  return (
    <View pointerEvents="none" style={s.dim}>
      {Array.from({ length: DIM_STEPS }, (_, i) => {
        const t = (i + 1) / DIM_STEPS;
        return (
          <View
            key={i}
            style={[s.dimRow, { opacity: Math.min(0.93, 0.1 + t * 1.15) }]}
          />
        );
      })}
      <View style={s.dimSolid} />
    </View>
  );
}

/** 가족 프로필 등록 3 · 차량 정보 확인 */
export function CarConfirmScreen({ navigation }: P<'PCarConfirm'>) {
  const link = useFamilyDraft(d => d.link);
  return (
    <OnboardScreen
      step={0}
      footer={
        <View style={s.row}>
          <PillButton
            variant="white"
            label="이전"
            style={s.prevBtn}
            onPress={navigation.goBack}
          />
          <PillButton
            label="다음으로"
            style={s.flex}
            onPress={() => navigation.navigate('PTerms')}
          />
        </View>
      }
    >
      <CenterTitle
        title={'차량 정보가 맞는지\n확인해주세요.'}
        sub="연결할 차량이 맞나요?"
      />
      <Image source={img.car} style={s.car} resizeMode="contain" />
      <View style={s.plate}>
        <Text
          style={s.plateText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {link?.vehicleModel ?? mock.vehicle.modelEn} |{'  '}
          {link?.plateNumberMasked ?? mock.vehicle.plate}
        </Text>
      </View>
    </OnboardScreen>
  );
}

const TERMS = [
  {
    title: '(필수) 위치 공유',
    desc: "만나는 곳까지 안내하려면 '항상 허용'이 필요해요.",
    required: true,
  },
  {
    title: '(필수) 알림 권한',
    desc: '부모님 출발과 도착을 알려줘요.',
    required: true,
  },
  {
    title: '(선택) 서비스 개선',
    desc: '픽업 기록을 서비스 개선에 활용해요.',
    required: false,
  },
];

/** 가족 프로필 등록 4 · 권한 동의. 필수 항목을 모두 체크해야 [다음으로]가 켜진다 */
export function TermsScreen({ navigation }: P<'PTerms'>) {
  const patch = useFamilyDraft(d => d.patch);
  const [checked, setChecked] = useState(TERMS.map(() => false));
  const requiredOk = TERMS.every((t, i) => !t.required || checked[i]);

  return (
    <OnboardScreen
      step={1}
      footer={
        <PillButton
          label="다음으로"
          disabled={!requiredOk}
          onPress={() => {
            patch({
              consents: {
                location: checked[0],
                push: checked[1],
                improve: checked[2],
              },
            });
            navigation.navigate('PGuardianProfile');
          }}
        />
      }
    >
      <CenterTitle
        title={'서비스 이용을 위해\n정보 제공에 동의해주세요.'}
        sub="차량 정보가 맞는지 확인해주세요."
      />
      <View style={s.flex} />
      <View style={s.termsCard}>
        <Text style={s.termsTitle}>권한 동의</Text>
        <Dots />
        <View style={s.termsList}>
          {TERMS.map((t, i) => (
            <Pressable
              key={t.title}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: checked[i] }}
              onPress={() =>
                setChecked(c => c.map((v, j) => (j === i ? !v : v)))
              }
              style={s.termRow}
            >
              <View style={s.flex}>
                <Text style={s.termTitle}>{t.title}</Text>
                <Text style={s.termDesc}>{t.desc}</Text>
              </View>
              <CheckBox on={checked[i]} />
            </Pressable>
          ))}
        </View>
      </View>
    </OnboardScreen>
  );
}

/** 시안의 점선 구분선 */
function Dots() {
  return (
    <View style={s.dots}>
      {Array.from({ length: 70 }, (_, i) => (
        <View key={i} style={s.dot} />
      ))}
    </View>
  );
}

function CheckBox({ on }: { on: boolean }) {
  return (
    <View style={[s.check, on ? s.checkOn : s.checkOff]}>
      {on ? <View style={s.checkMark} /> : null}
    </View>
  );
}

/**
 * 이름 입력 화면 공통: 화면이 열리자마자 키보드를 띄우고,
 * 엔터를 누르거나 빈 곳을 누르면 바로 다음 화면(사진 등록)으로 넘어간다.
 */
function useNameStep(value: string, onDone: () => void) {
  const ref = useRef<TextInputRef>(null);
  const focused = useIsFocused();
  useEffect(() => {
    if (!focused) {
      return;
    }
    // 화면 전환 애니메이션 중에는 Android가 포커스를 무시해서 조금 늦춘다
    const t = setTimeout(() => ref.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [focused]);
  const next = () => {
    if (!value.trim()) {
      ref.current?.focus();
      return;
    }
    Keyboard.dismiss();
    onDone();
  };
  return { ref, next };
}

/** 가족 프로필 등록 5·6 · 보호자 호칭 */
export function GuardianProfileScreen({ navigation }: P<'PGuardianProfile'>) {
  const alias = useFamilyDraft(d => d.guardianAlias);
  const setAlias = useFamilyDraft(d => d.setGuardianAlias);
  const { ref, next } = useNameStep(alias, () =>
    navigation.navigate('PGuardianPhoto'),
  );
  return (
    <OnboardScreen
      step={2}
      onBlankPress={next}
      footer={<PillButton label="다음으로" onPress={next} />}
    >
      <CenterTitle
        title="보호자 프로필 설정"
        sub={'원활한 픽업 안내를 위해\n보호자의 프로필을 등록해요.'}
      />
      <PillInput
        inputRef={ref}
        value={alias}
        onChangeText={setAlias}
        placeholder="자녀에게 누구라고 안내 할까요?"
        onSubmit={next}
        style={s.nameInput}
      />
    </OnboardScreen>
  );
}

/** 사진 선택(직접 촬영 / 사진첩) 바텀시트 */
function PhotoSheet({
  visible,
  onClose,
  onPicked,
  onClear,
}: {
  visible: boolean;
  onClose(): void;
  onPicked(): void;
  onClear?(): void;
}) {
  const pick = () => {
    onClose();
    onPicked();
  };
  return (
    <BottomSheet visible={visible} onClose={onClose} sheetStyle={s.sheetBg}>
      <View style={s.sheet}>
        <PillButton variant="white" label="직접 촬영하기" onPress={pick} />
        <PillButton label="사진첩에서 업로드" onPress={pick} />
        {onClear ? (
          <Pressable
            onPress={() => {
              onClose();
              onClear();
            }}
            style={s.sheetLink}
          >
            <Text style={s.sheetLinkText}>기본 이미지 사용</Text>
          </Pressable>
        ) : null}
      </View>
    </BottomSheet>
  );
}

/** 보호자 · 자녀 사진 등록 화면 공통 */
function PhotoStep({
  step,
  title,
  sub,
  name,
  onName,
  photo,
  sample,
  onPhoto,
  onNext,
}: {
  step: number;
  title: string;
  sub: string;
  name: string;
  onName(v: string): void;
  photo: ImageSourcePropType | null;
  sample: ImageSourcePropType;
  onPhoto(v: ImageSourcePropType | null): void;
  onNext(): Promise<void> | void;
}) {
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onNext();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <OnboardScreen
      step={step}
      onBlankPress={Keyboard.dismiss}
      footer={
        <>
          <Text style={[s.photoHint, error ? s.errorText : null]}>
            {error ?? '사진을 등록하지 않으면 기본 이미지가 사용돼요'}
          </Text>
          <PillButton
            label={busy ? '저장하는 중…' : '다음으로'}
            disabled={busy}
            onPress={next}
          />
        </>
      }
    >
      <CenterTitle title={title} sub={sub} />
      <View style={s.photoGap}>
        <ProfilePhoto photo={photo} onPress={() => setSheet(true)} />
      </View>
      <PillInput
        value={name}
        onChangeText={onName}
        onSubmit={Keyboard.dismiss}
        style={s.photoName}
      />
      <PhotoSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        onPicked={() => onPhoto(sample)}
        onClear={photo ? () => onPhoto(null) : undefined}
      />
    </OnboardScreen>
  );
}

/** 가족 프로필 등록 · 보호자 사진 (사진이 없으면 기본 이미지) */
export function GuardianPhotoScreen({ navigation }: P<'PGuardianPhoto'>) {
  const d = useFamilyDraft();
  // 같은 승인의 재시도는 같은 키로 (중복 연결 방지)
  const linkKey = useRef(newIdempotencyKey());
  return (
    <PhotoStep
      step={2}
      title="보호자 프로필 설정"
      sub={'원활한 픽업 안내를 위해\n보호자의 프로필을 등록해요.'}
      name={d.guardianAlias}
      onName={d.setGuardianAlias}
      photo={d.guardianPhoto}
      sample={img.guardianSample}
      onPhoto={d.setGuardianPhoto}
      onNext={async () => {
        const signedIn = !!useAuthStore.getState().auth;
        if (d.link && !signedIn) {
          const c = d.consents;
          await approveLink(
            d.link,
            d.guardianAlias,
            consentsFrom(c?.location ?? true, c?.push ?? true),
            linkKey.current,
          );
        }
        navigation.navigate('PChildProfile');
      }}
    />
  );
}

/** 가족 프로필 등록 · 자녀 이름 (보호자 때처럼 키보드가 바로 올라온다) */
export function ChildProfileScreen({ navigation }: P<'PChildProfile'>) {
  const name = useFamilyDraft(d => d.childName);
  const setName = useFamilyDraft(d => d.setChildName);
  const { ref, next } = useNameStep(name, () =>
    navigation.navigate('PChildPhoto'),
  );
  return (
    <OnboardScreen
      step={3}
      onBlankPress={next}
      footer={<PillButton label="다음으로" onPress={next} />}
    >
      <CenterTitle
        title="내 자녀 프로필 설정"
        sub={'원활한 픽업을 위해\n자녀 이름을 등록해 주세요.'}
      />
      <PillInput
        inputRef={ref}
        value={name}
        onChangeText={setName}
        placeholder="자녀 이름을 입력해 주세요."
        onSubmit={next}
        style={s.nameInput}
      />
    </OnboardScreen>
  );
}

/** 가족 프로필 등록 · 자녀 사진 */
export function ChildPhotoScreen({ navigation }: P<'PChildPhoto'>) {
  const d = useFamilyDraft();
  const server = useServerMode();
  const childKey = useRef(newIdempotencyKey());
  return (
    <PhotoStep
      step={3}
      title="내 자녀 프로필 설정"
      sub={'원활한 픽업 안내를 위해\n자녀 프로필을 등록해요.'}
      name={d.childName}
      onName={d.setChildName}
      photo={d.childPhoto}
      sample={img.childSample}
      onPhoto={d.setChildPhoto}
      onNext={async () => {
        if (server && !d.childId) {
          const childId = await registerChild(d.childName, childKey.current);
          d.patch({ childId });
        }
        navigation.navigate('PInviteShare');
      }}
    />
  );
}

const DEMO_INVITE = 'https://ilink.app/invite/demo';

/** 가족 프로필 등록 · 초대장 공유. 편지지를 누르면 링크가 복사된다 */
export function InviteShareScreen({ navigation }: P<'PInviteShare'>) {
  const server = useServerMode();
  const childId = useFamilyDraft(d => d.childId);
  const saved = useFamilyDraft(d => d.inviteUrl);
  const patch = useFamilyDraft(d => d.patch);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inviteKey = useRef(newIdempotencyKey());
  // 서버 모드면 자녀 초대 링크(FAM-04)를 받는다
  useEffect(() => {
    if (!server || !childId || saved) return;
    issueInvite(childId, inviteKey.current)
      .then(inviteUrl => patch({ inviteUrl }))
      .catch(e => setError(errorText(e)));
  }, [server, childId, saved, patch]);
  const INVITE_LINK = saved || DEMO_INVITE;
  const copy = () => {
    Clipboard.setString(INVITE_LINK);
    setCopied(true);
    if (Platform.OS === 'android') {
      ToastAndroid.show('초대 링크를 복사했어요.', ToastAndroid.SHORT);
    }
  };
  const share = async () => {
    try {
      const r = await Share.share({
        message: `iLink 가족 초대장이 도착했어요.\n${INVITE_LINK}`,
      });
      if (r.action === Share.dismissedAction) {
        return;
      }
    } catch {
      return;
    }
    navigation.navigate('PInviteSent');
  };
  return (
    <OnboardScreen
      step={4}
      footer={<PillButton label="자녀에게 초대장 공유하기" onPress={share} />}
    >
      <CenterTitle
        title="가족 프로필 연결"
        sub={'계정 연결을 위해\n자녀에게 초대장을 보내보세요.'}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="초대 링크 복사"
        onPress={copy}
        onLongPress={() => navigation.navigate('PInviteSent')}
        style={s.envelopeOpenWrap}
      >
        <Image source={img.envelopeOpen} style={s.envelopeOpen} />
      </Pressable>
      <Text style={s.envelopeHint}>
        {error ??
          (copied
            ? '링크를 복사했어요.'
            : '편지지를 터치하면 링크가 복사돼요.')}
      </Text>
    </OnboardScreen>
  );
}

/** 가족 프로필 등록 · 초대장 전송 완료 → 픽업 일정 등록 2로 바로 이어진다 */
export function InviteSentScreen({ navigation }: P<'PInviteSent'>) {
  const setInvited = useFamilyDraft(d => d.setInvited);
  const resetSchedule = useScheduleDraft(d => d.reset);
  return (
    <OnboardScreen
      footer={
        <PillButton
          label="픽업 일정 등록하기"
          onPress={() => {
            setInvited(true);
            resetSchedule();
            navigation.reset({
              index: 1,
              routes: [
                { name: 'PMain', params: { tab: 'home' } },
                { name: 'PScheduleIntro', params: { fromInvite: true } },
              ],
            });
          }}
        />
      }
    >
      <CenterTitle
        title="초대장을 전송했어요!"
        sub={
          '자녀가 수락할 때 바로 픽업할 수 있도록\n자녀 픽업 일정을 등록해보세요.'
        }
      />
      <Image source={img.envelopeClosed} style={s.envelopeClosed} />
    </OnboardScreen>
  );
}

/** 서버 오류 → 화면 문구 */
function errorText(e: unknown) {
  if (e instanceof ApiError) {
    if (e.isNetwork) return '인터넷 연결을 확인해 주세요.';
    // 해제된 자녀에게 초대를 발급하면 404 (2026.11.14)
    if (e.code === 'NOT_FOUND') return notFoundMessage('member');
    return messageFor(e.code, e.message);
  }
  return '잠시 후 다시 시도해 주세요.';
}

/**
 * 가족 프로필 등록 · 인증 번호 입력 (가족 프로필 등록 1의 '인증 번호로 등록할래요')
 * 차량 화면(V00)의 연결 코드를 넣으면 LINK-03으로 확인하고 차량 정보 확인으로 간다.
 */
export function CodeEntryScreen({ navigation }: P<'PCodeEntry'>) {
  const patch = useFamilyDraft(d => d.patch);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<TextInputRef>(null);
  const focused = useIsFocused();
  useEffect(() => {
    if (!focused) return;
    const t = setTimeout(() => ref.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [focused]);
  const submit = async () => {
    if (!code.trim() || busy) return;
    Keyboard.dismiss();
    setBusy(true);
    setError(null);
    try {
      patch({ link: await checkLinkCode(code) });
      navigation.navigate('PCarConfirm');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <OnboardScreen
      footer={
        <>
          {error ? (
            <Text style={[s.photoHint, s.errorText]}>{error}</Text>
          ) : null}
          <PillButton
            label={busy ? '확인하는 중…' : '다음으로'}
            disabled={!code.trim() || busy}
            onPress={submit}
          />
        </>
      }
    >
      <CenterTitle
        title="인증 번호로 등록해요"
        sub={'차량 화면에 보이는\n연결 번호를 입력해 주세요.'}
      />
      <PillInput
        inputRef={ref}
        value={code}
        onChangeText={v => setCode(v.toUpperCase())}
        placeholder="연결 번호"
        onSubmit={submit}
        style={s.nameInput}
      />
    </OnboardScreen>
  );
}

const SCREEN_W = 390;
const CORNER = 84;
const STROKE = 6;
const CORNER_R = 30;

const s = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 8 },
  regularLabel: { fontFamily: pf.regular },
  bullets: { gap: 7, paddingLeft: 9, marginBottom: 26 },
  bulletRow: { flexDirection: 'row', alignItems: 'center' },
  bulletDot: {
    width: 12,
    fontFamily: pf.regular,
    fontSize: 12,
    color: v2.ink,
  },
  bulletText: {
    fontFamily: pf.regular,
    fontSize: 15.5,
    lineHeight: 17,
    letterSpacing: -0.3,
    color: v2.ink,
  },

  // QR 촬영
  camRoot: { flex: 1, backgroundColor: '#0F1000' },
  dim: { position: 'absolute', left: 0, right: 0, top: '58%', bottom: 0 },
  dimRow: { flex: 1, backgroundColor: '#0F1000' },
  dimSolid: { height: 0 },
  frame: {
    position: 'absolute',
    left: (SCREEN_W - 308) / 2,
    top: 201,
    width: 308,
    height: 308,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#FFFFFF',
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: STROKE,
    borderLeftWidth: STROKE,
    borderTopLeftRadius: CORNER_R,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: STROKE,
    borderRightWidth: STROKE,
    borderTopRightRadius: CORNER_R,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: STROKE,
    borderLeftWidth: STROKE,
    borderBottomLeftRadius: CORNER_R,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: STROKE,
    borderRightWidth: STROKE,
    borderBottomRightRadius: CORNER_R,
  },
  camBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  camGuide: {
    fontFamily: pf.regular,
    fontSize: 19.5,
    letterSpacing: -0.4,
    color: '#FFFFFF',
    marginBottom: 29,
  },
  shutter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  shutterPressed: { transform: [{ scale: 0.94 }] },
  shutterInner: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#777770',
  },

  // 차량 확인
  prevBtn: { width: 106 },
  car: { width: 274, height: 130, alignSelf: 'center', marginTop: 146 },
  // 칩 폭은 글자에 맞춘다 (시안 230pt가 최소). 화면보다 길면 한 줄을 지키며 글자를 줄인다
  plate: {
    alignSelf: 'center',
    minWidth: 230,
    maxWidth: '100%',
    paddingHorizontal: 28,
    height: 47,
    borderRadius: 21,
    backgroundColor: v2.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 49,
  },
  plateText: {
    fontFamily: pf.regular,
    fontSize: 17,
    letterSpacing: -0.3,
    color: v2.ink,
  },

  // 약관
  termsCard: {
    backgroundColor: v2.white,
    borderRadius: 22,
    paddingTop: 24,
    paddingBottom: 21,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  termsTitle: {
    fontFamily: pf.bold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.4,
    color: v2.ink,
  },
  dots: {
    marginTop: 15,
    marginRight: 8,
    height: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  dot: { width: 1.5, height: 1, backgroundColor: '#DCDCDC' },
  termsList: { marginTop: 16, gap: 12 },
  termRow: { flexDirection: 'row', alignItems: 'flex-start' },
  termTitle: {
    fontFamily: pf.bold,
    fontSize: 16.5,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: v2.ink,
  },
  termDesc: {
    fontFamily: pf.regular,
    fontSize: 13,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: v2.desc,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkOn: { backgroundColor: v2.ink },
  checkOff: {
    backgroundColor: v2.white,
    borderWidth: 1.5,
    borderColor: v2.checkOff,
  },
  checkMark: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: v2.white,
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },

  // 이름 · 사진
  nameInput: { marginTop: 81 },
  photoGap: { marginTop: 81 },
  photoName: { marginTop: 37 },
  errorText: { color: '#D93B3B' },
  photoHint: {
    textAlign: 'center',
    fontFamily: pf.regular,
    fontSize: 15,
    letterSpacing: -0.3,
    color: v2.ink,
    marginBottom: 8,
  },
  sheet: { gap: 8 },
  sheetBg: {
    backgroundColor: v2.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetLink: { alignItems: 'center', paddingVertical: 10 },
  sheetLinkText: {
    fontFamily: pf.medium,
    fontSize: 15,
    color: v2.disabledText,
  },

  // 초대장
  envelopeOpenWrap: { alignSelf: 'center', marginTop: 63 },
  envelopeOpen: { width: 214, height: 226 },
  envelopeHint: {
    textAlign: 'center',
    marginTop: 28,
    fontFamily: pf.regular,
    fontSize: 15,
    letterSpacing: -0.3,
    color: v2.ink,
  },
  envelopeClosed: {
    width: 214,
    height: 132,
    alignSelf: 'center',
    marginTop: 125,
  },
});
