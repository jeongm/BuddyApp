import { Ionicons } from "@expo/vector-icons";
import Slider from '@react-native-community/slider';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Dimensions, Modal, Platform, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText as Text } from '../../components/AppText';
import { useSettingStore } from "../../store/useSettingStore";
// [추가] 테마 스토어 연동 (하드코딩 삭제!)
import { ACCENT_HEX_COLORS, useThemeStore } from "../../store/useThemeStore";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const safeShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    android: { elevation: 2 },
});
const safeShadowMd = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
    android: { elevation: 4 },
});

// [상수] 글꼴 목록
const availableFonts = [
    { id: 'Pretendard-Light', name: '프리텐다드 얇게' },
    { id: 'Pretendard-Regular', name: '프리텐다드 기본' },
    { id: 'Pretendard-Medium', name: '프리텐다드 굵게' },
    { id: 'BMJUA', name: '주아체' },
    { id: 'BMYEONSUNG', name: '연성체' },
    { id: 'BMHANNAAir', name: '한나Air' },
    { id: 'BMHANNAPro', name: '한나Pro' },
    { id: 'BMEULJIRO', name: '을지로체' },
];

export default function FontSettingsScreen() {
    const router = useRouter();
    const { theme, accent } = useThemeStore();
    const { fontFamily, setFontFamily, fontSizeScale, setFontSizeScale } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const [isApplying, setIsApplying] = useState(false);

    // [테마] 전역 색상 동기화
    const accentHex = ACCENT_HEX_COLORS[accent];

    // [로직] 글꼴 적용 시 로딩 모달 제어
    const handleApplyFont = (fontId: string) => {
        if (fontFamily === fontId) return;
        setIsApplying(true);
        setTimeout(() => {
            setFontFamily(fontId as any);
            setTimeout(() => setIsApplying(false), 600);
        }, 100);
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>

            {/* 글꼴 적용 로딩 모달 */}
            <Modal transparent={true} visible={isApplying} animationType="fade">
                <View className="flex-1 bg-slate-900/40 dark:bg-black/60 items-center justify-center backdrop-blur-sm">
                    <View className="bg-white dark:bg-slate-800 rounded-3xl items-center justify-center" style={[{ width: scale(200), paddingVertical: scale(30) }, safeShadowMd]}>
                        <ActivityIndicator size="large" color={accentHex} style={{ marginBottom: scale(16) }} />
                        <Text className="font-bold text-slate-700 dark:text-slate-300 tracking-tight" style={{ fontSize: scale(13) }} allowFontScaling={false}>
                            새로운 글꼴을 적용하고 있어요
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* 헤더 영역 */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800/60">
                <TouchableOpacity onPress={() => router.back()} className="p-2" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={scale(28)} color="#64748B" />
                </TouchableOpacity>
                <View className="absolute left-0 right-0 h-full items-center justify-center pointer-events-none" style={{ zIndex: -1 }}>
                    <Text
                        className="font-black text-slate-900 dark:text-white tracking-tight"
                        style={{ fontSize: scale(18), fontFamily: customFontFamily }}
                        allowFontScaling={false}
                    >
                        글꼴 및 크기
                    </Text>
                </View>
                <View style={{ width: scale(44) }} />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(80), paddingTop: scale(24) }} showsVerticalScrollIndicator={false}>
                <View style={{ paddingHorizontal: scale(20) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Typography</Text>

                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800/60 pt-6 pb-8" style={safeShadow}>

                        {/* [UI] 글자 크기 슬라이더 */}
                        <View style={{ paddingHorizontal: scale(20), marginBottom: scale(36) }}>
                            <View className="flex-row justify-between items-center" style={{ marginBottom: scale(12) }}>
                                <Text className="font-bold text-slate-700 dark:text-slate-300" style={{ fontSize: scale(15) }} allowFontScaling={false}>글자 크기</Text>
                                <Text className="font-extrabold" style={{ fontSize: scale(14), color: accentHex }} allowFontScaling={false}>
                                    {Math.round(fontSizeScale * 100)}%
                                </Text>
                            </View>
                            <Slider
                                style={{ width: '100%', height: scale(40) }}
                                minimumValue={0.8}
                                maximumValue={1.3}
                                step={0.05}
                                value={fontSizeScale}
                                onValueChange={setFontSizeScale}
                                minimumTrackTintColor={accentHex}
                                maximumTrackTintColor={theme === 'dark' ? '#334155' : '#E2E8F0'}
                                thumbTintColor={accentHex}
                            />
                        </View>

                        {/* [UI] 글꼴 선택 배열 */}
                        <View style={{ marginBottom: scale(32) }}>
                            <Text className="font-bold text-slate-700 dark:text-slate-300 px-5" style={{ fontSize: scale(15), marginBottom: scale(16) }} allowFontScaling={false}>글꼴 선택</Text>
                            <View className="flex-row flex-wrap justify-between px-5">
                                {availableFonts.map((font) => {
                                    const isSelected = fontFamily === font.id;
                                    const fontColor = isSelected ? accentHex : (theme === 'dark' ? '#94A3B8' : '#64748B');

                                    return (
                                        <TouchableOpacity
                                            key={font.id}
                                            onPress={() => handleApplyFont(font.id)}
                                            activeOpacity={0.8}
                                            className={`items-center justify-center border-2 mb-3 ${isSelected ? 'bg-white dark:bg-slate-800' : 'bg-slate-200/40 dark:bg-slate-800/40'}`}
                                            style={[
                                                { width: '48%', height: scale(88), borderRadius: scale(20), gap: scale(6) },
                                                isSelected ? { borderColor: accentHex } : { borderColor: 'transparent' },
                                                isSelected && safeShadow
                                            ]}
                                        >
                                            <Text className={`font-bold ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`} style={{ fontSize: scale(11) }} allowFontScaling={false}>{font.name}</Text>
                                            <Text style={{ fontFamily: font.id, fontSize: scale(17), color: fontColor }} allowFontScaling={false}>Aa 가나다 123</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* [UI] 미리보기 상자 */}
                        <View className="px-5">
                            <View className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60" style={[{ padding: scale(20) }, safeShadow]}>
                                <Text className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-3" style={{ fontSize: scale(10) }} allowFontScaling={false}>Preview</Text>
                                <Text
                                    style={{
                                        fontFamily: fontFamily,
                                        fontSize: scale(15),
                                        color: theme === 'dark' ? '#F8FAFC' : '#334155',
                                        lineHeight: scale(24)
                                    }}
                                    allowFontScaling={false}
                                >
                                    "버디야, 오늘 하루도 정말 고생 많았어! 내일은 더 좋은 일들이 우리를 기다리고 있을 거야. 푹 쉬어!"
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}