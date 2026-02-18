import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BuddyCharacter } from '../../components/BuddyCharacter';
import { Button } from '../../components/ui/Button';

export default function HomeScreen() {
  const router = useRouter();
  const characterName = 'Buddy';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      {/* 전체 컨테이너 */}
      <View className="flex-1 flex flex-col">

        {/* === Header === */}
        <View className="flex-row justify-between items-center p-6">
          <View className="flex-row items-center gap-2">
            {/* TODO Sparkles 버튼은 일단 주석 처리 - 추후 버디 아이콘 추가 고민 */}
            {/* <View className="bg-primary/10 p-2 rounded-full">
              <Ionicons name="sparkles" size={18} color="#7C3AED" />
            </View> */}
            <Text className="text-2xl font-bold text-foreground">{characterName}</Text>
          </View>

          {/* TODO Settings 버튼은 일단 주석 처리 */}
          {/* <Button
            variant="ghost"
            size="icon"
            onPress={() => router.push("/(tabs)/settings")}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
          </Button> */}
        </View>

        {/* === Main Content (중앙 정렬) === */}
        <View className="flex-1 items-center justify-center px-6 -mt-10">

          {/* 말풍선 */}
          <Animated.View
            entering={FadeInUp.delay(300).springify()}
            className="w-full items-center mb-6"
          >
            <View className="bg-card rounded-[28px] px-8 py-5 shadow-sm border border-border w-full max-w-xs items-center relative z-10">
              <Text className="text-center text-card-foreground text-lg font-medium leading-7">
                오늘 기분은 어때?{"\n"}무슨 일 있었어?
              </Text>
            </View>
            {/* 말풍선 꼬리 */}
            <View className="w-5 h-5 bg-card border-r border-b border-border rotate-45 -mt-2.5 z-0" />
          </Animated.View>

          {/* 캐릭터 영역 */}
          <View className="my-4">
            <BuddyCharacter size="large" />
          </View>

          {/* 대화 시작 버튼 */}
          <Animated.View
            entering={FadeInDown.delay(500)}
            className="w-full max-w-xs mt-10"
          >
            <Button
              size="lg"
              className="rounded-[20px] shadow-lg shadow-primary/20 h-16"
              onPress={() => router.push("/chat")}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="chatbubble-ellipses" size={24} color="white" />
                <Text className="text-white text-xl font-bold">대화 시작하기</Text>
              </View>
            </Button>
          </Animated.View>

        </View>

        {/* 하단 여백 확보 */}
        <View className="h-10" />
      </View>
    </SafeAreaView>
  );
}