import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Dimensions, Platform, Text as RNText, ScrollView, Switch, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { notificationApi, NotificationSettings } from "../../api/notificationApi";
import { AppText as Text } from '../../components/AppText';
import { useSettingStore } from "../../store/useSettingStore";
import { ACCENT_HEX_COLORS, useThemeStore } from "../../store/useThemeStore";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const safeShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    android: { elevation: 2 },
});

const ToggleItem = React.memo(({ icon, iconColor, title, subtitle, value, onToggle, disabled = false, isLast = false, accentHex, isLoading = false }: any) => (
    <View className={`flex-row items-center justify-between px-5 py-4 ${!isLast ? 'border-b border-slate-200/60 dark:border-slate-700/60' : ''}`}>
        <View className={`flex-row items-center gap-4 flex-1 ${disabled ? 'opacity-40' : 'opacity-100'}`}>
            <View className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 items-center justify-center" style={safeShadow}>
                <Ionicons name={icon} size={scale(18)} color={disabled ? "#94A3B8" : iconColor} />
            </View>
            <View className="flex-1 pr-4">
                <Text className="font-bold text-slate-800 dark:text-slate-200" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                    {title}
                </Text>
                {subtitle && (
                    <Text className="font-medium text-slate-400 dark:text-slate-500 mt-0.5 leading-tight" style={{ fontSize: scale(12) }} allowFontScaling={false}>
                        {subtitle}
                    </Text>
                )}
            </View>
        </View>
        <Switch
            trackColor={{ false: "#E2E8F0", true: accentHex }}
            thumbColor={Platform.OS === 'ios' ? "#FFFFFF" : value ? "#FFFFFF" : "#F8FAFC"}
            ios_backgroundColor="#E2E8F0"
            onValueChange={onToggle}
            value={value}
            disabled={disabled || isLoading}
            style={{ transform: [{ scaleX: Platform.OS === 'ios' ? 0.8 : 1 }, { scaleY: Platform.OS === 'ios' ? 0.8 : 1 }] }}
        />
    </View>
));

export default function NotificationSettingsScreen() {
    const router = useRouter();
    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const { accent } = useThemeStore();
    const accentHex = ACCENT_HEX_COLORS[accent];

    const [settings, setSettings] = useState<NotificationSettings>({
        chatAlert: true,
        dailyAlert: true,
        marketingAlert: false,
        nightAlert: false,
    });

    // ✅ [수정] 전체 로딩 → 개별 타입 로딩으로 변경
    const [loadingType, setLoadingType] = useState<keyof NotificationSettings | null>(null);

    useFocusEffect(
        useCallback(() => {
            fetchSettings();
        }, [])
    );

    const fetchSettings = async () => {
        try {
            const response = await notificationApi.getSettings();
            const data = (response as any).result || response;
            setSettings(data);
        } catch (error) {
            console.error("알림 설정 조회 실패:", error);
        }
    };

    const handleToggle = async (type: keyof NotificationSettings, newValue: boolean) => {
        if (loadingType) return;
        // ✅ [수정] 해당 타입만 로딩 시작
        setLoadingType(type);

        let optimisticSettings = { ...settings, [type]: newValue };

        if (type === 'nightAlert' && newValue === false) {
            optimisticSettings.dailyAlert = false;
        }

        setSettings(optimisticSettings);

        try {
            let response;
            switch (type) {
                case 'nightAlert': response = await notificationApi.updateNight(newValue); break;
                case 'dailyAlert': response = await notificationApi.updateDaily(newValue); break;
                case 'chatAlert': response = await notificationApi.updateChat(newValue); break;
                case 'marketingAlert': response = await notificationApi.updateMarketing(newValue); break;
            }

            const resultData = (response as any)?.result || response;
            if (resultData) {
                setSettings(resultData);
            }
        } catch (error) {
            console.error(`${type} 알림 변경 실패:`, error);
            Alert.alert("오류", "설정 변경에 실패했습니다. 다시 시도해주세요.");
            await fetchSettings();
        } finally {
            // ✅ [수정] 해당 타입만 로딩 해제
            setLoadingType(null);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>

            <View className="flex-row items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800/60">
                <TouchableOpacity onPress={() => router.back()} className="p-2" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={scale(28)} color="#64748B" />
                </TouchableOpacity>
                <View className="absolute left-0 right-0 h-full items-center justify-center pointer-events-none" style={{ zIndex: -1 }}>
                    <RNText className="font-black text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(18), fontFamily: customFontFamily }} allowFontScaling={false}>
                        알림 설정
                    </RNText>
                </View>
                <View style={{ width: scale(44) }} />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(80), paddingTop: scale(24) }} showsVerticalScrollIndicator={false}>

                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(32) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Buddy Notifications</Text>
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>

                        <ToggleItem
                            icon="moon"
                            iconColor="#F59E0B"
                            title="야간 시간대 알림"
                            subtitle="밤 9시 ~ 아침 8시 사이의 알림 수신 동의"
                            value={settings.nightAlert}
                            onToggle={(val: boolean) => handleToggle('nightAlert', val)}
                            accentHex={accentHex}
                            // ✅ [수정] 해당 타입만 로딩
                            isLoading={loadingType === 'nightAlert'}
                        />

                        <ToggleItem
                            icon="calendar"
                            iconColor="#3B82F6"
                            title="데일리 안부 알림"
                            subtitle={!settings.nightAlert ? "야간 알림을 켜야 이용할 수 있어요." : "버디가 매일 다정한 안부 인사를 건네요"}
                            value={settings.dailyAlert}
                            disabled={!settings.nightAlert}
                            onToggle={(val: boolean) => handleToggle('dailyAlert', val)}
                            accentHex={accentHex}
                            // ✅ [수정] 해당 타입만 로딩
                            isLoading={loadingType === 'dailyAlert'}
                            isLast
                        />

                    </View>
                </View>

                <View style={{ paddingHorizontal: scale(20) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Other Notifications</Text>
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>

                        <ToggleItem
                            icon="chatbubble-ellipses"
                            iconColor="#10B981"
                            title="대화 소멸 경고 알림"
                            subtitle="대화가 10시간 경과 시 소멸 경고 발송"
                            value={settings.chatAlert}
                            onToggle={(val: boolean) => handleToggle('chatAlert', val)}
                            accentHex={accentHex}
                            // ✅ [수정] 해당 타입만 로딩
                            isLoading={loadingType === 'chatAlert'}
                        />

                        <ToggleItem
                            icon="gift"
                            iconColor="#EC4899"
                            title="마케팅/이벤트 알림"
                            subtitle="다양한 혜택과 이벤트 소식을 받아보세요"
                            value={settings.marketingAlert}
                            onToggle={(val: boolean) => handleToggle('marketingAlert', val)}
                            accentHex={accentHex}
                            // ✅ [수정] 해당 타입만 로딩
                            isLoading={loadingType === 'marketingAlert'}
                            isLast
                        />

                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}