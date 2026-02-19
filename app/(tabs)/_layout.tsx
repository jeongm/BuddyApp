import { Tabs } from 'expo-router';
import React from 'react';
import { Text, TextInput } from 'react-native';
import { CustomTabBar } from '../../components/CustomTabBar'; // 경로가 맞는지 꼭 확인!

if ((Text as any).defaultProps == null) (Text as any).defaultProps = {};
(Text as any).defaultProps.allowFontScaling = false;

if ((TextInput as any).defaultProps == null) (TextInput as any).defaultProps = {};
(TextInput as any).defaultProps.allowFontScaling = false;

// ⚠️ 중요: 반드시 'export default'가 있어야 합니다!
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false, // 각 탭 화면의 헤더는 숨김
      }}
    >
      {/* name 속성은 파일 이름과 정확히 일치해야 합니다.
         app/(tabs)/ 폴더 안에 이 파일들이 있는지 확인하세요.
      */}
      <Tabs.Screen name="diary" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="home" />
      <Tabs.Screen name="report" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}