import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme as useTailwindColorScheme } from 'nativewind';
import "../global.css";
import { useThemeStore } from '../store/useThemeStore';

// ✨ 폰트 라이브러리 추가
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// 🚨 [핵심!] 폰트 목록을 바깥에 두어 무한 렌더링(앱 튕김) 방지!
const customFonts = {
  'BMDOHYEON': require('../assets/fonts/BMDOHYEON_otf.otf'),
  'BMEULJIRO': require('../assets/fonts/BMEULJIRO.otf'),
  'BMHANNAAir': require('../assets/fonts/BMHANNAAir_otf.otf'),
  'BMHANNAPro': require('../assets/fonts/BMHANNAProOTF.otf'),
  'BMJUA': require('../assets/fonts/BMJUA_otf.otf'),
  'BMYEONSUNG': require('../assets/fonts/BMYEONSUNG_otf.otf'),
  // 'NotoSansKR': require('../assets/fonts/NotosansKR.ttf'),

  // --- ✨ 프리텐다드 (굵기별 9종) ---
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

  // ✨ 폰트 로드
  const [fontsLoaded, fontError] = useFonts(customFonts);

  useEffect(() => {
    setColorScheme(theme);
  }, [theme]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }} className={`theme-${accent}`}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />
          <Stack.Screen name="chat/keyboard-chat" />
          <Stack.Screen name="chat/voice-chat" />

          {/* ✨(다이어리 화면들 등록) */}
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