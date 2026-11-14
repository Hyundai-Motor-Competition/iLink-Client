import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError } from '../api/errors';
import { SplashScreen } from '../features/splash/SplashScreen';
import { startDemoLiveActivityIfAsked } from '../services/liveActivity';
import { usePushRegistration } from '../services/usePushRegistration';
import { useAuthStore } from '../stores/authStore';
import { linking } from './navigation/linking';
import { RootNavigator } from './navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 4xx는 재시도해도 결과가 같다. 네트워크·5xx만 재시도.
      retry: (count, err) =>
        count < 2 &&
        (!(err instanceof ApiError) || err.isNetwork || err.status >= 500),
    },
  },
});

/** QueryClientProvider 안에서 푸시 등록 (푸시가 오면 쿼리를 다시 받는다) */
function PushRegistration() {
  usePushRegistration();
  return null;
}

export default function App() {
  const restore = useAuthStore(s => s.restore);
  // 스플래시(애니메이션 ≈ 2.8초) 동안 로그인 정보를 복원한다
  const [splash, setSplash] = useState(true);
  useEffect(() => {
    restore();
    startDemoLiveActivityIfAsked();
  }, [restore]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PushRegistration />
        <StatusBar barStyle="dark-content" />
        <NavigationContainer linking={linking}>
          <RootNavigator />
        </NavigationContainer>
        {splash ? <SplashScreen onDone={() => setSplash(false)} /> : null}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
