import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import 'expo-dev-client';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme as useTailwindColorScheme } from 'nativewind';
import "../global.css";
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { LogBox } from 'react-native';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
// ✨ KeyboardProvider import 추가
import { KeyboardProvider } from 'react-native-keyboard-controller';

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

function NavigationInitializer() {
  const router = useRouter();
  const { isLoggedIn, accessToken, refreshUser } = useAuthStore();

  useEffect(() => {
    if (!isLoggedIn || !accessToken) return;

    refreshUser()
      .then(() => {
        router.replace('/(tabs)/home');
      })
      .catch((error: any) => {
        const isNetworkError = !error?.response;

        if (isNetworkError) {
          console.warn("⚠️ 네트워크 오류 - 캐시된 유저 정보로 홈 이동");
          router.replace('/(tabs)/home');
        } else {
          console.warn("🚪 인증 실패 - 온보딩 화면으로 이동");
          useAuthStore.getState().logout();
          router.replace('/');
        }
      });
  }, []);

  return null;
}

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useTailwindColorScheme();
  const { theme, accent } = useThemeStore();

  const [fontsLoaded, fontError] = useFonts(customFonts);

  const [isAuthHydrated, setIsAuthHydrated] = useState(false);
  const [isThemeHydrated, setIsThemeHydrated] = useState(false);

  const isHydrated = isAuthHydrated && isThemeHydrated;

  useEffect(() => {
    const unsub = useThemeStore.persist.onFinishHydration(() => setIsThemeHydrated(true));
    if (useThemeStore.persist.hasHydrated()) setIsThemeHydrated(true);
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setIsAuthHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setIsAuthHydrated(true);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    setColorScheme(theme);
  }, [theme, setColorScheme, isHydrated]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isHydrated]);

  if (!fontsLoaded && !fontError) return null;
  if (!isHydrated) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* ✨ KeyboardProvider는 바깥, View는 안쪽으로 분리 */}
      <KeyboardProvider>
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
          <NavigationInitializer />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </View>
      </KeyboardProvider>
    </ThemeProvider>
  );
}