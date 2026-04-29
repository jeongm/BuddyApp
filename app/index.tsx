// app/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Linking,
    Modal,
    Platform,
    SafeAreaView as RNSafeAreaView,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

import { oauthApi } from '../api/authApi';
import { AppText as Text } from '../components/AppText';
import { useAuthStore } from '../store/useAuthStore';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const KAKAO_CLIENT_ID = "0cb1b0be0b0b267c4d25cf21596447eb";
const NAVER_CLIENT_ID = "AuARYXdKUbOgxePEuV7_";
const GOOGLE_WEB_CLIENT_ID = "558616630470-tfejh2ammnjtuufa4rvai5nkii93qu3l.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID = "558616630470-fef57mvgtffu8c5v3l9mr1ll6tatvem6.apps.googleusercontent.com";
const FAKE_REDIRECT_URI = "https://buddy.com/oauth/callback";

type SocialProvider = 'kakao' | 'naver' | 'google' | 'apple';

// ✅ 네이버 구조에 맞춘 텍스트 분리 (타이틀 강조, 설명 추가)
const INTRO_SLIDES = [
    {
        id: '1',
        title: '내 마음을 알아주는 단짝',
        description: '지치고 힘든 퇴근길, 누구에게도 말 못 할 고민을\n버디에게 편하게 털어놓아 보세요.',
        // 💡 준비하신 사진 경로로 맞춰주세요
        image: require('../assets/images/onboarding/onboarding_1.png')
    },
    {
        id: '2',
        title: '알아서 기록되는 하루',
        description: '피곤한 밤, 대화를 나누기만 해도 버디가\n오늘의 감성을 담아 예쁜 일기를 써줄 거예요.',
        image: require('../assets/images/onboarding/onboarding_2.png')
    },
    {
        id: '3',
        title: '나를 돌아보는 감정 리포트',
        description: '이번 주 내 마음의 온도는 어땠을까?\n한눈에 보는 리포트로 나를 더 아껴주세요.',
        image: require('../assets/images/onboarding/onboarding_3.png')
    },
    {
        id: '4',
        title: '내 취향에 딱 맞는 버디',
        description: '무조건 내 편인 햄찌부터 냉철한 폭스까지,\n지금 바로 나와 가장 잘 맞는 단짝을 만나보세요!',
        image: require('../assets/images/onboarding/onboarding_4.png')
    }
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { setColorScheme } = useNativeWindColorScheme();
    const [showLogin, setShowLogin] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const { setTokens, setUser } = useAuthStore();

    const [isWebviewVisible, setIsWebviewVisible] = useState(false);
    const [authUrl, setAuthUrl] = useState("");

    const currentProviderRef = useRef<SocialProvider | "">("");

    useFocusEffect(useCallback(() => {
        setColorScheme('light');
        return () => setColorScheme('system');
    }, []));

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: GOOGLE_WEB_CLIENT_ID,
            iosClientId: GOOGLE_IOS_CLIENT_ID,
        });
    }, []);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems[0]) setCurrentIndex(viewableItems[0].index);
    }).current;
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

    const handleNext = () => {
        if (currentIndex < INTRO_SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            setShowLogin(true);
        }
    };

    const handleSocialLogin = async (provider: SocialProvider) => {
        currentProviderRef.current = provider;

        if (provider === 'apple') {
            try {
                const credential = await AppleAuthentication.signInAsync({
                    requestedScopes: [
                        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                        AppleAuthentication.AppleAuthenticationScope.EMAIL,
                    ],
                });
                if (credential.identityToken) {
                    processBackendLogin('apple', credential.identityToken);
                } else {
                    Alert.alert("알림", "Apple 로그인 토큰을 가져오지 못했습니다.");
                }
            } catch (e: any) {
                if (e.code === 'ERR_REQUEST_CANCELED') {
                    console.log('유저가 Apple 로그인을 취소함');
                } else {
                    console.error('Apple 로그인 에러:', e);
                    Alert.alert("로그인 실패", "Apple 로그인 중 문제가 발생했습니다.");
                }
            }
            return;
        }

        if (provider === 'google') {
            try {
                await GoogleSignin.hasPlayServices();
                const userInfo: any = await GoogleSignin.signIn();
                const idToken = userInfo?.data?.idToken || userInfo?.idToken;
                if (idToken) {
                    processBackendLogin('google', idToken);
                } else {
                    Alert.alert("알림", "구글 로그인 토큰을 가져오지 못했습니다.");
                }
            } catch (error: any) {
                if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                    console.log('유저가 구글 로그인 창을 직접 닫음');
                } else if (error.code === statusCodes.IN_PROGRESS) {
                    console.log('이미 구글 로그인이 진행 중임');
                } else {
                    Alert.alert("로그인 실패", "구글 로그인 중 문제가 발생했습니다.");
                }
            }
            return;
        }

        let url = "";
        if (provider === 'kakao') {
            url = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${FAKE_REDIRECT_URI}&response_type=code&through_account=true`;
        } else if (provider === 'naver') {
            url = `https://nid.naver.com/oauth2.0/authorize?client_id=${NAVER_CLIENT_ID}&redirect_uri=${FAKE_REDIRECT_URI}&response_type=code&state=BUDDY_STATE`;
        }

        setAuthUrl(url);
        setIsWebviewVisible(true);
    };

    const onShouldStartLoadWithRequest = (event: any) => {
        const { url } = event;

        if (
            url.startsWith('kakaotalk://') ||
            url.startsWith('kakaokompassauth://') ||
            url.startsWith('naversearchapp://') ||
            url.startsWith('naver://')
        ) {
            Linking.openURL(url).catch(() => Alert.alert("알림", "해당 앱을 열 수 없습니다."));
            return false;
        }

        if (url.startsWith('intent://')) {
            const match = url.match(/intent:\/\/([^#]+)/);
            const fallbackUrl = match ? `kakaokompassauth://${match[1]}` : null;
            if (fallbackUrl) {
                Linking.openURL(fallbackUrl).catch(() =>
                    Linking.openURL(url).catch(() => Alert.alert("알림", "카카오톡 앱을 열 수 없습니다."))
                );
            }
            return false;
        }

        if (url.startsWith(FAKE_REDIRECT_URI)) {
            handleNavigationStateChange({ url });
            return false;
        }

        return true;
    };

    const handleNavigationStateChange = (navState: { url: string }) => {
        const { url } = navState;

        if (!url.startsWith(FAKE_REDIRECT_URI)) return;

        setIsWebviewVisible(false);

        try {
            const urlObj = new URL(url);
            const searchParams = url.includes('#')
                ? new URLSearchParams(url.split('#')[1])
                : urlObj.searchParams;

            const finalValue =
                searchParams.get('code') ||
                searchParams.get('access_token') ||
                searchParams.get('id_token');

            if (finalValue) {
                processBackendLogin(currentProviderRef.current, decodeURIComponent(finalValue));
            } else {
                Alert.alert("로그인 실패", "인증 정보를 추출하지 못했습니다.");
            }
        } catch (e) {
            console.error('URL 파싱 실패:', e);
            Alert.alert("로그인 실패", "인증 정보를 처리하는 중 문제가 발생했습니다.");
        }
    };

    const processBackendLogin = async (provider: string, token: string) => {
        try {
            const response = await oauthApi.loginWithSocialToken({ provider, token });
            const result: any = response.result || response;

            if (result.status === 'REQUIRES_LINKING' && result.linkKey) {
                Alert.alert(
                    "계정 연동 안내",
                    "이미 다른 방식으로 가입된 계정이 있습니다. 연동하시겠습니까?",
                    [
                        { text: "취소", style: "cancel" },
                        {
                            text: "연동하기",
                            onPress: async () => {
                                try {
                                    const linkRes = await oauthApi.linkSocialAccount(result.linkKey);
                                    const linkResult: any = linkRes.result || linkRes;
                                    handleLoginSuccess(linkResult);
                                } catch (e) {
                                    Alert.alert("실패", "계정 연동에 실패했습니다.");
                                }
                            }
                        }
                    ]
                );
                return;
            }
            handleLoginSuccess(result);
        } catch (error) {
            console.error("백엔드 소셜 로그인 실패:", error);
            Alert.alert("로그인 실패", "서버 통신 중 문제가 발생했습니다.");
        }
    };

    const handleLoginSuccess = (resultData: any) => {
        const { accessToken, refreshToken, member } = resultData;

        if (!member?.nickname || !member?.characterId) {
            // ✅ 신규 유저: 토큰을 저장하지 않고 params로 넘김
            router.replace({
                pathname: '/auth/terms',
                params: {
                    mode: 'social',
                    accessToken,
                    refreshToken,
                    member: JSON.stringify(member),
                }
            });
        } else {
            // ✅ 기존 유저: 바로 저장 후 홈으로
            setTokens(accessToken, refreshToken);
            if (member) setUser(member);
            router.replace('/(tabs)/home');
        }
    };

    // ─── 인트로 슬라이드 화면 ───────────────────────────────────────
    if (!showLogin) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

                <View className="flex-1">
                    <FlatList
                        ref={flatListRef}
                        data={INTRO_SLIDES}
                        keyExtractor={(item) => item.id}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                        renderItem={({ item }) => (
                            <View style={{ width }} className="flex-1 bg-white items-center pt-16 pb-32">
                                {/* 1. 상단 텍스트 영역 (블랙 앤 화이트) */}
                                <View className="items-center px-6 mb-8 w-full">
                                    <Text
                                        className="font-black text-black text-center mb-3"
                                        style={{ fontSize: scale(28), lineHeight: scale(36) }}
                                        allowFontScaling={false}
                                    >
                                        {item.title}
                                    </Text>
                                    <Text
                                        className="font-medium text-gray-500 text-center"
                                        style={{ fontSize: scale(15), lineHeight: scale(24) }}
                                        allowFontScaling={false}
                                    >
                                        {item.description}
                                    </Text>
                                </View>

                                {/* 2. 중앙 이미지 영역 (네이버처럼 화면 가운데 배치) */}
                                <View className="flex-1 w-full px-10 items-center justify-center">
                                    {item.image ? (
                                        <Image
                                            source={item.image}
                                            style={{ width: '100%', height: '100%' }}
                                            contentFit="contain"
                                        />
                                    ) : (
                                        <View className="w-full h-full bg-slate-50 rounded-[2rem] border border-slate-100 items-center justify-center">
                                            <Ionicons name="image-outline" size={scale(40)} color="#94A3B8" />
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}
                    />

                    {/* 3. 하단 인디케이터 및 버튼 영역 (고정) */}
                    <View className="absolute bottom-10 w-full px-6 items-center">
                        <View className="flex-row gap-2 mb-6">
                            {INTRO_SLIDES.map((_, index) => (
                                <View
                                    key={index}
                                    className={`h-2 rounded-full ${currentIndex === index ? 'w-6 bg-black' : 'w-2 bg-gray-200'}`}
                                />
                            ))}
                        </View>
                        <TouchableOpacity
                            onPress={handleNext}
                            activeOpacity={0.8}
                            style={{ height: scale(56) }}
                            className="w-full bg-black rounded-[1.5rem] items-center justify-center shadow-sm max-w-[340px]"
                        >
                            <Text
                                className="text-white font-extrabold tracking-wide"
                                style={{ fontSize: scale(15) }}
                                allowFontScaling={false}
                            >
                                {currentIndex === INTRO_SLIDES.length - 1 ? '시작하기' : '다음'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // ─── 로그인 화면 ────────────────────────────────────────────────
    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
            <View className="flex-1 justify-center items-center w-full pb-10">
                <Animated.View entering={FadeInDown.duration(800).springify()} className="items-center mb-10">
                    <Text
                        className="text-black font-black tracking-tighter"
                        style={{ fontSize: scale(60), lineHeight: scale(66) }}
                        allowFontScaling={false}
                    >
                        하루버디
                    </Text>
                    <Text
                        className="text-gray-500 font-bold tracking-wide mt-2"
                        style={{ fontSize: scale(15) }}
                        allowFontScaling={false}
                    >
                        내 마음을 읽어주는 단 하나의 친구
                    </Text>
                </Animated.View>

                <View className="w-full px-6 max-w-[380px]">
                    <Animated.View entering={FadeInUp.duration(600).delay(200).springify()} className="items-center mb-3 z-10">
                        <View className="bg-gray-100 rounded-full relative" style={{ paddingHorizontal: scale(20), paddingVertical: scale(10) }}>
                            <Text
                                className="text-gray-700 font-extrabold tracking-wide"
                                style={{ fontSize: scale(13) }}
                                allowFontScaling={false}
                            >
                                3초 만에 나만의 버디 만나기 🎉
                            </Text>
                            <View className="absolute -bottom-1.5 left-1/2 -ml-1.5 w-3 h-3 bg-gray-100 rotate-45" />
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.duration(800).delay(300).springify()} className="w-full" style={{ gap: scale(12) }}>

                        {/* 카카오 로그인 */}
                        <TouchableOpacity
                            onPress={() => handleSocialLogin('kakao')}
                            activeOpacity={0.8}
                            style={{ height: scale(56) }}
                            className="w-full bg-[#FEE500] rounded-full flex-row items-center justify-center shadow-sm"
                        >
                            <View className="absolute left-6 items-center justify-center">
                                <Image
                                    source={require('../assets/images/logo/kakao2.png')}
                                    style={{ width: scale(20), height: scale(20) }}
                                    contentFit="contain"
                                />
                            </View>
                            <Text
                                className="font-extrabold"
                                style={{ color: 'rgba(0, 0, 0, 0.85)', fontSize: scale(15) }}
                                allowFontScaling={false}
                            >
                                카카오로 시작하기
                            </Text>
                        </TouchableOpacity>

                        {/* 네이버 로그인 */}
                        <TouchableOpacity
                            onPress={() => handleSocialLogin('naver')}
                            activeOpacity={0.8}
                            style={{ height: scale(56) }}
                            className="w-full bg-[#03A94D] rounded-full flex-row items-center justify-center shadow-sm"
                        >
                            <View className="absolute left-6 items-center justify-center">
                                <Image
                                    source={require('../assets/images/logo/naver.png')}
                                    style={{ width: scale(16), height: scale(16) }}
                                    contentFit="contain"
                                />
                            </View>
                            <Text
                                className="text-white font-extrabold"
                                style={{ fontSize: scale(15) }}
                                allowFontScaling={false}
                            >
                                네이버로 시작하기
                            </Text>
                        </TouchableOpacity>

                        {/* 구글 로그인 */}
                        <TouchableOpacity
                            onPress={() => handleSocialLogin('google')}
                            activeOpacity={0.8}
                            style={{ height: scale(56) }}
                            className="w-full bg-white border border-gray-200 rounded-full flex-row items-center justify-center shadow-sm"
                        >
                            <View className="absolute left-6 items-center justify-center">
                                <Image
                                    source={require('../assets/images/logo/google.png')}
                                    style={{ width: scale(20), height: scale(20) }}
                                    contentFit="contain"
                                />
                            </View>
                            <Text
                                className="text-gray-800 font-extrabold"
                                style={{ fontSize: scale(15) }}
                                allowFontScaling={false}
                            >
                                Google로 시작하기
                            </Text>
                        </TouchableOpacity>

                        {/* Apple 로그인 - iOS 전용 */}
                        {Platform.OS === 'ios' && (
                            <TouchableOpacity
                                onPress={() => handleSocialLogin('apple')}
                                activeOpacity={0.8}
                                style={{ height: scale(56) }}
                                className="w-full bg-black rounded-full flex-row items-center justify-center shadow-sm"
                            >
                                <View className="absolute left-6 items-center justify-center mb-0.5">
                                    <Ionicons name="logo-apple" size={scale(22)} color="white" />
                                </View>
                                <Text
                                    className="text-white font-extrabold"
                                    style={{ fontSize: scale(15) }}
                                    allowFontScaling={false}
                                >
                                    Apple로 시작하기
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* 구분선 */}
                        <View className="flex-row items-center w-full my-1 px-2">
                            <View className="flex-1 h-[1px] bg-gray-200" />
                            <Text
                                className="text-gray-400 font-extrabold px-4"
                                style={{ fontSize: scale(12) }}
                                allowFontScaling={false}
                            >
                                또는
                            </Text>
                            <View className="flex-1 h-[1px] bg-gray-200" />
                        </View>

                        {/* 이메일 로그인 */}
                        <TouchableOpacity
                            onPress={() => router.push('/auth/login')}
                            activeOpacity={0.8}
                            style={{ height: scale(56) }}
                            className={`w-full rounded-full flex-row items-center justify-center ${Platform.OS === 'ios' ? 'bg-gray-200' : 'bg-black'}`}
                        >
                            <View className="absolute left-6 items-center justify-center mb-0.5">
                                <Ionicons
                                    name="mail"
                                    size={scale(20)}
                                    color={Platform.OS === 'ios' ? '#4B5563' : '#FFFFFF'}
                                />
                            </View>
                            <Text
                                className={`font-extrabold ${Platform.OS === 'ios' ? 'text-gray-800' : 'text-white'}`}
                                style={{ fontSize: scale(15) }}
                                allowFontScaling={false}
                            >
                                이메일로 계속하기
                            </Text>
                        </TouchableOpacity>

                        {/* 회원가입 / 비밀번호 찾기 */}
                        <View className="mt-5 items-center" style={{ gap: scale(16) }}>
                            <TouchableOpacity
                                onPress={() => router.push('/auth/signup')}
                                activeOpacity={0.6}
                                className="py-2 flex-row items-center justify-center"
                            >
                                <Text
                                    className="font-medium text-gray-500 mr-1"
                                    style={{ fontSize: scale(14) }}
                                    allowFontScaling={false}
                                >
                                    처음이신가요?
                                </Text>
                                <Text
                                    className="font-black text-black"
                                    style={{ fontSize: scale(14) }}
                                    allowFontScaling={false}
                                >
                                    이메일로 가입하기
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push('/auth/find-password')}
                                activeOpacity={0.6}
                            >
                                <Text
                                    className="font-bold text-gray-400 underline"
                                    style={{ fontSize: scale(12) }}
                                    allowFontScaling={false}
                                >
                                    비밀번호를 잊으셨나요?
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </Animated.View>
                </View>
            </View>

            {/* 카카오/네이버 WebView 모달 */}
            <Modal
                visible={isWebviewVisible}
                animationType="slide"
                onRequestClose={() => setIsWebviewVisible(false)}
            >
                <RNSafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
                    <View className="flex-row justify-between items-center px-4 py-2 border-b border-gray-100">
                        <Text
                            className="font-bold text-gray-800"
                            style={{ fontSize: scale(16) }}
                            allowFontScaling={false}
                        >
                            소셜 로그인
                        </Text>
                        <TouchableOpacity
                            onPress={() => setIsWebviewVisible(false)}
                            style={{ padding: scale(8) }}
                        >
                            <Ionicons name="close" size={scale(28)} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <WebView
                        source={{ uri: authUrl }}
                        onNavigationStateChange={handleNavigationStateChange}
                        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
                        incognito={true}
                        style={{ flex: 1 }}
                        userAgent={
                            Platform.OS === 'android'
                                ? "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36"
                                : "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
                        }
                    />
                </RNSafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}