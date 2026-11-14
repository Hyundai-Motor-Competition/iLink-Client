import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import {
  Camera,
  isScannedCode,
  type ScannedObject,
  useCameraDevice,
  useCameraPermission,
  useObjectOutput,
} from 'react-native-vision-camera';

/**
 * 화면 전체를 채우는 뒤 카메라 + QR 인식.
 * 카메라가 없거나(시뮬레이터) 권한이 없으면 fallback 사진을 깐다.
 * 읽은 QR 값은 한 번만 onCode로 넘긴다 (다시 받으려면 화면을 다시 연다).
 */
export function QrCamera(props: {
  fallback: ImageSourcePropType;
  onCode(value: string): void;
}) {
  // VisionCamera 5의 QR 인식(CameraObjectOutput)은 iOS에만 있다. Android는 미리보기만 띄우고
  // QR은 차량 링크(pickup://link?code=)나 촬영 버튼으로 받는다
  return Platform.OS === 'ios' ? <IosQrCamera {...props} /> : <PreviewOnly fallback={props.fallback} />;
}

function useCameraReady() {
  const device = useCameraDevice('back');
  const { hasPermission, canRequestPermission, requestPermission } = useCameraPermission();
  useEffect(() => {
    if (device && !hasPermission && canRequestPermission) requestPermission().catch(() => false);
  }, [device, hasPermission, canRequestPermission, requestPermission]);
  return { device, ready: !!device && hasPermission };
}

function PreviewOnly({ fallback }: { fallback: ImageSourcePropType }) {
  const focused = useIsFocused();
  const { device, ready } = useCameraReady();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image source={fallback} style={s.fill} resizeMode="cover" />
      {ready && device ? (
        <Camera style={StyleSheet.absoluteFill} device={device} isActive={focused} resizeMode="cover" />
      ) : null}
    </View>
  );
}

function IosQrCamera({
  fallback,
  onCode,
}: {
  fallback: ImageSourcePropType;
  onCode(value: string): void;
}) {
  const focused = useIsFocused();
  const { device, ready } = useCameraReady();
  const done = useRef(false);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    if (focused) done.current = false;
  }, [focused]);

  const types = useMemo(() => ['qr' as const], []);
  const onObjectsScanned = useCallback((objects: ScannedObject[]) => {
    if (done.current) return;
    const value = objects.find(isScannedCode)?.value;
    if (!value) return;
    done.current = true;
    onCodeRef.current(value);
  }, []);
  const objectOutput = useObjectOutput({ types, onObjectsScanned });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image source={fallback} style={s.fill} resizeMode="cover" />
      {ready && device ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={focused}
          outputs={[objectOutput]}
          resizeMode="cover"
        />
      ) : null}
    </View>
  );
}

/** 차량 QR 값(pickup://link?code=XXXX 또는 코드만)에서 연결 코드를 꺼낸다 */
export function linkCodeFrom(value: string): string | null {
  const m = value.match(/[?&]code=([A-Za-z0-9]+)/);
  if (m) return m[1];
  return /^[A-Za-z0-9]{4,32}$/.test(value.trim()) ? value.trim() : null;
}

const s = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
});
