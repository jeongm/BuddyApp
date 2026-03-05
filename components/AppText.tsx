// components/AppText.tsx
import { usePathname } from 'expo-router'; // ✨ 마법의 훅으로 교체!
import React from 'react';
import { Text as RNText, StyleSheet, TextProps } from 'react-native';
import { useSettingStore } from '../store/useSettingStore';

export function AppText(props: TextProps) {
    const { fontFamily, fontSizeScale } = useSettingStore();

    // ✨ 현재 주소를 가져옵니다 (예: "/", "/auth/login")
    const pathname = usePathname();

    // ✨ 주소가 아예 없거나, 첫 화면('/')이거나, '/auth'로 시작하는 화면이면 무조건 프리텐다드!
    const isAuthScreen = !pathname || pathname === '/' || pathname.startsWith('/auth');

    const currentFont = isAuthScreen ? 'Pretendard-Regular' : fontFamily;
    const currentScale = isAuthScreen ? 1 : fontSizeScale;

    // 기존 스타일을 배열로 풀어서 폰트와 크기를 덮어씌웁니다.
    const combinedStyle = [
        {
            fontFamily: currentFont,
            fontSize: ((StyleSheet.flatten(props.style)?.fontSize as number) || 14) * currentScale,
        },
        props.style,
    ];

    return <RNText {...props} style={combinedStyle} allowFontScaling={false} />;
}