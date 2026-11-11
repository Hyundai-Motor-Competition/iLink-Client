import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
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
  Avatar,
  BottomSheet,
  CenterHeadline,
  Checkbox,
  Headline,
  InfoRows,
  Screen,
  TopBar,
} from '../../shared/ui/kit';
import { CameraIcon } from '../../shared/ui/art';

const carImage = require('../../assets/images/car_ioniq5.png');
const familyImage = require('../../assets/images/family_duo.png');
import { colors, font, radius, spacing } from '../../shared/theme/tokens';
import { mock } from './mock';

type P<K extends keyof DemoStackParams> = NativeStackScreenProps<
  DemoStackParams,
  K
>;

/** 부모 · QR 스캔·연결 요청 */
export function QrScanScreen({ navigation }: P<'PQrScan'>) {
  const [left, setLeft] = useState(165);
  useEffect(() => {
    const t = setInterval(() => setLeft(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <Screen
      header={<TopBar title="차량 연결" onBack={navigation.goBack} />}
      footer={
        <>
          <Text style={s.hint}>직접 코드를 입력해 연결할 수 있어요.</Text>
          <Button
            label="코드 직접 입력"
            onPress={() => navigation.navigate('PCarConfirm')}
          />
        </>
      }
    >
      <Text style={s.qrGuide}>차량 화면의 QR코드를 스캔해주세요.</Text>
      {/* 카메라 연결 전: 탭하면 스캔 성공으로 간주 */}
      <Pressable
        style={s.qrBox}
        onPress={() => navigation.navigate('PCarConfirm')}
      >
        <View style={[s.corner, s.tl]} />
        <View style={[s.corner, s.tr]} />
        <View style={[s.corner, s.bl]} />
        <View style={[s.corner, s.br]} />
      </Pressable>
      <View style={s.timer}>
        <Text style={s.timerLabel}>남은 시간</Text>
        <Text style={s.timerValue}>
          {mm}:{ss}
        </Text>
      </View>
    </Screen>
  );
}

/** 부모 · 차량 정보 확인 */
export function CarConfirmScreen({ navigation }: P<'PCarConfirm'>) {
  return (
    <Screen
      header={<TopBar progress={0.36} />}
      footer={
        <Button label="확인" onPress={() => navigation.navigate('PTerms')} />
      }
    >
      <Headline chip="차량 연결" title={'차량 정보가 맞는지\n확인해주세요.'} />
      <View style={s.car}>
        <Image source={carImage} style={s.carImage} resizeMode="contain" />
      </View>
      <InfoRows
        rows={[
          ['성함', mock.guardian.name],
          ['차량', `${mock.vehicle.model} | ${mock.vehicle.plate}`],
        ]}
      />
    </Screen>
  );
}

const TERMS = [
  { label: '(필수) 서비스 이용을 위한 위치 공유', required: true },
  { label: '(필수) 픽업 알림 권한', required: true },
  { label: '(선택) 서비스 개선을 위한 공유', required: false },
];

/** 부모 · 약관 동의 */
export function TermsScreen({ navigation }: P<'PTerms'>) {
  const [checked, setChecked] = useState([true, true, false]);
  const requiredOk = TERMS.every((t, i) => !t.required || checked[i]);
  const next = () => navigation.navigate('PGuardianProfile');

  return (
    <Screen
      header={<TopBar progress={0.5} />}
      footer={
        <>
          <Button
            variant="outline"
            label="다음으로"
            disabled={!requiredOk}
            onPress={next}
          />
          <Button
            label="모두 동의하기"
            onPress={() => {
              setChecked([true, true, true]);
              next();
            }}
          />
        </>
      }
    >
      <Headline
        chip="약관 동의"
        title={'서비스 이용을 위해 먼저\n정보 제공에 동의해주세요.'}
      />
      <View style={s.spacer} />
      <Text style={s.termsTitle}>권한 동의</Text>
      <View style={s.termsList}>
        {TERMS.map((t, i) => (
          <Checkbox
            key={t.label}
            label={t.label}
            trailing="보기"
            checked={checked[i]}
            onPress={() => setChecked(c => c.map((v, j) => (j === i ? !v : v)))}
          />
        ))}
      </View>
    </Screen>
  );
}

/** 사진 선택(직접 촬영 / 사진첩) 바텀시트가 붙은 프로필 사진 */
function PhotoPicker({
  name,
  hasPhoto,
  onPicked,
}: {
  name?: string;
  hasPhoto: boolean;
  onPicked(): void;
}) {
  const [open, setOpen] = useState(false);
  const pick = () => {
    setOpen(false);
    onPicked();
  };
  return (
    <>
      <Pressable style={s.photo} onPress={() => setOpen(true)}>
        {hasPhoto ? (
          <Avatar name={name} size={136} />
        ) : (
          <View style={s.photoEmpty}>
            <CameraIcon size={44} />
          </View>
        )}
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <Button variant="outline" label="직접 촬영하기" onPress={pick} />
        <Button variant="dark" label="사진첩에서 업로드" onPress={pick} />
      </BottomSheet>
    </>
  );
}

/** 부모 · 내 프로필 */
export function GuardianProfileScreen({ navigation }: P<'PGuardianProfile'>) {
  const [photo, setPhoto] = useState(false);
  const [alias, setAlias] = useState('');
  return (
    <Screen
      header={<TopBar progress={0.75} onBack={navigation.goBack} />}
      footer={
        <Button
          label="다음으로"
          onPress={() => navigation.navigate('PChildProfile')}
        />
      }
    >
      <Headline
        chip="내 프로필"
        title={'원활한 픽업을 위해\n보호자 프로필을 등록해 주세요'}
      />
      <PhotoPicker
        name={alias || mock.guardian.alias}
        hasPhoto={photo}
        onPicked={() => setPhoto(true)}
      />
      <Field
        label="아이에게 보여줄 호칭을 알려주세요"
        placeholder="픽업 알림 시 자녀에게 표시될 이름이에요."
        value={alias}
        onChange={setAlias}
      />
    </Screen>
  );
}

/** 부모 · 자녀 프로필 */
export function ChildProfileScreen({ navigation }: P<'PChildProfile'>) {
  const [photo, setPhoto] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const filled = name.trim() !== '' && age.trim() !== '';
  const reset = () => {
    setPhoto(false);
    setName('');
    setAge('');
  };
  return (
    <Screen
      header={<TopBar progress={1} onBack={navigation.goBack} />}
      footer={
        <>
          {filled ? (
            <Button variant="outline" label="자녀 추가" onPress={reset} />
          ) : null}
          <Button
            label="완료"
            onPress={() => navigation.navigate('PFamilyDone')}
          />
        </>
      }
    >
      <Headline chip="자녀 프로필" title={'자녀 프로필을\n설정하세요.'} />
      <PhotoPicker
        name={name}
        hasPhoto={photo}
        onPicked={() => setPhoto(true)}
      />
      <View style={s.fields}>
        <Field
          label="자녀 성명"
          placeholder="자녀의 성함을 입력하세요."
          value={name}
          onChange={setName}
        />
        <Field
          label="자녀 나이"
          placeholder="자녀의 나이를 입력하세요."
          value={age}
          onChange={setAge}
          numeric
        />
      </View>
    </Screen>
  );
}

/** 부모 · 가족 프로필 완성 */
export function FamilyDoneScreen({ navigation }: P<'PFamilyDone'>) {
  return (
    <Screen
      scroll={false}
      style={s.doneBody}
      footer={
        <>
          <Button
            variant="outline"
            label="메인 화면으로"
            onPress={() =>
              navigation.reset({ index: 0, routes: [{ name: 'PMain' }] })
            }
          />
          <Button
            label="자녀 기기 초대 보내기"
            onPress={() =>
              navigation.reset({ index: 0, routes: [{ name: 'PMain' }] })
            }
          />
        </>
      }
    >
      <CenterHeadline
        eyebrow="가족 프로필 완성"
        title={'가족 프로필을\n완성했어요!'}
      />
      <View style={s.duo}>
        <Image source={familyImage} style={s.familyImage} />
      </View>
    </Screen>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  numeric,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange(v: string): void;
  numeric?: boolean;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={numeric ? 'number-pad' : 'default'}
        style={s.input}
      />
    </View>
  );
}

const CORNER = 36;
const s = StyleSheet.create({
  hint: { textAlign: 'center', color: colors.subText, fontSize: font.label },
  qrGuide: {
    textAlign: 'center',
    fontSize: font.body,
    color: colors.text,
    marginTop: 64,
    marginBottom: 16,
  },
  qrBox: {
    height: 358,
    borderRadius: 24,
    backgroundColor: '#393A3C',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#FFFFFF',
  },
  tl: {
    top: 56,
    left: 56,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 14,
  },
  tr: {
    top: 56,
    right: 56,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 14,
  },
  bl: {
    bottom: 56,
    left: 56,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 14,
  },
  br: {
    bottom: 56,
    right: 56,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 14,
  },
  timer: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  timerLabel: { fontSize: font.label, color: colors.text },
  timerValue: {
    fontSize: font.heading,
    fontWeight: '700',
    color: colors.primary,
  },
  car: { height: 260, alignItems: 'center', justifyContent: 'center' },
  carImage: { width: 330, height: 165 },
  spacer: { height: 260 },
  termsTitle: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  termsList: { paddingTop: 8 },
  photo: { alignSelf: 'center', marginVertical: 48 },
  photoEmpty: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fields: { gap: spacing.lg },
  field: { borderBottomWidth: 1, borderColor: colors.line, gap: 10 },
  fieldLabel: { fontSize: font.body, color: colors.subText, fontWeight: '500' },
  input: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 8,
  },
  doneBody: { justifyContent: 'center', gap: 48 },
  duo: { height: 220, alignItems: 'center', justifyContent: 'center' },
  familyImage: { width: 240, height: 240 },
});
