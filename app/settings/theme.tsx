import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Dimensions, Modal, Platform, ScrollView, TouchableOpacity, View } from "react-native";
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

    const [isApplying, setIsApplying] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");

    const accentColors: { id: AccentColor; hex: string; label: string }[] = [
        { id: 'default', hex: '#27272A', label: '블랙' },   // 이름도 모노->블랙으로!
        { id: 'rose', hex: '#FB7185', label: '코랄' },
        { id: 'blue', hex: '#60A5FA', label: '블루' },
        { id: 'green', hex: '#059669', label: '그린' },    // 따뜻한 그린
        { id: 'yellow', hex: '#F97316', label: '망고' },   // 옐로우 대신 망고/오렌지
    ];

    const currentAccentHex = accentColors.find(c => c.id === accent)?.hex || '#64748B';

    // [로직] 테마/색상 변경 및 리페인트(Repaint) 딜레이 처리
    const handleApplyChange = (type: 'theme' | 'accent', value: any) => {
        if (type === 'theme' && theme === value) return;
        if (type === 'accent' && accent === value) return;

        setLoadingMessage(type === 'theme' ? "새로운 테마를 적용하고 있어요..." : "포인트 색상을 입히고 있어요...");
        setIsApplying(true);

        setTimeout(() => {
            if (type === 'theme') setTheme(value);
            if (type === 'accent') setAccent(value);

            setTimeout(() => {
                setIsApplying(false);
            }, 600);
        }, 100);
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>

            {/* 테마 적용 로딩 모달 (리페인트 깜빡임 방지용) */}
            <Modal transparent={true} visible={isApplying} animationType="fade">
                <View className="flex-1 bg-slate-900/40 dark:bg-black/60 items-center justify-center backdrop-blur-sm">
                    <View className="bg-white dark:bg-slate-800 rounded-3xl items-center justify-center" style={[{ width: scale(200), paddingVertical: scale(30) }, safeShadowMd]}>
                        <ActivityIndicator size="large" color={currentAccentHex} style={{ marginBottom: scale(16) }} />
                        <Text className="font-bold text-slate-700 dark:text-slate-300 tracking-tight text-center" style={{ fontSize: scale(13), paddingHorizontal: scale(10) }} allowFontScaling={false}>
                            {loadingMessage}
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
                        테마 및 색상
                    </Text>
                </View>
                <View style={{ width: scale(44) }} />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(80), paddingTop: scale(24) }} showsVerticalScrollIndicator={false}>

                {/* [UI] 화면 테마 모드 선택 */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(40) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Appearance</Text>
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800/60 p-5" style={safeShadow}>
                        <View className="flex-row bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl" style={{ padding: scale(6) }}>
                            {[{ id: 'system', label: '기기 설정' }, { id: 'light', label: '라이트' }, { id: 'dark', label: '다크' }].map((t) => {
                                const isSelected = theme === t.id;
                                return (
                                    <TouchableOpacity
                                        key={t.id}
                                        onPress={() => handleApplyChange('theme', t.id)}
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

                {/* [UI] 포인트 컬러 (Accent) 선택 */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(40) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Accent Color</Text>
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800/60 px-2 py-6" style={safeShadow}>
                        <View className="flex-row justify-around items-center">
                            {accentColors.map((color) => {
                                const isSelected = accent === color.id;
                                return (
                                    <TouchableOpacity
                                        key={color.id}
                                        onPress={() => handleApplyChange('accent', color.id)}
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

                {/* [UI] 실시간 미리보기 */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(40) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Preview</Text>
                    <View className="bg-white dark:bg-slate-800/50 rounded-[24px] border border-slate-200/60 dark:border-slate-700/60 pt-5 pb-5 px-5" style={safeShadow}>

                        <View className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 p-4 mb-5" style={safeShadow}>
                            <View className="mb-1.5">
                                <Text className="font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(14.5) }} allowFontScaling={false} numberOfLines={1}>
                                    버디와 함께한 특별한 하루
                                </Text>
                            </View>
                            <Text className="font-medium text-slate-500 dark:text-slate-400 leading-5" style={{ fontSize: scale(12.5), marginBottom: scale(10) }} allowFontScaling={false} numberOfLines={2}>
                                테마를 바꾸면 일기장의 포인트 색상들도 예쁘게 변해요! 일상의 소중한 추억을 예쁘게 기록해 보세요.
                            </Text>
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

                        <View className="flex-row items-end justify-end mb-5 w-full">
                            <View className="px-4 rounded-2xl rounded-br-sm" style={{ maxWidth: '75%', backgroundColor: currentAccentHex, paddingVertical: scale(9) }}>
                                <Text className="font-medium text-white" style={{ fontSize: scale(13.5) }} allowFontScaling={false}>
                                    내 말풍선도 똑같이 변해요!
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row items-center border-t border-slate-100 dark:border-slate-700/50 pt-4 mt-1">
                            <View className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-4 justify-center mr-2" style={{ height: scale(38) }}>
                                <Text className="font-medium text-slate-400" style={{ fontSize: scale(13) }} allowFontScaling={false}>메시지 보내기...</Text>
                            </View>
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