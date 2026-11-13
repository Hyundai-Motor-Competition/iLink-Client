import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import type { DemoStackParams } from '../../app/navigation/types';
import { colors, font, radius, spacing } from '../../shared/theme/tokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mock } from './mock';
import { ParentTabBar, type ParentTab } from './ParentTabBar';
import { getChild } from './children';
import {
  diffMinutes,
  parseYmd,
  type PickupRecord,
  usePickupStore,
} from './pickupStore';

type P<K extends keyof DemoStackParams> = NativeStackScreenProps<
  DemoStackParams,
  K
>;

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
