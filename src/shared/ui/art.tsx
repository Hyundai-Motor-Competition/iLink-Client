import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/tokens';

/*
 * Figma 일러스트(3D 자동차·핀·캐릭터 등) 원본을 받기 전 쓰는 도형 그림.
 * 시뮬레이터에 컬러 이모지 글꼴이 없어 이모지 대신 View로 그린다.
 */

export function CarArt({
  width = 220,
  color = '#C9CDD4',
}: {
  width?: number;
  color?: string;
}) {
  const h = width * 0.42;
  const wheel = width * 0.2;
  return (
    <View style={{ width, height: h + wheel * 0.4 }}>
      <View
        style={[
          a.carTop,
          {
            left: width * 0.2,
            width: width * 0.55,
            height: h * 0.5,
            borderTopLeftRadius: h * 0.35,
            borderTopRightRadius: h * 0.25,
            backgroundColor: color,
          },
        ]}
      >
        <View style={[a.window, { left: '12%', width: '36%' }]} />
        <View style={[a.window, { left: '54%', width: '34%' }]} />
      </View>
      <View
        style={[
          a.carBody,
          {
            top: h * 0.42,
            width,
            height: h * 0.45,
            borderRadius: h * 0.18,
            backgroundColor: color,
          },
        ]}
      >
        <View style={[a.light, { left: 6 }]} />
        <View style={[a.light, { right: 6, backgroundColor: '#F27C7C' }]} />
      </View>
      {[0.14, 0.66].map(x => (
        <View
          key={x}
          style={[
            a.wheel,
            {
              left: width * x,
              top: h * 0.62,
              width: wheel,
              height: wheel,
              borderRadius: wheel / 2,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function PinArt({
  size = 140,
  color = '#3B6BF5',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View style={{ width: size, height: size * 1.3, alignItems: 'center' }}>
      <View
        style={[
          a.pinTail,
          {
            top: size * 0.45,
            width: size * 0.62,
            height: size * 0.62,
            backgroundColor: color,
          },
        ]}
      />
      <View
        style={[
          a.pinHead,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      >
        <View
          style={{
            width: size * 0.38,
            height: size * 0.38,
            borderRadius: size * 0.19,
            backgroundColor: '#FFFFFF',
          }}
        />
      </View>
    </View>
  );
}

export function CameraIcon({
  size = 40,
  color = '#FFFFFF',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View style={{ width: size, height: size * 0.8, alignItems: 'center' }}>
      <View
        style={[
          a.camBump,
          { width: size * 0.36, height: size * 0.14, backgroundColor: color },
        ]}
      />
      <View
        style={[
          a.camBody,
          {
            width: size,
            height: size * 0.66,
            borderRadius: size * 0.14,
            backgroundColor: color,
          },
        ]}
      >
        <View
          style={{
            width: size * 0.36,
            height: size * 0.36,
            borderRadius: size * 0.18,
            borderWidth: size * 0.07,
            borderColor: '#BDBDBD',
          }}
        />
      </View>
    </View>
  );
}

/** 동그라미 안 글자 아이콘 */
export function IconCircle({
  glyph,
  size = 48,
  tint = colors.primarySoft,
  color = colors.primary,
}: {
  glyph: string;
  size?: number;
  tint?: string;
  color?: string;
}) {
  return (
    <View
      style={[
        a.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tint,
        },
      ]}
    >
      <Text style={{ color, fontSize: size * 0.42, fontWeight: '700' }}>
        {glyph}
      </Text>
    </View>
  );
}

/** 작은 지도 핀 */
export function MiniPin({ color = colors.primary }: { color?: string }) {
  return (
    <View style={[a.mini, { backgroundColor: color }]}>
      <View style={a.miniDot} />
    </View>
  );
}

const a = StyleSheet.create({
  carTop: { position: 'absolute', top: 0 },
  window: {
    position: 'absolute',
    top: '22%',
    height: '62%',
    borderRadius: 6,
    backgroundColor: '#2F333A',
  },
  carBody: { position: 'absolute', left: 0 },
  light: {
    position: 'absolute',
    top: '30%',
    width: 18,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF4C2',
  },
  wheel: {
    position: 'absolute',
    backgroundColor: '#2B2D33',
    borderWidth: 6,
    borderColor: '#55585F',
  },
  pinTail: {
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
    borderRadius: 8,
  },
  pinHead: { alignItems: 'center', justifyContent: 'center' },
  camBump: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  camBody: { alignItems: 'center', justifyContent: 'center' },
  circle: { alignItems: 'center', justifyContent: 'center' },
  mini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
});
