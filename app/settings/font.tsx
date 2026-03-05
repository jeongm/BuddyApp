import { Ionicons } from "@expo/vector-icons";
import Slider from '@react-native-community/slider';
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Platform, Text as RNText, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText as Text } from '../../components/AppText';

import { useSettingStore } from "../../store/useSettingStore";
import { useThemeStore } from "../../store/useThemeStore";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const safeShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    android: { elevation: 2 },
});

export default function FontSettingsScreen() {
    const router = useRouter();
    const { theme, accent } = useThemeStore();
    const { fontFamily, setFontFamily, fontSizeScale, setFontSizeScale } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const accentHex = {
        default: '#64748B', violet: '#8B5CF6', rose: '#F43F5E', blue: '#3B82F6', green: '#22C55E'
    }[accent] || '#64748B';

    // 💡 나중에 여기서 3~4개만 남기고 주석 처리(또는 삭제)하시면, 완벽한 2x2 그리드가 완성됩니다!
    const availableFonts = [
        { id: 'Pretendard-Light', name: '프리텐다드 얇게' },
        { id: 'Pretendard-Regular', name: '프리텐다드 기본' },
        { id: 'Pretendard-Medium', name: '프리텐다드 굵게' },
        { id: 'BMJUA', name: '주아체' },
        // { id: 'BMDOHYEON', name: '도현체' },
        { id: 'BMYEONSUNG', name: '연성체' },
        { id: 'BMHANNAAir', name: '한나Air' },
        { id: 'BMHANNAPro', name: '한나Pro' },
        { id: 'BMEULJIRO', name: '을지로체' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
            {/* 뒤로가기 헤더 */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800/60">
                <TouchableOpacity onPress={() => router.back()} className="p-2" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={scale(28)} color="#64748B" />
                </TouchableOpacity>
                <View className="absolute left-0 right-0 h-full items-center justify-center pointer-events-none" style={{ zIndex: -1 }}>
                    <RNText
                        className="font-black text-slate-900 dark:text-white tracking-tight"
                        style={{ fontSize: scale(18), fontFamily: customFontFamily }}
                        allowFontScaling={false}
                    >
                        글꼴 및 크기
                    </RNText>
                </View>
                <View style={{ width: scale(44) }} />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(80), paddingTop: scale(24) }} showsVerticalScrollIndicator={false}>

                <View style={{ paddingHorizontal: scale(20) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Typography</Text>

                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800/60 pt-6 pb-8" style={safeShadow}>

                        {/* 1. 글자 크기 슬라이더 */}
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

                        {/* ✨ 2. 글꼴 선택 (숨김 없는 2열 그리드 뷰) */}
                        <View style={{ marginBottom: scale(32) }}>
                            <Text className="font-bold text-slate-700 dark:text-slate-300 px-5" style={{ fontSize: scale(15), marginBottom: scale(16) }} allowFontScaling={false}>글꼴 선택</Text>

                            <View className="flex-row flex-wrap justify-between px-5">
                                {availableFonts.map((font) => {
                                    const isSelected = fontFamily === font.id;
                                    const fontColor = isSelected ? accentHex : (theme === 'dark' ? '#94A3B8' : '#64748B');

                                    return (
                                        <TouchableOpacity
                                            key={font.id}
                                            onPress={() => setFontFamily(font.id as any)}
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

                        {/* 3. 미리보기 (Preview) 상자 */}
                        <View className="px-5">
                            <View className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60" style={[{ padding: scale(20) }, safeShadow]}>
                                <Text className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-3" style={{ fontSize: scale(10) }} allowFontScaling={false}>Preview</Text>
                                <Text
                                    style={{
                                        fontFamily: fontFamily,
                                        fontSize: scale(15) * fontSizeScale,
                                        color: theme === 'dark' ? '#F8FAFC' : '#334155',
                                        lineHeight: scale(24) * fontSizeScale
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