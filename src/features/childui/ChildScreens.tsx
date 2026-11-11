import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { DemoStackParams } from '../../app/navigation/types';
import { BottomSheet, Screen } from '../../shared/ui/kit';
import { colors, font, radius } from '../../shared/theme/tokens';

type P<K extends keyof DemoStackParams> = NativeStackScreenProps<
  DemoStackParams,
  K
>;

/*
 * 자녀 C00~C05 (Figma "Frame 1707486725" · Mobile v2, design/child/*.png).
 * 일러스트·아이콘·지도는 내보낸 화면 PNG에서 잘라 src/assets/images/child 에 두었다.
 * 실제 앱에서는 서버 상태로 화면이 바뀌고, 데모에서는 하단 "다음 안내 보기"로 넘어간다.
 */

const img = {
  family: require('../../assets/images/family_duo.png'),
  school: require('../../assets/images/child/school.png'),
  carMoving: require('../../assets/images/child/car_moving.png'),
  pinCar: require('../../assets/images/child/pin_car.png'),
  shield: require('../../assets/images/child/shield.png'),
  carDone: require('../../assets/images/child/car_done.png'),
  clock: require('../../assets/images/child/tile_clock.png'),
  pin: require('../../assets/images/child/tile_pin.png'),
  calendar: require('../../assets/images/child/tile_calendar.png'),
  stepCar: require('../../assets/images/child/step_car.png'),
  stepBag: require('../../assets/images/child/step_bag.png'),
  stepPin: require('../../assets/images/child/step_pin.png'),
  map: require('../../assets/images/child/map.png'),
  bgGreen: require('../../assets/images/child/bg_green.png'),
  bgBlueGreen: require('../../assets/images/child/bg_bluegreen.png'),
  bgPeach: require('../../assets/images/child/bg_peach.png'),
  bgMint: require('../../assets/images/child/bg_mint.png'),
};

const c = {
  dark: '#44464E',
  soft: '#EDEEF2',
  border: '#EDEEF2',
  body: '#3A3D42',
  green: '#02C265',
  pink: '#FFF0ED',
  checkOff: '#C7C9CE',
};

const PICKUP = { time: '18:05', place: '수학 임팩트 학원', remain: 12 };

/* ───────── 공통 ───────── */

function Btn({
  label,
  onPress,
  tone = 'primary',
  disabled,
  flex,
}: {
  label: string;
  onPress(): void;
  tone?: 'primary' | 'dark' | 'soft' | 'outline';
  disabled?: boolean;
  flex?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        s[`btn_${tone}`],
        flex && s.flex,
        disabled && s.btnDisabled,
        pressed && s.pressed,
      ]}
    >
      <Text
        style={[
          s.btnLabel,
          (tone === 'primary' || tone === 'dark') && s.btnLabelLight,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DemoNext({ onPress }: { onPress(): void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={s.demoNext}>다음 안내 보기 ›</Text>
    </Pressable>
  );
}

/** 상단 상태 표시(점 + 문구) · 제목 · 설명 · 일러스트 */
function Hero({
  status,
  dot,
  title,
  desc,
  art,
  artTop = 28,
}: {
  status?: string;
  dot?: string;
  title: string;
  desc: string;
  art: ImageSourcePropType;
  artTop?: number;
}) {
  return (
    <View style={s.hero}>
      {status ? (
        <View style={s.statusRow}>
          <View style={[s.dot, { backgroundColor: dot ?? c.body }]} />
          <Text style={[s.status, { color: dot ?? c.body }]}>{status}</Text>
        </View>
      ) : null}
      <Text style={s.title}>{title}</Text>
      <Text style={s.desc}>{desc}</Text>
      <Image source={art} style={{ marginTop: artTop }} />
    </View>
  );
}

function Tile({ src, size = 48 }: { src: ImageSourcePropType; size?: number }) {
  return (
    <Image
      source={src}
      style={[s.tile, { width: size, height: size, borderRadius: size / 4 }]}
    />
  );
}

/* ───────── C00 가족 연결 ───────── */

const PERMS = [
  {
    title: '위치 공유',
    tag: '필수',
    desc: "만나는 곳 안내에 '항상 허용'이 필요해요",
    required: true,
  },
  {
    title: '알림 권한',
    tag: '필수',
    desc: '부모님 출발과 도착을 알려줘요',
    required: true,
  },
  {
    title: '서비스 개선',
    tag: '선택',
    desc: '픽업 기록을 서비스 개선에 활용해요',
    required: false,
  },
];

export function ChildInviteScreen({ navigation }: P<'CInvite'>) {
  const [checked, setChecked] = useState([true, true, false]);
  const ok = PERMS.every((p, i) => !p.required || checked[i]);
  return (
    <Screen
      style={s.c00}
      footer={
        <Btn
          label="연결하기"
          disabled={!ok}
          onPress={() =>
            navigation.reset({ index: 0, routes: [{ name: 'CWaiting' }] })
          }
        />
      }
    >
      <View style={s.hero}>
        <Text style={s.title}>김현대님 반가워요!</Text>
        <Text style={s.desc}>
          김지은 보호자가 iLink로 초대했어요.{'\n'}연결하면 픽업 알림을 받을 수
          있어요.
        </Text>
        <Image source={img.family} style={s.family} />
      </View>

      <View style={[s.card, s.permCard]}>
        <Text style={s.cardLabel}>권한 동의</Text>
        {PERMS.map((p, i) => (
          <Pressable
            key={p.title}
            onPress={() => setChecked(v => v.map((x, j) => (j === i ? !x : x)))}
            style={[s.permRow, i > 0 && s.rowDivider]}
          >
            <View style={s.flex}>
              <View style={s.permHead}>
                <Text style={s.permTitle}>{p.title}</Text>
                <Text style={[s.permTag, p.required && s.permTagReq]}>
                  {p.tag}
                </Text>
              </View>
              <Text style={s.permDesc}>{p.desc}</Text>
            </View>
            <View style={[s.check, checked[i] && s.checkOn]}>
              {checked[i] ? <Text style={s.checkMark}>✓</Text> : null}
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

/* ───────── C01 실내 대기 ───────── */

export function ChildWaitingScreen({ navigation }: P<'CWaiting'>) {
  return (
    <Screen
      bg={img.bgGreen}
      footer={<DemoNext onPress={() => navigation.navigate('CDeparted')} />}
    >
      <Hero
        status="실내 대기"
        dot="#5F6660"
        title="건물 안에서 기다려 주세요"
        desc="부모님이 출발하면 알림을 보내줄게요."
        art={img.school}
        artTop={36}
      />
      <View style={[s.card, s.mt36]}>
        <View style={[s.infoRow, s.rowFirst]}>
          <Tile src={img.clock} />
          <View>
            <Text style={s.infoLabel}>픽업 시간</Text>
            <Text style={s.infoValueBig}>오늘 {PICKUP.time}</Text>
          </View>
        </View>
        <View style={[s.infoRow, s.rowDivider, s.rowNext]}>
          <Tile src={img.pin} />
          <View>
            <Text style={s.infoLabel}>만나는 곳</Text>
            <Text style={s.infoValue}>{PICKUP.place}</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

/* ───────── C02 부모님 출발 + 준비 시간 추가 바텀시트 ───────── */

const EXTRA = [5, 10, 15];

function addMin(hhmm: string, m: number) {
  const [h, mm] = hhmm.split(':').map(Number);
  const t = h * 60 + mm + m;
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

function ExtraTimeSheet({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose(): void;
  onAdd(min: number): void;
}) {
  const [pick, setPick] = useState(5);
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={s.sheetTitle}>준비 시간이 더 필요해요?</Text>
      <Text style={s.sheetDesc}>부모님께 몇 분 더 걸리는지 알려 드릴게요.</Text>
      <View style={s.seg}>
        {EXTRA.map(m => {
          const on = pick === m;
          return (
            <Pressable
              key={m}
              onPress={() => setPick(m)}
              style={[s.segItem, on && s.segItemOn]}
            >
              <Text style={[s.segMin, on && s.segMinOn]}>+{m}분</Text>
              <Text style={[s.segTime, on && s.segTimeOn]}>
                {addMin(PICKUP.time, m)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={s.sheetBtns}>
        <View style={s.cancelWrap}>
          <Btn tone="outline" label="취소" onPress={onClose} />
        </View>
        <Btn
          flex
          tone="dark"
          label={`${pick}분 추가하기`}
          onPress={() => onAdd(pick)}
        />
      </View>
    </BottomSheet>
  );
}

const STEPS = [
  { src: img.stepCar, label: '부모님 출발', sub: '17:53', state: 'done' },
  { src: img.stepBag, label: '안에서 준비하기', sub: '지금', state: 'now' },
  {
    src: img.stepPin,
    label: '만나러 나가기',
    sub: '차 오기 3분 전',
    state: 'next',
  },
] as const;

export function ChildDepartedScreen({ navigation }: P<'CDeparted'>) {
  const [sheet, setSheet] = useState(false);
  const [extra, setExtra] = useState(0);
  const eta = addMin(PICKUP.time, extra);
  return (
    <Screen
      bg={img.bgBlueGreen}
      footer={
        <>
          <Btn
            tone="soft"
            label="준비 시간이 더 필요해요"
            onPress={() => setSheet(true)}
          />
          <DemoNext onPress={() => navigation.navigate('CMeet')} />
        </>
      }
    >
      <Hero
        status="부모님 출발"
        dot={colors.primary}
        title="부모님이 출발했어요"
        desc={
          '준비가 끝나도 안에서 기다려 주세요.\n차가 도착하면 다시 알려줄게요.'
        }
        art={img.carMoving}
        artTop={48}
      />

      <View style={[s.card, s.mt44]}>
        <View style={s.etaRow}>
          <Text style={s.eta}>
            {eta}
            <Text style={s.etaSub}> 도착 예정</Text>
          </Text>
          <View style={s.pill}>
            <Text style={s.pillText}>약 {PICKUP.remain + extra}분 남음</Text>
          </View>
        </View>
        <View style={s.track}>
          <View style={s.fill} />
        </View>
        <View style={s.steps}>
          {STEPS.map((st, i) => (
            <View key={st.label} style={s.step}>
              <Image source={st.src} style={s.stepImg} />
              {i < STEPS.length - 1 ? (
                <View
                  style={[s.dash, i === 0 ? s.dashOn : s.dashOff]}
                  pointerEvents="none"
                />
              ) : null}
              <Text
                style={[
                  s.stepLabel,
                  st.state === 'now' && s.stepLabelNow,
                  st.state === 'next' && s.stepLabelNext,
                ]}
              >
                {st.label}
              </Text>
              <Text style={s.stepSub}>{st.sub}</Text>
            </View>
          ))}
        </View>
        {extra ? (
          <Text style={s.extraNote}>
            준비 시간 +{extra}분을 부모님께 알렸어요
          </Text>
        ) : null}
      </View>

      <ExtraTimeSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        onAdd={m => {
          setExtra(m);
          setSheet(false);
        }}
      />
    </Screen>
  );
}

/* ───────── C03 합류 안내 ───────── */

export function ChildMeetScreen({ navigation }: P<'CMeet'>) {
  const [sheet, setSheet] = useState(false);
  const [extra, setExtra] = useState(0);
  return (
    <Screen
      bg={img.bgBlueGreen}
      footer={
        <>
          <Btn
            tone="soft"
            label="준비 시간이 더 필요해요"
            onPress={() => setSheet(true)}
          />
          <Btn
            tone="dark"
            label="차를 못 찾겠어요"
            onPress={() => navigation.navigate('CHelp')}
          />
          <DemoNext onPress={() => navigation.navigate('CDone')} />
        </>
      }
    >
      <Hero
        status="곧 도착"
        dot={colors.primary}
        title="부모님 차가 곧 도착해요"
        desc="지금 만나는 곳으로 가 주세요."
        art={img.pinCar}
      />

      <View style={[s.card, s.mapCard]}>
        <Image source={img.map} style={s.map} resizeMode="cover" />
        <View style={s.meetRow}>
          <Tile src={img.pin} />
          <View style={s.flex}>
            <Text style={s.infoLabel}>만나는 곳</Text>
            <Text style={s.meetPlace}>{PICKUP.place}</Text>
            <Text style={s.meetSub}>
              {addMin(PICKUP.time, extra)} 도착 예정
            </Text>
          </View>
          <View style={s.pill}>
            <Text style={s.pillText}>걸어서 2분</Text>
          </View>
        </View>
      </View>

      <ExtraTimeSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        onAdd={m => {
          setExtra(m);
          setSheet(false);
        }}
      />
    </Screen>
  );
}

/* ───────── C04 안전 대기·도움 요청 ───────── */

export function ChildHelpScreen({ navigation }: P<'CHelp'>) {
  const [sent, setSent] = useState(false);
  return (
    <Screen
      bg={img.bgPeach}
      footer={
        <>
          <Btn
            tone="dark"
            label={sent ? '부모님께 연락했어요' : '부모님께 연락하기'}
            onPress={() => setSent(true)}
          />
          <DemoNext onPress={() => navigation.navigate('CDone')} />
        </>
      }
    >
      <Hero
        status="안내가 바뀌었어요"
        dot="#393637"
        title="건물 안에서 기다려 주세요"
        desc={
          '아까 받은 안내는 취소됐어요.\n다른 곳으로 가지 말고 기다려 주세요.'
        }
        art={img.shield}
      />
      <View style={[s.card, s.mt34]}>
        <Text style={s.cardLabel}>이렇게 해요</Text>
        {[
          '이미 밖이라면 건물 안에서 기다려요.',
          '다시 안내할 때 까지 대기해 주세요.',
        ].map((t, i) => (
          <View key={t} style={s.numRow}>
            <View style={s.num}>
              <Text style={s.numText}>{i + 1}</Text>
            </View>
            <Text style={s.numLabel}>{t}</Text>
          </View>
        ))}
      </View>
      <View style={s.notice}>
        <Text style={s.noticeTitle}>부모님이 다시 확인하고 있어요.</Text>
        <Text style={s.noticeDesc}>새 장소가 정해지면 다시 알려줄게요.</Text>
      </View>
    </Screen>
  );
}

/* ───────── C05 픽업 완료 ───────── */

export function ChildDoneScreen({ navigation }: P<'CDone'>) {
  return (
    <Screen
      bg={img.bgMint}
      footer={
        <>
          <Text style={s.footNote}>픽업이 끝나서 위치 공유를 껐어요</Text>
          <Btn
            tone="dark"
            label="홈으로"
            onPress={() =>
              navigation.reset({ index: 0, routes: [{ name: 'Landing' }] })
            }
          />
        </>
      }
    >
      <Hero
        status="픽업 완료"
        dot={c.green}
        title="탑승 완료!"
        desc="오늘도 안전하게 만났어요."
        art={img.carDone}
        artTop={36}
      />
      <View style={s.twoCards}>
        <View style={[s.card, s.miniCard]}>
          <Tile src={img.clock} size={40} />
          <Text style={[s.infoLabel, s.mt16]}>탑승 시각</Text>
          <Text style={s.infoValueBig}>18:08</Text>
        </View>
        <View style={[s.card, s.miniCard]}>
          <Tile src={img.pin} size={40} />
          <Text style={[s.infoLabel, s.mt16]}>만난 곳</Text>
          <Text style={s.infoValueBig}>{PICKUP.place}</Text>
        </View>
      </View>
      <View style={[s.card, s.infoRow, s.nextCard]}>
        <Tile src={img.calendar} />
        <View>
          <Text style={s.infoLabel}>다음 픽업</Text>
          <Text style={s.infoValueBig}>금요일 {PICKUP.time}</Text>
          <Text style={s.meetSub}>{PICKUP.place}</Text>
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  mt16: { marginTop: 16 },
  mt34: { marginTop: 34 },
  mt36: { marginTop: 36 },
  mt44: { marginTop: 44 },

  // 버튼
  btn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn_primary: { backgroundColor: colors.primary },
  btn_dark: { backgroundColor: c.dark },
  btn_soft: { backgroundColor: c.soft },
  btn_outline: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: '#D9DBE0',
  },
  btnDisabled: { backgroundColor: '#B1B1B1', borderColor: '#B1B1B1' },
  btnLabel: { fontSize: 17, fontWeight: '600', color: colors.text },
  btnLabelLight: { color: '#FFFFFF' },
  demoNext: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: font.caption,
    paddingVertical: 4,
  },

  // 상단
  hero: { alignItems: 'center', paddingTop: 24 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  status: { fontSize: 14, fontWeight: '600' },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.4,
  },
  desc: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: c.body,
    textAlign: 'center',
  },

  // 카드
  card: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 20,
    backgroundColor: colors.bg,
    padding: 18,
  },
  cardLabel: { fontSize: 14, color: colors.subText, marginBottom: 4 },
  rowDivider: { borderTopWidth: 1, borderTopColor: c.border },
  tile: { backgroundColor: '#EEF2FB' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  rowFirst: { paddingBottom: 14 },
  rowNext: { paddingTop: 14 },
  infoLabel: { fontSize: 13, color: colors.subText, marginBottom: 4 },
  infoValueBig: { fontSize: 18, fontWeight: '700', color: colors.text },
  infoValue: { fontSize: 16, fontWeight: '600', color: colors.text },

  // C00
  c00: { justifyContent: 'space-between' },
  family: { width: 196, height: 196, marginTop: 10 },
  permCard: { marginTop: 24, paddingBottom: 6 },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  permHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  permTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  permTag: { fontSize: 13, fontWeight: '600', color: colors.subText },
  permTagReq: { color: colors.primary },
  permDesc: { marginTop: 6, fontSize: 13, color: colors.subText },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: c.checkOff,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // C02
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eta: { fontSize: 20, fontWeight: '700', color: colors.text },
  etaSub: { fontSize: 14, fontWeight: '500', color: colors.subText },
  pill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: c.soft,
    marginTop: 14,
    overflow: 'hidden',
  },
  fill: { width: '37%', height: 6, backgroundColor: colors.primary },
  steps: { flexDirection: 'row', marginTop: 28 },
  step: { flex: 1, alignItems: 'center' },
  stepImg: { width: 56, height: 56, borderRadius: 28 },
  dash: {
    position: 'absolute',
    top: 27,
    left: '50%',
    marginLeft: 31,
    width: '41%',
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
  },
  dashOn: { borderColor: '#8AA2E6' },
  dashOff: { borderColor: '#D9DBE0' },
  stepLabel: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  stepLabelNow: { color: colors.primary },
  stepLabelNext: { color: colors.subText },
  stepSub: { marginTop: 6, fontSize: 12, color: colors.subText },
  extraNote: {
    marginTop: 16,
    textAlign: 'center',
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  // 바텀시트
  sheetTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  sheetDesc: { fontSize: 15, color: c.body, marginTop: 4, marginBottom: 16 },
  seg: {
    flexDirection: 'row',
    backgroundColor: c.soft,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  segItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  segItemOn: {
    backgroundColor: colors.bg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  segMin: { fontSize: 16, fontWeight: '500', color: colors.subText },
  segMinOn: { fontWeight: '700', color: colors.text },
  segTime: { fontSize: 12, color: colors.subText, marginTop: 2 },
  segTimeOn: { color: colors.primary },
  sheetBtns: { flexDirection: 'row', gap: 8 },
  cancelWrap: { width: 78 },

  // C03
  mapCard: { marginTop: 28, padding: 0, overflow: 'hidden' },
  map: { alignSelf: 'stretch', aspectRatio: 708 / 396 },
  meetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
  },
  meetPlace: { fontSize: 18, fontWeight: '700', color: colors.text },
  meetSub: { marginTop: 4, fontSize: 14, color: colors.subText },

  // C04
  numRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  num: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: c.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { fontSize: 12, fontWeight: '600', color: colors.text },
  numLabel: { fontSize: 16, fontWeight: '500', color: colors.text },
  notice: {
    marginTop: 12,
    backgroundColor: c.pink,
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  noticeTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  noticeDesc: { fontSize: 13, color: colors.subText },

  // C05
  twoCards: { flexDirection: 'row', gap: 10, marginTop: 40 },
  miniCard: { flex: 1, padding: 16 },
  nextCard: { marginTop: 12 },
  footNote: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.subText,
    marginBottom: 4,
  },
});
