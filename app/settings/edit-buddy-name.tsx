import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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

export default function EditBuddyNameScreen() {
    const router = useRouter();
    const { user, updateUserInfo, refreshUser } = useAuthStore();
    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const [buddyNameInput, setBuddyNameInput] = useState(user?.characterNickname || "");
    const [isSavingName, setIsSavingName] = useState(false);

    useFocusEffect(
        useCallback(() => {
            refreshUser();
        }, [refreshUser])
    );

    // [통신] 버디 이름 변경 저장
    const handleSaveBuddyName = async () => {
        const trimmedInput = buddyNameInput.trim();
        if (!trimmedInput) return Alert.alert("알림", "버디의 이름을 입력해주세요.");
        if (trimmedInput === user?.characterNickname) {
            router.back();
            return;
        }

        setIsSavingName(true);
        try {
            await memberApi.updateCharacterName({ characterName: trimmedInput });
            updateUserInfo({ characterNickname: trimmedInput });
            await refreshUser();
            router.back();
        } catch (error) {
            Alert.alert("알림", "버디 이름 변경에 실패했습니다.");
        } finally {
            setIsSavingName(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>

            {/* 헤더 영역 */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800/60">
                <TouchableOpacity onPress={() => router.back()} className="p-2" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={scale(28)} color="#64748B" />
                </TouchableOpacity>
                <View className="absolute left-0 right-0 h-full items-center justify-center pointer-events-none" style={{ zIndex: -1 }}>
                    <RNText className="font-black text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(18), fontFamily: customFontFamily }} allowFontScaling={false}>
                        버디 이름 변경
                    </RNText>
                </View>
                <View style={{ width: scale(44) }} />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(100), paddingTop: scale(32) }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* 상단 안내 문구 */}
                <View className="px-6 mb-8">
                    <Text className="text-slate-900 dark:text-white font-black mb-2 leading-tight" style={{ fontSize: scale(22) }} allowFontScaling={false}>
                        나의 단짝 버디에게{"\n"}새로운 이름을 지어주세요.
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed" style={{ fontSize: scale(14) }} allowFontScaling={false}>
                        최대 10자까지 입력할 수 있습니다.
                    </Text>
                </View>

                {/* 입력 및 액션 영역 */}
                <View style={{ paddingHorizontal: scale(20) }}>

                    <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[20px] px-5" style={[{ height: scale(60) }, safeShadow]}>
                        <TextInput
                            value={buddyNameInput}
                            onChangeText={setBuddyNameInput}
                            maxLength={10}
                            placeholder="새 버디 이름 입력"
                            placeholderTextColor="#94A3B8"
                            className="flex-1 font-bold text-slate-900 dark:text-white"
                            style={{ fontSize: scale(16), fontFamily: customFontFamily }}
                            allowFontScaling={false}
                            editable={!isSavingName}
                            onSubmitEditing={handleSaveBuddyName}
                        />
                        {/* 텍스트 지우기(X) 버튼 */}
                        {buddyNameInput.length > 0 && (
                            <TouchableOpacity onPress={() => setBuddyNameInput("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <View className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center">
                                    <Ionicons name="close" size={scale(12)} color="#64748B" />
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* ✨ 저장 버튼 색상을 primary-500으로 변경! */}
                    <TouchableOpacity
                        onPress={handleSaveBuddyName}
                        activeOpacity={0.8}
                        disabled={isSavingName || !buddyNameInput.trim()}
                        className={`w-full rounded-[20px] items-center justify-center mt-4 ${(!buddyNameInput.trim() || isSavingName) ? 'bg-slate-200 dark:bg-slate-800' : 'bg-primary-500'}`}
                        style={[{ paddingVertical: scale(16) }, buddyNameInput.trim() && !isSavingName && safeShadow]}
                    >
                        {isSavingName ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <RNText className={`font-extrabold tracking-wide ${(!buddyNameInput.trim() || isSavingName) ? 'text-slate-400 dark:text-slate-500' : 'text-white'}`} style={{ fontSize: scale(16), fontFamily: customFontFamily }} allowFontScaling={false}>
                                저장하기
                            </RNText>
                        )}
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}