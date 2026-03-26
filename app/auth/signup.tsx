import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '../../api/authApi';
import { AppText as Text } from '../../components/AppText';
import { useAuthStore } from '../../store/useAuthStore';

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const InputField = ({ label, icon, isFocused, isError, bottomText, rightElement, disabled, activeColor, ...props }: any) => (
    <View style={{ marginBottom: scale(20) }}>
        <Text className="font-extrabold text-slate-500 uppercase tracking-widest ml-1" style={{ fontSize: scale(12), marginBottom: scale(8) }} allowFontScaling={false}>{label}</Text>
        <View className={`flex-row items-center bg-slate-50 px-4 rounded-2xl border-2 ${isFocused ? "border-slate-900" : (isError ? "border-red-500" : "border-transparent")} ${disabled ? "opacity-60" : ""}`} style={{ height: scale(56) }}>
            {icon && <Ionicons name={icon} size={scale(20)} color={isFocused ? activeColor : (isError ? "#EF4444" : "#94A3B8")} />}
            <TextInput
                placeholderTextColor="#94A3B8"
                editable={!disabled}
                className="flex-1 text-slate-900 font-bold"
                style={{ fontSize: scale(15), paddingVertical: 0, fontFamily: 'Pretendard-Medium', marginLeft: icon ? scale(11) : 0 }}
                allowFontScaling={false}
                {...props}
            />
            {rightElement}
        </View>
        {bottomText && <Text className={`mt-2 ml-1 font-bold ${isError ? "text-red-500" : "text-emerald-500"}`} style={{ fontSize: scale(12) }} allowFontScaling={false}>{bottomText}</Text>}
    </View>
);

export default function SignupScreen() {
    const router = useRouter();
    // ✅ [수정] nativewind useColorScheme으로 교체
    const { setColorScheme } = useNativeWindColorScheme();
    // ✅ [수정] 라이트 고정이라 항상 다크 컬러
    const activeColor = '#0F172A';
    const insets = useSafeAreaInsets();
    const { setTokens, setUser } = useAuthStore();

    // ✅ [추가] 진입 시 라이트 강제, 나갈 때 시스템 복원
    useFocusEffect(useCallback(() => {
        setColorScheme('light');
        return () => setColorScheme('system');
    }, []));

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [verificationToken, setVerificationToken] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [timeLeft, setTimeLeft] = useState(180);
    const [emailMessage, setEmailMessage] = useState({ text: "", isError: false });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [focus, setFocus] = useState({ email: false, code: false, password: false, confirm: false });
    const handleFocus = (field: keyof typeof focus, isFocused: boolean) => setFocus(prev => ({ ...prev, [field]: isFocused }));

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (isCodeSent && !isEmailVerified && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        } else if (timeLeft === 0 && isCodeSent) {
            setEmailMessage({ text: "인증 시간이 만료되었습니다.", isError: true });
            setIsCodeSent(false);
        }
        return () => clearInterval(timer);
    }, [isCodeSent, isEmailVerified, timeLeft]);

    const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

    const handleSendCode = async () => {
        if (!email.trim() || !email.includes("@")) return setEmailMessage({ text: "올바른 이메일 형식을 입력해주세요.", isError: true });
        try {
            setEmailMessage({ text: "인증번호를 전송 중입니다...", isError: false });
            await authService.sendEmailAuthCode({ email, purpose: "SIGNUP" });
            setIsCodeSent(true);
            setTimeLeft(180);
            setEmailMessage({ text: "이메일로 인증번호가 전송되었습니다.", isError: false });
        } catch (error: any) {
            setEmailMessage({ text: error.response?.data?.message || "전송에 실패했습니다.", isError: true });
            setIsCodeSent(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode.trim()) return setEmailMessage({ text: "인증번호를 입력해주세요.", isError: true });
        try {
            const response = await authService.verifyEmailAuthCode({ email, code: verificationCode, purpose: "SIGNUP" });
            setVerificationToken(response.result);
            setIsEmailVerified(true);
            setEmailMessage({ text: "이메일 인증이 완료되었습니다! ✅", isError: false });
        } catch (error: any) {
            setEmailMessage({ text: error.response?.data?.message || "잘못된 인증번호입니다.", isError: true });
        }
    };

    const handleSignupSubmit = async () => {
        if (!isEmailVerified) return Alert.alert("알림", "이메일 인증을 완료해주세요.");
        if (password.length < 8 || password.length > 20) return Alert.alert("알림", "비밀번호는 8~20자로 설정해주세요.");
        if (password !== passwordConfirm) return Alert.alert("알림", "비밀번호가 일치하지 않습니다.");

        setIsSubmitting(true);
        try {
            const signupResponse = await authService.signup({ email, password, verificationToken });
            const resultData = signupResponse.result || signupResponse;

            if (resultData.accessToken) {
                setTokens(resultData.accessToken as string, resultData.refreshToken as string);
                if (resultData.member) setUser(resultData.member as any);
                router.push('/auth/terms');
            }
        } catch (error: any) {
            Alert.alert("오류", error.response?.data?.message || "가입 처리 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isSubmitEnabled = isEmailVerified && password.length >= 8 && password === passwordConfirm;

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "padding"}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
            >
                <View className="px-6 pb-2" style={{ paddingTop: scale(16) }}>
                    <TouchableOpacity onPress={() => router.back()} className="justify-center" style={{ width: scale(40), height: scale(40) }}>
                        <Ionicons name="arrow-back" size={scale(26)} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: scale(16), paddingBottom: scale(24) }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                >
                    <View style={{ marginBottom: scale(40) }}>
                        <Text className="font-extrabold text-slate-900 tracking-tight mb-2" style={{ fontSize: scale(30) }} allowFontScaling={false}>계정 생성</Text>
                        <Text className="font-medium text-slate-500" style={{ fontSize: scale(14) }} allowFontScaling={false}>버디와 함께할 계정을 만들어주세요.</Text>
                    </View>

                    <View className="flex-row items-end" style={{ gap: scale(8) }}>
                        <View className="flex-1">
                            <InputField activeColor={activeColor} label="이메일" icon="mail" value={email} onChangeText={setEmail} disabled={isEmailVerified} isFocused={focus.email} onFocus={() => handleFocus('email', true)} onBlur={() => handleFocus('email', false)} keyboardType="email-address" autoCapitalize="none" placeholder="이메일 입력" />
                        </View>
                        <TouchableOpacity
                            onPress={handleSendCode}
                            disabled={isEmailVerified || !email}
                            className={`px-5 rounded-2xl items-center justify-center border-2 ${isEmailVerified ? 'bg-slate-100 border-slate-100' : 'bg-transparent border-slate-900'}`}
                            style={{ height: scale(56), marginBottom: scale(20) }}
                        >
                            <Text className={`font-extrabold ${isEmailVerified ? 'text-slate-400' : 'text-slate-900'}`} style={{ fontSize: scale(13) }} allowFontScaling={false}>
                                {isCodeSent ? "재전송" : "인증받기"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {emailMessage.text && (
                        <Text className={`font-bold ml-1 ${emailMessage.isError ? "text-red-500" : "text-emerald-500"}`} style={{ marginTop: scale(-12), marginBottom: scale(20), fontSize: scale(12) }} allowFontScaling={false}>
                            {emailMessage.text}
                        </Text>
                    )}

                    {isCodeSent && !isEmailVerified && (
                        <View className="flex-row items-end" style={{ gap: scale(8) }}>
                            <View className="flex-1">
                                <InputField activeColor={activeColor} label="인증번호" value={verificationCode} onChangeText={setVerificationCode} isFocused={focus.code} onFocus={() => handleFocus('code', true)} onBlur={() => handleFocus('code', false)} maxLength={6} placeholder="인증번호 6자리" rightElement={<Text className="font-bold text-red-500" style={{ fontSize: scale(12) }} allowFontScaling={false}>{formatTime(timeLeft)}</Text>} />
                            </View>
                            <TouchableOpacity
                                onPress={handleVerifyCode}
                                className="px-6 rounded-2xl items-center justify-center bg-slate-900"
                                style={{ height: scale(56), marginBottom: scale(20) }}
                            >
                                <Text className="font-extrabold text-white" style={{ fontSize: scale(13) }} allowFontScaling={false}>확인</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <InputField
                        activeColor={activeColor}
                        label="비밀번호 (8~20자)"
                        icon="lock-closed"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        isFocused={focus.password}
                        onFocus={() => handleFocus('password', true)}
                        onBlur={() => handleFocus('password', false)}
                        maxLength={20}
                        placeholder="비밀번호 설정"
                        rightElement={
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? "eye-off" : "eye"} size={scale(20)} color="#94A3B8" />
                            </TouchableOpacity>
                        }
                    />

                    <InputField
                        activeColor={activeColor}
                        label="비밀번호 확인"
                        icon="checkmark-circle"
                        value={passwordConfirm}
                        onChangeText={setPasswordConfirm}
                        secureTextEntry={!showPassword}
                        isFocused={focus.confirm}
                        isError={passwordConfirm.length > 0 && password !== passwordConfirm}
                        bottomText={passwordConfirm.length > 0 ? (password === passwordConfirm ? "비밀번호가 일치합니다. ✨" : "비밀번호가 일치하지 않습니다.") : null}
                        onFocus={() => handleFocus('confirm', true)}
                        onBlur={() => handleFocus('confirm', false)}
                        maxLength={20}
                        placeholder="비밀번호 재입력"
                    />
                </ScrollView>

                <View
                    className="bg-white border-t border-slate-100"
                    style={{ paddingHorizontal: scale(24), paddingTop: scale(12), paddingBottom: insets.bottom > 0 ? insets.bottom : scale(24) }}
                >
                    <TouchableOpacity
                        onPress={handleSignupSubmit}
                        disabled={!isSubmitEnabled || isSubmitting}
                        activeOpacity={0.8}
                        className={`w-full rounded-2xl items-center justify-center ${!isSubmitEnabled || isSubmitting ? 'bg-slate-200' : 'bg-slate-900'}`}
                        style={{ height: scale(56) }}
                    >
                        <Text className={`font-extrabold tracking-widest uppercase ${!isSubmitEnabled || isSubmitting ? 'text-slate-400' : 'text-white'}`} style={{ fontSize: scale(15) }} allowFontScaling={false}>
                            {isSubmitting ? "처리 중..." : "다음"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}