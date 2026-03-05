import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Platform, Text as RNText, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText as Text } from '../../components/AppText';

import { memberApi } from "../../api/memberApi";
import { useAuthStore } from "../../store/useAuthStore";
import { useSettingStore } from "../../store/useSettingStore";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const safeShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    android: { elevation: 2 },
});

export default function EditNicknameScreen() {
    const router = useRouter();
    const { user, updateUserInfo } = useAuthStore();
    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const [nicknameInput, setNicknameInput] = useState(user?.nickname || "");
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveNickname = async () => {
        const trimmedInput = nicknameInput.trim();
        if (!trimmedInput) return Alert.alert("알림", "닉네임을 입력해주세요.");
        if (trimmedInput === user?.nickname) {
            router.back(); // 변경사항 없으면 그냥 뒤로가기
            return;
        }

        setIsSaving(true);
        try {
            await memberApi.updateNickname(trimmedInput);
            updateUserInfo({ nickname: trimmedInput });
            router.back(); // ✨ 성공 시 네이티브하게 이전 화면으로 복귀!
        } catch (error) {
            Alert.alert("알림", "닉네임 변경에 실패했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
            <View className="flex-row items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800/60">
                {/* 뒤로가기 버튼 */}
                <TouchableOpacity onPress={() => router.back()} className="p-2" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={scale(28)} color="#64748B" />
                </TouchableOpacity>
                <View className="absolute left-0 right-0 h-full items-center justify-center pointer-events-none" style={{ zIndex: -1 }}>
                    <RNText className="font-black text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(18), fontFamily: customFontFamily }} allowFontScaling={false}>
                        닉네임 변경
                    </RNText>
                </View>
                <View style={{ width: scale(44) }} />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(100), paddingTop: scale(32) }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View className="px-6 mb-8">
                    <Text className="text-slate-900 dark:text-white font-black mb-2 leading-tight" style={{ fontSize: scale(22) }} allowFontScaling={false}>
                        버디가 불러줄{"\n"}새로운 이름을 알려주세요.
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed" style={{ fontSize: scale(14) }} allowFontScaling={false}>
                        최대 10자까지 입력할 수 있습니다.
                    </Text>
                </View>

                <View style={{ paddingHorizontal: scale(20) }}>
                    {/* 입력창 */}
                    <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[20px] px-5" style={[{ height: scale(60) }, safeShadow]}>
                        <TextInput
                            // autoFocus
                            value={nicknameInput}
                            onChangeText={setNicknameInput}
                            maxLength={10}
                            placeholder="새 닉네임 입력"
                            placeholderTextColor="#94A3B8"
                            className="flex-1 font-bold text-slate-900 dark:text-white"
                            style={{ fontSize: scale(16), fontFamily: customFontFamily }}
                            allowFontScaling={false}
                            editable={!isSaving}
                            onSubmitEditing={handleSaveNickname}
                        />
                        {nicknameInput.length > 0 && (
                            <TouchableOpacity onPress={() => setNicknameInput("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <View className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center">
                                    <Ionicons name="close" size={scale(12)} color="#64748B" />
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* 저장 버튼 (입력창 바로 아래!) */}
                    <TouchableOpacity
                        onPress={handleSaveNickname}
                        activeOpacity={0.8}
                        disabled={isSaving || !nicknameInput.trim()}
                        className={`w-full rounded-[20px] items-center justify-center mt-4 ${(!nicknameInput.trim() || isSaving) ? 'bg-slate-200 dark:bg-slate-800' : 'bg-primary-600'}`}
                        style={[{ paddingVertical: scale(16) }, nicknameInput.trim() && !isSaving && safeShadow]}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <RNText className={`font-extrabold tracking-wide ${(!nicknameInput.trim() || isSaving) ? 'text-slate-400 dark:text-slate-500' : 'text-white'}`} style={{ fontSize: scale(16), fontFamily: customFontFamily }} allowFontScaling={false}>
                                저장하기
                            </RNText>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}