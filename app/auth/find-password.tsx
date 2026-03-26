import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInRight, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { SafeAreaView } from "react-native-safe-area-context";

import { authService } from "../../api/authApi";
import { AppText as Text } from '../../components/AppText';

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

// ✅ [수정] dark: 클래스 제거, activeColor prop 제거
const InputField = ({ label, icon, isFocused, isError, bottomText, rightElement, disabled, onFocus, onBlur, ...props }: any) => (
    <View style={{ marginBottom: scale(20) }}>
        <Text className="font-extrabold text-slate-500 uppercase tracking-widest ml-1" style={{ fontSize: scale(12), marginBottom: scale(8) }} allowFontScaling={false}>
            {label}
        </Text>
        <View className={`flex-row items-center bg-slate-50 px-4 rounded-2xl border-2 ${isFocused ? "border-slate-900" : (isError ? "border-red-500" : "border-transparent")} ${disabled ? "opacity-60" : ""}`} style={{ height: scale(56) }}>
            {icon && <Ionicons name={icon} size={scale(20)} color={isFocused ? '#0F172A' : (isError ? "#EF4444" : "#94A3B8")} />}
            <TextInput
                placeholderTextColor="#94A3B8"
                editable={!disabled}
                onFocus={onFocus}
                onBlur={onBlur}
                className="flex-1 text-slate-900"
                style={{ fontSize: scale(15), paddingVertical: 0, fontFamily: 'Pretendard-Medium', marginLeft: icon ? scale(11) : 0 }}
                allowFontScaling={false}
                {...props}
            />
            {rightElement}
        </View>
        {bottomText && <Text className={`mt-2 ml-1 font-bold ${isError ? "text-red-500" : "text-emerald-500"}`} style={{ fontSize: scale(12) }} allowFontScaling={false}>{bottomText}</Text>}
    </View>
);

export default function FindPasswordScreen() {
    const router = useRouter();
    const { setColorScheme } = useNativeWindColorScheme();

    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [validToken, setValidToken] = useState("");
    const [focus, setFocus] = useState({ email: false, code: false, newPassword: false, confirmPassword: false });
    const handleFocus = (field: keyof typeof focus, isFocused: boolean) => setFocus(prev => ({ ...prev, [field]: isFocused }));

    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // ✅ [추가] 라이트 모드 강제
    useFocusEffect(useCallback(() => {
        setColorScheme('light');
        return () => setColorScheme('system');
    }, []));

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        } else {
            router.back();
        }
    };

    const handleSendCode = async () => {
        if (!email.trim() || !email.includes('@')) return Alert.alert("알림", "올바른 이메일 형식을 입력해주세요.");
        setIsSendingCode(true);
        try {
            await authService.sendEmailAuthCode({ email: email.trim(), purpose: "PASSWORD_RESET" });
            setIsCodeSent(true);
            Alert.alert("발송 완료", "이메일로 6자리 인증번호가 발송되었습니다.");
        } catch (error: any) {
            Alert.alert("발송 실패", error.response?.data?.message || "인증번호 발송에 실패했습니다.");
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!code.trim()) return Alert.alert("알림", "인증번호를 입력해주세요.");
        setIsVerifying(true);
        try {
            const verifyRes = await authService.verifyEmailAuthCode({
                email: email.trim(),
                code: code.trim(),
                purpose: "PASSWORD_RESET"
            });
            const token = (typeof verifyRes.result === 'string' && verifyRes.result) ? verifyRes.result : code.trim();
            setValidToken(token);
            setStep(2);
        } catch (error: any) {
            Alert.alert("인증 실패", error.response?.data?.message || "인증번호가 틀렸거나 만료되었습니다.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword.trim() || !confirmPassword.trim()) return Alert.alert("알림", "모든 항목을 입력해주세요.");
        if (newPassword.length < 8 || newPassword.length > 20) return Alert.alert("알림", "비밀번호는 8~20자로 설정해주세요.");
        if (newPassword !== confirmPassword) return Alert.alert("알림", "새 비밀번호가 일치하지 않습니다.");

        setIsResetting(true);
        try {
            await authService.resetPassword({
                email: email.trim(),
                verificationToken: validToken,
                newPassword: newPassword.trim()
            });
            Alert.alert("변경 완료", "비밀번호가 성공적으로 재설정되었습니다.\n새로운 비밀번호로 로그인해주세요! 🎉", [
                { text: "확인", onPress: () => router.replace('/auth/login') }
            ]);
        } catch (error: any) {
            Alert.alert("오류", error.response?.data?.message || "비밀번호 재설정에 실패했습니다.");
        } finally {
            setIsResetting(false);
        }
    };

    const isNextButtonDisabled = isVerifying || !code.trim();
    const isResetButtonDisabled = isResetting || !newPassword.trim() || newPassword !== confirmPassword;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">

                <View className="px-6 pt-2 pb-2">
                    <TouchableOpacity onPress={handleBack} style={{ width: scale(40), height: scale(40) }} className="justify-center">
                        <Ionicons name="arrow-back" size={scale(26)} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: scale(32), paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {step === 1 && (
                        <Animated.View entering={FadeInRight.duration(400).springify()} exiting={SlideOutLeft.duration(300)} className="flex-1">
                            <View style={{ marginBottom: scale(40) }}>
                                <Text className="font-extrabold text-slate-900 tracking-tight mb-2" style={{ fontSize: scale(30) }} allowFontScaling={false}>
                                    비밀번호 찾기
                                </Text>
                                <Text className="font-medium text-slate-500" style={{ fontSize: scale(14) }} allowFontScaling={false}>
                                    가입하신 이메일로 인증번호를 보냅니다.
                                </Text>
                            </View>

                            <View className="flex-row items-end" style={{ gap: scale(8), marginBottom: scale(12) }}>
                                <View className="flex-1">
                                    <InputField
                                        label="Email" icon="mail" value={email}
                                        onChangeText={(text: string) => { setEmail(text); setIsCodeSent(false); setCode(""); }}
                                        isFocused={focus.email} onFocus={() => handleFocus('email', true)} onBlur={() => handleFocus('email', false)}
                                        keyboardType="email-address" autoCapitalize="none" placeholder="가입한 이메일 입력"
                                    />
                                </View>
                                <TouchableOpacity
                                    onPress={handleSendCode}
                                    disabled={isSendingCode || !email.trim()}
                                    className={`px-5 rounded-2xl items-center justify-center ${!email.trim() ? 'bg-slate-100' : 'bg-slate-900'}`}
                                    style={{ height: scale(56), marginBottom: scale(20) }}
                                >
                                    {isSendingCode
                                        ? <ActivityIndicator size="small" color={email.trim() ? '#fff' : '#94A3B8'} />
                                        : <Text className={`font-extrabold ${!email.trim() ? 'text-slate-400' : 'text-white'}`} style={{ fontSize: scale(13) }} allowFontScaling={false}>
                                            {isCodeSent ? "재전송" : "인증받기"}
                                        </Text>
                                    }
                                </TouchableOpacity>
                            </View>

                            {isCodeSent && (
                                <Animated.View entering={FadeInDown.duration(400).springify()}>
                                    <View className="w-full h-[1px] bg-slate-200/60 mb-6" />
                                    <InputField
                                        label="Verification Code" icon="key-outline" value={code}
                                        onChangeText={setCode} isFocused={focus.code}
                                        onFocus={() => handleFocus('code', true)} onBlur={() => handleFocus('code', false)}
                                        keyboardType="number-pad" maxLength={6} placeholder="인증번호 6자리 입력"
                                    />
                                    <TouchableOpacity
                                        onPress={handleVerifyCode}
                                        disabled={isNextButtonDisabled}
                                        activeOpacity={0.8}
                                        className={`w-full rounded-2xl items-center justify-center shadow-sm mt-4 ${isNextButtonDisabled ? 'bg-slate-300' : 'bg-slate-900'}`}
                                        style={{ height: scale(56) }}
                                    >
                                        {isVerifying
                                            ? <ActivityIndicator size="small" color="#fff" />
                                            : <Text className={`font-extrabold tracking-widest uppercase ${isNextButtonDisabled ? 'text-slate-500' : 'text-white'}`} style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                                다음 단계
                                            </Text>
                                        }
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                        </Animated.View>
                    )}

                    {step === 2 && (
                        <Animated.View entering={SlideInRight.duration(400).springify()} className="flex-1">
                            <View style={{ marginBottom: scale(40) }}>
                                <Text className="font-extrabold text-slate-900 tracking-tight mb-2" style={{ fontSize: scale(30) }} allowFontScaling={false}>
                                    새 비밀번호 설정
                                </Text>
                                <Text className="font-medium text-slate-500" style={{ fontSize: scale(14) }} allowFontScaling={false}>
                                    인증이 완료되었습니다. 새로운 비밀번호를 입력해주세요.
                                </Text>
                            </View>

                            <InputField
                                label="New Password (8~20자)" icon="lock-closed" value={newPassword}
                                onChangeText={setNewPassword} secureTextEntry={!showPassword} isFocused={focus.newPassword}
                                onFocus={() => handleFocus('newPassword', true)} onBlur={() => handleFocus('newPassword', false)}
                                maxLength={20} placeholder="새 비밀번호 입력"
                                rightElement={
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={scale(20)} color="#94A3B8" />
                                    </TouchableOpacity>
                                }
                            />

                            <InputField
                                label="Confirm New Password" icon="checkmark-circle" value={confirmPassword}
                                onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} isFocused={focus.confirmPassword}
                                isError={confirmPassword.length > 0 && newPassword !== confirmPassword}
                                bottomText={confirmPassword.length > 0 ? (newPassword === confirmPassword ? "비밀번호가 일치합니다. ✨" : "비밀번호가 일치하지 않습니다.") : null}
                                onFocus={() => handleFocus('confirmPassword', true)} onBlur={() => handleFocus('confirmPassword', false)}
                                maxLength={20} placeholder="새 비밀번호 재입력"
                                rightElement={
                                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={scale(20)} color="#94A3B8" />
                                    </TouchableOpacity>
                                }
                            />

                            <View className="px-1 mt-2 mb-8">
                                <Text className="font-bold text-slate-700 mb-3" style={{ fontSize: scale(14) }} allowFontScaling={false}>안전한 비밀번호 만들기</Text>
                                <View className="gap-3">
                                    <View className="flex-row items-start pr-2">
                                        <Text className="text-slate-400 mr-2 mt-0.5" style={{ fontSize: scale(13) }}>•</Text>
                                        <Text className="text-slate-500 leading-relaxed flex-1" style={{ fontSize: scale(13) }} allowFontScaling={false}>가급적 영문, 숫자, 특수문자를 혼합하여 8~20자리 이내로 입력하세요.</Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleResetPassword}
                                disabled={isResetButtonDisabled}
                                activeOpacity={0.8}
                                className={`w-full rounded-2xl items-center justify-center shadow-sm ${isResetButtonDisabled ? 'bg-slate-300' : 'bg-slate-900'}`}
                                style={{ height: scale(56) }}
                            >
                                {isResetting
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text className={`font-extrabold tracking-widest uppercase ${isResetButtonDisabled ? 'text-slate-500' : 'text-white'}`} style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                        Reset Password
                                    </Text>
                                }
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}