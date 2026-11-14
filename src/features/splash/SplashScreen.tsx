import LottieView from 'lottie-react-native';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { pretendard } from '../../shared/theme/tokens';

/** 디자인 '모바일 스플래시' 기준 화면 (390 x 844 pt) */
const DESIGN_W = 390;
const DESIGN_H = 844;
/** 애니메이션 원본 (390 x 120, 60fps · 168프레임 ≈ 2.8초) */
const LOTTIE_W = 390;
const LOTTIE_H = 120;
/** 디자인에서 도로 바닥이 583pt → 애니메이션 위쪽은 471pt */
const LOTTIE_TOP = 471;
export const SPLASH_BG = '#111200';

/**
 * 모바일 스플래시: 어두운 바탕 + iLink 로고 + 문구, 아래에 차가 달려와 깃발 앞에 서는 애니메이션
 * (Downloads/ilink_splash.json). 애니메이션이 끝나면 살짝 사라지며 onDone.
 * 앱 시작 때 로그인 정보 복원과 같이 돌고, 화면 비율이 달라도 디자인 비율(390 x 844)대로 줄여 맞춘다.
 */
export function SplashScreen({ onDone }: { onDone(): void }) {
  const { width, height } = useWindowDimensions();
  const k = Math.min(width / DESIGN_W, height / DESIGN_H);
  const top = (height - DESIGN_H * k) / 2;
  const fade = useRef(new Animated.Value(1)).current;
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    Animated.timing(fade, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start(() => onDone());
  };

  // 애니메이션이 안 돌아도(테스트 · 오류) 3.4초 뒤에는 넘어간다
  useEffect(() => {
    const t = setTimeout(finish, 3400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: fade }]}>
      <StatusBar barStyle="light-content" />
      <Image
        source={require('../../assets/images/splash/logo.png')}
        style={{
          position: 'absolute',
          top: top + 202 * k,
          left: (width - 80 * k) / 2,
          width: 80 * k,
          height: 33.3 * k,
        }}
        resizeMode="contain"
        accessibilityLabel="iLink"
      />
      <Text
        style={[
          styles.copy,
          {
            top: top + 262 * k,
            fontSize: 28 * k,
            lineHeight: 38 * k,
          },
        ]}
      >
        {'우리 아이와 만나는\n가장 안전한 연결'}
      </Text>
      <View
        style={{
          position: 'absolute',
          top: top + LOTTIE_TOP * k,
          left: (width - LOTTIE_W * k) / 2,
          width: LOTTIE_W * k,
          height: LOTTIE_H * k,
        }}
      >
        <LottieView
          source={require('../../assets/lottie/ilink_splash.json')}
          autoPlay
          loop={false}
          resizeMode="contain"
          style={StyleSheet.absoluteFill}
          onAnimationFinish={finish}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: SPLASH_BG },
  copy: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#FFFFFF',
    fontFamily: pretendard.bold,
    fontWeight: '700',
  },
});
