import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Platform, Text as RNText, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
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

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { verifiedPassword } = useLocalSearchParams();

    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const [newPasswordInput, setNewPasswordInput] = useState("");
    const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
    const [secureNew, setSecureNew] = useState(true);
    const [secureConfirm, setSecureConfirm] = useState(true);
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);

    const getPasswordMatchInfo = () => {
        if (!newPasswordInput || !confirmPasswordInput) return null;
        if (newPasswordInput === confirmPasswordInput) {
            return <RNText className="text-emerald-500 font-bold ml-2 mt-2" style={{ fontSize: scale(12), fontFamily: customFontFamily }}>비밀번호가 서로 일치합니다.</RNText>;
        }
        return <RNText className="text-rose-500 font-bold ml-2 mt-2" style={{ fontSize: scale(12), fontFamily: customFontFamily }}>새 비밀번호가 일치하지 않습니다.</RNText>;
    };

    const handleSavePassword = async () => {
        const newPw = newPasswordInput.trim();
        const confirmPw = confirmPasswordInput.trim();

        if (!newPw || !confirmPw) return Alert.alert("알림", "비밀번호를 모두 입력해주세요.");
        if (newPw !== confirmPw) return Alert.alert("알림", "새 비밀번호와 비밀번호 확인 입력이 서로 다릅니다.");
        if (verifiedPassword === newPw) return Alert.alert("알림", "새 비밀번호가 기존 비밀번호와 동일합니다.");

        setIsPasswordSaving(true);
        try {
            await memberApi.updatePassword({
                currentPassword: String(verifiedPassword),
                newPassword: newPw
            });

            Alert.alert("성공", "비밀번호가 안전하게 변경되었습니다. 🎉", [
                {
                    text: "확인",
                    onPress: () => router.replace('/settings') // 🚨 메인 설정 화면 경로
                }
            ]);
        } catch (error: any) {
            Alert.alert("오류", "비밀번호 변경에 실패했습니다.");
        } finally {
            setIsPasswordSaving(false);
        }
    };

    const isButtonDisabled = isPasswordSaving || !newPasswordInput.trim() || newPasswordInput !== confirmPasswordInput;

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
            <View className="flex-row items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800/60">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <Ionicons name="chevron-back" size={scale(28)} color="#64748B" />
                </TouchableOpacity>
                <View className="absolute left-0 right-0 h-full items-center justify-center pointer-events-none" style={{ zIndex: -1 }}>
                    <RNText className="font-black text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(18), fontFamily: customFontFamily }} allowFontScaling={false}>
                        새 비밀번호 설정
                    </RNText>
                </View>
                <View style={{ width: scale(44) }} />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(100), paddingTop: scale(32) }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View className="px-6 mb-8">
                    <Text className="text-slate-900 dark:text-white font-black mb-2 leading-tight" style={{ fontSize: scale(22) }} allowFontScaling={false}>
                        새롭게 사용할{"\n"}비밀번호를 입력해주세요.
                    </Text>
                </View>

                <View style={{ paddingHorizontal: scale(20) }}>
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800/60 p-5 mb-8" style={safeShadow}>

                        {/* 1. 새 비밀번호 */}
                        <View className="mb-4">
                            <View className="flex-row items-center bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl px-4" style={{ height: scale(52) }}>
                                <TextInput
                                    autoFocus
                                    value={newPasswordInput}
                                    onChangeText={setNewPasswordInput}
                                    placeholder="새 비밀번호 (8~20자)"
                                    placeholderTextColor="#94A3B8"
                                    secureTextEntry={secureNew}
                                    className="flex-1 font-bold text-slate-900 dark:text-white ml-2"
                                    style={{ fontSize: scale(15), fontFamily: customFontFamily }}
                                    allowFontScaling={false}
                                />
                                <TouchableOpacity onPress={() => setSecureNew(!secureNew)}>
                                    <Ionicons name={secureNew ? "eye-off-outline" : "eye-outline"} size={scale(20)} color="#CBD5E1" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* 2. 새 비밀번호 확인 */}
                        <View>
                            <View className={`flex-row items-center bg-white dark:bg-slate-800 border ${getPasswordMatchInfo()?.props.children.includes('불일치') ? 'border-rose-400 dark:border-rose-500 bg-rose-50/30' : 'border-slate-200/60 dark:border-slate-700'} rounded-xl px-4`} style={{ height: scale(52) }}>
                                <TextInput
                                    value={confirmPasswordInput}
                                    onChangeText={setConfirmPasswordInput}
                                    placeholder="새 비밀번호 확인"
                                    placeholderTextColor="#94A3B8"
                                    secureTextEntry={secureConfirm}
                                    className="flex-1 font-bold text-slate-900 dark:text-white ml-2"
                                    style={{ fontSize: scale(15), fontFamily: customFontFamily }}
                                    allowFontScaling={false}
                                    onSubmitEditing={handleSavePassword}
                                />
                                <TouchableOpacity onPress={() => setSecureConfirm(!secureConfirm)}>
                                    <Ionicons name={secureConfirm ? "eye-off-outline" : "eye-outline"} size={scale(20)} color="#CBD5E1" />
                                </TouchableOpacity>
                            </View>
                            {getPasswordMatchInfo()}
                        </View>
                    </View>

                    {/* ✨ 3. 추가된 비밀번호 생성 가이드라인 영역 */}
                    <View className="px-2">
                        <Text className="font-bold text-slate-700 dark:text-slate-300 mb-3" style={{ fontSize: scale(14) }} allowFontScaling={false}>
                            안전한 비밀번호 만들기
                        </Text>
                        <View className="gap-3">
                            <View className="flex-row items-start pr-2">
                                <Text className="text-slate-400 dark:text-slate-500 mr-2 mt-0.5" style={{ fontSize: scale(13) }}>•</Text>
                                <Text className="text-slate-500 dark:text-slate-400 leading-relaxed flex-1" style={{ fontSize: scale(13) }} allowFontScaling={false}>
                                    가급적 영문, 숫자, 특수문자를 혼합하여 8~20자리 이내로 입력하세요.
                                </Text>
                            </View>
                            <View className="flex-row items-start pr-2">
                                <Text className="text-slate-400 dark:text-slate-500 mr-2 mt-0.5" style={{ fontSize: scale(13) }}>•</Text>
                                <Text className="text-slate-500 dark:text-slate-400 leading-relaxed flex-1" style={{ fontSize: scale(13) }} allowFontScaling={false}>
                                    생일, 전화번호 등 개인정보와 관련된 숫자, 연속되거나 반복되는 문자 등 쉽게 알아낼 수 있는 비밀번호는 피해주세요.
                                </Text>
                            </View>
                            <View className="flex-row items-start pr-2">
                                <Text className="text-slate-400 dark:text-slate-500 mr-2 mt-0.5" style={{ fontSize: scale(13) }}>•</Text>
                                <Text className="text-slate-500 dark:text-slate-400 leading-relaxed flex-1" style={{ fontSize: scale(13) }} allowFontScaling={false}>
                                    이전에 사용하셨던 비밀번호를 재사용할 경우 도용의 우려가 있으니, 새로운 비밀번호를 사용해 주세요.
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View className="px-5 pb-8 pt-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
                <TouchableOpacity
                    onPress={handleSavePassword}
                    disabled={isButtonDisabled}
                    className={`w-full rounded-[20px] items-center justify-center ${isButtonDisabled ? 'bg-slate-200 dark:bg-slate-800' : 'bg-primary-600'}`}
                    style={[{ paddingVertical: scale(18) }, !isButtonDisabled && safeShadow]}
                >
                    {isPasswordSaving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <RNText className={`font-extrabold tracking-wide ${isButtonDisabled ? 'text-slate-400 dark:text-slate-500' : 'text-white'}`} style={{ fontSize: scale(16), fontFamily: customFontFamily }} allowFontScaling={false}>
                            완료
                        </RNText>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}