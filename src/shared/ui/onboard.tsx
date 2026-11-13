import type { ComponentRef, PropsWithChildren, ReactNode, Ref } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Keyboard,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  type TextStyle,
  TouchableWithoutFeedback,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pretendard as pf, v2 } from '../theme/tokens';

/*
 * 2차 디자인 공통 요소 (가족 프로필 등록 · 픽업 일정 등록 1~2).
 * 치수는 시안 PNG(390pt 폭, @3x)에서 잰 값이다.
 */

export const STEP_COUNT = 5;

export type TextInputRef = ComponentRef<typeof TextInput>;

/** 화면 틀: #F0F0F0 바탕, 위 단계 표시줄, 아래 고정 버튼 */
export function OnboardScreen({
  step,
  children,
  footer,
  onBlankPress,
  style,
}: PropsWithChildren<{
  /** 0부터. 없으면 단계 표시줄 자리를 비운다 */
  step?: number;
  footer?: ReactNode;
  /** 빈 화면을 눌렀을 때 (입력 화면에서 다음으로 넘길 때 쓴다) */
  onBlankPress?(): void;
  style?: StyleProp<ViewStyle>;
}>) {
  const body = (
    <View style={[s.body, style]}>
      <View style={s.stepWrap}>
        {step !== undefined ? <StepBar step={step} /> : null}
      </View>
      {children}
    </View>
  );
  // 시안은 iPhone(상태 표시줄 47pt, 홈 표시줄 포함 아래 21pt) 기준 절대 위치다.
  // 상태 표시줄이 더 얇은 Android에서도 같은 자리에 오도록 위·아래 여백을 시안 값에 맞춘다.
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        s.root,
        {
          paddingTop: Math.max(insets.top, DESIGN_STATUS_BAR),
          paddingBottom: Math.max(insets.bottom, DESIGN_BOTTOM),
        },
      ]}
    >
      {onBlankPress ? (
        <TouchableWithoutFeedback onPress={onBlankPress} accessible={false}>
          {body}
        </TouchableWithoutFeedback>
      ) : (
        body
      )}
      {footer ? <View style={s.footer}>{footer}</View> : null}
    </View>
  );
}

/** 가운데 정렬 5칸 단계 표시줄. 현재 단계만 길고 진하다 */
export function StepBar({ step }: { step: number }) {
  return (
    <View style={s.stepBar}>
      {Array.from({ length: STEP_COUNT }, (_, i) => (
        <View key={i} style={[s.seg, i === step && s.segOn]} />
      ))}
    </View>
  );
}

export function CenterTitle({
  title,
  sub,
  style,
}: {
  title: string;
  sub?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.titleWrap, style]}>
      <Text style={s.title}>{title}</Text>
      {sub ? <Text style={s.sub}>{sub}</Text> : null}
    </View>
  );
}

type PillVariant = 'dark' | 'white';

export function PillButton({
  label,
  onPress,
  variant = 'dark',
  disabled,
  style,
  labelStyle,
}: {
  label: string;
  onPress(): void;
  variant?: PillVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.pill,
        variant === 'dark' ? s.pillDark : s.pillWhite,
        disabled && s.pillDisabled,
        pressed && !disabled && s.pressed,
        style,
      ]}
    >
      <Text
        style={[
          s.pillLabel,
          variant === 'dark' && s.pillLabelLight,
          disabled && s.pillLabelDisabled,
          labelStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** 흰 알약 입력칸 (가운데 정렬) */
export function PillInput({
  value,
  onChangeText,
  placeholder,
  autoFocus,
  onSubmit,
  inputRef,
  editable = true,
  style,
}: {
  value: string;
  onChangeText?(v: string): void;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmit?(): void;
  inputRef?: Ref<TextInputRef>;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.inputPill, style]}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={v2.placeholder}
        autoFocus={autoFocus}
        showSoftInputOnFocus
        editable={editable}
        returnKeyType="next"
        submitBehavior="blurAndSubmit"
        onSubmitEditing={onSubmit}
        style={s.input}
      />
    </View>
  );
}

export const AVATAR = 114;

/** 프로필 사진 + 오른쪽 아래 카메라 버튼. 사진이 없으면 기본 이미지(회색 원) */
export function ProfilePhoto({
  photo,
  onPress,
  size = AVATAR,
  badge = true,
}: {
  photo?: ImageSourcePropType | null;
  onPress?(): void;
  size?: number;
  badge?: boolean;
}) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel="프로필 사진 등록"
      style={[s.photoWrap, { width: size, height: size }]}
    >
      <View
        style={[s.photo, { width: size, height: size, borderRadius: size / 2 }]}
      >
        {photo ? (
          <Image
            source={photo}
            style={{ width: size, height: size }}
            resizeMode="cover"
          />
        ) : null}
      </View>
      {badge ? (
        <View style={s.badgeRing}>
          <View style={s.badge}>
            <CameraGlyph />
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

/** 카메라 아이콘 (흰 몸체 + 가운데 렌즈) */
function CameraGlyph() {
  return (
    <View style={s.cam}>
      <View style={s.camBump} />
      <View style={s.camBody}>
        <View style={s.camLens} />
      </View>
    </View>
  );
}

/** 위·아래 키보드를 닫고 콜백 실행 */
export const blurThen = (fn: () => void) => () => {
  Keyboard.dismiss();
  fn();
};

// 시안: 단계 표시줄 위끝 70pt(상태 표시줄 47pt 포함) → 안전 영역 안에서 23pt
const STEP_TOP = 23;
const DESIGN_STATUS_BAR = 47;
const DESIGN_BOTTOM = 21;
// 시안: 제목 첫 줄 글자 위끝 159pt → 안전 영역 기준 112pt
const TITLE_TOP = 82;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: v2.bg },
  body: { flex: 1, paddingHorizontal: 16 },
  stepWrap: { height: STEP_TOP + 3, justifyContent: 'flex-end' },
  stepBar: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 4,
  },
  seg: { width: 24, height: 3, borderRadius: 1.5, backgroundColor: v2.stepOff },
  segOn: { width: 73, backgroundColor: v2.stepOn },
  titleWrap: { alignItems: 'center', marginTop: TITLE_TOP },
  title: {
    fontFamily: pf.bold,
    fontSize: 26,
    lineHeight: 33,
    letterSpacing: -0.5,
    color: v2.ink,
    textAlign: 'center',
  },
  sub: {
    marginTop: 7,
    fontFamily: pf.regular,
    fontSize: 17,
    lineHeight: 24.5,
    letterSpacing: -0.3,
    color: v2.ink,
    textAlign: 'center',
  },
  footer: { paddingHorizontal: 16, gap: 8 },
  pill: {
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pillDark: { backgroundColor: v2.ink },
  pillWhite: { backgroundColor: v2.white },
  pillDisabled: { backgroundColor: v2.white },
  pressed: { opacity: 0.85 },
  pillLabel: {
    fontFamily: pf.semibold,
    fontSize: 17.5,
    letterSpacing: -0.3,
    color: v2.ink,
  },
  pillLabelLight: { color: v2.white },
  pillLabelDisabled: { color: v2.disabledText },
  inputPill: {
    height: 60,
    marginHorizontal: 28,
    borderRadius: 30,
    backgroundColor: v2.white,
    justifyContent: 'center',
  },
  input: {
    fontFamily: pf.semibold,
    fontSize: 18,
    letterSpacing: -0.3,
    color: v2.ink,
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 20,
    height: 60,
  },
  photoWrap: { alignSelf: 'center' },
  photo: { backgroundColor: v2.avatarEmpty, overflow: 'hidden' },
  // 시안: 지름 27pt 검정 원 + 2pt 바탕색 테두리, 중심이 사진 중심에서 (41, 41)
  badgeRing: {
    position: 'absolute',
    left: AVATAR / 2 + 41 - 15.5,
    top: AVATAR / 2 + 41 - 15.5,
    width: 31,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: v2.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: v2.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cam: { alignItems: 'center' },
  camBump: {
    width: 5,
    height: 2,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
    backgroundColor: v2.white,
  },
  camBody: {
    width: 12,
    height: 8.5,
    borderRadius: 2,
    backgroundColor: v2.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camLens: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    borderWidth: 1.2,
    borderColor: v2.ink,
  },
});

export const onboardStyles = s;
