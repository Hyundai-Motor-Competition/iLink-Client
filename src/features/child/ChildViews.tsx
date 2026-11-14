import { type ReactNode, useEffect, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Modal,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pretendard as pf } from '../../shared/theme/tokens';
import {
  type LatLng,
  RouteLine,
  TileMap,
} from '../../shared/ui/TileMap';

/*
 * 자녀 화면 3차 시안 (design/child2/*.png, 390 x 844pt @2x).
 * 좌표는 시안에서 잰 값이다. 위쪽 요소는 상태 표시줄(47pt) 아래 기준, 버튼 · 카드는 화면 아래 기준으로 놓는다.
 * 일러스트(집 · 차 · 얼굴 · 손)는 시안 PNG에서 잘라 src/assets/images/child2 에 두었다.
 * 이 파일은 그리기만 한다. 서버 상태 연결은 ChildSessionScreen.
 */

export const C = {
  bg: '#EBEBEB',
  ink: '#111200',
  body: '#3A3A38',
  sub: '#7E7E7E',
  white: '#FFFFFF',
  yellow: '#F6FF43',
  ringOff: '#848484',
  pink: '#FF3C14',
  pinkSoft: '#F0DCD7',
  dim: 'rgba(0,0,0,0.42)',
} as const;

export const art = {
  house: require('../../assets/images/child2/house.png'),
  carSide: require('../../assets/images/child2/car_side.png'),
  carFront: require('../../assets/images/child2/car_front.png'),
  faces: require('../../assets/images/child2/faces.png'),
  hands: require('../../assets/images/child2/hands.png'),
  ground: require('../../assets/images/child2/ground.png'),
  profile: require('../../assets/images/child2/ic_profile.png'),
  pin: require('../../assets/images/child2/ic_pin.png'),
  clock: require('../../assets/images/child2/ic_clock.png'),
  avatarChild: require('../../assets/images/child2/avatar_child.png'),
  avatarGuardian: require('../../assets/images/child2/avatar_guardian.png'),
};

/** 시안의 상태 표시줄 높이. 위 요소 좌표는 이 아래부터 잰다 */
const TOP = 47;
const top = (designY: number) => designY - TOP;

/* ───────── 화면 틀 ───────── */

/** 회색 바탕 + 오른쪽 위 프로필 버튼 + 제목 · 설명. 나머지는 children이 절대 위치로 그린다 */
export function ChildFrame({
  title,
  desc,
  children,
  footer,
  bg = C.bg,
  onProfile,
  hideProfile,
  backdrop,
}: {
  title?: string;
  desc?: string;
  children?: ReactNode;
  /** 화면 아래 고정 (버튼 · 카드) */
  footer?: ReactNode;
  bg?: string;
  onProfile?(): void;
  hideProfile?: boolean;
  /** 제목 뒤 전체 배경 (지도) */
  backdrop?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const padTop = Math.max(insets.top, TOP);
  const padBottom = Math.max(insets.bottom + 12, 34);
  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      {backdrop}
      {/* 절대 위치 요소가 상태 표시줄 아래부터 재도록 여백은 margin으로 */}
      <View style={[s.flex, { marginTop: padTop }]}>
        {!hideProfile ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="내 정보"
            onPress={onProfile}
            style={s.profileBtn}
          >
            <Image source={art.profile} style={s.profileIc} />
          </Pressable>
        ) : null}
        {title ? <Text style={s.title}>{title}</Text> : null}
        {desc ? <Text style={s.desc}>{desc}</Text> : null}
        {children}
      </View>
      {footer ? (
        <View style={[s.footer, { paddingBottom: padBottom }]}>{footer}</View>
      ) : null}
    </View>
  );
}

/** 땅(시안 y 600부터 아래로 옅어지는 띠) */
export function Ground() {
  return (
    <Image
      source={art.ground}
      resizeMode="stretch"
      style={[s.ground, { top: top(600) }]}
    />
  );
}

/** 시안 좌표(pt)에 일러스트를 놓는다 */
export function Art({
  src,
  x,
  y,
  w,
  h,
}: {
  src: ImageSourcePropType;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  // 가로는 화면 가운데 기준(시안 폭 390)으로 맞춘다
  return (
    <View style={[s.artRow, { top: top(y), height: h }]} pointerEvents="none">
      <Image
        source={src}
        style={{ width: w, height: h, marginLeft: (x + w / 2 - 195) * 2 }}
      />
    </View>
  );
}

/* ───────── 버튼 ───────── */

export function Pill({
  label,
  onPress,
  tone = 'dark',
  disabled,
  style,
  right,
}: {
  label: string;
  onPress(): void;
  tone?: 'dark' | 'white' | 'gray';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  right?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.pill,
        tone === 'dark' && s.pillDark,
        tone === 'white' && s.pillWhite,
        tone === 'gray' && s.pillGray,
        disabled && s.pillDisabled,
        pressed && s.pressed,
        style,
      ]}
    >
      <Text
        style={[
          s.pillLabel,
          tone === 'dark' && s.pillLabelLight,
          tone !== 'dark' && s.pillLabelRegular,
        ]}
      >
        {label}
      </Text>
      {right}
    </Pressable>
  );
}

/* ───────── 진행 카드 (차량 출발 · 곧 도착 · 탑승하기) ───────── */

const LABELS_DEFAULT = ['차량 출발', '곧 도착', '탑승하기'] as const;
const STRIPES = 120;

/**
 * pos: 0(차량 출발) · 0.5(가운데 단계) · 1(탑승하기) 사이 화살표 위치.
 * done: 진하게 표시할 단계 수(라벨 · 점).
 */
export function ProgressCard({
  pos,
  done,
  labels = LABELS_DEFAULT,
  tone = 'dark',
  style,
}: {
  pos: number;
  done: number;
  labels?: readonly [string, string, string];
  tone?: 'dark' | 'pink';
  style?: StyleProp<ViewStyle>;
}) {
  const p = Math.min(1, Math.max(0, pos));
  const arrowColor = tone === 'pink' ? C.pink : C.ink;
  return (
    <View style={[s.progCard, style]}>
      <View style={s.progLabels}>
        {labels.map((l, i) => (
          <Text
            key={l}
            style={[
              s.progLabel,
              i === 1 && s.center,
              i === 2 && s.right,
              i < done && s.progLabelOn,
            ]}
          >
            {l}
          </Text>
        ))}
      </View>
      <View style={s.track}>
        {/* 세로 줄무늬: 화살표에 가까울수록 진하다 */}
        <View style={s.stripes}>
          {Array.from({ length: STRIPES }, (_, i) => {
            const t = i / (STRIPES - 1);
            const passed = t <= p;
            const near = passed ? Math.max(0, 1 - (p - t) / 0.35) : 0;
            const op = passed ? 0.18 + near * 0.62 : t > 0.92 ? 0.08 : 0.16;
            return (
              <View
                key={i}
                style={[
                  s.stripe,
                  {
                    backgroundColor: C.ink,
                    opacity: op,
                  },
                ]}
              />
            );
          })}
        </View>
        {[0, 0.5, 1].map((at, i) => {
          if (Math.abs(at - p) < 0.04) return null;
          const on = i < done;
          return (
            <View key={at} style={[s.ring, ringAt(at), !on && s.ringOff]}>
              <View style={[s.ringDot, !on && s.ringDotOff]} />
            </View>
          );
        })}
        <View style={[s.arrow, arrowAt(p), { backgroundColor: arrowColor }]}>
          <View style={s.arrowTri} />
        </View>
      </View>
    </View>
  );
}

// 점 위치: 카드 안 x 47 · 179 · 311 (가운데)
const TRACK_LEFT = 47;
const TRACK_W = 264;
const ringAt = (t: number): ViewStyle => ({ left: TRACK_LEFT + t * TRACK_W - 8 });
const arrowAt = (t: number): ViewStyle => ({
  left: TRACK_LEFT + t * TRACK_W - 11,
});

/* ───────── 아래 카드 두 개 (위치 · 시간) ───────── */

export function InfoPair({
  items,
  style,
}: {
  items: { icon: 'pin' | 'clock'; label: string; value: string }[];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.pair, style]}>
      {items.map(it => (
        <View key={it.label} style={s.pairCard}>
          <View style={s.pairHead}>
            <Image
              source={it.icon === 'pin' ? art.pin : art.clock}
              style={it.icon === 'pin' ? s.icPin : s.icClock}
            />
            <Text style={s.pairLabel}>{it.label}</Text>
          </View>
          <Text style={s.pairValue} numberOfLines={1} adjustsFontSizeToFit>
            {it.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ───────── 가운데 팝업 (연결 완료) ───────── */

export function ConnectedDialog({
  visible,
  variant,
  onClose,
}: {
  visible: boolean;
  variant: 'faces' | 'hands';
  onClose(): void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={s.dim}>
        <View style={s.dialog}>
          {variant === 'faces' ? (
            <Image source={art.faces} style={s.faces} />
          ) : (
            <Image source={art.hands} style={s.hands} />
          )}
          <Text style={s.dialogTitle}>연결이 완료되었어요!</Text>
          <Text style={s.dialogDesc}>
            {variant === 'faces'
              ? '보호자분과의 연결이\n정상적으로 완료되었어요.'
              : '이제 픽업을 실시간으로 확인할 수 있어요'}
          </Text>
          <Pill label="확인" onPress={onClose} style={s.dialogBtn} />
        </View>
      </View>
    </Modal>
  );
}

/* ───────── 준비 시간 추가 바텀시트 ───────── */

const EXTRA = [5, 10, 15] as const;

export function addMinutes(hhmm: string, m: number) {
  const [h, mm] = hhmm.split(':').map(Number);
  const t = (h * 60 + mm + m) % (24 * 60);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

export function ExtraTimeSheet({
  visible,
  base,
  used = 0,
  busy,
  onClose,
  onAdd,
}: {
  visible: boolean;
  /** 지금 도착 예정 시각 HH:MM */
  base: string;
  /** 이미 늘린 분 (세션당 15분까지) */
  used?: number;
  busy?: boolean;
  onClose(): void;
  onAdd(min: 5 | 10 | 15): void;
}) {
  const [pick, setPick] = useState<5 | 10 | 15>(5);
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.dimFill} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom + 12, 34) }]}>
        <View style={s.grabber} />
        <Text style={s.sheetTitle}>준비 시간이 더 필요하신가요?</Text>
        <Text style={s.sheetDesc}>
          {'추가로 필요한 시간을 선택해 주세요.\n선택한 시간만큼 보호자에게 알려드릴게요.'}
        </Text>
        <View style={s.seg}>
          {EXTRA.map(m => {
            const on = pick === m;
            const over = used + m > 15;
            return (
              <Pressable
                key={m}
                disabled={over}
                onPress={() => setPick(m)}
                style={[s.segItem, on && s.segItemOn, over && s.segOver]}
              >
                <Text style={[s.segMin, on && s.segMinOn]}>+{m}분</Text>
                <Text style={[s.segTime, on && s.segTimeOn]}>
                  {addMinutes(base, m)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={s.sheetBtns}>
          <Pill tone="gray" label="취소" onPress={onClose} style={s.cancel} />
          <Pill
            label={`${pick}분 추가하기`}
            disabled={busy || used + pick > 15}
            onPress={() => onAdd(pick)}
            style={s.flex}
          />
        </View>
      </View>
    </Modal>
  );
}

/* ───────── C00 가족 연결 ───────── */

export type Consent = {
  key: string;
  title: string;
  desc: string;
  required: boolean;
};

export const CHILD_CONSENTS: Consent[] = [
  {
    key: 'LOCATION',
    title: '(필수) 위치 공유',
    desc: "만나는 곳까지 안내하려면 '항상 허용'이 필요해요.",
    required: true,
  },
  {
    key: 'PUSH',
    title: '(필수) 알림 권한',
    desc: '부모님 출발과 도착을 알려줘요.',
    required: true,
  },
  {
    key: 'IMPROVE',
    title: '(선택) 서비스 개선',
    desc: '픽업 기록을 서비스 개선에 활용해요.',
    required: false,
  },
];

export function ChildInviteView({
  childName,
  inviterName,
  busy,
  error,
  onConnect,
}: {
  childName: string;
  inviterName: string;
  busy?: boolean;
  error?: string | null;
  onConnect(): void;
}) {
  const [checked, setChecked] = useState([true, true, false]);
  const ok = CHILD_CONSENTS.every((c, i) => !c.required || checked[i]);
  return (
    <ChildFrame
      hideProfile
      footer={
        <>
          {error ? <Text style={s.error}>{error}</Text> : null}
          <Pill label="연결하기" disabled={!ok || busy} onPress={onConnect} />
        </>
      }
    >
      <Text style={[s.title, s.inviteTitle]}>{childName}님 반가워요!</Text>
      <Text style={s.desc}>
        {`${inviterName} 보호자가 iLink로 초대했어요.\n연결하면 픽업 알림을 받을 수 있어요.`}
      </Text>
      <View style={s.flex} />
      <View style={s.consentCard}>
        <Text style={s.consentHead}>권한 동의</Text>
        <View style={s.dashed} />
        {CHILD_CONSENTS.map((c, i) => (
          <Pressable
            key={c.key}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: checked[i] }}
            onPress={() => setChecked(v => v.map((x, j) => (j === i ? !x : x)))}
            style={s.consentRow}
          >
            <View style={s.flex}>
              <Text style={s.consentTitle}>{c.title}</Text>
              <Text style={s.consentDesc}>{c.desc}</Text>
            </View>
            <View style={[s.check, checked[i] && s.checkOn]}>
              {checked[i] ? <View style={s.checkMark} /> : null}
            </View>
          </Pressable>
        ))}
      </View>
      <View style={s.consentGap} />
    </ChildFrame>
  );
}

/* ───────── C01 실내 대기 ───────── */

export function ChildWaitingView({
  place,
  time,
  dialog,
  onCloseDialog,
  onProfile,
}: {
  place: string;
  time: string;
  dialog?: 'faces' | 'hands' | null;
  onCloseDialog?(): void;
  onProfile?(): void;
}) {
  return (
    <ChildFrame
      title="건물 안에서 기다려 주세요"
      desc={'아직 픽업 시간이 아니에요.\n보호자가 출발하면 알림으로 알려드릴게요.'}
      onProfile={onProfile}
      footer={
        <InfoPair
          items={[
            { icon: 'pin', label: '다음 픽업 위치', value: place },
            { icon: 'clock', label: '다음 픽업 시간', value: time },
          ]}
        />
      }
    >
      <Ground />
      <Art src={art.house} x={88} y={406} w={214} h={238} />
      <ConnectedDialog
        visible={!!dialog}
        variant={dialog ?? 'faces'}
        onClose={() => onCloseDialog?.()}
      />
    </ChildFrame>
  );
}

/* ───────── C02 보호자 출발 ───────── */

export function ChildDepartedView({
  who,
  eta,
  pos,
  extraUsed,
  busy,
  notice,
  onAddTime,
  onProfile,
}: {
  /** '엄마가' · '김현대님이' */
  who: string;
  /** 도착 예정 HH:MM */
  eta: string;
  pos: number;
  extraUsed: number;
  busy?: boolean;
  notice?: string | null;
  onAddTime(min: 5 | 10 | 15): Promise<void> | void;
  onProfile?(): void;
}) {
  const [sheet, setSheet] = useState(false);
  return (
    <ChildFrame
      title={`${who} 출발했어요`}
      desc={'준비가 끝나도 건물 안에서 기다려 주세요.\n차량이 가까워지면 다시 알려드릴게요.'}
      onProfile={onProfile}
      footer={
        <>
          {notice ? <Text style={s.note}>{notice}</Text> : null}
          <Pill
            tone="white"
            label="준비 시간이 더 필요해요"
            disabled={extraUsed >= 15}
            onPress={() => setSheet(true)}
          />
        </>
      }
    >
      <ProgressCard pos={pos} done={1} style={{ top: top(240) }} />
      <Ground />
      <View style={[s.tipRow, { top: top(445) }]}>
        <View style={s.tip}>
          <Text style={s.tipTime}>{eta}</Text>
          <Text style={s.tipText}> 도착 예정</Text>
        </View>
        <View style={s.tipTail} />
      </View>
      <Art src={art.carSide} x={43} y={516} w={285} h={110} />
      <ExtraTimeSheet
        visible={sheet}
        base={eta}
        used={extraUsed}
        busy={busy}
        onClose={() => setSheet(false)}
        onAdd={async m => {
          await onAddTime(m);
          setSheet(false);
        }}
      />
    </ChildFrame>
  );
}

/* ───────── C03 합류 안내 (지도) ───────── */

export function ChildMeetView({
  academy,
  spot,
  minutes,
  child,
  vehicle,
  childPhoto,
  guardianPhoto,
  pos,
  notice,
  busy,
  onHelp,
  onProfile,
}: {
  academy: string;
  spot: string;
  /** 차 도착까지 남은 분 (null이면 '곧 도착') */
  minutes: number | null;
  child: LatLng | null;
  vehicle: LatLng | null;
  childPhoto?: ImageSourcePropType;
  guardianPhoto?: ImageSourcePropType;
  pos: number;
  notice?: string | null;
  busy?: boolean;
  onHelp(): void;
  onProfile?(): void;
}) {
  const points = [child, vehicle].filter(Boolean) as LatLng[];
  const backdrop =
    points.length > 0 ? (
      <TileMap
        style={StyleSheet.absoluteFill}
        points={points}
        padding={{ top: top(340) + 150, bottom: 150, side: 60 }}
        maxZoom={18}
      >
        {project => {
          const c = child ? project(child) : null;
          const v = vehicle ? project(vehicle) : null;
          return (
            <>
              {c && v ? (
                <RouteLine
                  from={v}
                  to={c}
                  colors={['#1C1F2B', '#1F2D4F', '#233D74', '#2A4F98', '#3163BC', '#3A75DA']}
                />
              ) : null}
              {v ? (
                <MapPin at={v} photo={guardianPhoto ?? art.avatarGuardian} ring={C.yellow}>
                  <View style={s.etaBubble}>
                    <Text style={s.etaBubbleText}>
                      {minutes == null ? '곧 도착' : minutes <= 0 ? '도착' : `${minutes}분 후 도착`}
                    </Text>
                  </View>
                </MapPin>
              ) : null}
              {c ? (
                <MapPin at={c} photo={childPhoto ?? art.avatarChild} ring="#3A75DA">
                  <View style={s.placeBubble}>
                    <Text style={s.placeName} numberOfLines={1}>
                      {academy}
                    </Text>
                    <Text style={s.placeSub} numberOfLines={1}>
                      {spot}
                    </Text>
                  </View>
                </MapPin>
              ) : null}
            </>
          );
        }}
      </TileMap>
    ) : (
      <View style={[StyleSheet.absoluteFill, s.mapEmpty]} />
    );
  return (
    <ChildFrame
      title="차가 곧 도착해요"
      desc={'지금 만나는 곳으로 가 주세요.\n우리 차가 맞는지 꼭 확인하고 타요.'}
      onProfile={onProfile}
      backdrop={
        <>
          {backdrop}
          <TopFade />
        </>
      }
      footer={
        <>
          {notice ? <Text style={[s.note, s.noteOnMap]}>{notice}</Text> : null}
          <Pill label="차를 못 찾겠어요" disabled={busy} onPress={onHelp} />
        </>
      }
    >
      <ProgressCard
        pos={pos}
        done={2}
        labels={['차량 출발', '픽업 도착', '탑승하기']}
        style={{ top: top(240) }}
      />
    </ChildFrame>
  );
}

/** 지도 위쪽을 회색 바탕으로 덮고 아래로 서서히 투명하게 */
function TopFade() {
  const insets = useSafeAreaInsets();
  const solid = Math.max(insets.top, TOP) + top(300);
  const steps = [0.92, 0.75, 0.55, 0.35, 0.18, 0.06];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={{ height: solid, backgroundColor: C.bg }} />
      {steps.map(o => (
        <View key={o} style={{ height: 10, backgroundColor: C.bg, opacity: o }} />
      ))}
    </View>
  );
}

function MapPin({
  at,
  photo,
  ring,
  children,
}: {
  at: { x: number; y: number };
  photo: ImageSourcePropType;
  ring: string;
  children?: ReactNode;
}) {
  // 핀 끝(아래 꼭짓점)이 좌표에 오게
  const W = 54;
  return (
    <View
      pointerEvents="none"
      style={[s.pinWrap, { left: at.x - 80, top: at.y - W - 10 - 52 }]}
    >
      <View style={s.pinBubbleSlot}>{children}</View>
      <View style={s.pinBody}>
        <View style={s.pinTail} />
        <View style={[s.pinRing, { borderColor: ring }]}>
          <Image source={photo} style={s.pinPhoto} />
        </View>
      </View>
    </View>
  );
}

/* ───────── C04 안내 변경 · 도움 요청 ───────── */

export function ChildHelpView({
  title = '건물 안에서 기다려 주세요',
  desc = '아까 받은 안내는 취소됐어요.\n새 장소가 정해지면 다시 알려줄게요.',
  banner = '부모님이 다시 정차 위치를 확인중',
  busy,
  onContact,
  onProfile,
}: {
  title?: string;
  desc?: string;
  banner?: string;
  busy?: boolean;
  onContact(): void;
  onProfile?(): void;
}) {
  return (
    <ChildFrame
      title={title}
      desc={desc}
      onProfile={onProfile}
      footer={
        <>
          <View style={s.banner}>
            <View style={s.bannerIc}>
              <Text style={s.bannerIcText}>i</Text>
            </View>
            <Text style={s.bannerText}>{banner}</Text>
          </View>
          <Pill tone="white" label="부모님께 연락하기" disabled={busy} onPress={onContact} />
        </>
      }
    >
      <ProgressCard pos={0.75} done={2} tone="pink" style={{ top: top(240) }} />
      <Ground />
      <Art src={art.house} x={88} y={406} w={214} h={238} />
    </ChildFrame>
  );
}

/* ───────── C05 탑승 완료 ───────── */

export function ChildDoneView({
  place,
  boardedAt,
  seconds = 8,
  onConfirm,
  onProfile,
}: {
  place: string;
  boardedAt: string;
  seconds?: number;
  onConfirm(): void;
  onProfile?(): void;
}) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) {
      onConfirm();
      return;
    }
    const t = setTimeout(() => setLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onConfirm]);
  return (
    <ChildFrame
      title="안전하게 탑승했어요!"
      desc={'오늘 하루도 수고 많았어요.\n이제 목적지까지 편안하게 이동해 주세요.'}
      onProfile={onProfile}
      footer={
        <>
          <InfoPair
            style={s.doneCards}
            items={[
              { icon: 'pin', label: '만난 곳', value: place },
              { icon: 'clock', label: '탑승 시각', value: boardedAt },
            ]}
          />
          <Pill
            label="확인"
            onPress={onConfirm}
            right={
              <View style={s.countRing}>
                <Text style={s.countText}>{Math.max(left, 0)}</Text>
              </View>
            }
          />
        </>
      }
    >
      <ProgressCard pos={1} done={3} style={{ top: top(240) }} />
      <Ground />
      <Art src={art.carFront} x={72} y={423} w={246} h={179} />
    </ChildFrame>
  );
}

/** '오후 8시 10분' */
export function koreanTime(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  const ap = h < 12 ? '오전' : '오후';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${ap} ${hh}시${m ? ` ${m}분` : ''}`;
}

export function hhmm(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1 },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  pressed: { opacity: 0.85 },

  profileBtn: {
    position: 'absolute',
    right: 16,
    top: 15,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  profileIc: { width: 22, height: 22 },
  title: {
    marginTop: top(124),
    textAlign: 'center',
    fontFamily: pf.extrabold,
    fontSize: 26.5,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: C.ink,
  },
  inviteTitle: { marginTop: top(232) },
  desc: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: pf.regular,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: C.body,
  },
  footer: { position: 'absolute', left: 16, right: 16, bottom: 0, gap: 12 },
  ground: { position: 'absolute', left: 0, width: '100%', height: 90 },
  artRow: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },

  pill: {
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  pillDark: { backgroundColor: C.ink },
  pillWhite: { backgroundColor: C.white },
  pillGray: { backgroundColor: '#EBEBEB' },
  pillDisabled: { opacity: 0.45 },
  pillLabel: {
    fontFamily: pf.semibold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: C.ink,
  },
  pillLabelLight: { color: C.white },
  pillLabelRegular: { fontFamily: pf.regular },

  progCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 100,
    borderRadius: 30,
    backgroundColor: C.white,
    paddingHorizontal: 22,
    paddingTop: 27,
  },
  progLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progLabel: {
    flex: 1,
    fontFamily: pf.semibold,
    fontSize: 14,
    letterSpacing: -0.3,
    color: C.ringOff,
  },
  progLabelOn: { color: C.ink },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 53,
    height: 22,
  },
  stripes: {
    position: 'absolute',
    left: TRACK_LEFT + 8,
    width: TRACK_W - 16,
    top: 3,
    height: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stripe: { width: 0.8, height: 16 },
  ring: {
    position: 'absolute',
    top: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.ink,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOff: { borderColor: C.ringOff },
  ringDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.ink },
  ringDotOff: { backgroundColor: C.ringOff },
  arrow: {
    position: 'absolute',
    top: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowTri: {
    marginLeft: 2,
    width: 0,
    height: 0,
    borderTopWidth: 4.5,
    borderBottomWidth: 4.5,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: C.white,
  },

  pair: { flexDirection: 'row', gap: 7 },
  pairCard: {
    flex: 1,
    height: 107,
    borderRadius: 26,
    backgroundColor: C.white,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  pairHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icPin: { width: 13, height: 17 },
  icClock: { width: 17, height: 16 },
  pairLabel: { fontFamily: pf.regular, fontSize: 14, color: C.sub },
  pairValue: {
    marginTop: 22,
    fontFamily: pf.bold,
    fontSize: 19,
    letterSpacing: -0.4,
    color: C.ink,
  },
  doneCards: { marginBottom: 4 },

  dim: {
    flex: 1,
    backgroundColor: C.dim,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dimFill: { flex: 1, backgroundColor: C.dim },
  dialog: {
    borderRadius: 28,
    backgroundColor: C.white,
    alignItems: 'center',
    paddingTop: 42,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faces: { width: 173, height: 80 },
  hands: { width: 116, height: 81 },
  dialogTitle: {
    marginTop: 30,
    fontFamily: pf.extrabold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: C.ink,
  },
  dialogDesc: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: pf.regular,
    fontSize: 15,
    lineHeight: 23,
    color: C.ink,
  },
  dialogBtn: { alignSelf: 'stretch', marginTop: 26 },

  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 16,
    paddingTop: 12,
    alignItems: 'center',
  },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#DCDCE0' },
  sheetTitle: {
    marginTop: 34,
    fontFamily: pf.extrabold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: C.ink,
  },
  sheetDesc: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: pf.regular,
    fontSize: 15,
    lineHeight: 23,
    color: C.ink,
  },
  seg: {
    alignSelf: 'stretch',
    marginTop: 26,
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 30,
    padding: 4,
  },
  segItem: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segItemOn: {
    backgroundColor: C.white,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segOver: { opacity: 0.35 },
  segMin: { fontFamily: pf.bold, fontSize: 16, color: C.body },
  segMinOn: { color: C.ink },
  segTime: { marginTop: 2, fontFamily: pf.regular, fontSize: 13, color: '#8E8E8E' },
  segTimeOn: { color: '#2F7BF5' },
  sheetBtns: { alignSelf: 'stretch', flexDirection: 'row', gap: 8, marginTop: 28 },
  cancel: { width: 112 },

  consentCard: {
    marginHorizontal: 16,
    borderRadius: 30,
    backgroundColor: C.white,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 14,
  },
  consentGap: { height: 110 },
  consentHead: { fontFamily: pf.bold, fontSize: 19, color: C.ink },
  dashed: {
    marginTop: 16,
    marginBottom: 6,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E2E2E2',
  },
  consentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  consentTitle: { fontFamily: pf.bold, fontSize: 15, color: C.ink },
  consentDesc: { marginTop: 6, fontFamily: pf.regular, fontSize: 12.5, color: '#8A8A8A' },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: C.ink, borderColor: C.ink },
  checkMark: {
    width: 10,
    height: 6,
    marginTop: -2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: C.white,
    transform: [{ rotate: '-45deg' }],
  },
  error: { textAlign: 'center', color: '#E5484D', fontFamily: pf.medium, fontSize: 13 },
  note: { textAlign: 'center', color: C.body, fontFamily: pf.medium, fontSize: 13 },
  noteOnMap: {
    alignSelf: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  tipRow: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.ink,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 28,
  },
  tipTime: { fontFamily: pf.bold, fontSize: 14, color: C.yellow },
  tipText: { fontFamily: pf.regular, fontSize: 13, color: '#E7EC9C' },
  tipTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: C.ink,
  },

  mapEmpty: { backgroundColor: '#F2F2F0' },
  pinWrap: { position: 'absolute', width: 160, alignItems: 'center' },
  pinBubbleSlot: { height: 52, justifyContent: 'flex-end', paddingBottom: 6 },
  pinBody: { width: 54, height: 64, alignItems: 'center' },
  pinTail: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2A2A28',
  },
  pinRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#2A2A28',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  etaBubble: {
    backgroundColor: C.ink,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 28,
    justifyContent: 'center',
  },
  etaBubbleText: { fontFamily: pf.bold, fontSize: 14, color: C.yellow },
  placeBubble: {
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C9C9C9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    maxWidth: 160,
  },
  placeName: { fontFamily: pf.bold, fontSize: 13, color: C.ink },
  placeSub: { marginTop: 1, fontFamily: pf.regular, fontSize: 11, color: C.body },

  banner: {
    height: 48,
    borderRadius: 24,
    backgroundColor: C.pinkSoft,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 8,
  },
  bannerIc: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.4,
    borderColor: C.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIcText: { fontSize: 11, fontFamily: pf.bold, color: C.pink, marginTop: -1 },
  bannerText: { fontFamily: pf.medium, fontSize: 15, color: C.pink },

  countRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontFamily: pf.semibold, fontSize: 12, color: C.white },
});
