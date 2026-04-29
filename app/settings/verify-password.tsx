import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Platform, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { memberApi } from "../../api/memberApi";
import { AppText as Text } from '../../components/AppText';
import { useSettingStore } from "../../store/useSettingStore";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const safeShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    android: { elevation: 2 },
});

export default function VerifyPasswordScreen() {
    const router = useRouter();
    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const [currentPasswordInput, setCurrentPasswordInput] = useState("");
    const [secureCurrent, setSecureCurrent] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerifyNext = async () => {
        const currentPw = currentPasswordInput.trim();
        if (!currentPw) return Alert.alert("알림", "현재 비밀번호를 입력해주세요.");

        setIsVerifying(true);
        try {
            await memberApi.verifyPassword({ currentPassword: currentPw });

            router.push({
                pathname: '/settings/change-password',
                params: { verifiedPassword: currentPw }
            });
        } catch (error: any) {
            Alert.alert("알림", "비밀번호가 일치하지 않습니다.\n다시 확인해주세요.");
        } finally {
            setIsVerifying(false);
        }
    };

    const isButtonDisabled = isVerifying || !currentPasswordInput.trim();

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
            <View className="flex-row items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800/60">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <Ionicons name="chevron-back" size={scale(28)} color="#64748B" />
                </TouchableOpacity>
                <View className="absolute left-0 right-0 h-full items-center justify-center pointer-events-none" style={{ zIndex: -1 }}>
                    <Text className="font-black text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(18), fontFamily: customFontFamily }} allowFontScaling={false}>
                        비밀번호 확인
                    </Text>
                </View>
                <View style={{ width: scale(44) }} />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(100), paddingTop: scale(32) }} keyboardShouldPersistTaps="handled">
                <View className="px-6 mb-8">
                    <Text className="text-slate-900 dark:text-white font-black mb-2 leading-tight" style={{ fontSize: scale(22) }} allowFontScaling={false}>
                        안전한 변경을 위해{"\n"}현재 비밀번호를 입력해주세요.
                    </Text>
                </View>

                <View style={{ paddingHorizontal: scale(20) }}>
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800/60 p-5" style={safeShadow}>
                        {/* 텍스트 라벨 삭제됨! 바로 입력창 등장 */}
                        <View className="flex-row items-center bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl px-4" style={{ height: scale(52) }}>
                            <TextInput
                                autoFocus
                                value={currentPasswordInput}
                                onChangeText={setCurrentPasswordInput}
                                placeholder="현재 비밀번호 입력"
                                placeholderTextColor="#94A3B8"
                                secureTextEntry={secureCurrent}
                                className="flex-1 font-bold text-slate-900 dark:text-white ml-2"
                                style={{ fontSize: scale(15), fontFamily: customFontFamily }}
                                allowFontScaling={false}
                                editable={!isVerifying}
                                onSubmitEditing={handleVerifyNext}
                            />
                            <TouchableOpacity onPress={() => setSecureCurrent(!secureCurrent)}>
                                <Ionicons name={secureCurrent ? "eye-off-outline" : "eye-outline"} size={scale(20)} color="#CBD5E1" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View className="px-5 pb-8 pt-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
                <TouchableOpacity
                    onPress={handleVerifyNext}
                    disabled={isButtonDisabled}
                    className={`w-full rounded-[20px] items-center justify-center ${isButtonDisabled ? 'bg-slate-200 dark:bg-slate-800' : 'bg-primary-600'}`}
                    style={[{ paddingVertical: scale(18) }, !isButtonDisabled && safeShadow]}
                >
                    {isVerifying ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text className={`font-extrabold tracking-wide ${isButtonDisabled ? 'text-slate-400 dark:text-slate-500' : 'text-white'}`} style={{ fontSize: scale(16), fontFamily: customFontFamily }} allowFontScaling={false}>
                            다음 단계로
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}