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

    // Tailwind fontSize 클래스 매핑
    const TAILWIND_FONT_SIZES: Record<string, number> = {
        'text-xs': 12,
        'text-sm': 14,
        'text-base': 16,
        'text-lg': 18,
        'text-xl': 20,
        'text-2xl': 24,
        'text-3xl': 30,
        'text-4xl': 36,
        'text-5xl': 48,
    };

    const className = props.className as string || '';
    const tailwindFontSize = Object.entries(TAILWIND_FONT_SIZES).find(([key]) =>
        className.includes(key)
    )?.[1];

    const inlineSize = flatStyle.fontSize as number | undefined;
    const resolvedFontSize = inlineSize || tailwindFontSize || 14;

    // style에 직접 fontSize 넣은 경우엔 이미 scale() 처리됐다고 보고 currentScale 적용 안 함
    const finalFontSize = inlineSize
        ? resolvedFontSize  // style로 직접 넣은 건 그대로
        : resolvedFontSize * currentScale;  // tailwind 클래스만 fontSizeScale 적용

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
        androidSafeStyle.fontWeight = 'normal';
        androidSafeStyle.fontStyle = 'normal';
    }

    // ✨ 4. 배열 순서가 중요합니다! (뒤에 있는 게 앞의 스타일을 이깁니다)
    const combinedStyle = [
        props.style,        // Tailwind가 준 기본 스타일을 깔고
        androidSafeStyle,   // 안드로이드일 경우 fontWeight: normal로 강제 제압!
        {
            fontFamily: baseFont === 'System' ? undefined : baseFont,
            // ✅ inline fontSize가 있으면 props.style의 값을 존중, 없으면 scale 적용
            ...(inlineSize ? {} : { fontSize: finalFontSize }),
        },
    ];

    return <RNText {...props} style={combinedStyle} allowFontScaling={false} />;
}