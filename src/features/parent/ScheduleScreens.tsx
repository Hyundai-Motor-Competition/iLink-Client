import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import {
  type ComponentRef,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { DemoStackParams } from '../../app/navigation/types';
import { messageFor } from '../../domain/errorCodes';
import { ApiError } from '../../api/errors';
import { pretendard as pf, v2 } from '../../shared/theme/tokens';
import {
  OnboardScreen,
  PillButton,
  ProfilePhoto,
} from '../../shared/ui/onboard';
import { useChildren } from './children';
import {
  type AcademyHit,
  registerSchedule,
  searchAcademies,
  useServerMode,
} from './data';
import { givenName, useFamilyDraft } from './familyDraft';
import { mock } from './mock';
import { usePickupStore } from './pickupStore';
import { DAYS, reviewLabel, useScheduleDraft } from './scheduleDraft';

type P<K extends keyof DemoStackParams> = NativeStackScreenProps<
  DemoStackParams,
  K
>;

/*
 * 픽업 일정 등록 1~12 (assets/모바일 - 부모/픽업일정등록*.png, 390pt 폭 @3x).
 * 보호자 토큰이 있으면 서버(SET-01 학원 검색 → SET-02 일정 → SPOT-02 장소 → SET-07/08 설정 완료)에 저장하고,
 * 로그인 전 데모에서는 앱 메모리(pickupStore)에 저장한다.
 * 지도 SDK가 아직 없어 지도는 시안에서 잘라 낸 고정 이미지다. 대안 장소는 지도를 끌어 학원 기준 위치를 정한다.
 */
const img = {
  map: require('../../assets/images/v2/map_academy.png'),
  pinDark: require('../../assets/images/v2/pin_dark.png'),
  pinGrey: require('../../assets/images/v2/pin_grey.png'),
  pinGreyMap: require('../../assets/images/v2/pin_grey_map.png'),
  pinIcon: require('../../assets/images/v2/ic_pin_dark.png'),
  remove: require('../../assets/images/v2/ic_remove.png'),
  search: require('../../assets/images/v2/ic_search.png'),
};

const closeToHome = (navigation: P<'PScheduleIntro'>['navigation']) => () =>
  navigation.reset({
    index: 0,
    routes: [{ name: 'PMain', params: { tab: 'home' } }],
  });

/** 시안 공통 머리: 회색 작은 제목 + 큰 제목 (왼쪽 정렬) */
function FlowHeader({ label, title }: { label: string; title: string }) {
  return (
    <>
      <Text style={s.label}>{label}</Text>
      <Text style={s.title}>{title}</Text>
    </>
  );
}

/** 시안 바텀시트: 흰 바탕, 위 모서리 40, 손잡이 */
function Sheet({
  visible,
  onClose,
  top,
  children,
}: {
  visible: boolean;
  onClose(): void;
  /** 시트 위끝 (화면 위에서 pt) */
  top: number;
  children: ReactNode;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={s.dim} onPress={onClose} />
      <View style={[s.sheet, { top }]}>
        <View style={s.handle} />
        {children}
      </View>
    </Modal>
  );
}

/* ---------- 1 · 자녀 선택 ---------- */

/**
 * 픽업 일정 등록 1 · 자녀 선택 (누구의 일정인가요?)
 * 초대장 전송 뒤 일정 등록으로 올 때는 이 화면을 건너뛰고 2로 바로 간다.
 */
export function ScheduleChildScreen({ navigation }: P<'PScheduleChild'>) {
  const sel = useScheduleDraft(d => d.childId);
  const setSel = useScheduleDraft(d => d.setChild);
  const reset = useScheduleDraft(d => d.reset);
  const { list, loading } = useChildren();
  useEffect(() => {
    reset();
  }, [reset]);
  useEffect(() => {
    if (list.length && !list.some(c => c.id === sel)) setSel(list[0].id);
  }, [list, sel, setSel]);
  return (
    <OnboardScreen
      footer={
        <PillButton
          label="다음으로"
          disabled={!list.length}
          onPress={() => navigation.navigate('PScheduleIntro')}
        />
      }
    >
      <Text style={s2.eyebrow}>자녀 선택</Text>
      <Text style={s2.title}>누구의 일정인가요?</Text>
      <View style={s2.list}>
        {loading ? <ActivityIndicator color={v2.ink} /> : null}
        {!loading && !list.length ? (
          <Text style={s.empty}>
            먼저 가족 프로필에서 자녀를 등록해 주세요.
          </Text>
        ) : null}
        {list.map(c => {
          const on = c.id === sel;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setSel(c.id)}
              style={s2.card}
            >
              {c.photo ? (
                <Image source={c.photo} style={s2.photo} />
              ) : (
                <View style={[s2.photo, s.photoEmpty]} />
              )}
              <View style={s.flex}>
                <Text style={s2.name}>{c.name}</Text>
                <Text style={s2.meta}>{c.meta}</Text>
              </View>
              {on ? (
                <View style={s2.radio}>
                  <View style={s2.radioDot} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </OnboardScreen>
  );
}

/* ---------- 2 · 시작 ---------- */

/** 픽업 일정 등록 2 · 시작. 초대장 전송 뒤에는 가족 프로필에서 등록한 자녀로 바로 이어진다 */
export function ScheduleIntroScreen({
  navigation,
  route,
}: P<'PScheduleIntro'>) {
  const fromInvite = route.params?.fromInvite ?? false;
  const childId = useScheduleDraft(d => d.childId);
  const setChild = useScheduleDraft(d => d.setChild);
  const family = useFamilyDraft();
  const { list } = useChildren();
  const invitedName = family.childName.trim();
  const invited =
    list.find(c => c.name === invitedName) ??
    list.find(c => c.id === family.childId) ??
    list[list.length - 1];
  useEffect(() => {
    if (fromInvite && invited) setChild(invited.id);
  }, [fromInvite, invited, setChild]);

  const child = list.find(c => c.id === childId) ?? invited ?? list[0];
  const name = child?.name ?? (invitedName || '자녀');
  const photo =
    fromInvite && family.childPhoto ? family.childPhoto : child?.photo;

  return (
    <OnboardScreen
      footer={
        <PillButton
          label="시작하기"
          onPress={() => navigation.navigate('PScheduleAcademy')}
        />
      }
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="닫기"
        hitSlop={8}
        onPress={closeToHome(navigation)}
        style={s2.close}
      >
        <View style={[s2.closeLine, s2.closeA]} />
        <View style={[s2.closeLine, s2.closeB]} />
      </Pressable>
      <Text style={s2.introEyebrow}>수업 끝나는 시간만 알려주세요.</Text>
      <Text style={s2.introTitle}>
        {givenName(name)}의 픽업 일정을 등록해요
      </Text>
      <View style={s2.introPhoto}>
        <ProfilePhoto photo={photo} badge={false} />
      </View>
    </OnboardScreen>
  );
}

/* ---------- 3 · 4 · 학원 검색 ---------- */

/** 데모(로그인 전) 학원 목록. 위치는 대치동 근처 예시 좌표 */
const MOCK_ACADEMIES: AcademyHit[] = mock.academies.map((a, i) => ({
  externalPlaceId: `mock-${i}`,
  name: a.name.replace('학원', ' 학원').replace('  ', ' '),
  address: a.addr,
  location: { lat: 37.4995 + i * 0.001, lng: 127.0602 + i * 0.001 },
}));

/** 이름에서 검색어와 같은 앞부분을 파랗게 */
function Highlighted({ name, query }: { name: string; query: string }) {
  const key = query.replace(/\s/g, '');
  let cut = 0;
  // 공백을 무시하고 검색어와 같은 앞부분 길이를 원래 이름 기준으로 센다
  for (let i = 0, j = 0; i < name.length && j < key.length; i++) {
    if (name[i] === ' ') continue;
    if (name[i] !== key[j]) break;
    j++;
    cut = i + 1;
  }
  return (
    <Text style={s.hitRest}>
      <Text style={s.hitKey}>{name.slice(0, cut)}</Text>
      {name.slice(cut)}
    </Text>
  );
}

/** 픽업 일정 등록 3 · 4 · 학원 검색 (결과는 바텀시트) */
export function ScheduleAcademyScreen({ navigation }: P<'PScheduleAcademy'>) {
  const server = useServerMode();
  const childId = useScheduleDraft(d => d.childId);
  const picked = useScheduleDraft(d => d.academyHit);
  const setHit = useScheduleDraft(d => d.setAcademyHit);
  const { list } = useChildren();
  const child = list.find(c => c.id === childId);
  const [query, setQuery] = useState(picked?.name ?? '');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<AcademyHit[]>([]);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    Keyboard.dismiss();
    setBusy(true);
    setError(null);
    try {
      const word = q.replace(/\s/g, '').slice(0, 4);
      const found = server
        ? await searchAcademies(q)
        : MOCK_ACADEMIES.filter(a => a.name.replace(/\s/g, '').includes(word));
      setHits(found);
      setOpen(true);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? messageFor(e.code, e.message)
          : '검색하지 못했어요. 다시 시도해 주세요',
      );
    } finally {
      setBusy(false);
    }
  };

  const choose = (a: AcademyHit) => {
    setHit(a);
    setQuery(a.name);
    setOpen(false);
    navigation.navigate('PScheduleConfirm');
  };

  const next =
    picked && picked.name === query
      ? () => navigation.navigate('PScheduleConfirm')
      : search;

  return (
    <OnboardScreen
      onBlankPress={Keyboard.dismiss}
      footer={
        <PillButton
          label="다음으로"
          disabled={!query.trim() || busy}
          onPress={next}
        />
      }
    >
      <FlowHeader
        label="픽업 위치"
        title={`${givenName(
          child?.name ?? '자녀',
        )}가 다니는 학원을\n찾아주세요`}
      />
      <View style={s.searchPill}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="학원 이름이나 주소로 검색"
          placeholderTextColor={v2.placeholder}
          returnKeyType="search"
          onSubmitEditing={search}
          style={s.searchInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="검색"
          hitSlop={10}
          onPress={search}
        >
          {busy ? (
            <ActivityIndicator color={v2.stepOn} />
          ) : (
            <Image source={img.search} style={s.searchIcon} />
          )}
        </Pressable>
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}

      <Sheet visible={open} onClose={() => setOpen(false)} top={351}>
        <Text style={s.sheetHeading}>검색 결과 {hits.length}개</Text>
        <ScrollView style={s.flex} contentContainerStyle={s.hitList}>
          {!hits.length ? (
            <Text style={s.empty}>다른 이름이나 주소로 찾아 주세요.</Text>
          ) : null}
          {hits.map((a, i) => (
            <View key={a.externalPlaceId} style={[s.hit, i > 0 && s.hitLine]}>
              <View style={s.flex}>
                <Highlighted name={a.name} query={query} />
                <Text style={s.hitAddr}>{a.address}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => choose(a)}
                style={({ pressed }) => [s.chooseBtn, pressed && s.pressed]}
              >
                <Text style={s.chooseText}>선택</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </Sheet>
    </OnboardScreen>
  );
}

/* ---------- 지도 카드 (5 · 8 · 10) ---------- */

function MapCard({ alt }: { alt?: boolean }) {
  return (
    <View style={s.mapCard}>
      <View style={s.mapClip}>
        <Image source={img.map} style={s.mapImg} resizeMode="cover" />
        {alt ? <Image source={img.pinGreyMap} style={s.mapAltPin} /> : null}
      </View>
    </View>
  );
}

/* ---------- 5 · 학원 확인 ---------- */

export function ScheduleConfirmScreen({ navigation }: P<'PScheduleConfirm'>) {
  const hit = useScheduleDraft(d => d.academyHit);
  return (
    <OnboardScreen
      footer={
        <>
          <PillButton
            variant="white"
            label="다시 검색"
            labelStyle={s.regular}
            onPress={navigation.goBack}
          />
          <PillButton
            label="맞아요"
            onPress={() => navigation.navigate('PScheduleTime')}
          />
        </>
      }
    >
      <FlowHeader label="픽업 위치 확인" title="이 학원이 맞나요?" />
      <View style={s.mapGap}>
        <MapCard />
        <View style={s.placeCard}>
          <Image source={img.pinIcon} style={s.placePinIcon} />
          <View style={s.flex}>
            <Text style={s.placeName} numberOfLines={1}>
              {hit?.name ?? '-'}
            </Text>
            <Text style={s.placeAddr} numberOfLines={1}>
              {hit?.address ?? ''}
            </Text>
          </View>
        </View>
      </View>
    </OnboardScreen>
  );
}

/* ---------- 6 · 7 · 요일 · 시간 ---------- */

const ROW = 36;
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ['00', '10', '20', '30', '40', '50'];
const AMPM = ['AM', 'PM'];

/** 위아래로 넘기는 바퀴 (가운데가 고른 값) */
function Wheel({
  items,
  index,
  onChange,
}: {
  items: string[];
  index: number;
  onChange(i: number): void;
}) {
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const [cur, setCur] = useState(index);
  useEffect(() => {
    const t = setTimeout(
      () => ref.current?.scrollTo({ y: index * ROW, animated: false }),
      0,
    );
    return () => clearTimeout(t);
    // 처음 열 때만 맞춘다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const at = (y: number) =>
    Math.max(0, Math.min(items.length - 1, Math.round(y / ROW)));
  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = at(e.nativeEvent.contentOffset.y);
    setCur(i);
    onChange(i);
  };
  return (
    <View style={s.wheel}>
      <ScrollView
        ref={ref}
        style={s.flex}
        contentContainerStyle={s.wheelContent}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        nestedScrollEnabled
        onScroll={e => setCur(at(e.nativeEvent.contentOffset.y))}
        scrollEventThrottle={32}
        onMomentumScrollEnd={settle}
      >
        {items.map((it, i) => {
          const d = Math.abs(i - cur);
          return (
            <Pressable
              key={it}
              onPress={() => {
                ref.current?.scrollTo({ y: i * ROW, animated: true });
                setCur(i);
                onChange(i);
              }}
              style={s.wheelRow}
            >
              <Text
                style={[
                  s.wheelText,
                  d === 0 && s.wheelTextOn,
                  d === 1 && s.wheelTextNear,
                  d >= 2 && s.wheelTextFar,
                ]}
              >
                {it}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** (오전/오후, 시 index, 분 index) → "HH:mm" */
function to24(ampm: number, hour: number, minute: number) {
  const h12 = hour + 1;
  const h = (h12 % 12) + (ampm === 1 ? 12 : 0);
  return `${String(h).padStart(2, '0')}:${MINUTES[minute]}`;
}

function from24(t: string) {
  const [hs, ms] = t.split(':');
  const h = Number(hs);
  return {
    ampm: h >= 12 ? 1 : 0,
    hour: ((h + 11) % 12) % 12,
    minute: Math.max(0, MINUTES.indexOf(`${ms[0]}0`)),
  };
}

export function ScheduleTimeScreen({ navigation }: P<'PScheduleTime'>) {
  const { days, weekly, time, timeSet, toggleDay, setWeekly, setTime } =
    useScheduleDraft();
  const [open, setOpen] = useState(false);
  const init = from24(timeSet ? time : '08:00');
  const [ampm, setAmpm] = useState(init.ampm);
  const [hour, setHour] = useState(init.hour);
  const [minute, setMinute] = useState(init.minute);
  const ready = days.some(Boolean) && timeSet;

  return (
    <OnboardScreen
      footer={
        <PillButton
          label="다음으로"
          disabled={!ready}
          onPress={() => navigation.navigate('PScheduleSpot')}
        />
      }
    >
      <FlowHeader label="픽업 요일과 시간" title="언제 픽업할까요?" />
      <Text style={[s.section, s.sectionDays]}>목표 픽업일</Text>
      <View style={s.days}>
        {DAYS.map((d, i) => {
          const on = days[i];
          const weekend = i >= 5;
          return (
            <Pressable
              key={d}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => toggleDay(i)}
              style={[s.day, weekend && s.dayWeekend, on && s.dayOn]}
            >
              <Text
                style={[
                  s.dayText,
                  weekend && s.dayTextWeekend,
                  on && s.dayTextOn,
                ]}
              >
                {d}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: weekly }}
        onPress={() => setWeekly(!weekly)}
        style={s.weekly}
      >
        <View style={[s.check, weekly ? s.checkOn : s.checkOff]}>
          {weekly ? <View style={s.checkMark} /> : null}
        </View>
        <Text style={s.weeklyText}>매주</Text>
      </Pressable>
      <Text style={[s.section, s.sectionTime]}>목표 픽업 시각</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="목표 픽업 시각 고르기"
        onPress={() => setOpen(true)}
        style={s.timePill}
      >
        <Text style={[s.timeText, timeSet && s.timeTextOn]}>
          {timeSet ? time : '00:00'}
        </Text>
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)} top={454}>
        <Text style={s.sheetHeading}>시간 선택</Text>
        <View style={s.wheels}>
          <View style={s.wheelBand} pointerEvents="none">
            <View style={s.wheelPill} />
            <View style={s.wheelPill} />
            <View style={s.wheelPill} />
          </View>
          <Wheel items={AMPM} index={ampm} onChange={setAmpm} />
          <Wheel items={HOURS} index={hour} onChange={setHour} />
          <Wheel items={MINUTES} index={minute} onChange={setMinute} />
        </View>
        <View style={s.flex} />
        <PillButton
          label="완료"
          style={s.sheetButton}
          onPress={() => {
            setTime(to24(ampm, hour, minute));
            setOpen(false);
          }}
        />
      </Sheet>
    </OnboardScreen>
  );
}

/* ---------- 8 · 9 · 10 · 만날 장소 ---------- */

/** 대안 장소 시트의 지도에서 1pt = 1.5m 로 본다 (시안 지도 축척 기준) */
const M_PER_PT = 1.5;
const DRAG_LIMIT = 70;

function AltSpotSheet({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose(): void;
  onSave(name: string, east: number, north: number): void;
}) {
  const [name, setName] = useState('');
  const pan = useRef(new Animated.ValueXY()).current;
  const last = useRef({ x: 0, y: 0 });
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const clamp = (v: number) =>
          Math.max(-DRAG_LIMIT, Math.min(DRAG_LIMIT, v));
        pan.setValue({
          x: clamp(last.current.x + g.dx),
          y: clamp(last.current.y + g.dy),
        });
      },
      onPanResponderRelease: () => {
        pan.stopAnimation(v => {
          last.current = v;
        });
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      setName('');
      pan.setValue({ x: 0, y: 0 });
      last.current = { x: 0, y: 0 };
    }
  }, [visible, pan]);

  return (
    <Sheet visible={visible} onClose={onClose} top={255}>
      <Text style={s.altTitle}>대안 장소 추가</Text>
      <Text style={s.altSub}>지도를 움직여 장소를 골라주세요</Text>
      <View style={s.altMap} {...responder.panHandlers}>
        <Animated.Image
          source={img.map}
          resizeMode="cover"
          style={[s.altMapImg, { transform: pan.getTranslateTransform() }]}
        />
        <Image source={img.pinGreyMap} style={s.altPin} />
      </View>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="어떤 곳인가요? (예: 건너편 편의점 앞)"
        placeholderTextColor={v2.placeholder}
        style={s.altInput}
      />
      <View style={s.flex} />
      <PillButton
        label="저장"
        disabled={!name.trim()}
        style={s.sheetButton}
        onPress={() => {
          // 지도를 오른쪽으로 끌면 고른 곳은 학원의 왼쪽(서쪽), 아래로 끌면 북쪽
          const east = -last.current.x * M_PER_PT;
          const north = last.current.y * M_PER_PT;
          onSave(name.trim(), Math.round(east), Math.round(north));
        }}
      />
    </Sheet>
  );
}

function distanceText(a: { east: number; north: number }) {
  const m = Math.round(Math.hypot(a.east, a.north));
  return m < 5 ? '바로 앞' : `${m}m`;
}

export function ScheduleSpotScreen({ navigation }: P<'PScheduleSpot'>) {
  const hit = useScheduleDraft(d => d.academyHit);
  const alts = useScheduleDraft(d => d.altSpots);
  const addAlt = useScheduleDraft(d => d.addAlt);
  const removeAlt = useScheduleDraft(d => d.removeAlt);
  const [open, setOpen] = useState(false);
  return (
    <OnboardScreen
      footer={
        <>
          <PillButton
            variant="white"
            label="대안 장소 추가"
            labelStyle={s.regular}
            onPress={() => setOpen(true)}
          />
          <PillButton
            label="다음으로"
            onPress={() => navigation.navigate('PScheduleReview')}
          />
        </>
      }
    >
      <FlowHeader label="만날 장소" title="어디서 만날까요?" />
      <ScrollView
        style={s.mapGap}
        contentContainerStyle={s.spotScroll}
        showsVerticalScrollIndicator={false}
      >
        <MapCard alt={alts.length > 0} />
        <View style={[s.spotCard, alts.length > 0 && s.spotCardMid]}>
          <Image source={img.pinDark} style={s.spotPin} />
          <View style={s.flex}>
            <Text style={s.spotName} numberOfLines={1}>
              {hit?.name ?? '-'}
            </Text>
            <Text style={s.spotAddr} numberOfLines={1}>
              {hit?.address ?? ''}
            </Text>
          </View>
        </View>
        {alts.map((a, i) => (
          <View
            key={`${a.name}-${i}`}
            style={[
              s.spotCard,
              s.spotCardAlt,
              i < alts.length - 1 && s.spotCardMid,
            ]}
          >
            <Image source={img.pinGrey} style={s.spotPin} />
            <View style={s.flex}>
              <Text style={s.spotName} numberOfLines={1}>
                {a.name}
              </Text>
              <Text style={s.spotAddr} numberOfLines={1}>
                {hit?.name ? `${hit.name}에서 ${distanceText(a)}` : ''}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${a.name} 삭제`}
              hitSlop={10}
              onPress={() => removeAlt(i)}
            >
              <Image source={img.remove} style={s.removeIcon} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
      <AltSpotSheet
        visible={open}
        onClose={() => setOpen(false)}
        onSave={(name, east, north) => {
          addAlt({ name, east, north });
          setOpen(false);
        }}
      />
    </OnboardScreen>
  );
}

/* ---------- 11 · 확인 ---------- */

const DEFAULT_SPOT = '정문 앞';

export function ScheduleReviewScreen({ navigation }: P<'PScheduleReview'>) {
  const server = useServerMode();
  const qc = useQueryClient();
  const draft = useScheduleDraft();
  const { list } = useChildren();
  const addSchedule = usePickupStore(st => st.addSchedule);
  const child = list.find(c => c.id === draft.childId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows: [string, string][] = [
    ['자녀', child?.name ?? '-'],
    ['일정', reviewLabel(draft.days, draft.weekly, draft.time)],
    ['장소', draft.academyHit?.name ?? draft.academy],
    ['만날 장소', `${DEFAULT_SPOT} (기본)`],
    // 서버 규칙(가드 G6, 2026.11.13~): 합류 안내는 차가 정차한 뒤에 나간다
    ['합류 안내', '자동 (정차 후)'],
    ['출발 알림', '길안내 시작 시 자동'],
  ];

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (server && draft.academyHit) {
        await registerSchedule({
          childId: draft.childId,
          academy: draft.academyHit,
          days: draft.days,
          time: draft.time,
          spots: [
            {
              name: `${draft.academyHit.name} ${DEFAULT_SPOT}`,
              offset: { east: 0, north: 15 },
              isDefault: true,
            },
            ...draft.altSpots.map(a => ({
              name: a.name,
              offset: { east: a.east, north: a.north },
            })),
          ],
        });
        await qc.invalidateQueries();
      } else {
        addSchedule({
          childId: draft.childId,
          academy: draft.academyHit?.name ?? draft.academy,
          spot: mock.spots[0].name,
          altSpot: draft.altSpots[0]?.name ?? mock.spots[1].name,
          days: draft.days,
          weekly: draft.weekly,
          time: draft.time,
        });
      }
      navigation.navigate('PScheduleDone');
    } catch (e) {
      setError(
        e instanceof ApiError
          ? messageFor(e.code, e.message)
          : '등록하지 못했어요. 다시 시도해 주세요',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardScreen
      footer={
        <>
          <Text style={[s.footnote, error ? s.footnoteError : null]}>
            {error ?? '합류 안내 방식은 설정에서 바꿀 수 있어요.'}
          </Text>
          <PillButton
            label={busy ? '등록하는 중…' : '등록 완료'}
            disabled={busy}
            onPress={submit}
          />
        </>
      }
    >
      <FlowHeader label="픽업 일정 확인" title="이대로 등록할까요?" />
      <View style={s.rows}>
        {rows.map(([k, v]) => (
          <View key={k} style={s.row}>
            <Text style={s.rowKey}>{k}</Text>
            <Text style={s.rowVal} numberOfLines={1}>
              {v}
            </Text>
          </View>
        ))}
      </View>
    </OnboardScreen>
  );
}

/* ---------- 12 · 완료 ---------- */

/** "화요일 저녁부터 차량 화면에 오늘의 픽업이 떠요." */
function firstRunText(days: boolean[], time: string) {
  const now = new Date();
  const today = (now.getDay() + 6) % 7;
  const [h, m] = time.split(':').map(Number);
  for (let n = 0; n < 7; n++) {
    const d = (today + n) % 7;
    if (!days[d]) continue;
    if (n === 0 && now.getHours() * 60 + now.getMinutes() > h * 60 + m) {
      continue;
    }
    const part = h < 12 ? '오전' : h < 17 ? '오후' : '저녁';
    const day = n === 0 ? '오늘' : `${DAYS[d]}요일`;
    return `${day} ${part}부터 차량 화면에 오늘의 픽업이 떠요.`;
  }
  return '다음 픽업 날부터 차량 화면에 오늘의 픽업이 떠요.';
}

export function ScheduleDoneScreen({ navigation }: P<'PScheduleDone'>) {
  const { days, time } = useScheduleDraft();
  const home = () =>
    navigation.reset({
      index: 0,
      routes: [{ name: 'PMain', params: { tab: 'home' } }],
    });
  return (
    <OnboardScreen
      footer={
        <>
          <Text style={s.footnote}>{firstRunText(days, time)}</Text>
          <PillButton
            variant="white"
            label="다른 일정 추가"
            onPress={() =>
              navigation.reset({
                index: 1,
                routes: [
                  { name: 'PMain', params: { tab: 'home' } },
                  { name: 'PScheduleChild' },
                ],
              })
            }
          />
          <PillButton label="홈으로" onPress={home} />
        </>
      }
    >
      <Text style={s.doneLabel}>일정 등록 완료</Text>
      <Text style={s.doneTitle}>등록이 끝났어요</Text>
    </OnboardScreen>
  );
}

/* ---------- 스타일 (시안 PNG 기준. 위 47pt · 단계 표시줄 26pt 아래에서 잰 값) ---------- */

const s = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  regular: { fontFamily: pf.regular },
  empty: {
    fontFamily: pf.regular,
    fontSize: 15,
    color: v2.desc,
    paddingVertical: 12,
  },
  photoEmpty: { backgroundColor: v2.avatarEmpty },
  error: {
    marginTop: 12,
    fontFamily: pf.medium,
    fontSize: 14,
    color: '#D93B3B',
    paddingHorizontal: 8,
  },

  // 머리 (작은 제목 중심 124pt, 큰 제목 줄 중심 160 · 192pt)
  label: {
    marginTop: 41,
    fontFamily: pf.semibold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.3,
    color: v2.sub,
  },
  title: {
    marginTop: 10,
    fontFamily: pf.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: v2.ink,
  },

  // 시트
  dim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: v2.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    marginTop: 13,
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DCDCDC',
  },
  sheetHeading: {
    marginTop: 31,
    fontFamily: pf.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: v2.ink,
  },
  sheetButton: { marginTop: 12 },

  // 3 · 4 검색
  searchPill: {
    marginTop: 56,
    height: 60,
    borderRadius: 30,
    backgroundColor: v2.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 21,
    paddingRight: 22,
  },
  searchInput: {
    flex: 1,
    fontFamily: pf.semibold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: v2.ink,
    paddingVertical: 0,
  },
  searchIcon: { width: 18, height: 18 },
  hitList: { paddingTop: 11 },
  hit: {
    minHeight: 71,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  hitLine: { borderTopWidth: 1, borderColor: '#E4E4E4' },
  hitKey: { color: '#1C8BE0' },
  hitRest: {
    fontFamily: pf.bold,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.4,
    color: '#6B6B6B',
  },
  hitAddr: {
    marginTop: 2,
    fontFamily: pf.regular,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.3,
    color: '#7A7A7A',
  },
  chooseBtn: {
    width: 49,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  chooseText: {
    fontFamily: pf.regular,
    fontSize: 15,
    color: '#6B6B6B',
  },

  // 지도 카드 (5 · 8)
  mapGap: { marginTop: 82 },
  mapCard: {
    height: 242,
    borderRadius: 26,
    backgroundColor: v2.white,
    padding: 9,
  },
  mapClip: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  mapImg: { width: '100%', height: '100%' },
  mapAltPin: {
    position: 'absolute',
    left: '55.5%',
    top: '23%',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  placeCard: {
    marginTop: -1,
    height: 83,
    borderRadius: 26,
    backgroundColor: v2.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 20,
  },
  placePinIcon: { width: 14, height: 18, marginRight: 13 },
  placeName: {
    fontFamily: pf.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: v2.ink,
  },
  placeAddr: {
    marginTop: 1,
    fontFamily: pf.regular,
    fontSize: 16.5,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: '#6B6B6B',
  },

  // 6 · 7 요일 · 시간
  section: {
    fontFamily: pf.semibold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.3,
    color: v2.sub,
  },
  sectionDays: { marginTop: 85 },
  sectionTime: { marginTop: 35 },
  days: {
    marginTop: 19,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: v2.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayWeekend: { backgroundColor: '#F7F7F7' },
  dayOn: { backgroundColor: v2.ink },
  dayText: {
    fontFamily: pf.regular,
    fontSize: 17,
    color: v2.ink,
  },
  dayTextWeekend: { color: '#6B6B6B' },
  dayTextOn: { color: v2.white, fontFamily: pf.bold },
  weekly: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: v2.ink },
  checkOff: {
    backgroundColor: v2.white,
    borderWidth: 1.5,
    borderColor: v2.checkOff,
  },
  checkMark: {
    width: 9,
    height: 5,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: v2.white,
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },
  weeklyText: {
    marginLeft: 9,
    fontFamily: pf.regular,
    fontSize: 17,
    color: v2.ink,
  },
  timePill: {
    marginTop: 11,
    height: 60,
    borderRadius: 30,
    backgroundColor: v2.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontFamily: pf.semibold,
    fontSize: 21,
    letterSpacing: -0.2,
    color: '#6F6F5F',
  },
  timeTextOn: { color: v2.ink },
  wheels: {
    marginTop: 17,
    height: ROW * 5,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  wheelBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ROW * 2 - 6.5,
    height: 49,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  wheelPill: {
    width: 90,
    height: 49,
    borderRadius: 25,
    backgroundColor: v2.bg,
  },
  wheel: { width: 90, height: ROW * 5, overflow: 'hidden' },
  wheelContent: { paddingVertical: ROW * 2 },
  wheelRow: {
    width: 90,
    height: ROW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    fontFamily: pf.medium,
    fontSize: 17,
    color: '#8E8E8A',
  },
  wheelTextOn: { fontSize: 20, color: '#5F6058' },
  wheelTextNear: { opacity: 0.55 },
  wheelTextFar: { fontSize: 15, opacity: 0.3 },

  // 8 · 9 · 10 만날 장소
  spotScroll: { paddingBottom: 8 },
  spotCard: {
    marginTop: -1,
    height: 72,
    borderRadius: 26,
    backgroundColor: v2.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 24,
  },
  spotCardMid: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  spotCardAlt: { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  spotPin: { width: 32, height: 32, borderRadius: 16, marginRight: 13 },
  spotName: {
    fontFamily: pf.bold,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.4,
    color: v2.ink,
  },
  spotAddr: {
    fontFamily: pf.regular,
    fontSize: 16.5,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: '#6B6B6B',
  },
  removeIcon: { width: 16, height: 16, borderRadius: 8 },
  altTitle: {
    marginTop: 37,
    fontFamily: pf.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: v2.ink,
  },
  altSub: {
    marginTop: 4,
    fontFamily: pf.regular,
    fontSize: 16.5,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: '#6B6B6B',
  },
  altMap: {
    marginTop: 20,
    height: 202,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#EDEDE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  altMapImg: {
    position: 'absolute',
    width: 358 + DRAG_LIMIT * 2,
    height: 202 + DRAG_LIMIT * 2,
  },
  altPin: { width: 40, height: 40, borderRadius: 20 },
  altInput: {
    marginTop: 20,
    height: 60,
    borderRadius: 30,
    backgroundColor: v2.bg,
    paddingHorizontal: 20,
    textAlign: 'center',
    fontFamily: pf.semibold,
    fontSize: 17,
    color: v2.ink,
  },

  // 11 확인
  rows: { marginTop: 92, borderTopWidth: 1, borderColor: '#E2E2E2' },
  row: {
    height: 51,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#E2E2E2',
    paddingHorizontal: 7,
  },
  rowKey: {
    width: 100,
    fontFamily: pf.semibold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: '#5F6058',
  },
  rowVal: {
    flex: 1,
    textAlign: 'right',
    fontFamily: pf.regular,
    fontSize: 17,
    letterSpacing: -0.3,
    color: v2.ink,
  },
  footnote: {
    textAlign: 'center',
    fontFamily: pf.regular,
    fontSize: 14.5,
    letterSpacing: -0.3,
    color: '#7A7A7A',
    marginBottom: 8,
  },
  footnoteError: { color: '#D93B3B' },

  // 12 완료
  doneLabel: {
    marginTop: 217,
    textAlign: 'center',
    fontFamily: pf.semibold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.3,
    color: v2.sub,
  },
  doneTitle: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: pf.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: v2.ink,
  },
});

/* 픽업 일정 등록 1 · 2 */
const s2 = StyleSheet.create({
  eyebrow: {
    marginTop: 70,
    fontFamily: pf.semibold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.3,
    color: v2.sub,
  },
  title: {
    marginTop: 10,
    fontFamily: pf.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: v2.ink,
  },
  list: { marginTop: 87, gap: 10 },
  card: {
    height: 90,
    borderRadius: 22,
    backgroundColor: v2.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 19,
    paddingRight: 22,
  },
  photo: { width: 43, height: 43, borderRadius: 21.5, marginRight: 12 },
  name: {
    fontFamily: pf.bold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.4,
    color: '#0A0A0A',
  },
  meta: {
    marginTop: 4,
    fontFamily: pf.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.3,
    color: '#ABABAB',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: v2.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: v2.ink },
  close: {
    position: 'absolute',
    right: 16,
    top: 15,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: v2.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeLine: {
    position: 'absolute',
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#6F6F6F',
  },
  closeA: { transform: [{ rotate: '45deg' }] },
  closeB: { transform: [{ rotate: '-45deg' }] },
  introEyebrow: {
    marginTop: 119,
    textAlign: 'center',
    fontFamily: pf.semibold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.3,
    color: v2.sub,
  },
  introTitle: {
    marginTop: 9,
    textAlign: 'center',
    fontFamily: pf.bold,
    fontSize: 25,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: v2.ink,
  },
  introPhoto: { marginTop: 54 },
});
