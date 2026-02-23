import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../api/authApi';
import { memberApi } from '../../api/memberApi';
import { IS_TEST_MODE } from '../../config';

const CHARACTERS = [
    { seq: 1, name: "햄스터", img: require('../../assets/images/characters/Hamster.png'), desc: "주인님 기분이 제일 중요해! 🐹\n논리보다는 감정에 깊이 공감해주는 사랑스러운 친구예요.", keywords: ["#공감요정", "#무한긍정", "#애교만점"] },
    { seq: 2, name: "여우", img: require('../../assets/images/characters/Fox.png'), desc: "징징거릴 시간에 해결책을 찾아. 😏\n감정보다 이성을 중시하는 시니컬한 분석가예요.", keywords: ["#팩트폭력", "#냉철분석", "#효율중시"] },
    { seq: 3, name: "판다", img: require('../../assets/images/characters/Panda.png'), desc: "허허, 실수는 누구나 하는 법. 🍵\n따뜻한 위로와 현실적인 조언을 함께 주는 든든한 멘토예요.", keywords: ["#지혜로움", "#멘토", "#따뜻한위로"] },
];

const InputField = ({ label, icon, isFocused, isError, bottomText, rightElement, disabled, activeColor, ...props }: any) => (
    <View className="mb-5">
        <Text className="text-[12px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2">{label}</Text>
        {/* ✨ 포커스 시 테두리를 블랙/화이트로 강하게 잡아줍니다 */}
        <View className={`flex-row items-center bg-slate-50 dark:bg-slate-900 h-14 px-4 rounded-2xl border-2 transition-colors ${isFocused ? "border-slate-900 dark:border-white" : (isError ? "border-red-500" : "border-transparent")} ${disabled ? "opacity-60" : ""}`}>
            {icon && <Ionicons name={icon} size={20} color={isFocused ? activeColor : (isError ? "#EF4444" : "#94A3B8")} />}
            <TextInput
                placeholderTextColor="#94A3B8"
                editable={!disabled}
                className="flex-1 ml-3 text-[15px] font-bold text-slate-900 dark:text-white"
                {...props}
            />
            {rightElement}
        </View>
        {/* ✨ 성공/기본 메시지도 블랙 모노톤으로 통일 */}
        {bottomText && <Text className={`text-xs mt-2 ml-1 font-bold ${isError ? "text-red-500" : "text-slate-900 dark:text-white"}`}>{bottomText}</Text>}
    </View>
);

const AnimatedView = ({ children, className }: any) => (
    <View className={`w-full animate-[fade-in_0.3s] ${className || ''}`}>{children}</View>
);

export default function SignupScreen() {
    const router = useRouter();

    // ✨ 시스템 테마 감지하여 블랙/화이트 적용
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
            <View className="mb-10">
                <Text className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">계정 생성</Text>
                <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">버디와 함께할 계정을 만들어주세요.</Text>
            </View>

            <View className="flex-row gap-2 items-end">
                <View className="flex-1">
                    <InputField activeColor={activeColor} label="Email" icon="mail" value={email} onChangeText={setEmail} disabled={isEmailVerified} isFocused={focus.email} onFocus={() => handleFocus('email', true)} onBlur={() => handleFocus('email', false)} keyboardType="email-address" autoCapitalize="none" placeholder="이메일 입력" />
                </View>
                {/* ✨ 인증받기 버튼: 서브 액션이므로 아웃라인(테두리) 스타일로 모노톤 적용 */}
                <TouchableOpacity onPress={handleSendCode} disabled={isEmailVerified || !email} className={`h-14 px-5 rounded-2xl items-center justify-center mb-5 border-2 ${isEmailVerified ? 'bg-slate-100 border-slate-100 dark:bg-slate-800 dark:border-slate-800' : 'bg-transparent border-slate-900 dark:border-white'}`}>
                    <Text className={`text-[13px] font-extrabold ${isEmailVerified ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>{isCodeSent ? "재전송" : "인증받기"}</Text>
                </TouchableOpacity>
            </View>
            {emailMessage.text && <Text className={`-mt-3 mb-5 ml-1 text-xs font-bold ${emailMessage.isError ? "text-red-500" : "text-slate-900 dark:text-white"}`}>{emailMessage.text}</Text>}

            {isCodeSent && !isEmailVerified && (
                <View className="flex-row gap-2 items-end">
                    <View className="flex-1">
                        <InputField activeColor={activeColor} label="Verification Code" value={verificationCode} onChangeText={setVerificationCode} isFocused={focus.code} onFocus={() => handleFocus('code', true)} onBlur={() => handleFocus('code', false)} maxLength={6} placeholder="인증번호 6자리" rightElement={<Text className="text-xs font-bold text-red-500">{formatTime(timeLeft)}</Text>} />
                    </View>
                    {/* ✨ 확인 버튼: 모노톤 */}
                    <TouchableOpacity onPress={handleVerifyCode} className="h-14 px-6 rounded-2xl items-center justify-center mb-5 bg-slate-900 dark:bg-white">
                        <Text className="text-[13px] font-extrabold text-white dark:text-slate-900">확인</Text>
                    </TouchableOpacity>
                </View>
            )}

            <InputField activeColor={activeColor} label="Password (8~20자)" icon="lock-closed" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} isFocused={focus.password} onFocus={() => handleFocus('password', true)} onBlur={() => handleFocus('password', false)} maxLength={20} placeholder="비밀번호 설정" rightElement={<TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#94A3B8" /></TouchableOpacity>} />
            <InputField activeColor={activeColor} label="Confirm Password" icon="checkmark-circle" value={passwordConfirm} onChangeText={setPasswordConfirm} secureTextEntry={!showPassword} isFocused={focus.confirm} isError={passwordConfirm.length > 0 && password !== passwordConfirm} bottomText={passwordConfirm && password !== passwordConfirm ? "비밀번호가 일치하지 않습니다." : null} onFocus={() => handleFocus('confirm', true)} onBlur={() => handleFocus('confirm', false)} maxLength={20} placeholder="비밀번호 재입력" />

            {/* ✨ 넥스트 버튼: 퓨어 모노톤 */}
            <TouchableOpacity onPress={nextStep} activeOpacity={0.8} className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white items-center justify-center shadow-sm mt-4">
                <Text className="text-white dark:text-slate-900 font-extrabold text-[15px] tracking-widest uppercase">Next</Text>
            </TouchableOpacity>
        </AnimatedView>
    );

    const renderStep2 = () => (
        <AnimatedView>
            <View className="mb-10">
                <Text className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">닉네임 설정</Text>
                <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">버디가 부를 당신의 이름을 알려주세요.</Text>
            </View>
            <InputField activeColor={activeColor} label="Your Nickname" icon="person" value={userNickname} onChangeText={setUserNickname} isFocused={focus.nickname} onFocus={() => handleFocus('nickname', true)} onBlur={() => handleFocus('nickname', false)} placeholder="사용할 닉네임 입력" />

            <TouchableOpacity onPress={nextStep} activeOpacity={0.8} className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white items-center justify-center shadow-sm mt-4">
                <Text className="text-white dark:text-slate-900 font-extrabold text-[15px] tracking-widest uppercase">Next</Text>
            </TouchableOpacity>
        </AnimatedView>
    );

    const renderStep3 = () => (
        <AnimatedView className="items-center">
            <View className="mb-8 w-full">
                <Text className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">캐릭터 선택</Text>
                <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">나만의 AI 친구를 골라보세요.</Text>
            </View>

            <View className="flex-row items-center justify-between w-full mb-8">
                <TouchableOpacity onPress={() => setCharacterIndex((prev) => (prev - 1 + CHARACTERS.length) % CHARACTERS.length)} className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 items-center justify-center active:bg-slate-100">
                    <Ionicons name="chevron-back" size={24} color="#64748b" />
                </TouchableOpacity>

                {/* ✨ 캐릭터 선택 링: 모노톤 */}
                <View className="w-48 h-48 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center border-[4px] border-slate-900 dark:border-white shadow-sm">
                    <Image source={CHARACTERS[characterIndex].img} style={{ width: 140, height: 140 }} contentFit="contain" />
                </View>

                <TouchableOpacity onPress={() => setCharacterIndex((prev) => (prev + 1) % CHARACTERS.length)} className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 items-center justify-center active:bg-slate-100">
                    <Ionicons name="chevron-forward" size={24} color="#64748b" />
                </TouchableOpacity>
            </View>

            <View className="items-center mb-10 w-full px-2">
                <Text className="text-2xl font-extrabold text-slate-900 dark:text-white mb-4">{CHARACTERS[characterIndex].name}</Text>
                <View className="flex-row flex-wrap justify-center gap-2 mb-4">
                    {CHARACTERS[characterIndex].keywords.map((kw, i) => (
                        <View key={i} className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <Text className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300">{kw}</Text>
                        </View>
                    ))}
                </View>
                <Text className="text-[15px] text-slate-500 dark:text-slate-400 text-center leading-[26px] font-medium">{CHARACTERS[characterIndex].desc}</Text>
            </View>

            <View className="w-full">
                <InputField activeColor={activeColor} label="Buddy's Name" icon="star" value={characterNickname} onChangeText={setCharacterNickname} isFocused={focus.charNickname} onFocus={() => handleFocus('charNickname', true)} onBlur={() => handleFocus('charNickname', false)} placeholder="버디의 애칭을 지어주세요" />
            </View>

            <TouchableOpacity onPress={handleFinalSubmit} disabled={isSubmitting} activeOpacity={0.8} className={`w-full h-14 rounded-2xl items-center justify-center shadow-sm mt-4 ${isSubmitting ? 'bg-slate-300 dark:bg-slate-700' : 'bg-slate-900 dark:bg-white'}`}>
                <Text className={`font-extrabold text-[15px] tracking-widest ${isSubmitting ? "text-slate-500 dark:text-slate-400" : "text-white dark:text-slate-900"}`}>
                    {isSubmitting ? "처리 중..." : "가입 완료"}
                </Text>
            </TouchableOpacity>
        </AnimatedView>
    );

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">

                <View className="px-6 pt-2 pb-2">
                    <TouchableOpacity onPress={prevStep} className="w-10 h-10 justify-center mb-4">
                        <Ionicons name="arrow-back" size={26} color="#94A3B8" />
                    </TouchableOpacity>
                    {/* ✨ 상단 프로그레스 바도 모노톤(블랙/화이트)으로 통일! */}
                    <View className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <View className="h-full bg-slate-900 dark:bg-white transition-all duration-300 rounded-full" style={{ width: `${(step / 3) * 100}%` }} />
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </ScrollView>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}