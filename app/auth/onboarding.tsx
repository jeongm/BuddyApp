import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { memberApi } from '../../api/memberApi';
import { notificationApi } from '../../api/notificationApi';
import { AppText as Text } from '../../components/AppText';
import { IS_TEST_MODE } from '../../config';
import { useAuthStore } from '../../store/useAuthStore';

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const CHARACTERS = [
    { seq: 1, name: "햄찌", img: require('../../assets/images/characters/Hamster.webp'), desc: "주인님 기분이 제일 중요해! 🐹\n논리보다는 감정에 깊이 공감해주는 사랑스러운 친구예요.", keywords: ["#공감요정", "#무한긍정", "#애교만점"] },
    { seq: 2, name: "폭스", img: require('../../assets/images/characters/Fox.webp'), desc: "징징거릴 시간에 해결책을 찾아. 😏\n감정보다 이성을 중시하는 시니컬한 분석가예요.", keywords: ["#팩트폭력", "#냉철분석", "#효율중시"] },
    { seq: 3, name: "곰곰이", img: require('../../assets/images/characters/Bear.webp'), desc: "허허, 실수는 누구나 하는 법. 🍵\n따뜻한 위로와 현실적인 조언을 함께 주는 든든한 멘토예요.", keywords: ["#지혜로움", "#멘토", "#따뜻한위로"] },
];

// ✅ [수정] dark: 클래스 제거, activeColor prop 제거 (라이트 고정이라 불필요)
const InputField = ({ label, isFocused, onSubmitEditing, returnKeyType, ...props }: any) => (
    <View style={{ marginBottom: scale(20) }}>
        <Text className="font-extrabold text-slate-500 uppercase tracking-widest ml-1" style={{ fontSize: scale(12), marginBottom: scale(8) }} allowFontScaling={false}>{label}</Text>
        <View className={`flex-row items-center bg-slate-50 px-4 rounded-2xl border-2 ${isFocused ? "border-slate-900" : "border-transparent"}`} style={{ height: scale(56) }}>
            <TextInput
                placeholderTextColor="#94A3B8"
                className="flex-1 font-bold text-slate-900"
                style={{ fontSize: scale(15), paddingVertical: 0, fontFamily: 'Pretendard-Regular' }}
                allowFontScaling={false}
                onSubmitEditing={onSubmitEditing}
                returnKeyType={returnKeyType || "done"}
                blurOnSubmit={false}
                {...props}
            />
        </View>
    </View>
);

export default function OnboardingScreen() {
    const router = useRouter();
    const { setColorScheme } = useNativeWindColorScheme();
    const insets = useSafeAreaInsets();
    const { user, setUser, setTokens } = useAuthStore();

    const params = useLocalSearchParams();
    const marketingAgreed = params.marketingAgreed === 'true';

    const [step, setStep] = useState(1);
    const [userNickname, setUserNickname] = useState("");
    const [characterIndex, setCharacterIndex] = useState(0);
    const [characterNickname, setCharacterNickname] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focus, setFocus] = useState({ nickname: false, charNickname: false });
    const handleFocus = (field: keyof typeof focus, isFocused: boolean) => setFocus(prev => ({ ...prev, [field]: isFocused }));

    // ✅ [추가] 라이트 모드 강제
    useFocusEffect(useCallback(() => {
        setColorScheme('light');
        return () => setColorScheme('system');
    }, []));

    const nextStep = () => {
        if (!userNickname.trim()) return Alert.alert("알림", "닉네임을 입력해주세요.");
        setStep(2);
    };

    const prevStep = () => {
        if (step === 1) {
            Alert.alert(
                "가입 취소",
                "처음 화면으로 돌아가시겠습니까?",
                [
                    { text: "취소", style: "cancel" },
                    {
                        text: "확인",
                        style: "destructive",
                        onPress: () => {
                            setTokens(null as any, null as any);
                            setUser(null as any);
                            router.replace('/');
                        }
                    }
                ]
            );
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
                if (user) setUser({ ...user, nickname: userNickname, characterId: CHARACTERS[characterIndex].seq, characterNickname });
                router.replace({ pathname: "/(tabs)/home", params: { isNewUser: 'true' } });
                return;
            }

            await memberApi.onboarding({
                nickname: userNickname,
                characterId: CHARACTERS[characterIndex].seq,
                characterName: characterNickname,
                isNightAgreed: false
            });

            if (marketingAgreed) {
                await notificationApi.updateMarketing(true);
            }

            if (user) setUser({ ...user, nickname: userNickname, characterId: CHARACTERS[characterIndex].seq, characterNickname });
            router.replace({ pathname: "/(tabs)/home", params: { isNewUser: 'true' } });

        } catch (error: any) {
            console.error("🚨 온보딩 에러:", error?.message);
            console.error("🚨 온보딩 응답:", error?.response?.data);
            Alert.alert("오류", "설정 저장 중 문제가 발생했습니다. 다시 시도해주세요.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep1 = () => (
        <View>
            <View style={{ marginBottom: scale(40) }}>
                <Text className="font-extrabold text-slate-900 tracking-tight mb-2" style={{ fontSize: scale(30) }} allowFontScaling={false}>반가워요! 🎉</Text>
                <Text className="font-medium text-slate-500" style={{ fontSize: scale(14) }} allowFontScaling={false}>버디가 부를 당신의 이름을 알려주세요.</Text>
            </View>
            <InputField
                label="닉네임"
                value={userNickname}
                onChangeText={setUserNickname}
                isFocused={focus.nickname}
                onFocus={() => handleFocus('nickname', true)}
                onBlur={() => handleFocus('nickname', false)}
                placeholder="사용할 닉네임 입력"
                returnKeyType="next"
                onSubmitEditing={nextStep}
            />
        </View>
    );

    const renderStep2 = () => (
        <View className="items-center">
            <View className="w-full" style={{ marginBottom: scale(28) }}>
                <Text className="font-extrabold text-slate-900 tracking-tight mb-2" style={{ fontSize: scale(30) }} allowFontScaling={false}>캐릭터 선택</Text>
                <Text className="font-medium text-slate-500" style={{ fontSize: scale(14) }} allowFontScaling={false}>나만의 AI 친구를 골라보세요.</Text>
            </View>

            <View className="flex-row items-center justify-between w-full" style={{ marginBottom: scale(20) }}>
                <TouchableOpacity
                    onPress={() => setCharacterIndex((prev) => (prev - 1 + CHARACTERS.length) % CHARACTERS.length)}
                    className="bg-slate-100 items-center justify-center rounded-full"
                    style={{ width: scale(44), height: scale(44) }}
                >
                    <Ionicons name="chevron-back" size={scale(20)} color="#64748b" />
                </TouchableOpacity>

                <View className="bg-slate-50 items-center justify-center rounded-full" style={{ width: scale(160), height: scale(160) }}>
                    <Image source={CHARACTERS[characterIndex].img} style={{ width: scale(115), height: scale(115) }} contentFit="contain" />
                </View>

                <TouchableOpacity
                    onPress={() => setCharacterIndex((prev) => (prev + 1) % CHARACTERS.length)}
                    className="bg-slate-100 items-center justify-center rounded-full"
                    style={{ width: scale(44), height: scale(44) }}
                >
                    <Ionicons name="chevron-forward" size={scale(20)} color="#64748b" />
                </TouchableOpacity>
            </View>

            <View className="w-full bg-slate-50 rounded-[2rem] items-center" style={{ padding: scale(20), marginBottom: scale(20) }}>
                <Text className="font-black text-slate-900 mb-3" style={{ fontSize: scale(20) }} allowFontScaling={false}>
                    {CHARACTERS[characterIndex].name}
                </Text>
                <View className="flex-row flex-wrap justify-center mb-4" style={{ gap: scale(6) }}>
                    {CHARACTERS[characterIndex].keywords.map((kw, i) => (
                        <View key={i} className="rounded-full bg-white px-3 py-1 border border-slate-200/80">
                            <Text className="font-bold text-slate-500" style={{ fontSize: scale(11) }} allowFontScaling={false}>{kw}</Text>
                        </View>
                    ))}
                </View>
                {(() => {
                    const [catchphrase, detail] = CHARACTERS[characterIndex].desc.split('\n');
                    return (
                        <View className="items-center w-full px-1">
                            <Text className="font-extrabold text-slate-800 text-center mb-2" style={{ fontSize: scale(14), lineHeight: scale(21) }} allowFontScaling={false}>"{catchphrase}"</Text>
                            <Text className="text-slate-500 text-center font-medium" style={{ fontSize: scale(13), lineHeight: scale(19) }} allowFontScaling={false}>{detail}</Text>
                        </View>
                    );
                })()}
            </View>

            <View className="w-full">
                <InputField
                    label="버디 이름"
                    value={characterNickname}
                    onChangeText={setCharacterNickname}
                    isFocused={focus.charNickname}
                    onFocus={() => handleFocus('charNickname', true)}
                    onBlur={() => handleFocus('charNickname', false)}
                    placeholder="버디의 애칭을 지어주세요"
                    returnKeyType="done"
                    onSubmitEditing={handleFinalSubmit}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "padding"}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
            >
                <View className="px-6 pb-2" style={{ paddingTop: scale(16) }}>
                    <TouchableOpacity onPress={prevStep} className="justify-center" style={{ width: scale(40), height: scale(40) }}>
                        <Ionicons name="arrow-back" size={scale(26)} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: scale(16), paddingBottom: scale(24) }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                >
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                </ScrollView>

                <View
                    className="bg-white border-t border-slate-100"
                    style={{ paddingHorizontal: scale(24), paddingTop: scale(12), paddingBottom: insets.bottom > 0 ? insets.bottom : scale(24) }}
                >
                    {step === 1 ? (
                        <TouchableOpacity
                            onPress={nextStep}
                            activeOpacity={0.8}
                            className="w-full rounded-2xl bg-slate-900 items-center justify-center"
                            style={{ height: scale(56) }}
                        >
                            <Text className="text-white font-extrabold tracking-widest uppercase" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                다음
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={handleFinalSubmit}
                            disabled={isSubmitting}
                            activeOpacity={0.8}
                            className={`w-full rounded-2xl items-center justify-center ${isSubmitting ? 'bg-slate-200' : 'bg-slate-900'}`}
                            style={{ height: scale(56) }}
                        >
                            <Text className={`font-extrabold tracking-widest uppercase ${isSubmitting ? "text-slate-400" : "text-white"}`} style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                {isSubmitting ? "처리 중..." : "버디 만나러 가기"}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}