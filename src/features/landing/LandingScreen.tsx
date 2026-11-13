import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DemoStackParams } from '../../app/navigation/types';
import { Screen } from '../../shared/ui/kit';
import { colors, font, radius, spacing } from '../../shared/theme/tokens';

type Props = NativeStackScreenProps<DemoStackParams, 'Landing'>;

const landingBg = require('../../assets/images/child/bg_bluegreen.png');

/** 랜딩: Figma에 아직 없어 부모/자녀 진입 선택만 둔다. */
export function LandingScreen({ navigation }: Props) {
  return (
    <Screen bg={landingBg} scroll={false} style={styles.body}>
      <View style={styles.top}>
        <Text style={styles.logo}>iLink</Text>
        <Text style={styles.sub}>
          아이 픽업을 차량과 휴대폰으로{'\n'}함께 챙겨요.
        </Text>
      </View>
      <View style={styles.cards}>
        <RoleCard
          emoji="부모"
          title="부모"
          desc="차량을 연결하고 자녀의 픽업 일정을 관리해요."
          onPress={() => navigation.navigate('PFamilyIntro')}
        />
        <RoleCard
          emoji="자녀"
          title="자녀"
          desc="부모님의 초대를 받고 픽업 안내를 확인해요."
          onPress={() => navigation.navigate('CInvite')}
        />
      </View>
    </Screen>
  );
}

function RoleCard({
  emoji,
  title,
  desc,
  onPress,
}: {
  emoji: string;
  title: string;
  desc: string;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.emojiWrap}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
      </View>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { justifyContent: 'space-between', paddingTop: 120, paddingBottom: 40 },
  top: { gap: 12 },
  logo: { fontSize: 40, fontWeight: '700', color: colors.primary },
  sub: {
    fontSize: font.heading,
    lineHeight: 30,
    color: colors.text,
    fontWeight: '600',
  },
  cards: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 20,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  cardPressed: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  emojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 15, fontWeight: '700', color: colors.primary },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: font.heading, fontWeight: '700', color: colors.text },
  cardDesc: { fontSize: font.caption, color: colors.subText },
  chev: { fontSize: 28, color: colors.muted },
});
