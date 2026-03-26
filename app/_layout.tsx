import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import 'expo-dev-client';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme as useTailwindColorScheme } from 'nativewind';
import "../global.css";
import { useAuthStore } from '../store/useAuthStore'; // ✅ 추가
import { useThemeStore } from '../store/useThemeStore';

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { LogBox } from 'react-native';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

LogBox.ignoreLogs([
  '[Reanimated] Reading from `value` during component render',
]);
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

const customFonts = {
  'BMDOHYEON': require('../assets/fonts/BMDOHYEON_otf.otf'),
  'BMEULJIRO': require('../assets/fonts/BMEULJIRO.otf'),
  'BMHANNAAir': require('../assets/fonts/BMHANNAAir_otf.otf'),
  'BMHANNAPro': require('../assets/fonts/BMHANNAProOTF.otf'),
  'BMJUA': require('../assets/fonts/BMJUA_otf.otf'),
  'BMYEONSUNG': require('../assets/fonts/BMYEONSUNG_otf.otf'),

  'Pretendard-Thin': require('../assets/fonts/Pretendard/Pretendard-Thin.otf'),
  'Pretendard-ExtraLight': require('../assets/fonts/Pretendard/Pretendard-ExtraLight.otf'),
  'Pretendard-Light': require('../assets/fonts/Pretendard/Pretendard-Light.otf'),
  'Pretendard-Regular': require('../assets/fonts/Pretendard/Pretendard-Regular.otf'),
  'Pretendard-Medium': require('../assets/fonts/Pretendard/Pretendard-Medium.otf'),
  'Pretendard-SemiBold': require('../assets/fonts/Pretendard/Pretendard-SemiBold.otf'),
  'Pretendard-Bold': require('../assets/fonts/Pretendard/Pretendard-Bold.otf'),
  'Pretendard-ExtraBold': require('../assets/fonts/Pretendard/Pretendard-ExtraBold.otf'),
  'Pretendard-Black': require('../assets/fonts/Pretendard/Pretendard-Black.otf'),
};

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useTailwindColorScheme();
  const { theme, accent } = useThemeStore();
  const { isLoggedIn, accessToken, refreshUser } = useAuthStore(); // ✅ 추가
  const router = useRouter(); // ✅ 추가

  const [fontsLoaded, fontError] = useFonts(customFonts);
  const [isHydrated, setIsHydrated] = useState(false);

  // zustand persist hydration 완료 대기
  useEffect(() => {
    const unsub = useThemeStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
    if (useThemeStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }
    return () => unsub();
  }, []);

  // ✅ 자동로그인 - hydration 완료 후 토큰 체크
  useEffect(() => {
    if (!isHydrated) return;

    if (isLoggedIn && accessToken) {
      refreshUser().then(() => {
        router.replace('/(tabs)/home');
      });
    }
  }, [isHydrated]);

  // 테마가 바뀔 때마다 NativeWind에 값을 밀어 넣기
  useEffect(() => {
    if (!isHydrated) return;
    setColorScheme(theme);
  }, [theme, setColorScheme, isHydrated]);

  // 폰트 + hydration 둘 다 완료되면 스플래시 숨기기
  useEffect(() => {
    if ((fontsLoaded || fontError) && isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isHydrated]);

  if (!fontsLoaded && !fontError) return null;
  if (!isHydrated) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }} className={`theme-${accent}`}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />
          <Stack.Screen name="chat/keyboard-chat" />
          <Stack.Screen name="chat/voice-chat" />
          <Stack.Screen name="diary-screen/chat-history" />
          <Stack.Screen name="diary-screen/editor" />
          <Stack.Screen name="diary-screen/viewer" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </View>
    </ThemeProvider>
  );
}