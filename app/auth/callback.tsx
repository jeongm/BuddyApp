import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { oauthApi } from '../../api/authApi';
import { AppText as Text } from '../../components/AppText';
import { useAuthStore } from '../../store/useAuthStore';

export default function OAuthCallbackScreen() {
    const router = useRouter();
    const rawParams = useLocalSearchParams();
    const { setTokens, setUser } = useAuthStore();
    const { setColorScheme } = useNativeWindColorScheme();

    const mode = Array.isArray(rawParams.mode) ? rawParams.mode[0] : rawParams.mode;
    const key = Array.isArray(rawParams.key) ? rawParams.key[0] : rawParams.key;
    const email = Array.isArray(rawParams.email) ? rawParams.email[0] : rawParams.email;
    const provider = Array.isArray(rawParams.provider) ? rawParams.provider[0] : rawParams.provider;

    const isProcessed = useRef(false);
    const [statusText, setStatusText] = useState("로그인 정보를 확인하고 있어요...");

    // ✅ [추가] 라이트 모드 강제
    useFocusEffect(useCallback(() => {
        setColorScheme('light');
        return () => setColorScheme('system');
    }, []));

    useEffect(() => {
        if (isProcessed.current) return;

        if (!mode || !key) {
            Alert.alert("오류", "잘못된 접근입니다.");
            router.replace('/');
            return;
        }

        isProcessed.current = true;

        if (mode === 'success') {
            handleSuccess(key, provider || "UNKNOWN");
        } else if (mode === 'link') {
            handleLink(key, email, provider);
        } else {
            Alert.alert("오류", "알 수 없는 요청입니다.");
            router.replace('/');
        }
    }, [mode, key, email, provider]);

    const handleSuccess = async (authKey: string, authProvider: string) => {
        try {
            const response = await oauthApi.loginWithSocialToken({
                provider: authProvider,
                token: authKey
            });
            const result = response.result || response;
            processLoginSuccess(result);
        } catch (error) {
            console.error("OAuth Success Error:", error);
            Alert.alert("로그인 실패", "소셜 로그인 처리 중 문제가 발생했습니다.");
            router.replace('/');
        }
    };

    const handleLink = (authKey: string, authEmail?: string, authProvider?: string) => {
        setStatusText("계정 연동을 대기 중입니다...");

        Alert.alert(
            "계정 연동 안내",
            `이미 ${authEmail || '다른 방식'}으로 가입된 계정이 있습니다.\n${authProvider || '이 소셜'} 로그인을 연동하시겠습니까?`,
            [
                {
                    text: "취소",
                    style: "cancel",
                    onPress: () => router.replace('/')
                },
                {
                    text: "연동하기",
                    onPress: async () => {
                        setStatusText("계정을 연동하고 있어요...");
                        try {
                            const response = await oauthApi.linkSocialAccount(authKey);
                            const result = response.result || response;
                            processLoginSuccess(result);
                        } catch (error) {
                            console.error("OAuth Link Error:", error);
                            Alert.alert("연동 실패", "계정 연동 중 문제가 발생했습니다.");
                            router.replace('/');
                        }
                    }
                }
            ]
        );
    };

    const processLoginSuccess = (result: any) => {
        const { accessToken, refreshToken, member } = result;
        setTokens(accessToken, refreshToken);
        if (member) setUser(member);

        if (!member?.nickname || !member?.characterId) {
            router.replace('/auth/terms?mode=social');
        } else {
            router.replace('/(tabs)/home');
        }
    };

    return (
        // ✅ [수정] dark: 클래스 제거
        <SafeAreaView className="flex-1 bg-white items-center justify-center">
            <ActivityIndicator size="large" color="#64748B" />
            // ✅ [수정] Text → AppText로 교체, dark: 클래스 제거
            <Text className="mt-6 font-bold text-slate-600 text-[15px]" allowFontScaling={false}>
                {statusText}
            </Text>
        </SafeAreaView>
    );
}