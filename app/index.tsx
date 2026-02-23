import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">

            <View className="flex-1 justify-center w-full pb-16">

                {/* 1. 상단 브랜딩 영역 */}
                <View className="items-center mb-10 mt-8">
                    <Animated.View entering={FadeInDown.duration(800).springify()} className="items-center">
                        <Text className="text-slate-900 dark:text-white font-black tracking-tighter" style={{ fontSize: 64, lineHeight: 70 }}>
                            BUDDY
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-base font-bold tracking-wide mt-2">
                            내 마음을 읽어주는 단 하나의 친구
                        </Text>
                    </Animated.View>
                </View>

                {/* 2. 하단 액션 영역 */}
                <View className="px-6 w-full">

                    {/* ✨ 말풍선 툴팁 (로즈 색상으로 하드코딩!) */}
                    <Animated.View entering={FadeInUp.duration(600).delay(300).springify()} className="items-center mb-6">
                        <View className="bg-rose-50 dark:bg-rose-900/40 px-5 py-2.5 rounded-full border border-rose-100 dark:border-rose-800 relative shadow-sm">
                            <Text className="text-rose-600 dark:text-rose-400 text-[12px] font-extrabold tracking-wide">
                                지금 가입하고 나만의 버디를 만나보세요! 🎉
                            </Text>
                            {/* 말풍선 아래 꼬리 (동일하게 로즈 색상 적용) */}
                            <View className="absolute -bottom-1.5 left-1/2 -ml-1.5 w-3 h-3 bg-rose-50 dark:bg-rose-900/40 border-b border-r border-rose-100 dark:border-rose-800 rotate-45" />
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.duration(800).delay(400).springify()} className="w-full gap-3">

                        {/* 카카오 로그인 */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            className="w-full h-14 bg-[#FEE500] rounded-full flex-row items-center justify-center shadow-sm"
                        >
                            <View className="absolute left-6">
                                <Ionicons name="chatbubble-sharp" size={20} color="#371D1E" />
                            </View>
                            <Text className="text-[#371D1E] font-extrabold text-[15px]">카카오로 3초 만에 로그인</Text>
                        </TouchableOpacity>

                        {/* 네이버 로그인 */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            className="w-full h-14 bg-[#03C75A] rounded-full flex-row items-center justify-center shadow-sm"
                        >
                            <View className="absolute left-6">
                                <Text className="text-white font-extrabold text-lg">N</Text>
                            </View>
                            <Text className="text-white font-extrabold text-[15px]">네이버로 로그인</Text>
                        </TouchableOpacity>

                        {/* 구글 로그인 */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            className="w-full h-14 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex-row items-center justify-center shadow-sm"
                        >
                            <View className="absolute left-6">
                                <Ionicons name="logo-google" size={20} color="#DB4437" />
                            </View>
                            <Text className="text-slate-700 dark:text-slate-200 font-extrabold text-[15px]">Google로 로그인</Text>
                        </TouchableOpacity>

                        {/* 이메일로 시작하기 */}
                        <TouchableOpacity
                            onPress={() => router.push('/auth/login')}
                            activeOpacity={0.8}
                            className="w-full h-14 bg-slate-900 dark:bg-white rounded-full flex-row items-center justify-center shadow-sm"
                        >
                            <View className="absolute left-6 mb-0.5">
                                <Ionicons name="mail" size={20} color="white" className="dark:text-slate-900" />
                            </View>
                            <Text className="text-white dark:text-slate-900 font-extrabold text-[15px]">이메일로 로그인</Text>
                        </TouchableOpacity>

                        {/* 하단 텍스트 링크 (회원가입, 계정 찾기, 비밀번호 찾기) */}
                        <View className="flex-row items-center justify-center gap-4 mt-6">
                            <TouchableOpacity onPress={() => router.push('/auth/signup')} activeOpacity={0.6}>
                                <Text className="text-[13px] font-bold text-slate-500 dark:text-slate-400">회원가입</Text>
                            </TouchableOpacity>

                            <View className="w-[1px] h-3 bg-slate-300 dark:bg-slate-700" />

                            <TouchableOpacity activeOpacity={0.6}>
                                <Text className="text-[13px] font-bold text-slate-500 dark:text-slate-400">계정 찾기</Text>
                            </TouchableOpacity>

                            <View className="w-[1px] h-3 bg-slate-300 dark:bg-slate-700" />

                            <TouchableOpacity activeOpacity={0.6}>
                                <Text className="text-[13px] font-bold text-slate-500 dark:text-slate-400">비밀번호 찾기</Text>
                            </TouchableOpacity>
                        </View>

                    </Animated.View>
                </View>

            </View>
        </SafeAreaView>
    );
}