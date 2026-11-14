import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DemoStackParams } from '../../app/navigation/types';
import { pretendard as pf, v2 } from '../../shared/theme/tokens';
import { PillButton } from '../../shared/ui/onboard';

type Props = NativeStackScreenProps<DemoStackParams, 'Landing'>;
type Role = 'parent' | 'child';

const face = {
  parent: require('../../assets/images/landing/face_parent.png'),
  child: require('../../assets/images/landing/face_child.png'),
};

/*
 * 모드 선택 (랜딩): 누가 사용하시나요? → 부모 / 자녀 카드 → [다음으로]
 * 치수는 시안 PNG(390pt 폭)에서 잰 값이다. 시안 기준 상태 표시줄 47pt, 아래 여백 21pt.
 */
const DESIGN_STATUS_BAR = 47;
const DESIGN_BOTTOM = 21;

export function LandingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<Role | null>(null);
  const next = () => {
    if (role === 'parent') navigation.navigate('PFamilyIntro');
    else if (role === 'child') navigation.navigate('CInvite');
  };
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
      <View style={s.head}>
        <Text style={s.mode}>모드 선택</Text>
        <Text style={s.title}>누가 사용하시나요?</Text>
      </View>
      <View style={s.cards}>
        <RoleCard
          label="부모"
          image={face.parent}
          selected={role === 'parent'}
          onPress={() => setRole('parent')}
        />
        <RoleCard
          label="자녀"
          image={face.child}
          selected={role === 'child'}
          onPress={() => setRole('child')}
        />
      </View>
      <View style={s.footer}>
        <PillButton label="다음으로" onPress={next} />
      </View>
    </View>
  );
}

function RoleCard({
  label,
  image,
  selected,
  onPress,
}: {
  label: string;
  image: number;
  selected: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[s.card, selected && s.cardOn]}
    >
      <View style={s.illu}>
        <Image source={image} style={s.face} resizeMode="contain" />
      </View>
      <Text style={s.cardLabel}>{label}</Text>
    </Pressable>
  );
}

const CARD_H = 189.5;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EBEBEB' },
  // '모드 선택' 글자 가운데 249pt, 제목 가운데 295pt (시안 절대 위치)
  head: { marginTop: 191, alignItems: 'center' },
  mode: {
    fontFamily: pf.semibold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: v2.ink,
  },
  title: {
    marginTop: 15,
    fontFamily: pf.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: v2.ink,
  },
  // 카드는 버튼 위 14pt에 붙는다
  cards: {
    marginTop: 'auto',
    marginBottom: 14.5,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 6,
  },
  card: {
    flex: 1,
    height: CARD_H,
    borderRadius: 24,
    backgroundColor: v2.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardOn: { borderColor: v2.ink },
  illu: {
    marginTop: 18,
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: '#FCFBFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  face: { width: 88, height: 76 },
  cardLabel: {
    position: 'absolute',
    top: 145,
    fontFamily: pf.semibold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: v2.ink,
  },
  footer: { paddingHorizontal: 16 },
});
