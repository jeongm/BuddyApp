// components/AppText.tsx
import { usePathname } from 'expo-router';
import React from 'react';
import { Platform, Text as RNText, StyleSheet, TextProps } from 'react-native';
import { useSettingStore } from '../store/useSettingStore';

export function AppText(props: TextProps) {
    const { fontFamily, fontSizeScale } = useSettingStore();
    const pathname = usePathname();

    // 주소가 아예 없거나, 첫 화면('/')이거나, '/auth'로 시작하면 무조건 프리텐다드!
    const isAuthScreen = !pathname || pathname === '/' || pathname.startsWith('/auth');

    let baseFont = isAuthScreen ? 'Pretendard-Regular' : (fontFamily || 'Pretendard-Regular');
    const currentScale = isAuthScreen ? 1 : (fontSizeScale || 1);

    // ✨ 1. 들어온 스타일을 분석해서 굵기를 문자열로 뽑아냅니다.
    const flatStyle = StyleSheet.flatten(props.style) || {};
    const fontWeight = String(flatStyle.fontWeight || 'normal').toLowerCase();

    // ✨ 2. 굵기에 맞춰서 진짜 폰트 파일 이름으로 싹 바꿔치기!
    if (baseFont === 'Pretendard-Regular' || baseFont === 'System') {
        if (fontWeight === 'bold' || fontWeight === '700') baseFont = 'Pretendard-Bold';
        else if (fontWeight === '800' || fontWeight === '900') baseFont = 'Pretendard-ExtraBold';
        else if (fontWeight === '600') baseFont = 'Pretendard-SemiBold';
        else if (fontWeight === '500') baseFont = 'Pretendard-Medium';
        else if (fontWeight === '300') baseFont = 'Pretendard-Light';
        else baseFont = 'Pretendard-Regular';
    }

    // ✨ 3. [안드로이드 절대 방어막] 지우는 게 아니라 '무조건 normal'로 강제 덮어쓰기!
    const androidSafeStyle: any = {};
    if (baseFont !== 'System' && Platform.OS === 'android') {
        androidSafeStyle.fontWeight = 'normal'; // 안드로이드야 제발 굵기 건드리지 마!!
        androidSafeStyle.fontStyle = 'normal';
    }

    // ✨ 4. 배열 순서가 중요합니다! (뒤에 있는 게 앞의 스타일을 이깁니다)
    const combinedStyle = [
        props.style,        // Tailwind가 준 기본 스타일을 깔고
        androidSafeStyle,   // 안드로이드일 경우 fontWeight: normal로 강제 제압!
        {
            fontFamily: baseFont === 'System' ? undefined : baseFont,
            fontSize: ((flatStyle.fontSize as number) || 14) * currentScale,
        },
    ];

    return <RNText {...props} style={combinedStyle} allowFontScaling={false} />;
}