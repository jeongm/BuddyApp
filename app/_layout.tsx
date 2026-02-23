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
    // ✨ 에러 방지: 테마가 바뀔 때만 안전하게 NativeWind 엔진에 전달
    if (theme !== colorScheme) {
      // 시스템 모드일 땐 기본적으로 light로 설정 (필요시 기기 테마 감지 로직 추가)
      const targetTheme = theme === 'system' ? 'light' : theme;
      setColorScheme(targetTheme);
    }
  }, [theme]);

  // ✨ 핵심 해결책: ThemeProvider를 View 밖(최상단)으로 완전히 빼서 뼈대 붕괴를 원천 차단!
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }} className={`theme-${accent}`}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
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