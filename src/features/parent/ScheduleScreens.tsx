import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { DemoStackParams } from '../../app/navigation/types';
import { Button } from '../../shared/ui/Button';
import {
  BottomSheet,
  CenterHeadline,
  Checkbox,
  Headline,
  InfoRows,
  Radio,
  Screen,
  TopBar,
} from '../../shared/ui/kit';
import { colors, font, radius, spacing } from '../../shared/theme/tokens';
import { KEYWORD, mock } from './mock';
import { useSpotRecommendations } from '../spot/useSpotRecommendations';
import { DAYS, scheduleLabel, useScheduleDraft } from './scheduleDraft';
import { childPhoto } from './children';
import { usePickupStore } from './pickupStore';

type P<K extends keyof DemoStackParams> = NativeStackScreenProps<
  DemoStackParams,
  K
>;

const closeToHome = (navigation: P<'PScheduleIntro'>['navigation']) => () =>
  navigation.reset({
    index: 0,
    routes: [{ name: 'PMain', params: { tab: 'home' } }],
  });

/*
 * 픽업 일정 등록 1~9 (design/pickup/*.png).
 * 그림·사진·지도는 내보낸 화면 PNG에서 잘라 src/assets/images/schedule 에 두었다.
 * 지도는 SDK 연결 전까지 고정 이미지다.
 */
const img = {
  bgTop: require('../../assets/images/schedule/bg_top.png'),
  pinCar: require('../../assets/images/schedule/pin_car_big.png'),
  mapConfirm: require('../../assets/images/schedule/map_confirm.png'),
  mapSpots: require('../../assets/images/schedule/map_spots.png'),
  spotMain: require('../../assets/images/schedule/spot_main.png'),
  spotAlt: require('../../assets/images/schedule/spot_alt.png'),
  spotAdd: require('../../assets/images/schedule/spot_add.png'),
};

/** 픽업 일정 등록 1 · 소개 */
export function ScheduleIntroScreen({ navigation }: P<'PScheduleIntro'>) {
  const reset = useScheduleDraft(d => d.reset);
  return (
    <Screen
      bg={img.bgTop}
      scroll={false}
      header={<TopBar onClose={navigation.goBack} />}
      style={s.introBody}
      footer={
        <Button
          label="등록할게요."
          onPress={() => {
            reset();
            navigation.navigate('PScheduleChild');
          }}
        />
      }
    >
      <CenterHeadline
        eyebrow="픽업 일정"
        title={'자녀의 픽업 일정을\n미리 등록해보세요.'}
      />
      <Image source={img.pinCar} style={s.pinCar} />
    </Screen>
  );
}

/** Step 1 · 자녀 선택 */
export function ScheduleChildScreen({ navigation }: P<'PScheduleChild'>) {
  const sel = useScheduleDraft(d => d.childId);
  const setSel = useScheduleDraft(d => d.setChild);
  return (
    <Screen
      header={
        <TopBar progress={0.14} onClose={closeToHome(navigation as never)} />
      }
      footer={
        <Button
          label="다음으로"
          onPress={() => navigation.navigate('PScheduleAcademy')}
        />
      }
    >
      <Headline chip="Step 1" title={'일정을 등록할 자녀를\n선택해주세요.'} />
      <View style={s.list}>
        {mock.children.map(c => {
          const on = c.id === sel;
          return (
            <Pressable
              key={c.id}
              onPress={() => setSel(c.id)}
              style={[s.childCard, on && s.childCardOn]}
            >
              <Image source={childPhoto(c.id)} style={s.photo} />
              <View style={s.flex}>
                <Text style={s.childName}>{c.name}</Text>
                <Text style={s.childMeta}>{c.school}</Text>
              </View>
              <Radio on={on} />
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

type Academy = (typeof mock.academies)[number];

/** Step 2 · 학원 검색(바텀시트) → 위치 확인(바텀시트) */
export function ScheduleAcademyScreen({ navigation }: P<'PScheduleAcademy'>) {
  const childId = useScheduleDraft(d => d.childId);
  const setAcademy = useScheduleDraft(d => d.setAcademy);
  const child = mock.children.find(c => c.id === childId) ?? mock.children[0];
  const [query, setQuery] = useState(mock.academies[0].name);
  const [sheet, setSheet] = useState<'search' | 'confirm' | null>(null);
  const [picked, setPicked] = useState<Academy | null>(null);
  const [saved, setSaved] = useState<Academy | null>(null);
  const word = query.trim().split(' ')[0];
  const results = mock.academies.filter(a => !word || a.name.includes(word));

  return (
    <Screen
      header={
        <TopBar progress={0.52} onClose={closeToHome(navigation as never)} />
      }
      footer={
        <Button
          label="다음으로"
          disabled={!saved}
          onPress={() => navigation.navigate('PScheduleSpot')}
        />
      }
    >
      <Headline
        chip="Step 2"
        highlight={child.name}
        title={' 자녀의 학원을\n등록해볼까요?'}
      />
      <Pressable style={s.search} onPress={() => setSheet('search')}>
        <Text style={[s.searchText, saved && s.searchTextOn]}>
          {saved ? saved.name : '학원명이나 주소로 검색해보세요.'}
        </Text>
        <SearchIcon />
      </Pressable>
      {saved ? <Text style={s.savedAddr}>{saved.addr}</Text> : null}

      <BottomSheet
        tall
        visible={sheet === 'search'}
        onClose={() => setSheet(null)}
      >
        <View style={s.searchActive}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="학원명이나 주소로 검색해보세요."
            placeholderTextColor={colors.muted}
            style={s.searchInput}
          />
          {query ? (
            <Pressable
              hitSlop={10}
              onPress={() => setQuery('')}
              style={s.clear}
            >
              <Text style={s.clearMark}>✕</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={s.resultTitle}>장소 결과</Text>
        {results.map((a, i) => (
          <View key={a.name} style={[s.result, i > 0 && s.resultLine]}>
            <View style={s.flex}>
              <Text style={s.resultName}>
                <Text style={s.accent}>{KEYWORD}</Text>
                {a.name.replace(KEYWORD, '')}
              </Text>
              <Text style={s.resultAddr}>{a.addr}</Text>
            </View>
            <Button
              size="sm"
              variant={i === 0 ? 'primary' : 'soft'}
              label="선택"
              style={[s.pick, i > 0 && s.pickSoft]}
              onPress={() => {
                setPicked(a);
                setSheet('confirm');
              }}
            />
          </View>
        ))}
      </BottomSheet>

      <BottomSheet
        tall
        visible={sheet === 'confirm'}
        onClose={() => setSheet(null)}
      >
        <View style={s.flex}>
          <Text style={s.confirmQ}>다음 위치로 저장할까요?</Text>
          <Image
            source={img.mapConfirm}
            style={s.mapConfirm}
            resizeMode="cover"
          />
          <View style={s.pickedRow}>
            <PinGlyph />
            <View style={s.flex}>
              <Text style={s.pickedName}>{picked?.name}</Text>
              <Text style={s.pickedAddr}>{picked?.addr}</Text>
            </View>
          </View>
        </View>
        <View style={s.row}>
          <Button
            variant="soft"
            label="재검색"
            style={[s.reBtn, s.pickSoft]}
            onPress={() => setSheet('search')}
          />
          <Button
            label="이 위치로 확정"
            style={s.flex}
            onPress={() => {
              setSaved(picked);
              if (picked) setAcademy(picked.name);
              setSheet(null);
              navigation.navigate('PScheduleSpot');
            }}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}

function SearchIcon() {
  return (
    <View style={s.searchIcon}>
      <View style={s.searchLens} />
      <View style={s.searchHandle} />
    </View>
  );
}

/** 위치 핀 (검은 물방울 + 흰 점) */
function PinGlyph() {
  return (
    <View style={s.pinGlyph}>
      <View style={s.pinGlyphDot} />
    </View>
  );
}

/**
 * Step 3 · 픽업 장소와 대안 장소.
 * 서버에 등록된 학원이면 SPOT-04 추천 후보를 보여 주고, 샘플 데이터로 진행 중이면 샘플 목록을 쓴다.
 */
export function ScheduleSpotScreen({ navigation }: P<'PScheduleSpot'>) {
  const [extra, setExtra] = useState(0);
  const { academyId, academyLocation } = useScheduleDraft();
  const rec = useSpotRecommendations(academyId, academyLocation);
  const spots =
    rec.data?.supported && rec.data.items.length
      ? rec.data.items.map(c => ({
          name: c.name,
          meta: [c.meta, ...c.cautions].join(' · '),
        }))
      : mock.spots;
  return (
    <Screen
      header={
        <TopBar progress={0.73} onClose={closeToHome(navigation as never)} />
      }
      footer={
        <Button
          label="저장하기"
          onPress={() => navigation.navigate('PScheduleTime')}
        />
      }
    >
      <Headline
        chip="Step 3"
        title={'픽업 장소와 대안 픽업 장소를\n등록해주세요.'}
      />
      <Text style={s.sectionLabel}>추천 픽업 장소</Text>
      <Image source={img.mapSpots} style={s.mapSpots} resizeMode="cover" />
      <View style={s.spotList}>
        {spots.map((sp, i) => (
          <View key={sp.name} style={s.spotCard}>
            <Image source={i ? img.spotAlt : img.spotMain} style={s.spotIcon} />
            <View style={s.flex}>
              <Text style={s.spotName}>{sp.name}</Text>
              <Text style={s.spotMeta}>{sp.meta}</Text>
            </View>
          </View>
        ))}
        {Array.from({ length: extra }).map((_, i) => (
          <View key={i} style={s.spotCard}>
            <Image source={img.spotAlt} style={s.spotIcon} />
            <Text style={[s.spotName, s.muted]}>
              지도에서 위치를 선택하세요
            </Text>
          </View>
        ))}
        <Pressable style={s.spotCard} onPress={() => setExtra(e => e + 1)}>
          <Image source={img.spotAdd} style={s.spotIcon} />
          <Text style={s.spotAdd}>대안 장소 추가</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

/** Step 4 · 요일과 목표 픽업 시각 */
export function ScheduleTimeScreen({ navigation }: P<'PScheduleTime'>) {
  const draft = useScheduleDraft();
  const { days, weekly, time, toggleDay, setWeekly } = draft;
  const addSchedule = usePickupStore(st => st.addSchedule);
  return (
    <Screen
      header={
        <TopBar progress={1} onClose={closeToHome(navigation as never)} />
      }
      footer={
        <Button
          label="다음으로"
          disabled={!days.some(Boolean)}
          onPress={() => {
            // 등록 확정: 홈·현황에 바로 보이도록 일정 저장
            addSchedule({
              childId: draft.childId,
              academy: draft.academy,
              spot: mock.spots[0].name,
              altSpot: mock.spots[1].name,
              days,
              weekly,
              time,
            });
            navigation.navigate('PScheduleDone');
          }}
        />
      }
    >
      <Headline chip="Step 4" title={'자녀를 픽업할 일정을\n입력해주세요.'} />
      <Text style={s.sectionLabel}>목표 픽업 요일</Text>
      <View style={s.days}>
        {DAYS.map((d, i) => (
          <Pressable
            key={d}
            onPress={() => toggleDay(i)}
            style={[s.day, days[i] && s.dayOn]}
          >
            <Text style={[s.dayText, days[i] && s.dayTextOn]}>{d}</Text>
          </Pressable>
        ))}
      </View>
      <Checkbox
        tone="dark"
        label="매주"
        checked={weekly}
        onPress={() => setWeekly(!weekly)}
      />
      <Text style={[s.sectionLabel, s.mtTime]}>목표 픽업 시각</Text>
      {/* 시각 선택 UI는 Figma에 아직 없어 표시만 한다. */}
      <View style={s.timeBox}>
        <Text style={s.timeText}>{time}</Text>
      </View>
    </Screen>
  );
}

/** 픽업 일정 등록 완료 */
export function ScheduleDoneScreen({ navigation }: P<'PScheduleDone'>) {
  const done = closeToHome(navigation as never);
  const { childId, academy, days, weekly, time } = useScheduleDraft();
  const child = mock.children.find(c => c.id === childId);
  return (
    <Screen
      bg={img.bgTop}
      scroll={false}
      header={<TopBar onClose={done} />}
      style={s.doneBody}
      footer={<Button label="완료" onPress={done} />}
    >
      <CenterHeadline
        eyebrow="픽업 일정 등록 완료"
        title={'앞으로 다음 내용대로\n안내해 드릴게요.'}
      />
      <InfoRows
        rows={[
          ['자녀', child?.name ?? ''],
          ['일정', scheduleLabel(days, weekly, time)],
          ['장소', academy],
        ]}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.sm },
  muted: { color: colors.muted },
  accent: { color: colors.primary },
  introBody: { justifyContent: 'center', alignItems: 'center', gap: 64 },
  pinCar: { marginBottom: 40 },

  // Step 1
  list: { gap: 12, marginTop: 52 },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E3E5',
  },
  childCardOn: { borderColor: colors.primary },
  photo: { width: 43, height: 43, borderRadius: 22 },
  childName: { fontSize: font.heading, fontWeight: '700', color: colors.text },
  childMeta: { fontSize: font.caption, color: colors.muted, marginTop: 6 },

  // Step 2
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingLeft: 21,
    paddingRight: 24,
    height: 60,
  },
  searchText: { flex: 1, fontSize: 15, color: colors.muted },
  searchTextOn: { color: colors.text, fontWeight: '600' },
  savedAddr: {
    fontSize: font.caption,
    color: colors.subText,
    marginTop: 8,
    marginLeft: 21,
  },
  searchIcon: { width: 20, height: 20 },
  searchLens: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.muted,
  },
  searchHandle: {
    position: 'absolute',
    width: 7,
    height: 2,
    backgroundColor: colors.muted,
    right: -1,
    bottom: 2,
    transform: [{ rotate: '45deg' }],
  },
  searchActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingLeft: 21,
    paddingRight: 18,
    height: 60,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
  },
  clear: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C9CBCF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearMark: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  resultTitle: { fontSize: font.label, color: colors.subText, marginBottom: 4 },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  resultLine: { borderTopWidth: 1, borderColor: '#E1E3E5' },
  resultName: { fontSize: font.body, color: '#4A4C53', fontWeight: '600' },
  resultAddr: { fontSize: font.caption, color: colors.subText, marginTop: 6 },
  pick: { width: 49, minHeight: 31, paddingHorizontal: 0, borderRadius: 8 },
  pickSoft: { backgroundColor: colors.surface },
  confirmQ: {
    fontSize: font.heading,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 16,
  },
  mapConfirm: {
    alignSelf: 'stretch',
    aspectRatio: 710 / 466,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E3E5',
  },
  pickedRow: { flexDirection: 'row', gap: 12, marginTop: 24, paddingLeft: 4 },
  pickedName: { fontSize: 17, fontWeight: '700', color: colors.text },
  pickedAddr: { fontSize: font.caption, color: colors.subText, marginTop: 8 },
  pinGlyph: {
    width: 18,
    height: 18,
    marginTop: 2,
    borderRadius: 9,
    borderBottomRightRadius: 0,
    backgroundColor: colors.text,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinGlyphDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  reBtn: { width: 129 },

  // Step 3
  sectionLabel: {
    fontSize: 15,
    color: colors.subText,
    fontWeight: '600',
    marginTop: 52,
    marginBottom: 14,
  },
  mapSpots: {
    alignSelf: 'stretch',
    aspectRatio: 710 / 352,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E3E5',
  },
  spotList: { marginTop: 16, gap: 13 },
  spotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    height: 69,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  spotIcon: { width: 36, height: 36 },
  spotName: { fontSize: 16, fontWeight: '700', color: colors.text },
  spotMeta: { fontSize: font.caption, color: colors.subText, marginTop: 6 },
  spotAdd: { fontSize: 16, fontWeight: '500', color: '#C3C5CA' },

  // Step 4
  days: { flexDirection: 'row', gap: 5, marginBottom: 14 },
  day: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: { backgroundColor: '#53565D' },
  dayText: { fontSize: 16, color: colors.subText },
  dayTextOn: { color: '#FFFFFF', fontWeight: '600' },
  mtTime: { marginTop: 48 },
  timeBox: {
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: { fontSize: font.heading, fontWeight: '600', color: '#4A4C53' },

  doneBody: { justifyContent: 'center', gap: 64, paddingBottom: 60 },
});
