import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Platform, Text as RNText, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText as Text } from '../../components/AppText';

import { useAuthStore } from "../../store/useAuthStore";
import { useSettingStore } from "../../store/useSettingStore";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const safeShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    android: { elevation: 2 },
});

export default function AccountSettingsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
            <View className="flex-row items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800/60">
                <TouchableOpacity onPress={() => router.back()} className="p-2" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={scale(28)} color="#64748B" />
                </TouchableOpacity>
                <View className="absolute left-0 right-0 h-full items-center justify-center pointer-events-none" style={{ zIndex: -1 }}>
                    <RNText className="font-black text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(18), fontFamily: customFontFamily }} allowFontScaling={false}>
                        내 정보
                    </RNText>
                </View>
                <View style={{ width: scale(44) }} />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(80), paddingTop: scale(24) }} showsVerticalScrollIndicator={false}>

                {/* [그룹 1] 개인 정보 영역 */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(32) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Profile Information</Text>
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>

                        <View className="flex-row items-center justify-between px-5 py-5 border-b border-slate-200/60 dark:border-slate-800/60">
                            <Text className="font-bold text-slate-700 dark:text-slate-300" style={{ fontSize: scale(15) }} allowFontScaling={false}>이메일 계정</Text>
                            <Text className="font-medium text-slate-400" style={{ fontSize: scale(15) }} allowFontScaling={false}>{user?.email}</Text>
                        </View>

                        {/* 🚨 진짜 페이지(/settings/edit-nickname)로 라우팅! */}
                        <TouchableOpacity onPress={() => router.push('/settings/edit-nickname')} activeOpacity={0.6} className="flex-row items-center justify-between px-5 py-5">
                            <Text className="font-bold text-slate-700 dark:text-slate-300" style={{ fontSize: scale(15) }} allowFontScaling={false}>내 닉네임</Text>
                            <View className="flex-row items-center" style={{ gap: scale(8) }}>
                                <Text className="font-medium text-slate-500 dark:text-slate-400" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                    {user?.nickname}
                                </Text>
                                <Ionicons name="chevron-forward" size={scale(18)} color="#CBD5E1" />
                            </View>
                        </TouchableOpacity>

                    </View>
                </View>

                {/* [그룹 2] 보안 설정 */}
                <View style={{ paddingHorizontal: scale(20) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Security</Text>
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>
                        <TouchableOpacity onPress={() => router.push('/settings/change-password')} activeOpacity={0.6} className="flex-row items-center justify-between px-5 py-5">
                            <Text className="font-bold text-slate-700 dark:text-slate-300" style={{ fontSize: scale(15) }} allowFontScaling={false}>비밀번호 변경</Text>
                            <Ionicons name="chevron-forward" size={scale(18)} color="#CBD5E1" />
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}