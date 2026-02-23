import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { chatApi } from "../../api/chatApi";
import { IS_TEST_MODE } from "../../config";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";

const { width, height } = Dimensions.get("window");

// 안전하고 은은한 버튼 전용 그림자
const safeShadow = { elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } };

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { sessionId, setSessionId } = useChatStore();

  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [myTranscript, setMyTranscript] = useState("마이크를 눌러 편하게 이야기해 보세요.");
  const [aiMessage, setAiMessage] = useState(`안녕, ${user?.nickname || "친구"}!\n오늘 하루는 어땠어?`);

  const getProfileImage = (seq?: number) => {
    switch (seq) {
      case 1: return require('../../assets/images/characters/Hamster.png');
      case 2: return require('../../assets/images/characters/Fox.png');
      case 3: return require('../../assets/images/characters/Panda.png');
      default: return require('../../assets/images/characters/Hamster.png');
    }
  };
  const currentProfileImg = getProfileImage(user?.characterSeq);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      pulseAnim.stopAnimation();
    }
  }, [isListening]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);

    try {
      let aiReply = "";
      if (IS_TEST_MODE) {
        await new Promise(r => setTimeout(r, 1500));
        aiReply = `[테스트] 너는 방금 "${text}"라고 말했어!`;
        if (sessionId === 0) setSessionId(999);
      } else {
        const response = await chatApi.sendMessage({ sessionId, content: text });
        aiReply = response.result.content;
        if (response.result.sessionId && response.result.sessionId !== sessionId) setSessionId(response.result.sessionId);
      }
      setAiMessage(aiReply);
    } catch (error) {
      setAiMessage("서버 연결이 불안정해요.\n다시 말해줄래? 😢");
    } finally {
      setIsLoading(false);
      setMyTranscript("터치해서 다시 말하기");
    }
  };

  const toggleListening = () => {
    if (isLoading) return;
    if (isListening) {
      setIsListening(false);
      const mockText = "오늘 진짜 뿌듯한 하루였어!";
      setMyTranscript(mockText);
      handleSendMessage(mockText);
    } else {
      setIsListening(true);
      setMyTranscript("듣고 있어요... 👂");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>

      {/* ✨ 상단: 키보드 전환 버튼 (우측 상단에 깔끔한 원형 아이콘으로 배치) */}
      <View className="flex-row justify-end px-6 pt-4 z-20">
        <TouchableOpacity
          onPress={() => router.push('/chat/keyboard-chat')}
          activeOpacity={0.7}
          className="w-12 h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full items-center justify-center shadow-sm"
        >
          {/* ✨ Ionicons 대신 MaterialIcons의 진짜 '키보드' 아이콘 사용! */}
          <MaterialIcons name="keyboard" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* 중상단: AI 대답 & 캐릭터 */}
      <View className="flex-1 items-center justify-center px-6 -mt-8">

        {/* 텍스트 뷰 */}
        <View className="min-h-[120px] justify-center items-center mb-8 w-full">
          <Text className="text-[28px] font-extrabold text-slate-900 dark:text-white text-center leading-[42px] tracking-tight">
            {isLoading ? "버디가 생각하는 중..." : aiMessage}
          </Text>
        </View>

        {/* 캐릭터 (맥박 애니메이션) */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className="items-center justify-center relative w-full aspect-square max-w-[280px]">
          {/* 캐릭터 뒤 은은한 후광 */}
          <View className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 ${isListening ? 'bg-primary-100/80 dark:bg-primary-900/40 scale-110' : 'bg-transparent scale-100'}`} />

          <Image source={currentProfileImg} style={{ width: 220, height: 220, zIndex: 10 }} contentFit="contain" />

          {/* ✨ 디테일 수정: 그림자를 더 넓고(w-40) 높게(h-8) 키우고, 블러(blur-md)를 강화하여 자연스럽게 만듦 */}
          <View className="absolute bottom-4 w-40 h-8 bg-slate-200/50 dark:bg-slate-800/50 rounded-[100%] scale-y-50 blur-md" />
        </Animated.View>
      </View>

      {/* 하단: 인풋 컨트롤 영역 (다시 심플한 마이크 단독 구성으로 복귀) */}
      <View className="px-6 pb-12 pt-6 items-center">

        {/* 내 음성 텍스트 */}
        <Text className={`text-[15px] font-bold text-center mb-10 transition-colors duration-300 ${isListening ? "text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-500"}`}>
          {isListening ? `"${myTranscript}"` : myTranscript}
        </Text>

        {/* 중앙 마이크 버튼 */}
        <TouchableOpacity
          onPress={toggleListening}
          disabled={isLoading}
          activeOpacity={0.7}
          className={`w-20 h-20 rounded-full items-center justify-center transition-colors duration-300 z-20 ${isLoading ? "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" :
            isListening ? "bg-red-500" : "bg-primary-600"
            }`}
          style={isLoading ? {} : safeShadow}
        >
          <Ionicons
            name={isLoading ? "ellipsis-horizontal" : (isListening ? "stop" : "mic")}
            size={32}
            color={isLoading ? "#94A3B8" : "white"}
          />
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}