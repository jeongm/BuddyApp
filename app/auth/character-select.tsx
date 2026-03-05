import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
// ✨ 1. 여기서 Text를 지웠습니다!
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// ✨ 2. 대신 우리가 만든 마법의 AppText를 불러옵니다!
import { memberApi } from '../../api/memberApi';
import { AppText as Text } from '../../components/AppText';
import { IS_TEST_MODE } from '../../config';
import { useAuthStore } from '../../store/useAuthStore';

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const CHARACTERS = [
    { seq: 1, name: "햄찌", img: require('../../assets/images/characters/Hamster.png'), desc: "주인님 기분이 제일 중요해! 🐹\n논리보다는 감정에 깊이 공감해주는 사랑스러운 친구예요.", keywords: ["#공감요정", "#무한긍정", "#애교만점"] },
    { seq: 2, name: "폭스", img: require('../../assets/images/characters/Fox.png'), desc: "징징거릴 시간에 해결책을 찾아. 😏\n감정보다 이성을 중시하는 시니컬한 분석가예요.", keywords: ["#팩트폭력", "#냉철분석", "#효율중시"] },
    { seq: 3, name: "곰곰이", img: require('../../assets/images/characters/Bear.png'), desc: "허허, 실수는 누구나 하는 법. 🍵\n따뜻한 위로와 현실적인 조언을 함께 주는 든든한 멘토예요.", keywords: ["#지혜로움", "#멘토", "#따뜻한위로"] },
];

const InputField = ({ label, icon, isFocused, isError, bottomText, rightElement, disabled, activeColor, ...props }: any) => (
    <View style={{ marginBottom: scale(20) }}>
        <Text className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1" style={{ fontSize: scale(12), marginBottom: scale(8) }} allowFontScaling={false}>{label}</Text>
        <View className={`flex-row items-center bg-slate-50 dark:bg-slate-900 px-4 rounded-2xl border-2 transition-colors ${isFocused ? "border-slate-900 dark:border-white" : (isError ? "border-red-500" : "border-transparent")} ${disabled ? "opacity-60" : ""}`} style={{ height: scale(56) }}>
            {icon && <Ionicons name={icon} size={scale(20)} color={isFocused ? activeColor : (isError ? "#EF4444" : "#94A3B8")} />}
            <TextInput
                placeholderTextColor="#94A3B8"
                editable={!disabled}
                className="flex-1 ml-3 font-bold text-slate-900 dark:text-white"
                // ✨ 3. 입력창(TextInput)에도 프리텐다드 강제 적용!
                style={{ fontSize: scale(15), paddingVertical: 0, fontFamily: 'Pretendard-Bold' }}
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

export default function CharacterSelectScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const activeColor = colorScheme === 'dark' ? '#FFFFFF' : '#0F172A';
    const { updateUserInfo } = useAuthStore();

    const [step, setStep] = useState(1);
    const [userNickname, setUserNickname] = useState("");
    const [characterIndex, setCharacterIndex] = useState(0);
    const [characterNickname, setCharacterNickname] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [focus, setFocus] = useState({ nickname: false, charNickname: false });
    const handleFocus = (field: keyof typeof focus, isFocused: boolean) => setFocus(prev => ({ ...prev, [field]: isFocused }));

    const nextStep = () => {
        if (!userNickname.trim()) return Alert.alert("알림", "닉네임을 입력해주세요.");
        setStep(2);
    };

    const prevStep = () => {
        if (step === 1) {
            Alert.alert("알림", "버디 설정을 완료해야 앱을 사용할 수 있어요!");
        } else {
            setStep(step - 1);
        }
    };

    const handleFinalSubmit = async () => {
        if (!characterNickname.trim()) return Alert.alert("알림", "캐릭터 이름을 지어주세요!");
        setIsSubmitting(true);
        try {
            if (IS_TEST_MODE) {
                await new Promise(r => setTimeout(r, 1000));
                updateUserInfo({ nickname: userNickname, characterSeq: CHARACTERS[characterIndex].seq, characterNickname });
                router.replace("/(tabs)/home");
                return;
            }

            await memberApi.updateNickname(userNickname);
            await memberApi.updateCharacter({ characterSeq: CHARACTERS[characterIndex].seq });
            await memberApi.updateCharacterName({ characterName: characterNickname });

            updateUserInfo({ nickname: userNickname, characterSeq: CHARACTERS[characterIndex].seq, characterNickname });
            router.replace("/(tabs)/home");

        } catch (error: any) {
            Alert.alert("오류", "설정 저장 중 문제가 발생했습니다. 다시 시도해주세요.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep1 = () => (
        <AnimatedView>
            <View style={{ marginBottom: scale(40) }}>
                <Text className="font-extrabold text-slate-900 dark:text-white tracking-tight mb-2" style={{ fontSize: scale(30) }} allowFontScaling={false}>환영합니다! 🎉</Text>
                <Text className="font-medium text-slate-500 dark:text-slate-400" style={{ fontSize: scale(14) }} allowFontScaling={false}>버디가 부를 당신의 이름을 알려주세요.</Text>
            </View>
            <InputField activeColor={activeColor} label="Your Nickname" icon="person" value={userNickname} onChangeText={setUserNickname} isFocused={focus.nickname} onFocus={() => handleFocus('nickname', true)} onBlur={() => handleFocus('nickname', false)} placeholder="사용할 닉네임 입력" />

            <TouchableOpacity onPress={nextStep} activeOpacity={0.8} className="w-full rounded-2xl bg-slate-900 dark:bg-white items-center justify-center shadow-sm" style={{ height: scale(56), marginTop: scale(16) }}>
                <Text className="text-white dark:text-slate-900 font-extrabold tracking-widest uppercase" style={{ fontSize: scale(15) }} allowFontScaling={false}>Next</Text>
            </TouchableOpacity>
        </AnimatedView>
    );

    const renderStep2 = () => (
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
                    {isSubmitting ? "처리 중..." : "시작하기"}
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
                        <View className="h-full bg-slate-900 dark:bg-white transition-all duration-300 rounded-full" style={{ width: `${(step / 2) * 100}%` }} />
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: scale(32), paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                </ScrollView>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}