import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storage } from '../../utils/storage';

export default function SignupScreen() {
    const router = useRouter();

    const handleSocialSignup = async (provider: string) => {
        // 회원가입 로직 처리 후 메인으로
        await storage.setUser({ name: "신규유저", isLoggedIn: true });
        router.replace('/(tabs)/home');
    };

    return (
        <SafeAreaView className="flex-1 bg-white px-6">
            <Stack.Screen options={{ headerShown: false }} />

            {/* 뒤로가기 & 헤더 */}
            <View className="pt-4 pb-10">
                <TouchableOpacity onPress={() => router.back()} className="mb-6">
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-3xl font-bold text-gray-900 mb-2">반가워요! 👋</Text>
                <Text className="text-gray-500 text-base">Buddy와 함께 일기를 써볼까요?</Text>
            </View>

            {/* 소셜 회원가입 버튼들 */}
            <View className="gap-4">
                <TouchableOpacity
                    onPress={() => handleSocialSignup('google')}
                    className="w-full h-14 bg-white border border-gray-200 rounded-2xl flex-row items-center justify-center relative active:bg-gray-50"
                >
                    <View className="absolute left-6">
                        <FontAwesome name="google" size={20} color="black" />
                    </View>
                    <Text className="text-gray-800 font-bold text-base">Google로 계속하기</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => handleSocialSignup('kakao')}
                    className="w-full h-14 bg-[#FEE500] rounded-2xl flex-row items-center justify-center relative active:opacity-90"
                >
                    <View className="absolute left-6">
                        <Ionicons name="chatbubble-sharp" size={20} color="#381E1F" />
                    </View>
                    <Text className="text-[#381E1F] font-bold text-base">카카오로 계속하기</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}