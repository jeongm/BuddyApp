import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

// ✅ 스타일 파일 임포트 (위치 완벽함!)
import "../global.css";

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  // 초기 로딩 시 (tabs) 레이아웃을 먼저 찾도록 설정
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* 1. 메인 탭 화면 */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* 2. 인증 화면 (로그인/회원가입) - 헤더 숨김 */}
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />

        {/* 3. 채팅 화면 - 헤더 숨김 */}
        <Stack.Screen name="chat/index" options={{ headerShown: false }} />

        {/* 4. 일기 상세 & 수정 화면 - 헤더 숨김 */}
        <Stack.Screen name="diary/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="diary/edit/[id]" options={{ headerShown: false }} />

        {/* 5. 모달 (옵션) */}
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}