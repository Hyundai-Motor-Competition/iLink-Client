import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pretendard as pf } from '../../shared/theme/tokens';

export type ParentTab = 'home' | 'status' | 'records' | 'my';

/** 시안(메인) 하단 탭: 검은 알약 안에서 고른 탭만 흰 알약 + 이름 */
const TABS: { key: ParentTab; label: string; icon: ImageSourcePropType }[] = [
  {
    key: 'home',
    label: '메인',
    icon: require('../../assets/images/v2/nav_home.png'),
  },
  {
    key: 'status',
    label: '현황',
    icon: require('../../assets/images/v2/nav_calendar.png'),
  },
  {
    key: 'records',
    label: '기록',
    icon: require('../../assets/images/v2/nav_record.png'),
  },
  {
    key: 'my',
    label: '마이',
    icon: require('../../assets/images/v2/nav_my.png'),
  },
];

/** 탭 바가 차지하는 높이 (내용 아래 여백으로 쓴다) */
export const TAB_BAR_SPACE = 100;

/** 부모 하단 탭 바. 화면 아래에 떠 있다 (메인 · 현황 · 기록 · 마이, 이용 결과 P09) */
export function ParentTabBar({
  tab,
  onChange,
}: {
  tab: ParentTab;
  onChange(t: ParentTab): void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[s.wrap, { bottom: Math.max(insets.bottom - 10, 14) }]}
    >
      <View style={s.bar}>
        {TABS.map(t => {
          const on = t.key === tab;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              accessibilityLabel={t.label}
              accessibilityState={{ selected: on }}
              onPress={() => onChange(t.key)}
              style={[s.item, on && s.itemOn]}
            >
              <Image
                source={t.icon}
                style={[s.icon, { tintColor: on ? '#111200' : '#FFFFFF' }]}
              />
              {on ? <Text style={s.label}>{t.label}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/*
 * 시안: 287 x 63pt 검은 알약(가운데), 고른 탭 92 x 57pt 흰 알약.
 * 나머지 세 아이콘은 남은 폭(287 - 6 - 92 = 189)을 63pt씩 나눠 고르게 놓는다 (늘어나는 폭으로 두면 아이콘이 한쪽으로 몰린다)
 */
const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bar: {
    width: 287,
    height: 63,
    borderRadius: 32,
    backgroundColor: '#14151A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  item: {
    width: 63,
    height: 57,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemOn: {
    width: 92,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  icon: { width: 21, height: 21 },
  label: {
    fontFamily: pf.medium,
    fontSize: 14,
    letterSpacing: -0.3,
    color: '#111200',
  },
});
