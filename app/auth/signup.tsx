import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../api/authApi';
import { memberApi } from '../../api/memberApi';
import { IS_TEST_MODE } from '../../config';

// ✨ 마법의 스케일링 함수 추가
const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const CHARACTERS = [
    { seq: 1, name: "햄스터", img: require('../../assets/images/characters/Hamster.png'), desc: "주인님 기분이 제일 중요해! 🐹\n논리보다는 감정에 깊이 공감해주는 사랑스러운 친구예요.", keywords: ["#공감요정", "#무한긍정", "#애교만점"] },
    { seq: 2, name: "여우", img: require('../../assets/images/characters/Fox.png'), desc: "징징거릴 시간에 해결책을 찾아. 😏\n감정보다 이성을 중시하는 시니컬한 분석가예요.", keywords: ["#팩트폭력", "#냉철분석", "#효율중시"] },
    { seq: 3, name: "판다", img: require('../../assets/images/characters/Panda.png'), desc: "허허, 실수는 누구나 하는 법. 🍵\n따뜻한 위로와 현실적인 조언을 함께 주는 든든한 멘토예요.", keywords: ["#지혜로움", "#멘토", "#따뜻한위로"] },
];

// ✨ 공통 InputField 스케일링 적용
const InputField = ({ label, icon, isFocused, isError, bottomText, rightElement, disabled, activeColor, ...props }: any) => (
    <View style={{ marginBottom: scale(20) }}>
        <Text className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1" style={{ fontSize: scale(12), marginBottom: scale(8) }} allowFontScaling={false}>{label}</Text>
        <View className={`flex-row items-center bg-slate-50 dark:bg-slate-900 px-4 rounded-2xl border-2 transition-colors ${isFocused ? "border-slate-900 dark:border-white" : (isError ? "border-red-500" : "border-transparent")} ${disabled ? "opacity-60" : ""}`} style={{ height: scale(56) }}>
            {icon && <Ionicons name={icon} size={scale(20)} color={isFocused ? activeColor : (isError ? "#EF4444" : "#94A3B8")} />}
            <TextInput
                placeholderTextColor="#94A3B8"
                editable={!disabled}
                className="flex-1 ml-3 font-bold text-slate-900 dark:text-white"
                style={{ fontSize: scale(15), paddingVertical: 0 }}
                allowFontScaling={false}
                {...props}
            />
            {rightElement}
        </View>
        {bottomText && <Text className={`mt-2 ml-1 font-bold ${isError ? "text-red-500" : "text-slate-900 dark:text-white"}`} style={{ fontSize: scale(12) }} allowFontScaling={false}>{bottomText}</Text>}
    </View>
);

const AnimatedView = ({ children, className }: any) => (
    <View className={`w-full animate-[fade-in_0.3s] ${className || ''}`}>{children}</View>
);

export default function SignupScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const activeColor = colorScheme === 'dark' ? '#FFFFFF' : '#0F172A';

    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [timeLeft, setTimeLeft] = useState(180);
    const [emailMessage, setEmailMessage] = useState({ text: "", isError: false });

    const [userNickname, setUserNickname] = useState("");
    const [characterIndex, setCharacterIndex] = useState(0);
    const [characterNickname, setCharacterNickname] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [focus, setFocus] = useState({ email: false, code: false, password: false, confirm: false, nickname: false, charNickname: false });
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
            await authService.sendSignupEmail({ email });
            setIsCodeSent(true);
            setTimeLeft(180);
            setEmailMessage({ text: "이메일로 인증번호가 전송되었습니다.", isError: false });
        } catch (error: any) {
            setEmailMessage({ text: error.response?.data?.message || "전송에 실패했습니다.", isError: true });
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode.trim()) return setEmailMessage({ text: "인증번호를 입력해주세요.", isError: true });
        try {
            const response = await authService.verifySignupEmail({ email, code: verificationCode });
            if (response.result === true) {
                setIsEmailVerified(true);
                setEmailMessage({ text: "이메일 인증이 완료되었습니다! ✅", isError: false });
            } else {
                setEmailMessage({ text: "인증번호가 일치하지 않습니다.", isError: true });
            }
        } catch (error: any) {
            setEmailMessage({ text: error.response?.data?.message || "잘못된 인증번호입니다.", isError: true });
        }
    };

    const nextStep = () => {
        if (step === 1) {
            if (password.length < 8 || password.length > 20) return Alert.alert("알림", "비밀번호는 8~20자로 설정해주세요.");
            if (password !== passwordConfirm) return Alert.alert("알림", "비밀번호가 일치하지 않습니다.");
            setStep(2);
        } else if (step === 2) {
            if (!userNickname.trim()) return Alert.alert("알림", "닉네임을 입력해주세요.");
            setStep(3);
        }
    };

    const prevStep = () => {
        if (step === 1) router.back();
        else setStep(step - 1);
    };

    const handleFinalSubmit = async () => {
        if (!characterNickname.trim()) return Alert.alert("알림", "캐릭터 이름을 지어주세요!");
        setIsSubmitting(true);
        try {
            if (IS_TEST_MODE) {
                await new Promise(r => setTimeout(r, 1000));
                Alert.alert("가입 완료 🎉", "버디와 함께할 준비가 끝났어요! 로그인해주세요.", [{ text: "확인", onPress: () => router.replace("/auth/login") }]);
                return;
            }
            await memberApi.signup({
                email, password, nickname: userNickname,
                characterSeq: CHARACTERS[characterIndex].seq, characterNickname
            });
            Alert.alert("가입 완료 🎉", "회원가입이 완료되었습니다. 로그인해주세요.", [{ text: "확인", onPress: () => router.replace("/auth/login") }]);
        } catch (error: any) {
            Alert.alert("오류", error.response?.data?.message || "오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep1 = () => (
        <AnimatedView>
            <View style={{ marginBottom: scale(40) }}>
                <Text className="font-extrabold text-slate-900 dark:text-white tracking-tight mb-2" style={{ fontSize: scale(30) }} allowFontScaling={false}>계정 생성</Text>
                <Text className="font-medium text-slate-500 dark:text-slate-400" style={{ fontSize: scale(14) }} allowFontScaling={false}>버디와 함께할 계정을 만들어주세요.</Text>
            </View>

            <View className="flex-row items-end" style={{ gap: scale(8) }}>
                <View className="flex-1">
                    <InputField activeColor={activeColor} label="Email" icon="mail" value={email} onChangeText={setEmail} disabled={isEmailVerified} isFocused={focus.email} onFocus={() => handleFocus('email', true)} onBlur={() => handleFocus('email', false)} keyboardType="email-address" autoCapitalize="none" placeholder="이메일 입력" />
                </View>
                <TouchableOpacity onPress={handleSendCode} disabled={isEmailVerified || !email} className={`px-5 rounded-2xl items-center justify-center border-2 ${isEmailVerified ? 'bg-slate-100 border-slate-100 dark:bg-slate-800 dark:border-slate-800' : 'bg-transparent border-slate-900 dark:border-white'}`} style={{ height: scale(56), marginBottom: scale(20) }}>
                    <Text className={`font-extrabold ${isEmailVerified ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`} style={{ fontSize: scale(13) }} allowFontScaling={false}>{isCodeSent ? "재전송" : "인증받기"}</Text>
                </TouchableOpacity>
            </View>
            {emailMessage.text && <Text className={`font-bold ml-1 ${emailMessage.isError ? "text-red-500" : "text-slate-900 dark:text-white"}`} style={{ marginTop: scale(-12), marginBottom: scale(20), fontSize: scale(12) }} allowFontScaling={false}>{emailMessage.text}</Text>}

            {isCodeSent && !isEmailVerified && (
                <View className="flex-row items-end" style={{ gap: scale(8) }}>
                    <View className="flex-1">
                        <InputField activeColor={activeColor} label="Verification Code" value={verificationCode} onChangeText={setVerificationCode} isFocused={focus.code} onFocus={() => handleFocus('code', true)} onBlur={() => handleFocus('code', false)} maxLength={6} placeholder="인증번호 6자리" rightElement={<Text className="font-bold text-red-500" style={{ fontSize: scale(12) }} allowFontScaling={false}>{formatTime(timeLeft)}</Text>} />
                    </View>
                    <TouchableOpacity onPress={handleVerifyCode} className="px-6 rounded-2xl items-center justify-center bg-slate-900 dark:bg-white" style={{ height: scale(56), marginBottom: scale(20) }}>
                        <Text className="font-extrabold text-white dark:text-slate-900" style={{ fontSize: scale(13) }} allowFontScaling={false}>확인</Text>
                    </TouchableOpacity>
                </View>
            )}

            <InputField activeColor={activeColor} label="Password (8~20자)" icon="lock-closed" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} isFocused={focus.password} onFocus={() => handleFocus('password', true)} onBlur={() => handleFocus('password', false)} maxLength={20} placeholder="비밀번호 설정" rightElement={<TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Ionicons name={showPassword ? "eye-off" : "eye"} size={scale(20)} color="#94A3B8" /></TouchableOpacity>} />
            <InputField activeColor={activeColor} label="Confirm Password" icon="checkmark-circle" value={passwordConfirm} onChangeText={setPasswordConfirm} secureTextEntry={!showPassword} isFocused={focus.confirm} isError={passwordConfirm.length > 0 && password !== passwordConfirm} bottomText={passwordConfirm && password !== passwordConfirm ? "비밀번호가 일치하지 않습니다." : null} onFocus={() => handleFocus('confirm', true)} onBlur={() => handleFocus('confirm', false)} maxLength={20} placeholder="비밀번호 재입력" />

            <TouchableOpacity onPress={nextStep} activeOpacity={0.8} className="w-full rounded-2xl bg-slate-900 dark:bg-white items-center justify-center shadow-sm" style={{ height: scale(56), marginTop: scale(16) }}>
                <Text className="text-white dark:text-slate-900 font-extrabold tracking-widest uppercase" style={{ fontSize: scale(15) }} allowFontScaling={false}>Next</Text>
            </TouchableOpacity>
        </AnimatedView>
    );

    const renderStep2 = () => (
        <AnimatedView>
            <View style={{ marginBottom: scale(40) }}>
                <Text className="font-extrabold text-slate-900 dark:text-white tracking-tight mb-2" style={{ fontSize: scale(30) }} allowFontScaling={false}>닉네임 설정</Text>
                <Text className="font-medium text-slate-500 dark:text-slate-400" style={{ fontSize: scale(14) }} allowFontScaling={false}>버디가 부를 당신의 이름을 알려주세요.</Text>
            </View>
            <InputField activeColor={activeColor} label="Your Nickname" icon="person" value={userNickname} onChangeText={setUserNickname} isFocused={focus.nickname} onFocus={() => handleFocus('nickname', true)} onBlur={() => handleFocus('nickname', false)} placeholder="사용할 닉네임 입력" />

            <TouchableOpacity onPress={nextStep} activeOpacity={0.8} className="w-full rounded-2xl bg-slate-900 dark:bg-white items-center justify-center shadow-sm" style={{ height: scale(56), marginTop: scale(16) }}>
                <Text className="text-white dark:text-slate-900 font-extrabold tracking-widest uppercase" style={{ fontSize: scale(15) }} allowFontScaling={false}>Next</Text>
            </TouchableOpacity>
        </AnimatedView>
    );

    const renderStep3 = () => (
        <AnimatedView className="items-center">
            <View className="w-full" style={{ marginBottom: scale(32) }}>
                <Text className="font-extrabold text-slate-900 dark:text-white tracking-tight mb-2" style={{ fontSize: scale(30) }} allowFontScaling={false}>캐릭터 선택</Text>
                <Text className="font-medium text-slate-500 dark:text-slate-400" style={{ fontSize: scale(14) }} allowFontScaling={false}>나만의 AI 친구를 골라보세요.</Text>
            </View>

            <View className="flex-row items-center justify-between w-full" style={{ marginBottom: scale(32) }}>
                <TouchableOpacity onPress={() => setCharacterIndex((prev) => (prev - 1 + CHARACTERS.length) % CHARACTERS.length)} className="rounded-full bg-slate-50 dark:bg-slate-800 items-center justify-center active:bg-slate-100" style={{ width: scale(48), height: scale(48) }}>
                    <Ionicons name="chevron-back" size={scale(24)} color="#64748b" />
                </TouchableOpacity>

                <View className="rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center border-[4px] border-slate-900 dark:border-white shadow-sm" style={{ width: scale(192), height: scale(192) }}>
                    <Image source={CHARACTERS[characterIndex].img} style={{ width: scale(140), height: scale(140) }} contentFit="contain" />
                </View>

                <TouchableOpacity onPress={() => setCharacterIndex((prev) => (prev + 1) % CHARACTERS.length)} className="rounded-full bg-slate-50 dark:bg-slate-800 items-center justify-center active:bg-slate-100" style={{ width: scale(48), height: scale(48) }}>
                    <Ionicons name="chevron-forward" size={scale(24)} color="#64748b" />
                </TouchableOpacity>
            </View>

            <View className="items-center w-full px-2" style={{ marginBottom: scale(40) }}>
                <Text className="font-extrabold text-slate-900 dark:text-white mb-4" style={{ fontSize: scale(24) }} allowFontScaling={false}>{CHARACTERS[characterIndex].name}</Text>
                <View className="flex-row flex-wrap justify-center mb-4" style={{ gap: scale(8) }}>
                    {CHARACTERS[characterIndex].keywords.map((kw, i) => (
                        <View key={i} className="rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" style={{ paddingHorizontal: scale(12), paddingVertical: scale(6) }}>
                            <Text className="font-extrabold text-slate-600 dark:text-slate-300" style={{ fontSize: scale(11) }} allowFontScaling={false}>{kw}</Text>
                        </View>
                    ))}
                </View>
                <Text className="text-slate-500 dark:text-slate-400 text-center font-medium" style={{ fontSize: scale(15), lineHeight: scale(26) }} allowFontScaling={false}>{CHARACTERS[characterIndex].desc}</Text>
            </View>

            <View className="w-full">
                <InputField activeColor={activeColor} label="Buddy's Name" icon="star" value={characterNickname} onChangeText={setCharacterNickname} isFocused={focus.charNickname} onFocus={() => handleFocus('charNickname', true)} onBlur={() => handleFocus('charNickname', false)} placeholder="버디의 애칭을 지어주세요" />
            </View>

            <TouchableOpacity onPress={handleFinalSubmit} disabled={isSubmitting} activeOpacity={0.8} className={`w-full rounded-2xl items-center justify-center shadow-sm mt-4 ${isSubmitting ? 'bg-slate-300 dark:bg-slate-700' : 'bg-slate-900 dark:bg-white'}`} style={{ height: scale(56) }}>
                <Text className={`font-extrabold tracking-widest ${isSubmitting ? "text-slate-500 dark:text-slate-400" : "text-white dark:text-slate-900"}`} style={{ fontSize: scale(15) }} allowFontScaling={false}>
                    {isSubmitting ? "처리 중..." : "가입 완료"}
                </Text>
            </TouchableOpacity>
        </AnimatedView>
    );

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">

                <View className="px-6 pb-2" style={{ paddingTop: scale(8) }}>
                    <TouchableOpacity onPress={prevStep} className="justify-center" style={{ width: scale(40), height: scale(40), marginBottom: scale(16) }}>
                        <Ionicons name="arrow-back" size={scale(26)} color="#94A3B8" />
                    </TouchableOpacity>
                    <View className="w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" style={{ height: scale(8) }}>
                        <View className="h-full bg-slate-900 dark:bg-white transition-all duration-300 rounded-full" style={{ width: `${(step / 3) * 100}%` }} />
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: scale(32), paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </ScrollView>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}