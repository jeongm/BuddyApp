import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Linking, Modal, SafeAreaView as RNSafeAreaView, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { oauthApi } from '../api/authApi';
import { AppText as Text } from '../components/AppText';
import { useAuthStore } from '../store/useAuthStore';

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const KAKAO_CLIENT_ID = "0cb1b0be0b0b267c4d25cf21596447eb";
const NAVER_CLIENT_ID = "AuARYXdKUbOgxePEuV7_";
const GOOGLE_CLIENT_ID = "558616630470-tfejh2ammnjtuufa4rvai5nkii93qu3l.apps.googleusercontent.com";

const FAKE_REDIRECT_URI = "https://buddy.com/oauth/callback";

const INTRO_SLIDES = [
    { id: '1', title: '내 마음을 읽는 단짝', description: '누구에게도 말 못 할 고민,\n버디에게 편하게 털어놓아 보세요.' },
    { id: '2', title: '하루를 기록하는 일기장', description: '대화를 나누기만 해도\n버디가 오늘의 일기를 예쁘게 써줄 거예요.' },
    { id: '3', title: '다양한 매력의 친구들', description: '공감 요정 햄찌부터 냉철한 폭스까지,\n나와 가장 잘 맞는 친구를 골라보세요.' }
];

export default function OnboardingScreen() {
    const router = useRouter();
    const [showLogin, setShowLogin] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const { setTokens, setUser } = useAuthStore();

    const [isWebviewVisible, setIsWebviewVisible] = useState(false);
    const [authUrl, setAuthUrl] = useState("");
    const [currentProvider, setCurrentProvider] = useState("");

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

    // =========================================================================
    // ✨ 1. 웹뷰 띄우기 (카카오, 네이버, 구글 모두 response_type=code 로 완벽 통일!)
    // =========================================================================
    const handleSocialLogin = (provider: 'kakao' | 'naver' | 'google') => {
        setCurrentProvider(provider);
        let url = "";

        if (provider === 'kakao') {
            url = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${FAKE_REDIRECT_URI}&response_type=code&through_account=true`;
        } else if (provider === 'naver') {
            url = `https://nid.naver.com/oauth2.0/authorize?client_id=${NAVER_CLIENT_ID}&redirect_uri=${FAKE_REDIRECT_URI}&response_type=code&state=BUDDY_STATE`;
        } else if (provider === 'google') {
            // ✨ 구글: 백엔드가 원하는 ID 토큰(id_token) 요청으로 복구!
            url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${FAKE_REDIRECT_URI}&response_type=id_token&scope=openid%20email%20profile&nonce=BUDDY_NONCE`;
        }

        setAuthUrl(url);
        setIsWebviewVisible(true);
    };

    // =========================================================================
    // ✨ 2. 카카오톡 앱 열기 길잡이
    // =========================================================================
    const onShouldStartLoadWithRequest = (event: any) => {
        const { url } = event;
        if (url.startsWith('kakaotalk://') || url.startsWith('intent://')) {
            Linking.openURL(url).catch(() => {
                Alert.alert("알림", "카카오톡 앱을 열 수 없습니다. 카카오 계정으로 로그인해주세요.");
            });
            return false;
        }
        return true;
    };

    // =========================================================================
    // ✨ 3. 가짜 주소 낚아채기 (어떤 위치에 있든 정확하게 값을 뽑아내는 무적 추출기)
    // =========================================================================
    const handleNavigationStateChange = (navState: any) => {
        const { url } = navState;

        if (url.startsWith(FAKE_REDIRECT_URI)) {
            setIsWebviewVisible(false);

            // 주소에서 # 뒤의 값들과 ? 뒤의 값들을 모두 합쳐서 분석합니다.
            const urlSeparator = url.includes('#') ? '#' : '?';
            const paramsString = url.split(urlSeparator)[1] || "";
            const params = paramsString.split('&');

            let finalValue = "";

            // 1. 카카오용: 'code=' 찾기
            // 2. 네이버용: 'access_token=' 찾기
            // 3. 구글용: 'id_token=' 찾기
            params.forEach((param: string) => {
                if (param.startsWith('code=')) finalValue = param.split('=')[1];
                else if (param.startsWith('access_token=')) finalValue = param.split('=')[1];
                else if (param.startsWith('id_token=')) finalValue = param.split('=')[1];
            });

            if (finalValue) {
                console.log(`✅ [${currentProvider}] 데이터 추출 성공! 백엔드로 전송`);
                processBackendLogin(currentProvider, finalValue);
            } else {
                console.log("❌ 인증 값을 찾을 수 없습니다. URL:", url);
                Alert.alert("로그인 실패", "인증 정보를 추출하지 못했습니다.");
            }
        }
    };

    // =========================================================================
    // ✨ 4. 백엔드 통신 및 성공 처리
    // =========================================================================
    const processBackendLogin = async (provider: string, code: string) => {
        try {
            // 🚨 프론트 변수명도 'code', 백엔드가 원하는 이름표도 'code'!
            // 그래서 깔끔하게 { provider, code } 로 묶어서 보냅니다!
            const response = await oauthApi.loginWithSocialToken({ provider, code });
            const result = response.result || response;

            if (result.status === 'REQUIRES_LINKING' && result.linkKey) {
                Alert.alert("계정 연동 안내", "이미 다른 방식으로 가입된 계정이 있습니다. 연동하시겠습니까?", [
                    { text: "취소", style: "cancel" },
                    {
                        text: "연동하기",
                        onPress: async () => {
                            try {
                                const linkRes = await oauthApi.linkSocialAccount(result.linkKey);
                                handleLoginSuccess(linkRes.result || linkRes);
                            } catch (e) {
                                Alert.alert("실패", "계정 연동에 실패했습니다.");
                            }
                        }
                    }
                ]);
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
        setTokens(accessToken, refreshToken);
        if (member) setUser(member);

        if (member?.characterSeq === null || member?.characterSeq === undefined) {
            router.replace('/auth/character-select');
        } else {
            router.replace('/(tabs)/home');
        }
    };

    // ---------------------------------------------------------
    // 화면 렌더링 부 (생략 없이 원본 유지)
    // ---------------------------------------------------------
    if (!showLogin) {
        return (
            <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
                <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
                <View className="flex-1 justify-center items-center">
                    <Animated.View entering={FadeInDown.duration(800)} className="absolute top-16 items-center">
                        <Text className="text-slate-900 dark:text-white font-black tracking-tighter" style={{ fontSize: scale(36) }} allowFontScaling={false}>BUDDY</Text>
                    </Animated.View>

                    <FlatList
                        ref={flatListRef} data={INTRO_SLIDES} keyExtractor={(item) => item.id} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={viewabilityConfig}
                        renderItem={({ item }) => (
                            <View style={{ width }} className="items-center justify-center px-8">
                                <View className="w-full max-w-[340px] aspect-[4/5] bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 items-center justify-center p-8 shadow-sm">
                                    <View className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-800 mb-8 items-center justify-center">
                                        <Ionicons name="image-outline" size={scale(40)} color="#94A3B8" />
                                    </View>
                                    <Text className="font-extrabold text-slate-900 dark:text-white mb-3 text-center tracking-tight" style={{ fontSize: scale(24) }} allowFontScaling={false}>{item.title}</Text>
                                    <Text className="font-medium text-slate-500 dark:text-slate-400 text-center leading-6" style={{ fontSize: scale(15) }} allowFontScaling={false}>{item.description}</Text>
                                </View>
                            </View>
                        )}
                    />

                    <View className="absolute bottom-12 w-full px-8 items-center">
                        <View className="flex-row gap-2 mb-8">
                            {INTRO_SLIDES.map((_, index) => (
                                <View key={index} className={`h-2 rounded-full transition-all duration-300 ${currentIndex === index ? 'w-6 bg-slate-900 dark:bg-white' : 'w-2 bg-slate-200 dark:bg-slate-800'}`} />
                            ))}
                        </View>
                        <TouchableOpacity onPress={handleNext} activeOpacity={0.8} style={{ height: scale(56) }} className="w-full bg-slate-900 dark:bg-white rounded-[1.5rem] items-center justify-center shadow-sm max-w-[340px]">
                            <Text className="text-white dark:text-slate-900 font-extrabold tracking-wide" style={{ fontSize: scale(15) }} allowFontScaling={false}>{currentIndex === INTRO_SLIDES.length - 1 ? '시작하기' : '다음'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
            <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
            <View className="flex-1 justify-center items-center w-full pb-16">
                <Animated.View entering={FadeInDown.duration(800).springify()} className="items-center mb-12">
                    <Text className="text-slate-900 dark:text-white font-black tracking-tighter" style={{ fontSize: scale(60), lineHeight: scale(66) }} allowFontScaling={false}>BUDDY</Text>
                    <Text className="text-slate-500 dark:text-slate-400 font-bold tracking-wide mt-2" style={{ fontSize: scale(15) }} allowFontScaling={false}>내 마음을 읽어주는 단 하나의 친구</Text>
                </Animated.View>

                <View className="w-full px-6 max-w-[380px]">
                    <Animated.View entering={FadeInUp.duration(600).delay(200).springify()} className="items-center mb-3 z-10">
                        <View className="bg-slate-100 dark:bg-slate-800 rounded-full relative" style={{ paddingHorizontal: scale(20), paddingVertical: scale(10) }}>
                            <Text className="text-slate-700 dark:text-slate-300 font-extrabold tracking-wide" style={{ fontSize: scale(12) }} allowFontScaling={false}>지금 가입하고 나만의 버디를 만나보세요! 🎉</Text>
                            <View className="absolute -bottom-1.5 left-1/2 -ml-1.5 w-3 h-3 bg-slate-100 dark:bg-slate-800 rotate-45" />
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.duration(800).delay(300).springify()} className="w-full" style={{ gap: scale(12) }}>
                        <TouchableOpacity onPress={() => handleSocialLogin('kakao')} activeOpacity={0.8} style={{ height: scale(56) }} className="w-full bg-[#FEE500] rounded-full flex-row items-center justify-center shadow-sm">
                            <View className="absolute left-6 items-center justify-center">
                                <Image source={require('../assets/images/logo/kakao2.png')} style={{ width: scale(20), height: scale(20) }} contentFit="contain" />
                            </View>
                            <Text className="font-extrabold" style={{ color: 'rgba(0, 0, 0, 0.85)', fontSize: scale(15) }} allowFontScaling={false}>카카오로 3초 만에 로그인</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handleSocialLogin('naver')} activeOpacity={0.8} style={{ height: scale(56) }} className="w-full bg-[#03a94d] rounded-full flex-row items-center justify-center shadow-sm">
                            <View className="absolute left-6 items-center justify-center">
                                <Image source={require('../assets/images/logo/naver.png')} style={{ width: scale(16), height: scale(16) }} contentFit="contain" />
                            </View>
                            <Text className="text-white font-extrabold" style={{ fontSize: scale(15) }} allowFontScaling={false}>네이버로 로그인</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handleSocialLogin('google')} activeOpacity={0.8} style={{ height: scale(56) }} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex-row items-center justify-center shadow-sm">
                            <View className="absolute left-6 items-center justify-center">
                                <Image source={require('../assets/images/logo/google.png')} style={{ width: scale(20), height: scale(20) }} contentFit="contain" />
                            </View>
                            <Text className="text-slate-800 dark:text-slate-200 font-extrabold" style={{ fontSize: scale(15) }} allowFontScaling={false}>Google로 로그인</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push('/auth/login')} activeOpacity={0.8} style={{ height: scale(56) }} className="w-full bg-slate-900 dark:bg-white rounded-full flex-row items-center justify-center shadow-sm">
                            <View className="absolute left-6 items-center justify-center mb-0.5">
                                <Ionicons name="mail" size={scale(20)} color="white" className="dark:text-slate-900" />
                            </View>
                            <Text className="text-white dark:text-slate-900 font-extrabold" style={{ fontSize: scale(15) }} allowFontScaling={false}>이메일로 로그인</Text>
                        </TouchableOpacity>

                        <View className="flex-row items-center justify-center mt-4" style={{ gap: scale(16) }}>
                            <TouchableOpacity onPress={() => router.push('/auth/signup')} activeOpacity={0.6}>
                                <Text className="font-bold text-slate-500 dark:text-slate-400" style={{ fontSize: scale(13) }} allowFontScaling={false}>회원가입</Text>
                            </TouchableOpacity>
                            <View className="bg-slate-300 dark:bg-slate-700" style={{ width: 1, height: scale(12) }} />
                            <TouchableOpacity activeOpacity={0.6}>
                                <Text className="font-bold text-slate-500 dark:text-slate-400" style={{ fontSize: scale(13) }} allowFontScaling={false}>계정 찾기</Text>
                            </TouchableOpacity>
                            <View className="bg-slate-300 dark:bg-slate-700" style={{ width: 1, height: scale(12) }} />
                            <TouchableOpacity activeOpacity={0.6}>
                                <Text className="font-bold text-slate-500 dark:text-slate-400" style={{ fontSize: scale(13) }} allowFontScaling={false}>비밀번호 찾기</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </View>

            <Modal visible={isWebviewVisible} animationType="slide" onRequestClose={() => setIsWebviewVisible(false)}>
                <RNSafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
                    <View className="flex-row justify-between items-center px-4 py-2 border-b border-gray-100">
                        <Text className="font-bold text-slate-800" style={{ fontSize: scale(16) }} allowFontScaling={false}>소셜 로그인</Text>
                        <TouchableOpacity onPress={() => setIsWebviewVisible(false)} style={{ padding: scale(8) }}>
                            <Ionicons name="close" size={scale(28)} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <WebView
                        source={{ uri: authUrl }}
                        onNavigationStateChange={handleNavigationStateChange}
                        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
                        incognito={true}
                        style={{ flex: 1 }}
                        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
                    />
                </RNSafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}