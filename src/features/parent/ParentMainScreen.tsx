import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DemoStackParams } from '../../app/navigation/types';
import { Button } from '../../shared/ui/Button';
import { Avatar } from '../../shared/ui/kit';
import { IconCircle } from '../../shared/ui/art';
import { colors, font, radius, spacing } from '../../shared/theme/tokens';
import { mock } from './mock';
import { ParentTabBar, type ParentTab } from './ParentTabBar';
import { childPhoto, getChild } from './children';
import {
  addDays,
  parseYmd,
  type Pickup,
  type PickupStatus,
  type Schedule,
  upcomingPickups,
  usePickupStore,
  ymd,
} from './pickupStore';
import { scheduleLabel } from './scheduleDraft';

type Props = NativeStackScreenProps<DemoStackParams, 'PMain'>;
type Tab = ParentTab;

/** 부모 메인: 하단 탭(홈·현황·기록·마이) */
export function ParentMainScreen({ navigation, route }: Props) {
  const [tab, setTab] = useState<Tab>(route.params?.tab ?? 'status');
  // 이용 결과(P09) 등에서 탭을 눌러 돌아오면 그 탭으로 바꾼다
  const paramTab = route.params?.tab;
  useEffect(() => {
    if (paramTab) setTab(paramTab);
  }, [paramTab]);
  const nav = navigation;
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.flex}>
        {tab === 'home' && <HomeTab nav={nav} />}
        {tab === 'status' && <StatusTab nav={nav} />}
        {tab === 'records' && <RecordsTab nav={nav} />}
        {tab === 'my' && <MyTab nav={nav} />}
      </View>
      <ParentTabBar
        tab={tab}
        onChange={t => {
          setTab(t);
          // 다른 화면에서 같은 탭으로 돌아올 때도 반영되도록 파라미터를 맞춰 둔다
          navigation.setParams({ tab: t });
        }}
      />
    </SafeAreaView>
  );
}

type Nav = Props['navigation'];

const WEEK_KO = ['일', '월', '화', '수', '목', '금', '토'];
const dateLabel = (d: Date) =>
  `${d.getMonth() + 1}/${d.getDate()} (${WEEK_KO[d.getDay()]})`;

const STATUS_BADGE: Record<PickupStatus, { label: string; color: string }> = {
  scheduled: { label: '예정', color: colors.subText },
  live: { label: '진행 중', color: colors.primary },
  done: { label: '완료', color: colors.success },
  cancelled: { label: '철회됨', color: colors.danger },
};

function Badge({ status }: { status: PickupStatus }) {
  const b = STATUS_BADGE[status];
  return (
    <View style={[s.badge, { borderColor: b.color }]}>
      <Text style={[s.badgeText, { color: b.color }]}>{b.label}</Text>
    </View>
  );
}

/** 오늘 픽업 한 건: 상태에 따라 시작·진행 보기·다시 호출·결과 보기 */
function TodayCard({ p, nav }: { p: Pickup; nav: Nav }) {
  const startPickup = usePickupStore(st => st.startPickup);
  const recallPickup = usePickupStore(st => st.recallPickup);
  const child = getChild(p.childId);
  const openLive = () => nav.navigate('PPickupLive', { id: p.id });
  const openRecord = () =>
    p.recordId && nav.navigate('POutcome', { recordId: p.recordId });
  return (
    <View style={[s.homeCard, p.status === 'cancelled' && s.homeCardOff]}>
      <View style={s.rowBetween}>
        <Text style={s.homeEyebrow}>오늘 {p.time}</Text>
        <Badge status={p.status} />
      </View>
      <View style={s.todayRow}>
        <Image source={childPhoto(child.id)} style={s.photo48} />
        <View style={s.flex}>
          <Text style={s.homeMain}>{child.name}</Text>
          <Text style={s.homeSub}>{p.altSpot ?? p.place}</Text>
        </View>
      </View>
      {p.status === 'scheduled' ? (
        <Button
          label="픽업 시작하기"
          style={s.mt12}
          onPress={() => {
            startPickup(p.id);
            openLive();
          }}
        />
      ) : null}
      {p.status === 'live' ? (
        <Button label="진행 현황 보기" style={s.mt12} onPress={openLive} />
      ) : null}
      {p.status === 'cancelled' ? (
        <>
          <Text style={s.cancelNote}>
            호출을 철회했어요. 자녀는 건물 안에서 기다리고 있어요.
          </Text>
          <View style={s.row}>
            <Button
              variant="outline"
              label="기록 보기"
              style={s.flex}
              onPress={openRecord}
            />
            <Button
              label="다시 호출하기"
              style={s.flex}
              onPress={() => recallPickup(p.id)}
            />
          </View>
        </>
      ) : null}
      {p.status === 'done' ? (
        <Button
          variant="outline"
          label="결과 보기"
          style={s.mt12}
          onPress={openRecord}
        />
      ) : null}
    </View>
  );
}

function ScheduleRow({ sc, onRemove }: { sc: Schedule; onRemove?(): void }) {
  const child = getChild(sc.childId);
  return (
    <View style={s.homeRow}>
      <Image source={childPhoto(child.id)} style={s.photo40} />
      <View style={s.flex}>
        <Text style={s.homeRowTitle}>
          {child.name} · {scheduleLabel(sc.days, sc.weekly, sc.time)}
        </Text>
        <Text style={s.homeSub}>{sc.academy}</Text>
      </View>
      {onRemove ? (
        <Pressable hitSlop={10} onPress={onRemove}>
          <Text style={s.remove}>삭제</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** 홈: Figma에 아직 화면이 없어 오늘 픽업·등록된 일정 요약을 둔다. */
function HomeTab({ nav }: { nav: Nav }) {
  const schedules = usePickupStore(st => st.schedules);
  const pickups = usePickupStore(st => st.pickups);
  const today = ymd(new Date());
  const todays = pickups.filter(p => p.date === today);
  return (
    <ScrollView contentContainerStyle={s.page}>
      <Text style={s.pageTitle}>{mock.guardian.alias}님, 안녕하세요</Text>
      <Text style={s.sectionTitle}>오늘의 픽업</Text>
      {todays.length ? (
        todays.map(p => <TodayCard key={p.id} p={p} nav={nav} />)
      ) : (
        <View style={s.emptyBox}>
          <Text style={s.homeSub}>오늘 예정된 픽업이 없어요.</Text>
        </View>
      )}
      <Pressable
        style={s.homeRow}
        onPress={() => nav.navigate('PScheduleIntro')}
      >
        <IconCircle glyph="+" size={40} />
        <View style={s.flex}>
          <Text style={s.homeRowTitle}>픽업 일정 등록</Text>
          <Text style={s.homeSub}>학원과 픽업 장소, 시간을 등록해요</Text>
        </View>
        <Text style={s.chev}>›</Text>
      </Pressable>
      <Text style={s.sectionTitle}>등록된 일정 {schedules.length}</Text>
      {schedules.map(sc => (
        <ScheduleRow key={sc.id} sc={sc} />
      ))}
    </ScrollView>
  );
}

const STATUS_FILTERS = ['픽업 예정', '진행 중', '자녀별 일정'];

/** 현황메뉴: 픽업 예정 · 진행 중 · 자녀별 일정 */
function StatusTab({ nav }: { nav: Nav }) {
  const schedules = usePickupStore(st => st.schedules);
  const pickups = usePickupStore(st => st.pickups);
  const startPickup = usePickupStore(st => st.startPickup);
  const removeSchedule = usePickupStore(st => st.removeSchedule);
  const today = ymd(new Date());
  const live = pickups.filter(p => p.status === 'live');
  const endedToday = pickups.filter(
    p => p.date === today && (p.status === 'done' || p.status === 'cancelled'),
  );
  const [filter, setFilter] = useState(live.length ? 1 : 0);
  const upcoming = upcomingPickups(schedules, pickups);

  const confirmRemove = (sc: Schedule) =>
    Alert.alert(
      '일정을 삭제할까요?',
      `${getChild(sc.childId).name} · ${scheduleLabel(
        sc.days,
        sc.weekly,
        sc.time,
      )}`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => removeSchedule(sc.id),
        },
      ],
    );

  return (
    <ScrollView contentContainerStyle={s.page}>
      <Text style={s.pageTitle}>픽업 현황</Text>
      <View style={s.filters}>
        {STATUS_FILTERS.map((f, i) => (
          <Pressable key={f} onPress={() => setFilter(i)}>
            <Text style={[s.filter, i === filter && s.filterOn]}>
              {f}
              {i === 1 && live.length ? ` ${live.length}` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      {filter === 0 ? (
        upcoming.length ? (
          upcoming.map(u => {
            const child = getChild(u.schedule.childId);
            return (
              <View key={u.key} style={s.homeRow}>
                <Image source={childPhoto(child.id)} style={s.photo40} />
                <View style={s.flex}>
                  <Text style={s.homeRowTitle}>
                    {u.isToday ? '오늘' : dateLabel(u.date)} {u.schedule.time} ·{' '}
                    {child.name}
                  </Text>
                  <Text style={s.homeSub}>{u.schedule.academy}</Text>
                </View>
                {u.pickup ? (
                  <Button
                    size="sm"
                    label="시작"
                    onPress={() => {
                      startPickup(u.pickup!.id);
                      nav.navigate('PPickupLive', { id: u.pickup!.id });
                    }}
                  />
                ) : null}
              </View>
            );
          })
        ) : (
          <EmptySchedule
            nav={nav}
            text="앞으로 7일 안에 예정된 픽업이 없어요."
          />
        )
      ) : null}

      {filter === 1 ? (
        <>
          {live.length ? (
            live.map(p => {
              const child = getChild(p.childId);
              return (
                <Pressable
                  key={p.id}
                  style={s.liveCard}
                  onPress={() => nav.navigate('PPickupLive', { id: p.id })}
                >
                  <View style={s.liveMap}>
                    <View style={s.liveBadge}>
                      <Text style={s.liveBadgeText}>진행 중</Text>
                    </View>
                  </View>
                  <View style={s.liveInfo}>
                    <Image source={childPhoto(child.id)} style={s.photo56} />
                    <View>
                      <Text style={[s.liveName, s.onDark]}>{child.name}</Text>
                      <Text style={[s.liveMeta, s.onDarkSub]}>
                        {p.altSpot ?? p.place} · {p.time}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View style={s.emptyBox}>
              <Text style={s.homeSub}>진행 중인 픽업이 없어요.</Text>
            </View>
          )}
          {endedToday.length ? (
            <Text style={s.sectionTitle}>오늘 끝난 픽업</Text>
          ) : null}
          {endedToday.map(p => (
            <Pressable
              key={p.id}
              style={s.homeRow}
              onPress={() =>
                p.recordId && nav.navigate('POutcome', { recordId: p.recordId })
              }
            >
              <Image source={childPhoto(p.childId)} style={s.photo40} />
              <View style={s.flex}>
                <Text style={s.homeRowTitle}>
                  {getChild(p.childId).name} · {p.time}
                </Text>
                <Text style={s.homeSub}>{p.altSpot ?? p.place}</Text>
              </View>
              <Badge status={p.status} />
            </Pressable>
          ))}
        </>
      ) : null}

      {filter === 2 ? (
        schedules.length ? (
          mock.children.map(c => {
            const mine = schedules.filter(sc => sc.childId === c.id);
            return (
              <View key={c.id} style={s.childGroup}>
                <Text style={s.sectionTitle}>
                  {c.name} · {mine.length ? `${mine.length}개` : '일정 없음'}
                </Text>
                {mine.map(sc => (
                  <ScheduleRow
                    key={sc.id}
                    sc={sc}
                    onRemove={() => confirmRemove(sc)}
                  />
                ))}
              </View>
            );
          })
        ) : (
          <EmptySchedule nav={nav} text="등록된 일정이 없어요." />
        )
      ) : null}
    </ScrollView>
  );
}

function EmptySchedule({ nav, text }: { nav: Nav; text: string }) {
  return (
    <View style={s.emptyBox}>
      <Text style={s.homeSub}>{text}</Text>
      <Button
        variant="outline"
        label="픽업 일정 등록"
        style={s.mt12}
        onPress={() => nav.navigate('PScheduleIntro')}
      />
    </View>
  );
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const WEEK_EN = WEEKDAYS;
const recordDateLabel = (d: Date) =>
  `${d.getMonth() + 1}/${d.getDate()} ${WEEK_EN[d.getDay()]}`;
const startOfWeek = (d: Date) => addDays(d, -d.getDay());

/**
 * 기록메뉴 - 주간 / 월간 (design/record).
 * 오늘은 파랑, 고른 날은 회색으로 칠하고 날짜 밑 점은 그날 기록 수(최대 2)다.
 * 달력을 아래로 끌면 월간, 위로 밀면 주간으로 바뀐다. 화살표는 주간이면 한 주, 월간이면 한 달씩 움직인다.
 * 아래 목록은 고른 날의 기록이고, 누르면 이용 결과(P09)로 간다.
 */
function RecordsTab({ nav }: { nav: Nav }) {
  const records = usePickupStore(st => st.records);
  const today = new Date();
  const todayKey = ymd(today);
  // 처음에는 오늘, 오늘 기록이 없으면 가장 최근에 기록이 있는 날을 고른다
  const [sel, setSel] = useState(() => {
    const past = records
      .map(r => r.date)
      .filter(d => d <= todayKey)
      .sort();
    const last = past[past.length - 1];
    return last && last !== todayKey ? parseYmd(last) : today;
  });
  const [monthly, setMonthly] = useState(false);
  const selKey = ymd(sel);

  const counts = new Map<string, number>();
  for (const r of records) counts.set(r.date, (counts.get(r.date) ?? 0) + 1);

  const weeks: (Date | null)[][] = [];
  if (monthly) {
    const first = new Date(sel.getFullYear(), sel.getMonth(), 1);
    const last = new Date(sel.getFullYear(), sel.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [
      ...Array<null>(first.getDay()).fill(null),
      ...Array.from({ length: last }, (_, i) => addDays(first, i)),
    ];
    while (cells.length % 7) cells.push(null);
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  } else {
    const start = startOfWeek(sel);
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(start, i)));
  }

  const move = (dir: number) =>
    setSel(d => {
      if (!monthly) return addDays(d, dir * 7);
      const m = new Date(d.getFullYear(), d.getMonth() + dir, 1);
      // 이번 달로 돌아오면 오늘을, 아니면 1일을 고른다
      return m.getFullYear() === today.getFullYear() &&
        m.getMonth() === today.getMonth()
        ? today
        : m;
    });

  const setMonthlyRef = useRef(setMonthly);
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > 12 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 30) setMonthlyRef.current(true);
        else if (g.dy < -30) setMonthlyRef.current(false);
      },
    }),
  ).current;

  const dayRecords = records
    .filter(r => r.date === selKey)
    .sort((a, b) => a.expected.localeCompare(b.expected));

  return (
    <View style={s.recordsPage}>
      {/* 달력은 위에 고정하고(끌어서 주간/월간 전환), 기록 목록만 스크롤한다 */}
      <View style={s.calendarCard} {...pan.panHandlers}>
        <Text style={s.recordsTitle}>픽업 기록</Text>
        <View style={s.recordsDivider} />
        <View style={s.monthRow}>
          <Pressable
            hitSlop={14}
            accessibilityLabel={monthly ? '이전 달' : '이전 주'}
            onPress={() => move(-1)}
          >
            <Text style={s.monthArrow}>‹</Text>
          </Pressable>
          <Text style={s.month}>
            {sel.getFullYear()}.{String(sel.getMonth() + 1).padStart(2, '0')}
          </Text>
          <Pressable
            hitSlop={14}
            accessibilityLabel={monthly ? '다음 달' : '다음 주'}
            onPress={() => move(1)}
          >
            <Text style={s.monthArrow}>›</Text>
          </Pressable>
        </View>
        <View style={s.week}>
          {WEEKDAYS.map(d => (
            <Text key={d} style={s.wd}>
              {d}
            </Text>
          ))}
        </View>
        {weeks.map((w, wi) => (
          <View key={wi} style={s.week}>
            {w.map((d, di) => {
              if (!d) return <View key={di} style={s.dayCol} />;
              const key = ymd(d);
              const isToday = key === todayKey;
              const isSel = key === selKey && !isToday;
              const n = Math.min(counts.get(key) ?? 0, 2);
              return (
                <Pressable
                  key={di}
                  style={s.dayCol}
                  accessibilityLabel={`${
                    d.getMonth() + 1
                  }월 ${d.getDate()}일 기록 ${counts.get(key) ?? 0}건`}
                  onPress={() => setSel(d)}
                >
                  <View
                    style={[
                      s.dayBox,
                      isSel && s.dayBoxSel,
                      isToday && s.dayBoxToday,
                    ]}
                  >
                    <Text style={[s.dayNum, (isSel || isToday) && s.dayNumOn]}>
                      {d.getDate()}
                    </Text>
                  </View>
                  <View style={s.dots}>
                    {Array.from({ length: n }).map((_, i) => (
                      <View
                        key={i}
                        style={[s.recDot, isToday && s.recDotToday]}
                      />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
        <Pressable
          hitSlop={10}
          style={s.grabberWrap}
          accessibilityLabel={monthly ? '주간으로 보기' : '월간으로 보기'}
          onPress={() => setMonthly(m => !m)}
        >
          <View style={s.grabber} />
        </Pressable>
      </View>

      <ScrollView
        style={s.flex}
        contentContainerStyle={[s.timeline, s.recordsContent]}
      >
        {dayRecords.length ? (
          dayRecords.map((r, i) => (
            <View key={r.id} style={s.tlItem}>
              <View style={s.tlRail}>
                <View style={s.tlDot} />
                {i < dayRecords.length - 1 ? <View style={s.tlLine} /> : null}
              </View>
              <View style={s.flex}>
                <Text style={s.tlDate}>
                  {recordDateLabel(parseYmd(r.date))}
                </Text>
                <Pressable
                  style={({ pressed }) => [s.tlCard, pressed && s.pressed]}
                  onPress={() => nav.navigate('POutcome', { recordId: r.id })}
                >
                  <Image source={childPhoto(r.childId)} style={s.photo48} />
                  <View style={s.flex}>
                    <Text style={s.tlPlace}>{r.place}</Text>
                    <Text
                      style={[s.tlSub, r.status === 'cancelled' && s.tlSubOff]}
                    >
                      {r.status === 'done'
                        ? `${r.boardedAt ?? r.actual} 픽업 완료`
                        : `${r.expected} 호출 철회`}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text style={s.tlEmpty}>
            {recordDateLabel(sel)} · 픽업 기록이 없어요.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

/** 마이: Figma에 아직 없음 */
function MyTab({ nav }: { nav: Nav }) {
  return (
    <ScrollView contentContainerStyle={s.page}>
      <Text style={s.pageTitle}>마이</Text>
      <View style={s.myHead}>
        <Avatar name={mock.guardian.alias} size={64} />
        <View>
          <Text style={s.liveName}>{mock.guardian.name}</Text>
          <Text style={s.liveMeta}>
            {mock.vehicle.model} | {mock.vehicle.plate}
          </Text>
        </View>
      </View>
      {mock.children.map(c => (
        <View key={c.id} style={s.homeRow}>
          <Avatar name={c.name} size={40} />
          <View style={s.flex}>
            <Text style={s.homeRowTitle}>{c.name}</Text>
            <Text style={s.homeSub}>{c.school}</Text>
          </View>
        </View>
      ))}
      <Button
        variant="soft"
        label="데모 데이터 초기화"
        style={s.mt24}
        onPress={usePickupStore.getState().resetDemo}
      />
      <Button
        variant="outline"
        label="처음 화면으로"
        style={s.mt24}
        onPress={() => nav.reset({ index: 0, routes: [{ name: 'Landing' }] })}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  mt12: { marginTop: 12 },
  mt24: { marginTop: 24 },
  page: { padding: spacing.md, paddingBottom: 40, gap: 12 },
  pageTitle: {
    fontSize: font.heading,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  note: {
    fontSize: font.tiny,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 24,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 2, paddingBottom: 4 },
  tabIcon: { fontSize: 20, color: colors.muted },
  tabLabel: { fontSize: font.tiny, color: colors.muted, fontWeight: '500' },
  tabOn: { color: colors.text },
  homeCard: {
    padding: 20,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    gap: 4,
  },
  homeEyebrow: {
    fontSize: font.label,
    color: colors.primary,
    fontWeight: '600',
  },
  homeMain: { fontSize: font.title, fontWeight: '700', color: colors.text },
  homeSub: { fontSize: font.caption, color: colors.subText },
  homeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  homeRowTitle: { fontSize: font.body, fontWeight: '600', color: colors.text },
  chev: { fontSize: 24, color: colors.muted },
  filters: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  filter: { fontSize: font.body, color: colors.muted, fontWeight: '600' },
  filterOn: { color: colors.text },
  liveCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: '#3A3D44',
  },
  onDark: { color: '#FFFFFF' },
  onDarkSub: { color: '#C9CBD1' },
  liveMap: { height: 120, backgroundColor: '#5A5E66', padding: 16 },
  liveBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  liveBadgeText: { color: '#FFFFFF', fontSize: font.label, fontWeight: '600' },
  liveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  liveName: { fontSize: font.heading, fontWeight: '600', color: colors.text },
  liveMeta: { fontSize: font.label, color: colors.subText, marginTop: 2 },
  emptyBox: {
    padding: 24,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'stretch',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 56,
    marginTop: 28,
    marginBottom: 24,
  },
  month: { fontSize: 22, fontWeight: '700', color: colors.primary },
  monthArrow: { fontSize: 34, color: '#B1B1B1', lineHeight: 36 },
  week: { flexDirection: 'row' },
  wd: {
    flex: 1,
    textAlign: 'center',
    fontSize: font.caption,
    color: '#B1B1B1',
    marginBottom: 8,
  },
  dayNum: { fontSize: 16, color: '#6A6A6A' },
  dayNumOn: { color: '#FFFFFF', fontWeight: '700' },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: 12 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  homeCardOff: { backgroundColor: '#FFF1F1' },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  cancelNote: { fontSize: font.caption, color: colors.danger, marginTop: 10 },
  badge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: font.tiny, fontWeight: '600' },
  photo40: { width: 40, height: 40, borderRadius: 20 },
  photo48: { width: 48, height: 48, borderRadius: 24 },
  photo56: { width: 56, height: 56, borderRadius: 28 },
  remove: { fontSize: font.label, color: colors.danger, fontWeight: '600' },
  childGroup: { gap: 8 },
  recordsPage: { flex: 1, backgroundColor: '#F7F8FA' },
  recordsContent: { paddingBottom: 40 },
  calendarCard: {
    zIndex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    // 위쪽으로는 번지지 않게 반경만큼 아래로 내린다
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  recordsTitle: {
    fontSize: font.heading,
    fontWeight: '700',
    color: colors.text,
    marginTop: 28,
    marginBottom: 18,
  },
  recordsDivider: { height: 1, backgroundColor: '#E1E3E5' },
  dayCol: { flex: 1, alignItems: 'center', marginHorizontal: 2 },
  dayBox: {
    alignSelf: 'stretch',
    height: 46,
    borderRadius: 6,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBoxSel: { backgroundColor: '#75777D' },
  dayBoxToday: { backgroundColor: colors.primary },
  dots: { flexDirection: 'row', gap: 4, height: 14, alignItems: 'center' },
  recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#75777D' },
  recDotToday: { backgroundColor: colors.primary },
  grabberWrap: { alignItems: 'center', paddingTop: 4, paddingBottom: 12 },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E1E3E5',
  },
  timeline: { paddingHorizontal: spacing.md, paddingTop: 28 },
  tlItem: { flexDirection: 'row', gap: 14 },
  tlRail: { width: 8, alignItems: 'center', paddingTop: 8 },
  tlDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#75777D' },
  tlLine: {
    flex: 1,
    width: 0,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#B1B1B1',
    marginTop: 4,
  },
  tlDate: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5B5D63',
    marginBottom: 12,
  },
  tlCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    height: 92,
    borderRadius: 16,
    backgroundColor: colors.bg,
    marginBottom: 32,
  },
  tlPlace: { fontSize: 17, fontWeight: '700', color: colors.text },
  tlSub: { fontSize: font.label, color: colors.subText, marginTop: 8 },
  tlSubOff: { color: colors.danger },
  tlEmpty: {
    textAlign: 'center',
    fontSize: font.label,
    color: colors.subText,
    marginTop: 24,
  },
  pressed: { opacity: 0.85 },
  myHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
});
