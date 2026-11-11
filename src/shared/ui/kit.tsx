import type { PropsWithChildren, ReactNode } from 'react';
import {
  Image,
  type ImageSourcePropType,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, spacing } from '../theme/tokens';

/** 기본 화면 틀: 상단 영역 + 스크롤 본문 + 하단 고정 버튼 영역 */
export function Screen({
  children,
  header,
  footer,
  scroll = true,
  gradient,
  bg,
  style,
}: PropsWithChildren<{
  header?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  gradient?: boolean;
  /** 화면 상단 배경 이미지 (Figma 그라데이션을 잘라 만든 것). 아래로 갈수록 흰색으로 이어진다. */
  bg?: ImageSourcePropType;
  style?: ViewStyle;
}>) {
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {bg ? (
        <Image
          source={bg}
          resizeMode="stretch"
          pointerEvents="none"
          style={styles.bgImage}
        />
      ) : gradient ? (
        <TopGlow />
      ) : null}
      {header}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Body
          style={styles.flex}
          {...(scroll
            ? { contentContainerStyle: [styles.body, style] }
            : { style: [styles.flex, styles.body, style] })}
        >
          {children}
        </Body>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Figma 상단의 연한 파랑→초록 그라데이션을 두 겹 반투명 블록으로 흉내 낸다. */
const GLOW_STEPS = [0.9, 0.75, 0.6, 0.45, 0.32, 0.2, 0.1, 0.04];

function TopGlow() {
  return (
    <View pointerEvents="none" style={styles.glow}>
      {GLOW_STEPS.map(o => (
        <View key={o} style={[styles.glowRow, { opacity: o }]}>
          <View style={[styles.flex, styles.glowBlue]} />
          <View style={[styles.flex, styles.glowGreen]} />
        </View>
      ))}
    </View>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.progressTrack}>
      <View
        style={[styles.progressFill, { width: `${Math.min(1, value) * 100}%` }]}
      />
    </View>
  );
}

export function TopBar({
  progress,
  onClose,
  onBack,
  title,
}: {
  progress?: number;
  onClose?(): void;
  onBack?(): void;
  title?: string;
}) {
  return (
    <View>
      {progress !== undefined ? <ProgressBar value={progress} /> : null}
      <View style={styles.topBar}>
        {onBack ? <IconButton glyph="‹" onPress={onBack} big /> : <View />}
        {title ? (
          <View pointerEvents="none" style={styles.topTitleWrap}>
            <Text style={styles.topTitle}>{title}</Text>
          </View>
        ) : null}
        {onClose ? <IconButton glyph="✕" onPress={onClose} /> : <View />}
      </View>
    </View>
  );
}

export function IconButton({
  glyph,
  onPress,
  big,
}: {
  glyph: string;
  onPress(): void;
  big?: boolean;
}) {
  return (
    <Pressable hitSlop={12} onPress={onPress} style={styles.iconBtn}>
      <Text style={[styles.iconGlyph, big && styles.iconGlyphBig]}>
        {glyph}
      </Text>
    </Pressable>
  );
}

export function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export function Headline({
  chip,
  title,
  highlight,
}: {
  chip?: string;
  title: string;
  /** 제목 앞부분을 파랑으로 강조 (예: 자녀 이름) */
  highlight?: string;
}) {
  return (
    <View style={styles.headline}>
      {chip ? <Chip label={chip} /> : null}
      <Text style={styles.title}>
        {highlight ? <Text style={styles.titleAccent}>{highlight}</Text> : null}
        {title}
      </Text>
    </View>
  );
}

export function CenterHeadline({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.hero}>{title}</Text>
    </View>
  );
}

export function InfoRows({ rows }: { rows: [string, string][] }) {
  return (
    <View style={styles.infoRows}>
      {rows.map(([k, v]) => (
        <View key={k} style={styles.infoRow}>
          <Text style={styles.infoKey}>{k}</Text>
          <Text style={styles.infoVal}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

export function Checkbox({
  checked,
  onPress,
  label,
  trailing,
  tone = 'primary',
}: {
  checked: boolean;
  onPress(): void;
  label: string;
  trailing?: string;
  tone?: 'primary' | 'dark';
}) {
  const on = tone === 'dark' ? colors.dark : colors.primary;
  return (
    <Pressable onPress={onPress} style={styles.checkRow}>
      <View
        style={[
          styles.checkBox,
          { backgroundColor: checked ? on : colors.bg },
          !checked && styles.checkBoxOff,
        ]}
      >
        {checked ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
      {trailing ? <Text style={styles.checkTrailing}>{trailing}</Text> : null}
    </Pressable>
  );
}

export function Radio({ on }: { on: boolean }) {
  return (
    <View style={[styles.radio, on && styles.radioOn]}>
      {on ? <View style={styles.radioDot} /> : null}
    </View>
  );
}

/** 사진 자리. Figma 원본 이미지를 아직 내려받지 못해 이니셜로 대신한다. */
export function Avatar({
  name,
  size = 44,
  tint = '#DCE3F5',
}: {
  name?: string;
  size?: number;
  tint?: string;
}) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tint,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>
        {name ? name.slice(-2) : '?'}
      </Text>
    </View>
  );
}

/** 일러스트 자리 (3D 캐릭터·자동차 등) */
export function Illustration({
  emoji,
  size = 160,
  bg = 'transparent',
}: {
  emoji: string;
  size?: number;
  bg?: string;
}) {
  return (
    <View
      style={[
        styles.illus,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

export function UnderlineField({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value?: string;
  placeholder: string;
  onPress?(): void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, !value && styles.fieldPlaceholder]}>
        {value || placeholder}
      </Text>
    </Pressable>
  );
}

export function BottomSheet({
  visible,
  onClose,
  children,
  tall,
}: PropsWithChildren<{ visible: boolean; onClose(): void; tall?: boolean }>) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.dim} onPress={onClose} />
      <View style={[styles.sheet, tall && styles.sheetTall]}>{children}</View>
    </Modal>
  );
}

/** 화면 가운데 뜨는 카드형 알림 (경로 이탈, 탑승 확인 등) */
export function CenterDialog({
  visible,
  onClose,
  children,
}: PropsWithChildren<{ visible: boolean; onClose(): void }>) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.dim, styles.dimCenter]} onPress={onClose}>
        <Pressable style={styles.dialog}>{children}</Pressable>
      </Pressable>
    </Modal>
  );
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

export const kitStyles = StyleSheet.create({
  footerStack: { gap: spacing.sm },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  footer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  glow: { position: 'absolute', top: 0, left: 0, right: 0 },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 380,
  },
  glowRow: { height: 18, flexDirection: 'row' },
  glowBlue: { backgroundColor: '#DCE6FF' },
  glowGreen: { backgroundColor: '#DDF6E4' },
  progressTrack: {
    height: 2,
    marginHorizontal: spacing.md,
    backgroundColor: colors.border,
  },
  progressFill: { height: 2, backgroundColor: colors.primary },
  topBar: {
    height: 48,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topTitleWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    textAlign: 'center',
    fontSize: font.heading,
    fontWeight: '600',
    color: colors.text,
  },
  iconBtn: { minWidth: 24, alignItems: 'center' },
  iconGlyph: { fontSize: 20, color: colors.text },
  iconGlyphBig: { fontSize: 32, lineHeight: 34 },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipText: { color: '#FFFFFF', fontSize: font.label, fontWeight: '600' },
  headline: { gap: 12, marginTop: spacing.sm },
  title: {
    fontSize: font.title,
    lineHeight: 36,
    fontWeight: '600',
    color: colors.text,
  },
  titleAccent: { color: colors.primary },
  center: { alignItems: 'center', gap: 12 },
  eyebrow: { color: colors.primary, fontSize: font.body, fontWeight: '600' },
  hero: {
    fontSize: font.hero,
    lineHeight: 36,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  infoRows: { borderTopWidth: 1, borderColor: colors.border },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  infoKey: { fontSize: font.body, color: colors.text, fontWeight: '500' },
  infoVal: { fontSize: font.body, color: colors.text, fontWeight: '500' },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOff: { backgroundColor: '#A9ACB2' },
  checkMark: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  checkLabel: {
    flex: 1,
    fontSize: font.body,
    color: colors.text,
    fontWeight: '500',
  },
  checkTrailing: { fontSize: font.label, color: colors.muted },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontWeight: '700' },
  illus: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  field: {
    borderBottomWidth: 1,
    borderColor: colors.line,
    paddingBottom: 10,
    gap: 12,
  },
  fieldLabel: { fontSize: font.body, color: colors.subText, fontWeight: '500' },
  fieldValue: { fontSize: font.body, color: colors.text, fontWeight: '600' },
  fieldPlaceholder: { color: colors.muted, fontWeight: '400' },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: colors.dim },
  dimCenter: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.sm,
  },
  sheetTall: { top: 240 },
  dialog: {
    width: '100%',
    backgroundColor: colors.bg,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  divider: { height: 1, backgroundColor: colors.border },
});
