import {
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { colors, font, radius, spacing } from '../theme/tokens';

type Variant = 'primary' | 'ghost' | 'outline' | 'dark' | 'soft';

type Props = {
  label: string;
  onPress(): void;
  disabled?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'sm';
};

export function Button({
  label,
  onPress,
  disabled,
  variant = 'primary',
  style,
  size = 'md',
}: Props) {
  const v = variant === 'ghost' ? 'outline' : variant;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.sm,
        styles[v],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          size === 'sm' && styles.smLabel,
          (v === 'primary' || v === 'dark') && styles.lightLabel,
          v === 'soft' && styles.softLabel,
          disabled && styles.disabledLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  sm: { minHeight: 32, borderRadius: radius.md, paddingHorizontal: 12 },
  primary: { backgroundColor: colors.primary },
  outline: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dark: { backgroundColor: colors.dark },
  soft: { backgroundColor: colors.surfaceAlt },
  // Figma: 비활성 버튼은 연회색 바탕 + 회색 글자
  disabled: { backgroundColor: colors.surface, borderColor: colors.surface },
  pressed: { opacity: 0.85 },
  label: { fontSize: font.body, color: colors.text, fontWeight: '600' },
  smLabel: { fontSize: font.caption },
  lightLabel: { color: '#FFFFFF' },
  softLabel: { color: colors.subText },
  disabledLabel: { color: '#4A4C53' },
});
