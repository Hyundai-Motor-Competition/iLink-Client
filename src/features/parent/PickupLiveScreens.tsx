import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import type { DemoStackParams } from '../../app/navigation/types';
import { Button } from '../../shared/ui/Button';
import { BottomSheet, CenterDialog, Screen, TopBar } from '../../shared/ui/kit';
import { colors, font, radius, spacing } from '../../shared/theme/tokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mock } from './mock';
import { ParentTabBar, type ParentTab } from './ParentTabBar';
import { childPhoto, getChild } from './children';
import {
  diffMinutes,
  parseYmd,
  type PickupRecord,
  usePickupStore,
} from './pickupStore';

const icon = {
  mapSearch: require('../../assets/images/map_search.png'),
  call: require('../../assets/images/call.png'),
  cancel: require('../../assets/images/do_not_disturb_on.png'),
};

type P<K extends keyof DemoStackParams> = NativeStackScreenProps<
  DemoStackParams,
  K
>;

type Step = { title: string; desc?: string };

const DEPART: Step = { title: '부모님 출발' };
const READY: Step = { title: '준비 완료', desc: '자녀가 건물 안에서 기다려요' };
const MISSED: Step = {
  title: '정차하지 못했어요.',
  desc: '대안 장소로 재안내를 보냈어요.',
};
const ALT_STOP: Step = {
  title: '대안 장소에 정차했어요.',
  desc: '대안 장소에 도착 후 알림을 보냈어요.',
};
const CANCELLED: Step = {
  title: '호출을 철회했어요.',
  desc: '자녀에게 건물 안에서 기다리라고 안내했어요.',
};
/** STAGES에서 "대안 장소로 가기" 단계 */
const ALT_STAGE = 2;
const BOARDED: Step = {
  title: '자녀가 차량에 탑승했어요.',
  desc: '픽업 일정을 종료해요.',
};

/**
 * 현황메뉴 - 진행 중 2~7 (Figma 순서).
 * 서버 연결 전이라 몇 초마다 다음 단계로 넘어가고, 경로 이탈·탑승 확인은 팝업으로 보여준다.
 */
const STAGES: {
  steps: Step[];
  dialog?: 'detour' | 'boarded';
  /** 진행 중인 단계 (기본: 마지막). 그 뒤 단계는 예정으로 보인다. */
  current?: number;
  ended?: boolean;
}[] = [
  {
    current: 1,
    steps: [
      DEPART,
      { title: '안에서 준비하기', desc: '가방을 챙기고 건물 안에서 기다려요' },
      {
        title: '만나는 곳으로 가기',
        desc: '정문 앞 · 차가 오기 3분 전에 알려줄게요',
      },
    ],
  },
  {
    dialog: 'detour',
    current: 2,
    steps: [
      DEPART,
      READY,
      MISSED,
      {
        title: '만나는 곳으로 가기',
        desc: '횡단보도 앞 · 차가 오기 3분 전에 알려줄게요',
      },
    ],
  },
  {
    steps: [
      DEPART,
      READY,
      MISSED,
      {
        title: '대안 장소로 가기',
        desc: '대안 장소에 도착하면 알림을 보낼게요.',
      },
    ],
  },
  { steps: [DEPART, READY, MISSED, ALT_STOP] },
  { ended: true, steps: [DEPART, READY, MISSED, ALT_STOP, BOARDED] },
  {
    ended: true,
    dialog: 'boarded',
    steps: [DEPART, READY, MISSED, ALT_STOP, BOARDED],
  },
];

export function PickupLiveScreen({ navigation, route }: P<'PPickupLive'>) {
  const { id } = route.params;
  const pickup = usePickupStore(st => st.pickups.find(p => p.id === id));
  const saveStage = usePickupStore(st => st.setStage);
  const cancelPickup = usePickupStore(st => st.cancelPickup);
  const completePickup = usePickupStore(st => st.completePickup);
  const [hold, setHold] = useState(false);
  const [sheet, setSheet] = useState<'alt' | 'cancel' | null>(null);

  // 진행 단계·대체 장소·철회 여부는 스토어에 두어 홈·현황과 함께 바뀐다.
  const stage = Math.min(pickup?.stage ?? 0, STAGES.length - 1);
  const altSpot = pickup?.altSpot ?? null;
  const cancelled = pickup?.status === 'cancelled';
  const finished = pickup?.status === 'done';
  const live = pickup?.status === 'live';
  const setStage = (n: number, spot?: string) => saveStage(id, n, spot);
  const cur = STAGES[stage];
  const busy = !!sheet || !live;

  // 팝업·시트가 떠 있지 않으면 4초 뒤 다음 단계로
  useEffect(() => {
    if (busy || cur.dialog || stage >= STAGES.length - 1) return;
    const t = setTimeout(() => saveStage(id, stage + 1), 4000);
    return () => clearTimeout(t);
  }, [id, stage, cur.dialog, busy, saveStage]);

  const showResult = () => {
    const recordId = completePickup(id);
    if (recordId) navigation.replace('POutcome', { recordId });
  };

  if (!pickup) {
    return (
      <Screen
        header={<TopBar title="진행 중인 픽업" onBack={navigation.goBack} />}
      >
        <Text style={s.emptyText}>픽업 정보를 찾을 수 없어요.</Text>
      </Screen>
    );
  }
  const child = getChild(pickup.childId);

  // 대체 장소를 고르면 "대안 장소로 가기" 단계로, 호출을 철회하면 진행을 멈추고 철회 단계를 붙인다.
  const steps: Step[] = cancelled
    ? [
        ...cur.steps.slice(0, (cur.current ?? cur.steps.length - 1) + 1),
        CANCELLED,
      ]
    : altSpot
    ? cur.steps.map(st =>
        st === ALT_STOP
          ? { ...st, desc: `${altSpot}에 도착 후 알림을 보냈어요.` }
          : st.title === '대안 장소로 가기'
          ? { ...st, desc: `${altSpot} · 도착하면 알림을 보낼게요.` }
          : st,
      )
    : cur.steps;
  const lastIdx = steps.length - 1;
  const curIdx = cancelled ? lastIdx : cur.current ?? lastIdx;
  const ended = !!cur.ended || cancelled || finished;
  const canAct = !ended;

  return (
    <Screen
      header={<TopBar title="진행 중인 픽업" onBack={navigation.goBack} />}
      footer={
        cancelled ? (
          <Button label="현황으로 돌아가기" onPress={navigation.goBack} />
        ) : finished ? (
          <Button label="결과 보기" onPress={showResult} />
        ) : cur.ended ? null : (
          <Button
            variant={hold ? 'outline' : 'dark'}
            label={hold ? '다음 알림 다시 받기' : '다음 알림 보류하기'}
            onPress={() => setHold(h => !h)}
          />
        )
      }
    >
      <View style={s.hero}>
        <Image source={childPhoto(child.id)} style={s.heroPhoto} />
        <Text style={s.name}>{child.name}</Text>
        <Text style={s.place}>
          {pickup.place} · {pickup.time}
        </Text>
      </View>

      <View style={s.actions}>
        <Action
          icon={icon.mapSearch}
          label="대체 장소"
          tint={colors.dark}
          disabled={!canAct}
          onPress={() => setSheet('alt')}
        />
        <Action icon={icon.call} label="직접 연락" tint={colors.success} />
        <Action
          icon={icon.cancel}
          label="호출 철회"
          tint={colors.danger}
          disabled={!canAct}
          onPress={() => setSheet('cancel')}
        />
      </View>

      <Text style={s.section}>진행 상황</Text>
      <View>
        {cancelled ? (
          <View style={s.notice}>
            <Text style={s.noticeText}>
              픽업 호출을 철회했어요. 진행이 멈췄어요.
            </Text>
          </View>
        ) : altSpot ? (
          <View style={s.notice}>
            <Text style={s.noticeText}>대체 장소로 바꿨어요 · {altSpot}</Text>
          </View>
        ) : null}
        {steps.map((st, i) => {
          const isCancel = cancelled && i === lastIdx;
          const done = (i < curIdx || !!cur.ended) && !isCancel;
          const active = i === curIdx && !ended;
          return (
            <View key={st.title + i} style={s.step}>
              <View style={s.rail}>
                <View
                  style={[
                    s.node,
                    done && s.nodeDone,
                    active && s.nodeActive,
                    isCancel && s.nodeCancel,
                  ]}
                >
                  {done ? <Text style={s.nodeMark}>✓</Text> : null}
                  {isCancel ? <Text style={s.nodeMark}>✕</Text> : null}
                </View>
                {i < lastIdx ? (
                  <View style={[s.line, i < curIdx && s.lineDone]} />
                ) : null}
              </View>
              <View style={s.stepText}>
                <Text
                  style={[
                    s.stepTitle,
                    active && s.stepTitleActive,
                    isCancel && s.danger,
                    i > curIdx && !ended && s.stepTitlePending,
                  ]}
                >
                  {st.title}
                </Text>
                {st.desc ? <Text style={s.stepDesc}>{st.desc}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>

      <BottomSheet visible={sheet === 'alt'} onClose={() => setSheet(null)}>
        <Text style={s.sheetTitle}>대체 장소로 바꿀까요?</Text>
        <Text style={s.dlgDescLeft}>
          자녀에게 새 장소로 가라고 바로 안내해요.
        </Text>
        {mock.spots.map((sp, i) => {
          const on = (altSpot ?? '') === sp.name;
          return (
            <Pressable
              key={sp.name}
              style={[s.spotRow, on && s.spotRowOn]}
              onPress={() => {
                setStage(Math.max(stage, ALT_STAGE), sp.name);
                setSheet(null);
              }}
            >
              <View style={[s.spotNum, i > 0 && s.spotNumAlt]}>
                <Text style={s.nodeMark}>{i + 1}</Text>
              </View>
              <View style={s.flex}>
                <Text style={s.stepTitle}>{sp.name}</Text>
                <Text style={s.stepDesc}>{sp.meta}</Text>
              </View>
            </Pressable>
          );
        })}
        <Button variant="soft" label="취소" onPress={() => setSheet(null)} />
      </BottomSheet>

      <CenterDialog visible={sheet === 'cancel'} onClose={() => setSheet(null)}>
        <Text style={s.dlgEyebrowDanger}>호출 철회</Text>
        <Text style={s.dlgTitle}>픽업 호출을 철회할까요?</Text>
        <Text style={s.dlgDesc}>
          자녀에게 건물 안에서 기다리라고 안내해요.{'\n'}철회 후에는 다시
          호출해야 해요.
        </Text>
        <Button
          variant="outline"
          label="계속 진행할게요"
          onPress={() => setSheet(null)}
        />
        <Button
          variant="dark"
          label="호출 철회하기"
          onPress={() => {
            cancelPickup(id);
            setSheet(null);
          }}
        />
      </CenterDialog>

      <CenterDialog
        visible={cur.dialog === 'detour' && !busy}
        onClose={() => {}}
      >
        <Text style={s.dlgEyebrow}>경로 이탈 감지</Text>
        <Text style={s.dlgTitle}>정차할 장소를 지나쳤어요.</Text>
        <Text style={s.dlgDesc}>안내를 위해 다음 중 선택해주세요.</Text>
        <Button
          variant="outline"
          label="해당 장소로 재진입할거에요."
          onPress={() => setStage(3)}
        />
        <Button
          label="두번째 대안 장소로 이동할게요."
          onPress={() => setStage(2)}
        />
      </CenterDialog>

      <CenterDialog
        visible={cur.dialog === 'boarded' && !busy}
        onClose={() => {}}
      >
        <View style={s.check}>
          <Text style={s.checkMark}>✓</Text>
        </View>
        <Text style={s.dlgEyebrow}>자녀 탑승 확인</Text>
        <Text style={s.dlgTitle}>픽업을 종료하고 귀가할게요.</Text>
        <Text style={s.dlgDesc}>안전한 탑승을 확인했어요.</Text>
        <Button label="결과 보기" onPress={showResult} />
      </CenterDialog>
    </Screen>
  );
}

function Action({
  icon,
  label,
  tint,
  disabled,
  onPress,
}: {
  icon: ImageSourcePropType;
  label: string;
  tint: string;
  disabled?: boolean;
  onPress?(): void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.action,
        disabled && s.actionDisabled,
        pressed && s.pressed,
      ]}
    >
      <View style={[s.actionIcon, { backgroundColor: tint }]}>
        <Image source={icon} style={s.actionImg} />
      </View>
      <Text style={s.actionLabel}>{label}</Text>
    </Pressable>
  );
}

/** P09 이용 결과·데이터 */
const WEEK_KO = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * P09 이용 결과·데이터 (design/record).
 * 기록 탭에서 들어오는 화면이라 하단 탭 바를 그대로 두고(기록 선택),
 * 오른쪽 위 달력 아이콘이나 탭을 누르면 메인으로 돌아간다.
 */
export function OutcomeScreen({ navigation, route }: P<'POutcome'>) {
  const record = usePickupStore(st =>
    st.records.find(r => r.id === route.params.recordId),
  );
  const optIn = usePickupStore(st => st.predictionOptIn);
  const setOptIn = usePickupStore(st => st.setPredictionOptIn);
  const toTab = (tab: ParentTab) => navigation.popTo('PMain', { tab });

  const header = (
    <View style={s.outHeader}>
      <Text style={s.outTitle}>이용 결과</Text>
      <Pressable
        hitSlop={12}
        accessibilityLabel="기록 달력으로"
        style={s.calBtn}
        onPress={() => toTab('records')}
      >
        <CalendarIcon />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={s.outRoot} edges={['top']}>
      {header}
      {record ? (
        <OutcomeBody record={record} optIn={optIn} setOptIn={setOptIn} />
      ) : (
        <Text style={s.emptyText}>기록을 찾을 수 없어요.</Text>
      )}
      <ParentTabBar tab="records" onChange={toTab} />
    </SafeAreaView>
  );
}

function OutcomeBody({
  record,
  optIn,
  setOptIn,
}: {
  record: PickupRecord;
  optIn: boolean;
  setOptIn(v: boolean): void;
}) {
  const d = parseYmd(record.date);
  const done = record.status === 'done' && !!record.actual;
  const diff = done ? diffMinutes(record.expected, record.actual!) : 0;
  const diffText = !done
    ? '-'
    : diff === 0
    ? '정시'
    : `${diff > 0 ? '+' : ''}${diff}분`;
  return (
    <ScrollView style={s.flex} contentContainerStyle={s.outContent}>
      <View style={s.outSection}>
        <Text style={s.outDate}>
          {d.getMonth() + 1}월 {d.getDate()}일 ({WEEK_KO[d.getDay()]})
        </Text>
        <Text style={[s.outResult, !done && s.danger]}>
          {done ? '픽업 완료' : '호출 철회'}
        </Text>
        <Text style={s.outSub}>
          {mock.guardian.name} ·{' '}
          {done
            ? `${record.boardedAt ?? record.actual} 탑승 확인`
            : `${record.expected} 픽업을 철회했어요`}
        </Text>
        <Text style={s.outMeta}>
          {getChild(record.childId).name} · {record.place}
        </Text>
      </View>
      <View style={s.band} />
      <View style={s.outSection}>
        <Text style={s.outHead}>예상 vs 실제</Text>
        <Row k="정차 예상" v={record.expected} />
        <Row k="실제 정차" v={done ? record.actual! : '-'} />
        <Row k="차이" v={diffText} accent={done && diff > 0} />
      </View>
      <View style={s.band} />
      <View style={s.outSection}>
        <Text style={s.outHead}>데이터 설정</Text>
        <View style={s.rowBetween}>
          <View style={s.flex}>
            <Text style={s.optTitle}>예측 개선에 활용</Text>
            <Text style={s.optDesc}>
              90일 동안 보관하고, 언제든 삭제할 수 있어요
            </Text>
          </View>
          <Switch
            value={optIn}
            onValueChange={setOptIn}
            trackColor={{ true: colors.primary }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function CalendarIcon() {
  return (
    <View style={s.cal}>
      <View style={[s.calRing, s.calRingL]} />
      <View style={[s.calRing, s.calRingR]} />
      <View style={s.calBar} />
    </View>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <View style={[s.rowBetween, s.outRow]}>
      <Text style={s.rowK}>{k}</Text>
      <Text style={[s.rowV, accent && s.late]}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  outRoot: { flex: 1, backgroundColor: colors.bg },
  outHeader: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  calBtn: { position: 'absolute', right: spacing.md },
  cal: {
    width: 20,
    height: 19,
    borderWidth: 2,
    borderColor: colors.text,
    borderRadius: 4,
  },
  calRing: {
    position: 'absolute',
    top: -5,
    width: 2,
    height: 5,
    backgroundColor: colors.text,
  },
  calRingL: { left: 3 },
  calRingR: { right: 3 },
  calBar: { height: 2, backgroundColor: colors.text, marginTop: 3 },
  outContent: { paddingBottom: 32 },
  outSection: { paddingHorizontal: spacing.md, paddingVertical: 24 },
  band: { height: 8, backgroundColor: '#F7F8FA' },
  outDate: { fontSize: 15, color: '#5B5D63' },
  outResult: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 12,
  },
  outSub: { fontSize: font.label, color: colors.subText },
  outMeta: { fontSize: font.caption, color: colors.muted, marginTop: 4 },
  outHead: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5B5D63',
    marginBottom: 10,
  },
  outRow: { paddingVertical: 8 },
  late: { color: '#FF4D1F' },
  optTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  optDesc: { fontSize: font.caption, color: colors.subText, marginTop: 6 },
  flex: { flex: 1 },
  mt: { marginTop: spacing.lg },
  hero: { alignItems: 'center', gap: 4, marginTop: 24 },
  name: {
    fontSize: font.heading,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  place: { fontSize: font.label, color: colors.subText },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
    marginTop: 24,
    marginBottom: 24,
  },
  action: { alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionImg: { width: 24, height: 24 },
  heroPhoto: { width: 96, height: 96, borderRadius: 48 },
  emptyText: {
    marginTop: 80,
    textAlign: 'center',
    fontSize: font.body,
    color: colors.subText,
  },
  actionDisabled: { opacity: 0.35 },
  pressed: { opacity: 0.7 },
  nodeCancel: { backgroundColor: colors.danger, borderColor: colors.danger },
  notice: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: { fontSize: font.label, color: colors.text, fontWeight: '600' },
  sheetTitle: { fontSize: font.heading, fontWeight: '700', color: colors.text },
  dlgDescLeft: {
    fontSize: font.label,
    color: colors.subText,
    marginBottom: 8,
  },
  dlgEyebrowDanger: {
    textAlign: 'center',
    color: colors.danger,
    fontSize: font.body,
    fontWeight: '600',
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  spotRowOn: { borderColor: colors.primary },
  spotNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotNumAlt: { backgroundColor: colors.dark },
  danger: { color: colors.danger },
  actionLabel: { fontSize: font.label, color: colors.text },
  section: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  step: { flexDirection: 'row', gap: 14, minHeight: 58 },
  rail: { alignItems: 'center', width: 20 },
  node: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  nodeActive: { borderColor: colors.primary, borderWidth: 6 },
  nodeMark: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  line: { flex: 1, width: 2, backgroundColor: colors.line, marginVertical: 2 },
  lineDone: { backgroundColor: colors.primary },
  stepText: { flex: 1, gap: 4, paddingBottom: 14 },
  stepTitle: { fontSize: font.body, color: colors.text, fontWeight: '500' },
  stepTitlePending: { color: colors.muted },
  stepTitleActive: { color: colors.primary, fontWeight: '700' },
  stepDesc: { fontSize: font.caption, color: colors.subText },
  dlgEyebrow: {
    textAlign: 'center',
    color: colors.primary,
    fontSize: font.body,
    fontWeight: '600',
  },
  dlgTitle: {
    textAlign: 'center',
    fontSize: font.title,
    fontWeight: '700',
    color: colors.text,
  },
  dlgDesc: {
    textAlign: 'center',
    fontSize: font.body,
    color: colors.subText,
    marginBottom: 8,
  },
  check: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  date: { fontSize: font.body, color: colors.subText, marginTop: 16 },
  result: {
    fontSize: font.title,
    fontWeight: '700',
    color: colors.text,
    marginVertical: 6,
  },
  card: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    gap: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowK: { fontSize: 15, color: colors.subText },
  rowV: { fontSize: font.body, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border },
});
