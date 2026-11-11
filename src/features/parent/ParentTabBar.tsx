import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font } from '../../shared/theme/tokens';

export type ParentTab = 'home' | 'status' | 'records' | 'my';

const TABS: { key: ParentTab; label: string; icon: ImageSourcePropType }[] = [
  { key: 'home', label: '홈', icon: require('../../assets/images/home.png') },
  {
    key: 'status',
    label: '현황',
    icon: require('../../assets/images/route.png'),
  },
  {
    key: 'records',
    label: '기록',
    icon: require('../../assets/images/history_2.png'),
  },
  { key: 'my', label: '마이', icon: require('../../assets/images/person.png') },
];

const INACTIVE = '#999DA3';

/** 부모 하단 탭 바. 메인 화면과 이용 결과(P09)에서 함께 쓴다. */
export function ParentTabBar({
  tab,
  onChange,
}: {
  tab: ParentTab;
  onChange(t: ParentTab): void;
}) {
  return (
    <SafeAreaView edges={['bottom']} style={s.bar}>
      {TABS.map(t => {
        const on = t.key === tab;
        const color = on ? colors.primary : INACTIVE;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={s.item}
            onPress={() => onChange(t.key)}
          >
            <Image source={t.icon} style={[s.icon, { tintColor: color }]} />
            <Text style={[s.label, { color }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 4, paddingBottom: 6 },
  icon: { width: 28, height: 28 },
  label: { fontSize: font.tiny, fontWeight: '500' },
});
