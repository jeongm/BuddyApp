// app/auth/terms.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import React, { useCallback, useState } from 'react';
import { Dimensions, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '../../components/AppText';

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

export default function TermsScreen() {
    const router = useRouter();
    const { mode, accessToken, refreshToken, member } = useLocalSearchParams<{
        mode?: string;
        accessToken?: string;
        refreshToken?: string;
        member?: string;
    }>();

    const { setColorScheme } = useNativeWindColorScheme();
    const insets = useSafeAreaInsets();

    const [termsAgreed, setTermsAgreed] = useState(false);
    const [privacyAgreed, setPrivacyAgreed] = useState(false);
    const [marketingAgreed, setMarketingAgreed] = useState(false);

    const isAllAgreed = termsAgreed && privacyAgreed && marketingAgreed;
    const isRequiredAgreed = termsAgreed && privacyAgreed;

    useFocusEffect(useCallback(() => {
        setColorScheme('light');
        return () => setColorScheme('system');
    }, []));

    const toggleAll = () => {
        const newValue = !isAllAgreed;
        setTermsAgreed(newValue);
        setPrivacyAgreed(newValue);
        setMarketingAgreed(newValue);
    };

    const handleNext = () => {
        if (!isRequiredAgreed) return;
        if (mode === 'social') {
            router.replace({
                pathname: '/auth/onboarding',
                params: {
                    marketingAgreed: marketingAgreed ? 'true' : 'false',
                    accessToken,
                    refreshToken,
                    member,
                }
            });
        } else {
            router.push({
                pathname: '/auth/onboarding',
                params: { marketingAgreed: marketingAgreed ? 'true' : 'false' }
            });
        }
    };

    const CheckBoxRow = ({ title, isChecked, onPress, isRequired, hasDetail = true }: any) => (
        <View className="flex-row items-center justify-between w-full">
            <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-row items-center flex-1 py-1">
                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${isChecked ? 'bg-slate-900 border-slate-900' : 'bg-transparent border-slate-300'}`}>
                    {isChecked && <Ionicons name="checkmark" size={scale(14)} color="#FFFFFF" />}
                </View>
                <Text className="font-bold text-slate-700" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                    <Text className={isRequired ? "text-emerald-500" : "text-slate-400"}>
                        {isRequired ? "[필수] " : "[선택] "}
                    </Text>
                    {title}
                </Text>
            </TouchableOpacity>
            {hasDetail ? (
                <TouchableOpacity className="p-2">
                    <Ionicons name="chevron-forward" size={scale(18)} color="#94A3B8" />
                </TouchableOpacity>
            ) : (
                <View className="p-2" style={{ width: scale(18) + 16 }} />
            )}
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="px-6 pb-2" style={{ paddingTop: scale(16) }}>
                <TouchableOpacity
                    onPress={() => {
                        if (mode === 'social') {
                            router.replace('/');
                        } else {
                            router.back();
                        }
                    }}
                    className="justify-center"
                    style={{ width: scale(40), height: scale(40) }}
                >
                    <Ionicons name="arrow-back" size={scale(26)} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: scale(20), paddingBottom: scale(24) }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ marginBottom: scale(40) }}>
                    <Text className="font-extrabold text-slate-900 tracking-tight mb-3" style={{ fontSize: scale(30), lineHeight: scale(38) }} allowFontScaling={false}>
                        거의 다 왔어요! 👋{"\n"}약관을 확인해주세요.
                    </Text>
                    <Text className="font-medium text-slate-500" style={{ fontSize: scale(14) }} allowFontScaling={false}>
                        버디와 함께하기 위한 마지막 단계예요.
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={toggleAll}
                    activeOpacity={0.8}
                    className={`flex-row items-center p-4 rounded-2xl mb-8 border-2 ${isAllAgreed ? 'bg-slate-50 border-slate-900' : 'bg-slate-50 border-transparent'}`}
                >
                    <View className={`w-7 h-7 rounded-full border-2 items-center justify-center mr-3 ${isAllAgreed ? 'bg-slate-900 border-slate-900' : 'bg-transparent border-slate-300'}`}>
                        {isAllAgreed && <Ionicons name="checkmark" size={scale(18)} color="#FFFFFF" />}
                    </View>
                    <Text className="font-extrabold text-slate-900" style={{ fontSize: scale(16) }} allowFontScaling={false}>
                        네, 모두 확인했으며 동의합니다.
                    </Text>
                </TouchableOpacity>

                <View className="px-2" style={{ gap: scale(20) }}>
                    <CheckBoxRow title="버디 서비스 이용약관" isRequired={true} isChecked={termsAgreed} onPress={() => setTermsAgreed(prev => !prev)} />
                    <CheckBoxRow title="개인정보 수집 및 이용" isRequired={true} isChecked={privacyAgreed} onPress={() => setPrivacyAgreed(prev => !prev)} />
                    <CheckBoxRow title="마케팅/이벤트 알림 수신" isRequired={false} isChecked={marketingAgreed} onPress={() => setMarketingAgreed(prev => !prev)} hasDetail={false} />
                </View>
            </ScrollView>

            <View
                className="bg-white border-t border-slate-100"
                style={{ paddingHorizontal: scale(24), paddingTop: scale(12), paddingBottom: insets.bottom > 0 ? insets.bottom : scale(24) }}
            >
                <TouchableOpacity
                    onPress={handleNext}
                    disabled={!isRequiredAgreed}
                    activeOpacity={0.8}
                    className={`w-full rounded-2xl items-center justify-center ${!isRequiredAgreed ? 'bg-slate-200' : 'bg-slate-900'}`}
                    style={{ height: scale(56) }}
                >
                    <Text className={`font-extrabold tracking-widest uppercase ${!isRequiredAgreed ? 'text-slate-400' : 'text-white'}`} style={{ fontSize: scale(15) }} allowFontScaling={false}>
                        동의하고 시작하기
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}