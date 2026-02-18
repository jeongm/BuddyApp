import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white justify-between pb-10">

            {/* 1. 상단 타이틀 & 이미지 */}
            <View className="flex-1 items-center justify-center">
                <Animated.View entering={FadeInDown.delay(200)} className="items-center">
                    {/* 로고 대신 아이콘 */}
                    <View className="w-40 h-40 bg-purple-50 rounded-full items-center justify-center mb-8 shadow-sm">
                        <Ionicons name="chatbubbles" size={80} color="#7C3AED" />
                    </View>
                    <Text className="text-[#7C3AED] font-bold text-5xl mb-3">Buddy</Text>
                    <Text className="text-gray-400 text-lg">내 마음을 읽어주는 친구</Text>
                </Animated.View>
            </View>

            {/* 2. 하단 버튼 영역 */}
            <Animated.View entering={FadeInDown.delay(400)} className="px-6 w-full gap-4">

                {/* 시작하기 버튼 (회원가입으로 이동) */}
                <TouchableOpacity
                    onPress={() => router.push('/auth/signup')}
                    className="w-full h-14 bg-[#7C3AED] rounded-2xl items-center justify-center active:opacity-90 shadow-sm"
                >
                    <Text className="text-white font-bold text-lg">새로 시작하기</Text>
                </TouchableOpacity>

                {/* 로그인 버튼 (로그인으로 이동) */}
                <TouchableOpacity
                    onPress={() => router.push('/auth/login')}
                    className="w-full h-14 bg-white border border-gray-200 rounded-2xl items-center justify-center active:bg-gray-50"
                >
                    <Text className="text-[#7C3AED] font-bold text-lg">기존 계정으로 로그인</Text>
                </TouchableOpacity>

            </Animated.View>
        </SafeAreaView>
    );
}