import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { DemoStackParams } from '../../app/navigation/types';
import { pretendard as pf, v2 } from '../../shared/theme/tokens';
import { childPhoto, getChild, photoFor } from './children';
import {
  childrenOf,
  useFamily,
  useSchedules,
  useServerMode,
  useSessionActions,
  WEEK,
} from './data';
import { useLiveList, useServerLive } from './liveHooks';
import type { LiveVM } from './liveModel';
import { TAB_BAR_SPACE } from './ParentTabBar';
import { TileMap } from '../../shared/ui/TileMap';
import { upcomingPickups, usePickupStore, ymd } from './pickupStore';
import { reviewLabel } from './scheduleDraft';

type Nav = NativeStackNavigationProp<DemoStackParams, 'PMain'>;

/*
 * 메인(assets/메인 · 메인-1)과 현황(현황메뉴-진행 중1).
 * 서버 모드: SES-01/03 진행 중 세션, SET-04 일정, FAM-01 자녀. 데모: pickupStore.
 */
const img = {
  logo: require('../../assets/images/v2/logo.png'),
  bell: require('../../assets/images/v2/ic_bell.png'),
  target: require('../../assets/images/v2/ic_target.png'),
  phone: require('../../assets/images/v2/ic_phone.png'),
  pin: require('../../assets/images/v2/ic_pin.png'),
  map: require('../../assets/images/v2/map_academy.png'),
};

type DayItem = {
  key: string;
  date: Date;
  time: string;
  academy: string;
  childName: string;
  status: 'done' | 'live' | 'upcoming' | 'past' | 'cancelled';
  liveKey?: string;
};

const STATUS_TEXT: Record<DayItem['status'], string> = {
  done: '픽업완료',
  live: '진행 중',
  upcoming: '픽업예정',
  past: '지난 일정',
  cancelled: '철회됨',
};

const minutesOf = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
/** JS 요일(일=0) → 서버 요일 코드 */
const weekCode = (d: Date) => WEEK[(d.getDay() + 6) % 7];

/** 앞으로 n일(오늘 포함) 픽업 일정 */
function useDayItems(days: number): DayItem[] {
  const server = useServerMode();
  const family = useFamily();
  const kids = childrenOf(family.data);
  const schedules = useSchedules(kids.map(k => k.id));
  const lives = useLiveList();
  const store = usePickupStore();
  const now = new Date();

  if (server) {
    const out: DayItem[] = [];
    for (let n = 0; n < days; n++) {
      const date = addDays(now, n);
      for (const list of schedules.data ?? []) {
        const kid = kids.find(k => k.id === list.childId);
        for (const sc of list.items) {
          if (!sc.weekdays?.includes(weekCode(date))) continue;
          const time = sc.classEndTime?.slice(0, 5) ?? '--:--';
          const academy = sc.academy?.name ?? '학원';
          const live =
            n === 0
              ? lives.find(
                  l => l.childName === kid?.name && l.academy === academy,
                )
              : undefined;
          out.push({
            key: `${sc.scheduleId}-${n}`,
            date,
            time,
            academy,
            childName: kid?.name ?? '자녀',
            status: live
              ? 'live'
              : n === 0 &&
                minutesOf(time) < now.getHours() * 60 + now.getMinutes()
              ? 'past'
              : 'upcoming',
            liveKey: live ? 'server' : undefined,
          });
        }
      }
    }
    return out.sort(
      (a, b) =>
        a.date.getTime() - b.date.getTime() ||
        minutesOf(a.time) - minutesOf(b.time),
    );
  }

  const today = ymd(now);
  const todays: DayItem[] = store.pickups
    .filter(p => p.date === today)
    .map(p => ({
      key: p.id,
      date: now,
      time: p.time,
      academy: p.place,
      childName: getChild(p.childId).name,
      status:
        p.status === 'scheduled'
          ? 'upcoming'
          : p.status === 'live'
          ? 'live'
          : p.status === 'done'
          ? 'done'
          : 'cancelled',
      liveKey: p.status === 'live' ? p.id : undefined,
    }));
  const later: DayItem[] = upcomingPickups(store.schedules, store.pickups, now)
    .filter(u => !u.isToday)
    .filter(u => (u.date.getTime() - now.getTime()) / 86400000 < days)
    .map(u => ({
      key: u.key,
      date: u.date,
      time: u.schedule.time,
      academy: u.schedule.academy,
      childName: getChild(u.schedule.childId).name,
      status: 'upcoming',
    }));
  return [
    ...todays.sort((a, b) => minutesOf(a.time) - minutesOf(b.time)),
    ...later,
  ];
}

/* ---------- 메인 ---------- */

export function HomeTab({ nav }: { nav: Nav }) {
  const lives = useLiveList();
  const live = lives[0];
  const items = useDayItems(7);
  const today = items.filter(
    i => i.date.toDateString() === new Date().toDateString(),
  );
  const [tab, setTab] = useState<'live' | 'upcoming'>('upcoming');
  const open = (l: LiveVM) =>
    nav.navigate('PPickupLive', {
      id: l.key.startsWith('s-') ? 'server' : l.key,
    });

  return (
    <ScrollView
      style={s.homeRoot}
      contentContainerStyle={s.homeBody}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.topRow}>
        <Image source={img.logo} style={s.logo} />
        <View style={s.bellBtn}>
          <Image source={img.bell} style={s.bellIcon} />
        </View>
      </View>

      {live ? (
        <>
          <Text style={s.h1}>진행 중인 픽업</Text>
          <LiveCard live={live} onOpen={() => open(live)} />
          <Text style={[s.h1, s.h1Timeline]}>오늘의 픽업 타임라인</Text>
          <Timeline
            items={today}
            onPress={i =>
              i.liveKey ? nav.navigate('PPickupLive', { id: i.liveKey }) : null
            }
          />
        </>
      ) : (
        <>
          <Text style={s.h1}>간편 픽업 등록</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="픽업 일정 등록"
            onPress={() => nav.navigate('PScheduleChild')}
            style={({ pressed }) => [s.quickCard, pressed && s.pressed]}
          >
            <Text style={s.quickPlus}>+</Text>
            <Text style={s.quickText}>새 픽업 일정을 등록해요</Text>
          </Pressable>
          <View style={s.homeTabs}>
            {(
              [
                ['live', '진행 중'],
                ['upcoming', '픽업예정'],
              ] as const
            ).map(([k, label]) => (
              <Pressable key={k} onPress={() => setTab(k)} hitSlop={8}>
                <Text style={[s.h1Tab, tab !== k && s.h1TabOff]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {tab === 'live' ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyText}>진행 중인 픽업이 없어요.</Text>
            </View>
          ) : items.length ? (
            <Timeline items={items} showDate />
          ) : (
            <View style={s.emptyCard}>
              <Text style={s.emptyText}>
                등록된 픽업 일정이 없어요. 위에서 등록해 보세요.
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function LiveCard({ live, onOpen }: { live: LiveVM; onOpen(): void }) {
  const { view } = useServerLive();
  const act = useSessionActions(view);
  const call = async () => {
    const list = view ? await act.contacts().catch(() => []) : [];
    const phone = list.find(c => c.role === 'CHILD')?.phone ?? list[0]?.phone;
    Linking.openURL(`tel:${phone ?? ''}`);
  };
  return (
    <>
      <Pressable onPress={onOpen} style={s.liveCard}>
        <View style={s.chip}>
          <Image source={img.pin} style={s.chipPin} />
          <Text style={s.chipText} numberOfLines={1}>
            {live.academy}
          </Text>
        </View>
        <View style={s.childRow}>
          {live.photo ? (
            <Image source={live.photo} style={s.childPhoto} />
          ) : (
            <View style={[s.childPhoto, s.photoEmpty]} />
          )}
          <View style={s.flex}>
            <Text style={s.childLabel}>자녀</Text>
            <Text style={s.childName}>{live.childName}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="진행 현황 보기"
            onPress={onOpen}
            style={s.roundBtn}
          >
            <Image source={img.target} style={s.roundIcon} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="자녀에게 전화"
            onPress={call}
            style={[s.roundBtn, s.roundBtnGap]}
          >
            <Image source={img.phone} style={s.roundIcon} />
          </Pressable>
        </View>
        <View style={s.tiles}>
          <Tile label="픽업 시간" value={live.pickupTime ?? '--:--'} />
          <Tile label="도착 예정" value={live.arriveTime ?? '--:--'} />
          <Tile
            label="남은 시간"
            value={
              live.arrived
                ? '도착'
                : live.remainMin !== undefined
                ? `${live.remainMin}분 후`
                : '--'
            }
            accent
          />
        </View>
      </Pressable>
      <View style={s.trackCard}>
        <View style={s.perforation} />
        <View style={s.trackLabels}>
          <Text style={s.trackFrom}>출발</Text>
          <Text style={s.trackTo}>도착</Text>
        </View>
        <Track progress={live.progress} />
      </View>
    </>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={s.tile}>
      <Text style={s.tileLabel}>{label}</Text>
      <Text style={[s.tileValue, accent && s.tileAccent]}>{value}</Text>
    </View>
  );
}

const STRIPES = 64;
/** 출발 → 도착 진행 막대: 세로 줄무늬, 지나온 쪽이 진하다. 차 표시는 진행률 위치 */
function Track({ progress }: { progress: number }) {
  return (
    <View style={s.track}>
      <View style={s.ringStart}>
        <View style={s.ringStartDot} />
      </View>
      <View style={s.stripes}>
        {Array.from({ length: STRIPES }, (_, i) => {
          const t = i / STRIPES;
          const passed = t <= progress;
          const shade = passed
            ? 0.2 + 0.6 * (t / Math.max(progress, 0.01))
            : 0.75 - 0.45 * ((t - progress) / Math.max(1 - progress, 0.01));
          return (
            <View
              key={i}
              style={[s.stripe, { opacity: Math.max(0.15, shade) }]}
            />
          );
        })}
        <View style={[s.carMark, { left: `${progress * 100}%` }]}>
          <View style={s.carArrow} />
        </View>
      </View>
      <View style={s.ringEnd}>
        <View style={s.ringEndDot} />
      </View>
    </View>
  );
}

function Timeline({
  items,
  showDate,
  onPress,
}: {
  items: DayItem[];
  showDate?: boolean;
  onPress?(i: DayItem): void;
}) {
  const WEEK_KO = ['일', '월', '화', '수', '목', '금', '토'];
  return (
    <View style={s.timeline}>
      <View style={s.timelineRail} />
      {items.map(i => {
        const live = i.status === 'live';
        const done = i.status === 'done' || i.status === 'past';
        return (
          <Pressable
            key={i.key}
            disabled={!onPress}
            onPress={() => onPress?.(i)}
            style={[s.tlRow, showDate && s.tlRowTall]}
          >
            {live ? (
              <View style={s.tlRing}>
                <View style={s.tlRingDot} />
              </View>
            ) : (
              <View style={s.tlDot} />
            )}
            <View
              style={[s.tlChip, live && s.tlChipLive, done && s.tlChipDone]}
            >
              <Text
                style={[
                  s.tlChipText,
                  live && s.tlChipTextLive,
                  done && s.tlChipTextDone,
                ]}
              >
                {i.time}
              </Text>
            </View>
            <View style={s.flex}>
              <Text
                style={[s.tlAcademy, live && s.tlAcademyLive]}
                numberOfLines={1}
              >
                {i.academy}
              </Text>
              {showDate ? (
                <Text style={s.tlDate}>
                  {i.date.getMonth() + 1}/{i.date.getDate()} (
                  {WEEK_KO[i.date.getDay()]})
                </Text>
              ) : null}
            </View>
            <Text style={[s.tlMeta, live && s.tlMetaLive]} numberOfLines={1}>
              {i.childName} · {STATUS_TEXT[i.status]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- 현황 ---------- */

const STATUS_TABS = ['픽업 예정', '진행 중', '자녀별 일정'] as const;

export function StatusTab({ nav }: { nav: Nav }) {
  const lives = useLiveList();
  const items = useDayItems(7).filter(i => i.status === 'upcoming');
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>(
    lives.length ? '진행 중' : '픽업 예정',
  );
  return (
    <ScrollView
      style={s.statusRoot}
      contentContainerStyle={s.statusBody}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.statusTitle}>픽업 현황</Text>
      <View style={s.statusTabs}>
        {STATUS_TABS.map(t => (
          <Pressable key={t} onPress={() => setTab(t)} hitSlop={8}>
            <Text style={[s.statusTab, tab !== t && s.statusTabOff]}>{t}</Text>
          </Pressable>
        ))}
      </View>
      {tab === '진행 중' ? (
        lives.length ? (
          lives.map(l => (
            <LiveMapCard
              key={l.key}
              live={l}
              onPress={() =>
                nav.navigate('PPickupLive', {
                  id: l.key.startsWith('s-') ? 'server' : l.key,
                })
              }
            />
          ))
        ) : (
          <Text style={s.statusEmpty}>진행 중인 픽업이 없어요.</Text>
        )
      ) : tab === '픽업 예정' ? (
        items.length ? (
          <View style={s.statusList}>
            {items.map(i => (
              <View key={i.key} style={s.upRow}>
                <Text style={s.upDate}>
                  {i.date.getMonth() + 1}/{i.date.getDate()}
                </Text>
                <View style={s.flex}>
                  <Text style={s.upAcademy} numberOfLines={1}>
                    {i.academy}
                  </Text>
                  <Text style={s.upMeta}>
                    {i.childName} · {i.time} 픽업
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.statusEmpty}>앞으로 7일 동안 픽업 일정이 없어요.</Text>
        )
      ) : (
        <ChildSchedules />
      )}
    </ScrollView>
  );
}

/** 진행 중 카드: 지도 위에 자녀 · 학원 (현황메뉴-진행 중1) */
function LiveMapCard({ live, onPress }: { live: LiveVM; onPress(): void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && s.pressed]}
    >
      <View style={s.mapCard}>
        {live.vehicle || live.spot ? (
          // 자녀 · 차량 앱과 같은 OSM 지도에 차 위치 (차 위치가 아직 없으면 만날 장소)
          <TileMap
            style={s.mapCardImg}
            points={[(live.vehicle ?? live.spot)!]}
            padding={{ top: 20, bottom: 70, side: 40 }}
          >
            {project => {
              if (!live.vehicle) return null;
              const q = project(live.vehicle);
              return <View style={[s.mapCar, { left: q.x - 9, top: q.y - 9 }]} />;
            }}
          </TileMap>
        ) : (
          <Image source={img.map} resizeMode="cover" style={s.mapCardImg} />
        )}
        <View style={s.mapShade1} />
        <View style={s.mapShade2} />
        <View style={s.livePill}>
          <Text style={s.livePillText}>진행 중</Text>
        </View>
        <View style={s.mapChild}>
          {live.photo ? (
            <Image source={live.photo} style={s.mapPhoto} />
          ) : (
            <View style={[s.mapPhoto, s.photoEmpty]} />
          )}
          <View style={s.flex}>
            <Text style={s.mapName}>{live.childName}</Text>
            <Text style={s.mapAcademy} numberOfLines={1}>
              {live.academy}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function ChildSchedules() {
  const server = useServerMode();
  const family = useFamily();
  const kids = childrenOf(family.data);
  const schedules = useSchedules(kids.map(k => k.id));
  const store = usePickupStore(st => st.schedules);
  const rows = server
    ? (schedules.data ?? []).flatMap(list =>
        list.items.map(sc => {
          const name = kids.find(k => k.id === list.childId)?.name ?? '자녀';
          return {
            key: String(sc.scheduleId),
            name,
            photo: photoFor(name),
            line: `${reviewLabel(
              WEEK.map(w => !!sc.weekdays?.includes(w)),
              true,
              sc.classEndTime?.slice(0, 5) ?? '',
            )} · ${sc.academy?.name ?? ''}`,
          };
        }),
      )
    : store.map(sc => ({
        key: sc.id,
        name: getChild(sc.childId).name,
        photo: childPhoto(sc.childId),
        line: `${reviewLabel(sc.days, sc.weekly, sc.time)} · ${sc.academy}`,
      }));
  if (!rows.length) {
    return <Text style={s.statusEmpty}>등록된 일정이 없어요.</Text>;
  }
  return (
    <View style={s.statusList}>
      {rows.map(r => (
        <View key={r.key} style={s.upRow}>
          {r.photo ? (
            <Image source={r.photo} style={s.upPhoto} />
          ) : (
            <View style={[s.upPhoto, s.photoEmpty]} />
          )}
          <View style={s.flex}>
            <Text style={s.upAcademy}>{r.name}</Text>
            <Text style={s.upMeta} numberOfLines={1}>
              {r.line}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/* 메인: 시안 1170x2532(@3x). 위 47pt 상태 표시줄 포함 절대값에서 뺀 값 */
const s = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.8 },
  photoEmpty: { backgroundColor: v2.avatarEmpty },

  homeRoot: { flex: 1, backgroundColor: v2.bg },
  homeBody: { paddingHorizontal: 16, paddingBottom: TAB_BAR_SPACE + 20 },
  topRow: {
    marginTop: 15,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { width: 65, height: 22, tintColor: '#9A9A9A', marginLeft: -1 },
  bellBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: v2.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: { width: 22, height: 22, tintColor: v2.ink },
  h1: {
    marginTop: 34,
    fontFamily: pf.bold,
    fontSize: 21,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: v2.ink,
  },
  h1Timeline: { marginTop: 48 },
  liveCard: {
    marginTop: 21,
    backgroundColor: v2.white,
    borderRadius: 26,
    paddingHorizontal: 17,
    paddingTop: 19,
    paddingBottom: 16,
  },
  chip: {
    alignSelf: 'flex-start',
    height: 28,
    borderRadius: 14,
    backgroundColor: v2.ink,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 13,
    paddingRight: 13,
    maxWidth: 240,
  },
  chipPin: { width: 11, height: 14, marginRight: 8 },
  chipText: {
    fontFamily: pf.bold,
    fontSize: 13.5,
    letterSpacing: -0.3,
    color: v2.white,
  },
  childRow: { marginTop: 23, flexDirection: 'row', alignItems: 'center' },
  childPhoto: { width: 48, height: 48, borderRadius: 24, marginRight: 11 },
  childLabel: {
    fontFamily: pf.regular,
    fontSize: 14,
    color: '#6F6F6F',
  },
  childName: {
    marginTop: 1,
    fontFamily: pf.bold,
    fontSize: 20,
    letterSpacing: -0.4,
    color: v2.ink,
  },
  roundBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: v2.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnGap: { marginLeft: 8 },
  roundIcon: { width: 22, height: 22, tintColor: v2.ink },
  tiles: { marginTop: 16, flexDirection: 'row', gap: 9 },
  tile: {
    flex: 1,
    height: 63,
    borderRadius: 14,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontFamily: pf.regular,
    fontSize: 13.5,
    color: '#6F6F6F',
  },
  tileValue: {
    marginTop: 3,
    fontFamily: pf.bold,
    fontSize: 20,
    letterSpacing: -0.3,
    color: v2.ink,
  },
  tileAccent: { color: '#2F5BEA' },
  trackCard: {
    marginTop: 2,
    height: 82,
    borderRadius: 26,
    backgroundColor: v2.white,
    paddingHorizontal: 23,
    paddingTop: 22,
  },
  perforation: {
    position: 'absolute',
    top: -1,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DCDCDC',
  },
  trackLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  trackFrom: {
    marginLeft: 12,
    fontFamily: pf.regular,
    fontSize: 14,
    color: '#6F6F6F',
  },
  trackTo: {
    marginRight: 12,
    fontFamily: pf.bold,
    fontSize: 14,
    color: v2.ink,
  },
  track: {
    marginTop: 6,
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringStart: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#8E8E8E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringStartDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#8E8E8E',
  },
  ringEnd: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: v2.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringEndDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: v2.ink,
  },
  stripes: {
    flex: 1,
    height: 14,
    marginHorizontal: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stripe: { width: 1, height: 14, backgroundColor: '#5F6058' },
  carMark: {
    position: 'absolute',
    marginLeft: -11,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: v2.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carArrow: {
    marginLeft: 2,
    width: 0,
    height: 0,
    borderTopWidth: 4.5,
    borderBottomWidth: 4.5,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: v2.white,
  },
  timeline: { marginTop: 18 },
  timelineRail: {
    position: 'absolute',
    left: 4,
    top: 20,
    bottom: 20,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9A9A9A',
  },
  tlRow: { height: 42, flexDirection: 'row', alignItems: 'center' },
  tlRowTall: { height: 58 },
  tlDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#8E8E8E',
    marginRight: 14,
  },
  tlRing: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1.5,
    borderColor: v2.ink,
    backgroundColor: v2.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -3,
    marginRight: 11,
  },
  tlRingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: v2.ink },
  tlChip: {
    width: 52,
    height: 26,
    borderRadius: 8,
    backgroundColor: v2.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  tlChipLive: { backgroundColor: v2.ink },
  tlChipDone: { backgroundColor: '#DEDEDE' },
  tlChipText: {
    fontFamily: pf.semibold,
    fontSize: 14.5,
    color: v2.ink,
  },
  tlChipTextLive: { color: v2.white },
  tlChipTextDone: { color: '#6F6F6F' },
  tlAcademy: {
    fontFamily: pf.regular,
    fontSize: 17,
    letterSpacing: -0.4,
    color: '#8E8E8E',
  },
  tlAcademyLive: { fontFamily: pf.bold, color: v2.ink },
  tlDate: { fontFamily: pf.regular, fontSize: 12.5, color: '#9A9A9A' },
  tlMeta: {
    marginLeft: 8,
    fontFamily: pf.regular,
    fontSize: 14.5,
    letterSpacing: -0.3,
    color: '#8E8E8E',
  },
  tlMetaLive: { fontFamily: pf.bold, color: v2.ink },
  quickCard: {
    marginTop: 21,
    height: 117,
    borderRadius: 26,
    backgroundColor: v2.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPlus: { fontFamily: pf.regular, fontSize: 28, color: '#B4B4B4' },
  quickText: { fontFamily: pf.regular, fontSize: 14.5, color: '#9A9A9A' },
  homeTabs: { marginTop: 36, flexDirection: 'row', gap: 15 },
  h1Tab: {
    fontFamily: pf.bold,
    fontSize: 21,
    letterSpacing: -0.5,
    color: v2.ink,
  },
  h1TabOff: { color: '#9A9EAA' },
  emptyCard: {
    marginTop: 21,
    borderRadius: 26,
    backgroundColor: v2.white,
    padding: 28,
    alignItems: 'center',
  },
  emptyText: { fontFamily: pf.regular, fontSize: 14.5, color: '#9A9A9A' },

  // 현황 (현황메뉴-진행 중1, 780x1688 @2x)
  statusRoot: { flex: 1, backgroundColor: '#FFFFFF' },
  statusBody: { paddingHorizontal: 16, paddingBottom: TAB_BAR_SPACE + 20 },
  statusTitle: {
    marginTop: 31,
    fontFamily: pf.bold,
    fontSize: 20,
    letterSpacing: -0.5,
    color: '#181A1C',
  },
  statusTabs: { marginTop: 32, flexDirection: 'row', gap: 21 },
  statusTab: {
    fontFamily: pf.bold,
    fontSize: 16.5,
    letterSpacing: -0.4,
    color: '#181A1C',
  },
  statusTabOff: { color: '#A0A3A8' },
  statusEmpty: {
    marginTop: 40,
    textAlign: 'center',
    fontFamily: pf.regular,
    fontSize: 15,
    color: '#8E9199',
  },
  mapCard: {
    marginTop: 23,
    height: 156,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 18,
  },
  mapCardImg: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  mapCar: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: v2.white,
    backgroundColor: '#3A75DA',
  },
  mapShade1: {
    ...StyleSheet.absoluteFill,
    top: '35%',
    backgroundColor: 'rgba(60,64,80,0.35)',
  },
  mapShade2: {
    ...StyleSheet.absoluteFill,
    top: '62%',
    backgroundColor: 'rgba(60,64,80,0.35)',
  },
  livePill: {
    alignSelf: 'flex-start',
    height: 28,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#1040CA',
    justifyContent: 'center',
  },
  livePillText: {
    fontFamily: pf.semibold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  mapChild: { flexDirection: 'row', alignItems: 'center' },
  mapPhoto: { width: 48, height: 48, borderRadius: 24, marginRight: 13 },
  mapName: {
    fontFamily: pf.bold,
    fontSize: 20,
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
  mapAcademy: {
    fontFamily: pf.regular,
    fontSize: 15,
    color: '#FFFFFF',
  },
  statusList: { marginTop: 16 },
  upRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
    gap: 12,
  },
  upDate: {
    width: 44,
    fontFamily: pf.bold,
    fontSize: 15,
    color: '#1040CA',
  },
  upPhoto: { width: 40, height: 40, borderRadius: 20 },
  upAcademy: {
    fontFamily: pf.semibold,
    fontSize: 16,
    color: '#181A1C',
  },
  upMeta: {
    marginTop: 2,
    fontFamily: pf.regular,
    fontSize: 13.5,
    color: '#8E9199',
  },
});
