import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storage } from '../../utils/storage';

export default function LoginScreen() {
    const router = useRouter();

    const handleLogin = async () => {
        // 로그인 로직 처리 후 메인으로
        await storage.setUser({ name: "기존유저", isLoggedIn: true });
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
                <Text className="text-3xl font-bold text-gray-900 mb-2">다시 오셨군요!</Text>
                <Text className="text-gray-500 text-base">로그인하여 기록을 불러오세요.</Text>
            </View>

            {/* (옵션) 이메일 입력폼 예시 */}
            <View className="gap-4 mb-8">
                <View>
                    <Text className="text-gray-500 mb-2 text-sm font-bold">이메일</Text>
                    <TextInput
                        placeholder="example@email.com"
                        className="w-full h-14 bg-gray-50 rounded-2xl px-4 text-base border border-gray-100"
                    />
                </View>
                <View>
                    <Text className="text-gray-500 mb-2 text-sm font-bold">비밀번호</Text>
                    <TextInput
                        placeholder="비밀번호를 입력하세요"
                        secureTextEntry
                        className="w-full h-14 bg-gray-50 rounded-2xl px-4 text-base border border-gray-100"
                    />
                </View>

                {/* 로그인 버튼 */}
                <TouchableOpacity
                    onPress={handleLogin}
                    className="w-full h-14 bg-[#7C3AED] rounded-2xl items-center justify-center active:opacity-90 shadow-sm mt-2"
                >
                    <Text className="text-white font-bold text-lg">로그인하기</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-row items-center mb-6">
                <View className="flex-1 h-[1px] bg-gray-200" />
                <Text className="mx-4 text-gray-400 text-xs">또는 소셜 로그인</Text>
                <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            {/* 소셜 로그인 (간편 로그인) */}
            <View className="flex-row gap-4 justify-center">
                <TouchableOpacity onPress={handleLogin} className="w-14 h-14 rounded-full border border-gray-200 items-center justify-center">
                    <FontAwesome name="google" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogin} className="w-14 h-14 rounded-full bg-[#FEE500] items-center justify-center">
                    <Ionicons name="chatbubble-sharp" size={24} color="#381E1F" />
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}