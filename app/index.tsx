import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// ✨ 기기 화면 너비를 가져옵니다.
const { width } = Dimensions.get('window');

// ✨ 마법의 스케일링 함수: 유저님의 아이폰 16 Pro Max(가로 430px)를 기준으로 비율을 계산합니다!
// 430px 폰에서는 그대로 1배, 360px 폰에서는 약 0.83배로 모든 사이즈가 알아서 줄어듭니다.
const scale = (size: number) => Math.round((width / 430) * size);

const INTRO_SLIDES = [
    {
        id: '1',
        title: '내 마음을 읽는 단짝',
        description: '누구에게도 말 못 할 고민,\n버디에게 편하게 털어놓아 보세요.',
    },
    {
        id: '2',
        title: '하루를 기록하는 일기장',
        description: '대화를 나누기만 해도\n버디가 오늘의 일기를 예쁘게 써줄 거예요.',
    },
    {
        id: '3',
        title: '다양한 매력의 친구들',
        description: '공감 요정 햄스터부터 냉철한 여우까지,\n나와 가장 잘 맞는 친구를 골라보세요.',
    }
];

export default function OnboardingScreen() {
    const router = useRouter();
    const [showLogin, setShowLogin] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems[0]) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

    const handleNext = () => {
        if (currentIndex < INTRO_SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            setShowLogin(true);
        }
    };

    // ---------------------------------------------------------
    // 1️⃣ 앱 소개 (스와이프) 화면
    // ---------------------------------------------------------
    if (!showLogin) {
        return (
            <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
                <View className="flex-1 justify-center items-center">

                    <Animated.View entering={FadeInDown.duration(800)} className="absolute top-16 items-center">
                        <Text
                            className="text-slate-900 dark:text-white font-black tracking-tighter"
                            style={{ fontSize: scale(36) }} // 👈 스케일 적용
                            allowFontScaling={false}
                        >
                            BUDDY
                        </Text>
                    </Animated.View>

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
                            <View style={{ width }} className="items-center justify-center px-8">
                                <View className="w-full max-w-[340px] aspect-[4/5] bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 items-center justify-center p-8 shadow-sm">
                                    <View className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-800 mb-8 items-center justify-center">
                                        <Ionicons name="image-outline" size={scale(40)} color="#94A3B8" />
                                        <Text style={{ fontSize: scale(10) }} className="text-slate-400 mt-2 font-bold" allowFontScaling={false}>이미지 공간</Text>
                                    </View>
                                    <Text className="font-extrabold text-slate-900 dark:text-white mb-3 text-center tracking-tight" style={{ fontSize: scale(24) }} allowFontScaling={false}>
                                        {item.title}
                                    </Text>
                                    <Text className="font-medium text-slate-500 dark:text-slate-400 text-center leading-6" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                        {item.description}
                                    </Text>
                                </View>
                            </View>
                        )}
                    />

                    <View className="absolute bottom-12 w-full px-8 items-center">
                        <View className="flex-row gap-2 mb-8">
                            {INTRO_SLIDES.map((_, index) => (
                                <View key={index} className={`h-2 rounded-full transition-all duration-300 ${currentIndex === index ? 'w-6 bg-primary-600' : 'w-2 bg-slate-200 dark:bg-slate-800'}`} />
                            ))}
                        </View>
                        <TouchableOpacity
                            onPress={handleNext}
                            activeOpacity={0.8}
                            style={{ height: scale(56) }} // 👈 버튼 높이도 스케일 적용
                            className="w-full bg-slate-900 dark:bg-white rounded-[1.5rem] items-center justify-center shadow-sm max-w-[340px]"
                        >
                            <Text className="text-white dark:text-slate-900 font-extrabold tracking-wide" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                {currentIndex === INTRO_SLIDES.length - 1 ? '시작하기' : '다음'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // ---------------------------------------------------------
    // 2️⃣ 로그인 화면 (유저님이 캡처해서 보여주신 부분)
    // ---------------------------------------------------------
    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
            <View className="flex-1 justify-center items-center w-full pb-16">

                {/* 상단 브랜딩 영역 */}
                <Animated.View entering={FadeInDown.duration(800).springify()} className="items-center mb-12">
                    {/* ✨ 고정된 60px 대신 scale(60)을 주어 안드로이드에선 약 50px 정도로 예쁘게 줄어듭니다! */}
                    <Text className="text-slate-900 dark:text-white font-black tracking-tighter" style={{ fontSize: scale(60), lineHeight: scale(66) }} allowFontScaling={false}>
                        BUDDY
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 font-bold tracking-wide mt-2" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                        내 마음을 읽어주는 단 하나의 친구
                    </Text>
                </Animated.View>

                {/* 하단 액션(로그인 버튼) 영역 */}
                <View className="w-full px-6 max-w-[380px]">

                    {/* 말풍선 툴팁 */}
                    <Animated.View entering={FadeInUp.duration(600).delay(200).springify()} className="items-center mb-6 z-10">
                        {/* 패딩도 스케일에 맞춰 조절 */}
                        <View className="bg-slate-100 dark:bg-slate-800 rounded-full relative" style={{ paddingHorizontal: scale(20), paddingVertical: scale(10) }}>
                            <Text className="text-slate-700 dark:text-slate-300 font-extrabold tracking-wide" style={{ fontSize: scale(12) }} allowFontScaling={false}>
                                지금 가입하고 나만의 버디를 만나보세요! 🎉
                            </Text>
                            <View className="absolute -bottom-1.5 left-1/2 -ml-1.5 w-3 h-3 bg-slate-100 dark:bg-slate-800 rotate-45" />
                        </View>
                    </Animated.View>

                    {/* ✨ 실제 로고 이미지가 적용된 소셜 로그인 버튼 리스트 */}
                    <Animated.View entering={FadeInUp.duration(800).delay(300).springify()} className="w-full" style={{ gap: scale(12) }}>

                        {/* 1. 카카오 로그인 */}
                        <TouchableOpacity activeOpacity={0.8} style={{ height: scale(56) }} className="w-full bg-[#FEE500] rounded-full flex-row items-center justify-center shadow-sm">
                            <View className="absolute left-6 items-center justify-center">
                                {/* ✨ 임시 아이콘 대신 유저님의 kakao.png 적용 */}
                                <Image source={require('../assets/images/logo/kakao2.png')} style={{ width: scale(20), height: scale(20) }} contentFit="contain" />
                            </View>
                            <Text className="font-extrabold" style={{ color: 'rgba(0, 0, 0, 0.85)', fontSize: scale(15) }} allowFontScaling={false}>
                                카카오로 3초 만에 로그인
                            </Text>
                        </TouchableOpacity>

                        {/* 2. 네이버 로그인 */}
                        <TouchableOpacity activeOpacity={0.8} style={{ height: scale(56) }} className="w-full bg-[#03a94d] rounded-full flex-row items-center justify-center shadow-sm">
                            <View className="absolute left-6 items-center justify-center">
                                {/* ✨ 임시 텍스트 대신 유저님의 naver.png 적용 */}
                                <Image source={require('../assets/images/logo/naver.png')} style={{ width: scale(16), height: scale(16) }} contentFit="contain" />
                            </View>
                            <Text className="text-white font-extrabold" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                네이버로 로그인
                            </Text>
                        </TouchableOpacity>

                        {/* 3. 구글 로그인 */}
                        <TouchableOpacity activeOpacity={0.8} style={{ height: scale(56) }} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex-row items-center justify-center shadow-sm">
                            <View className="absolute left-6 items-center justify-center">
                                {/* ✨ 임시 박스 대신 유저님의 google.png 적용 */}
                                <Image source={require('../assets/images/logo/google.png')} style={{ width: scale(20), height: scale(20) }} contentFit="contain" />
                            </View>
                            <Text className="text-slate-800 dark:text-slate-200 font-extrabold" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                Google로 로그인
                            </Text>
                        </TouchableOpacity>

                        {/* 4. 이메일 로그인 */}
                        <TouchableOpacity onPress={() => router.push('/auth/login')} activeOpacity={0.8} style={{ height: scale(56) }} className="w-full bg-slate-900 dark:bg-white rounded-full flex-row items-center justify-center shadow-sm mt-1">
                            <View className="absolute left-6 items-center justify-center mb-0.5">
                                <Ionicons name="mail" size={scale(20)} color="white" className="dark:text-slate-900" />
                            </View>
                            <Text className="text-white dark:text-slate-900 font-extrabold" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                이메일로 계속하기
                            </Text>
                        </TouchableOpacity>

                        {/* 하단 텍스트 링크 */}
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
        </SafeAreaView>
    );
}