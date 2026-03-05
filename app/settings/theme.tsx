import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Platform, Text as RNText, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText as Text } from '../../components/AppText';

import { useSettingStore } from "../../store/useSettingStore";
import { useThemeStore, type AccentColor } from "../../store/useThemeStore";

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

export default function ThemeSettingsScreen() {
    const router = useRouter();
    const { theme, setTheme, accent, setAccent } = useThemeStore();
    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const accentColors: { id: AccentColor; hex: string; label: string }[] = [
        { id: 'default', hex: '#64748B', label: '모노' },
        { id: 'violet', hex: '#8B5CF6', label: '바이올렛' },
        { id: 'rose', hex: '#F43F5E', label: '로즈' },
        { id: 'blue', hex: '#3B82F6', label: '블루' },
        { id: 'green', hex: '#22C55E', label: '그린' },
    ];

    // ✨ 현재 선택된 포인트 컬러의 HEX 값을 가져옵니다 (미리보기에 적용하기 위함)
    const currentAccentHex = accentColors.find(c => c.id === accent)?.hex || '#64748B';

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
                        테마 및 색상
                    </RNText>
                </View>
                <View style={{ width: scale(44) }} />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(80), paddingTop: scale(24) }} showsVerticalScrollIndicator={false}>

                {/* [그룹 1] 화면 테마 모드 */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(40) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Appearance</Text>
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800/60 p-5" style={safeShadow}>

                        <View className="flex-row bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl" style={{ padding: scale(6) }}>
                            {[{ id: 'system', label: '기기 설정' }, { id: 'light', label: '라이트' }, { id: 'dark', label: '다크' }].map((t) => {
                                const isSelected = theme === t.id;
                                return (
                                    <TouchableOpacity
                                        key={t.id}
                                        onPress={() => setTheme(t.id as any)}
                                        activeOpacity={isSelected ? 1 : 0.8}
                                        className={`flex-1 rounded-xl items-center justify-center ${isSelected ? 'bg-white dark:bg-slate-700' : 'bg-transparent'}`}
                                        style={[{ paddingVertical: scale(14) }, isSelected && safeShadow]}
                                    >
                                        <Text className={`tracking-tight ${isSelected ? 'font-extrabold text-slate-900 dark:text-white' : 'font-bold text-slate-500 dark:text-slate-400'}`} style={{ fontSize: scale(14) }} allowFontScaling={false}>
                                            {t.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <Text className="text-slate-400 dark:text-slate-500 text-center mt-4 leading-5" style={{ fontSize: scale(12) }} allowFontScaling={false}>
                            기기 설정에 맞추거나 원하는 테마로 고정할 수 있습니다.
                        </Text>

                    </View>
                </View>

                {/* [그룹 2] 포인트 컬러 (Accent) */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(40) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Accent Color</Text>
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800/60 px-2 py-6" style={safeShadow}>

                        <View className="flex-row justify-around items-center">
                            {accentColors.map((color) => {
                                const isSelected = accent === color.id;
                                return (
                                    <TouchableOpacity
                                        key={color.id}
                                        onPress={() => setAccent(color.id)}
                                        activeOpacity={0.8}
                                        className="items-center"
                                        style={{ gap: scale(10) }}
                                    >
                                        <View
                                            className="rounded-full items-center justify-center"
                                            style={[
                                                { width: scale(44), height: scale(44), backgroundColor: color.hex },
                                                isSelected ? { opacity: 1, transform: [{ scale: 1.15 }] } : { opacity: 0.3, transform: [{ scale: 0.95 }] },
                                                isSelected && safeShadowMd
                                            ]}
                                        >
                                            {isSelected && <Ionicons name="checkmark" size={scale(24)} color="white" />}
                                        </View>
                                        <Text className={`font-extrabold tracking-wide ${isSelected ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`} style={{ fontSize: scale(11) }} allowFontScaling={false}>
                                            {color.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                    </View>
                </View>

                {/* ✨ [그룹 3] 실시간 미리보기 (Live Preview - 궁극의 완성본!) */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(40) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Preview</Text>

                    <View className="bg-white dark:bg-slate-800/50 rounded-[24px] border border-slate-200/60 dark:border-slate-700/60 pt-5 pb-5 px-5" style={safeShadow}>

                        {/* 📔 가짜 일기장 UI (실제 일기 리스트와 100% 동일한 포맷!) */}
                        <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 p-4 mb-5" style={safeShadow}>
                            {/* 1. 제목 (날짜 대신 찐 제목 느낌으로!) */}
                            <View className="mb-1.5">
                                <Text className="font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(14.5) }} allowFontScaling={false} numberOfLines={1}>
                                    버디와 함께한 특별한 하루
                                </Text>
                            </View>

                            {/* 2. 내용 */}
                            <Text className="font-medium text-slate-500 dark:text-slate-400 leading-5" style={{ fontSize: scale(12.5), marginBottom: scale(10) }} allowFontScaling={false} numberOfLines={2}>
                                테마를 바꾸면 일기장의 포인트 색상들도 예쁘게 변해요! 일상의 소중한 추억을 예쁘게 기록해 보세요.
                            </Text>

                            {/* ✨ 3. 해시태그 (맨 밑바닥에 안정적으로 안착!) */}
                            <View className="flex-row" style={{ gap: scale(6) }}>
                                <View className="px-2.5 py-1 rounded-md" style={{ backgroundColor: currentAccentHex + '1A' }}>
                                    <Text className="font-bold tracking-tight uppercase" style={{ color: currentAccentHex, fontSize: scale(10) }} allowFontScaling={false}>#버디</Text>
                                </View>
                                <View className="px-2.5 py-1 rounded-md" style={{ backgroundColor: currentAccentHex + '1A' }}>
                                    <Text className="font-bold tracking-tight uppercase" style={{ color: currentAccentHex, fontSize: scale(10) }} allowFontScaling={false}>#일기</Text>
                                </View>
                            </View>
                        </View>

                        <View className="w-full h-[1px] bg-slate-100 dark:bg-slate-700/50 mb-5" />

                        {/* 가짜 채팅 UI - 버디 */}
                        <View className="flex-row items-end mb-3 w-full">
                            <View className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 mr-2 items-center justify-center">
                                <Ionicons name="paw" size={scale(15)} color="#94A3B8" />
                            </View>
                            <View className="bg-slate-100 dark:bg-slate-800 px-4 rounded-2xl rounded-bl-sm" style={{ maxWidth: '75%', paddingVertical: scale(9) }}>
                                <Text className="font-medium text-slate-800 dark:text-slate-200" style={{ fontSize: scale(13.5) }} allowFontScaling={false}>
                                    테마를 바꾸면 이렇게 변해요!
                                </Text>
                            </View>
                        </View>

                        {/* 가짜 채팅 UI - 나 */}
                        <View className="flex-row items-end justify-end mb-5 w-full">
                            <View className="px-4 rounded-2xl rounded-br-sm" style={{ maxWidth: '75%', backgroundColor: currentAccentHex, paddingVertical: scale(9) }}>
                                <Text className="font-medium text-white" style={{ fontSize: scale(13.5) }} allowFontScaling={false}>
                                    내 말풍선도 똑같이 변해요!
                                </Text>
                            </View>
                        </View>

                        {/* ✨ [핵심 UX] 덩그러니 있던 완료 버튼 대신, 현실적인 '채팅 입력창 + 전송 버튼' 프리뷰! */}
                        <View className="flex-row items-center border-t border-slate-100 dark:border-slate-700/50 pt-4 mt-1">
                            {/* 가짜 입력창 */}
                            <View className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-4 justify-center mr-2" style={{ height: scale(38) }}>
                                <Text className="font-medium text-slate-400" style={{ fontSize: scale(13) }} allowFontScaling={false}>메시지 보내기...</Text>
                            </View>
                            {/* 가짜 전송(Send) 버튼 - 동그란 배경에 종이비행기 아이콘! */}
                            <View className="rounded-full items-center justify-center" style={{ width: scale(38), height: scale(38), backgroundColor: currentAccentHex }}>
                                <Ionicons name="send" size={scale(15)} color="white" style={{ marginLeft: scale(2) }} />
                            </View>
                        </View>

                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}