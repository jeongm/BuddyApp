import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// ✨ 1. 직접 통신 대신 만들어둔 oauthApi를 가져옵니다!
import { oauthApi } from '../../api/authApi';
import { useAuthStore } from '../../store/useAuthStore';

export default function OAuthCallbackScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ mode: string; key: string; email?: string; provider?: string }>();
    const { setTokens, setUser } = useAuthStore();

    const isProcessed = useRef(false);
    const [statusText, setStatusText] = useState("로그인 정보를 확인하고 있어요...");

    useEffect(() => {
        if (isProcessed.current) return;

        const { mode, key, email, provider } = params;

        if (!mode || !key) {
            Alert.alert("오류", "잘못된 접근입니다.");
            router.replace('/');
            return;
        }

        isProcessed.current = true;

        if (mode === 'success') {
            handleSuccess(key);
        } else if (mode === 'link') {
            handleLink(key, email, provider);
        } else {
            Alert.alert("오류", "알 수 없는 요청입니다.");
            router.replace('/');
        }
    }, [params]);

    // ✨ 1. 일반 성공 케이스 (신규 가입 or 기존 유저)
    const handleSuccess = async (key: string) => {
        try {
            // 🚨 2. axios 직접 호출 대신 oauthApi.getSocialToken 사용!
            const response = await oauthApi.getSocialToken(key);
            const result = response.result || response;
            processLoginSuccess(result);
        } catch (error) {
            console.error("OAuth Success Error:", error);
            Alert.alert("로그인 실패", "소셜 로그인 처리 중 문제가 발생했습니다.");
            router.replace('/');
        }
    };

    // ✨ 2. 연동 필요 케이스
    const handleLink = (key: string, email?: string, provider?: string) => {
        setStatusText("계정 연동을 대기 중입니다...");

        Alert.alert(
            "계정 연동 안내",
            `이미 ${email || '다른 방식'}으로 가입된 계정이 있습니다.\n${provider || '이 소셜'} 로그인을 연동하시겠습니까?`,
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
                            // 🚨 3. 잘못된 주소 직접 호출 대신 oauthApi.linkSocialAccount 사용!
                            const response = await oauthApi.linkSocialAccount(key);
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

    // ✨ 공통 로직: 토큰 저장 및 characterSeq 기반 라우팅
    const processLoginSuccess = (result: any) => {
        const { accessToken, refreshToken, member } = result;

        setTokens(accessToken, refreshToken);
        if (member) setUser(member);

        if (member?.characterSeq === null || member?.characterSeq === undefined) {
            // 🐣 신규 유저 -> 캐릭터 선택 화면
            router.replace('/auth/character-select');
        } else {
            // 🏠 기존 유저 -> 메인 홈
            router.replace('/(tabs)/home');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
            <ActivityIndicator size="large" color="#64748B" />
            <Text className="mt-6 font-bold text-slate-600 dark:text-slate-300 text-[15px]" allowFontScaling={false}>
                {statusText}
            </Text>
        </SafeAreaView>
    );
}