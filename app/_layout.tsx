import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from 'nativewind';
import "../global.css";
import { useThemeStore } from '../store/useThemeStore';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { theme, accent } = useThemeStore();

  useEffect(() => {
    // ✨ 핵심 해결책: 네비게이션 트리가 완전히 생성될 수 있도록 아주 살짝 딜레이(비동기)를 줍니다!
    const timer = setTimeout(() => {
      const targetTheme = theme === 'system' ? 'light' : theme;
      if (targetTheme !== colorScheme) {
        setColorScheme(targetTheme);
      }
    }, 10); // 10ms 딜레이 부여

    // 컴포넌트 언마운트 시 타이머 청소 (메모리 누수 방지)
    return () => clearTimeout(timer);
  }, [theme, colorScheme]); // ✨ colorScheme도 의존성 배열에 추가하여 안전성 확보

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }} className={`theme-${accent}`}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* ✨ 핵심: (tabs) 그룹 전체에 스와이프 뒤로가기 완벽 차단! 여기서 막아야 로그인 창으로 안 튕깁니다. */}
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />
          <Stack.Screen name="chat/index" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </View>
    </ThemeProvider>
  );
}