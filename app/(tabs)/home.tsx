import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { chatApi } from "../../api/chatApi";
import { AppText as Text } from '../../components/AppText';
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";

const { width } = Dimensions.get("window");
const scale = (size: number) => Math.round((width / 430) * size);

const safeShadow = {
  elevation: 8,
  shadowColor: '#000',
  shadowOpacity: 0.15,
  shadowRadius: scale(16),
  shadowOffset: { width: 0, height: scale(8) }
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { sessionId, setSessionId } = useChatStore();

  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [myTranscript, setMyTranscript] = useState("마이크를 눌러 편하게 이야기해 보세요.");
  const [aiMessage, setAiMessage] = useState(``);

  useEffect(() => {
    // 만약 아직 아무 대화도 하지 않은 상태(초기 인사 상태)라면 닉네임 변화를 반영합니다.
    // (대화 도중에 갑자기 인사가 바뀌면 이상하니까요!)
    if (!isLoading && (aiMessage === "" || aiMessage.includes("안녕") && aiMessage.includes("어땠어?"))) {
      setAiMessage(`안녕, ${user?.nickname || "친구"}!\n오늘 하루는 어땠어?`);
    }
  }, [user?.nickname]); // 🚨 user.nickname이 바뀔 때마다 실행됩니다!

  const getProfileImage = (seq?: number) => {
    switch (seq) {
      case 1: return require('../../assets/images/characters/Hamster.png');
      case 2: return require('../../assets/images/characters/Fox.png');
      case 3: return require('../../assets/images/characters/Bear.png');
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

  // ✨ 최신 API 명세에 맞춰 완벽하게 수정된 전송 로직
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);

    try {
      // 🚨 1. API 요청 시 키값을 sessionSeq로 맞춰서 보냅니다.
      // (store에서 가져온 sessionId 값을 sessionSeq라는 이름표를 붙여 전송)
      const response = await chatApi.sendMessage({ sessionSeq: sessionId, content: text });

      const resultData = response.result as any;

      // 🚨 2. 응답 데이터에서 메시지 꺼내기 (result.message.content)
      const aiReply = resultData?.message?.content || "응답을 이해하지 못했어요.";

      // 🚨 3. 새로 발급된 방 번호 확인 및 업데이트 (resultData.sessionSeq)
      if (resultData?.sessionSeq && resultData.sessionSeq !== sessionId) {
        setSessionId(resultData.sessionSeq);
      }

      setAiMessage(aiReply);
    } catch (error) {
      setAiMessage("서버 연결이 불안정해요.\n다시 말해줄래? 😢");
    } finally {
      setIsLoading(false);
      setMyTranscript("터치해서 다시 말하기");
    }
  };

  // ✨ 음성 인식 로직이 들어갈 뼈대 함수
  const toggleListening = () => {
    if (isLoading) return;

    if (isListening) {
      // TODO: 음성 인식 중지 및 결과 텍스트 전송 로직
      setIsListening(false);
      const mockText = "오늘 진짜 뿌듯한 하루였어!"; // (임시) 나중에 실제 변환된 텍스트로 교체
      setMyTranscript(mockText);
      handleSendMessage(mockText);
    } else {
      // TODO: 마이크 권한 확인 및 음성 인식 시작 로직
      setIsListening(true);
      setMyTranscript("듣고 있어요... 👂");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <View className="flex-row justify-end px-6 pt-4 z-20">
        <TouchableOpacity
          onPress={() => router.push('/chat/keyboard-chat')}
          activeOpacity={0.7}
          style={{ width: scale(48), height: scale(48) }}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full items-center justify-center shadow-sm"
        >
          <MaterialIcons name="keyboard" size={scale(24)} color="#64748B" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-center px-6 -mt-8">
        <View style={{ minHeight: scale(120), marginBottom: scale(32) }} className="justify-center items-center w-full">
          <Text
            className="font-extrabold text-slate-900 dark:text-white text-center tracking-tight"
            style={{ fontSize: scale(28), lineHeight: scale(42) }}
            allowFontScaling={false}
          >
            {isLoading ? "버디가 생각하는 중..." : aiMessage}
          </Text>
        </View>

        <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%', maxWidth: scale(280), aspectRatio: 1 }} className="items-center justify-center relative">
          <View className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 ${isListening ? 'bg-primary-100/80 dark:bg-primary-900/40 scale-110' : 'bg-transparent scale-100'}`} />
          <Image source={currentProfileImg} style={{ width: scale(220), height: scale(220), zIndex: 10 }} contentFit="contain" />
          <View
            className="absolute bg-slate-200/50 dark:bg-slate-800/50 rounded-[100%] blur-md"
            style={{ width: scale(160), height: scale(32), bottom: scale(16), transform: [{ scaleY: 0.5 }] }}
          />
        </Animated.View>
      </View>

      <View className="px-6 pb-12 pt-6 items-center">
        <Text
          className={`font-bold text-center transition-colors duration-300 ${isListening ? "text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-500"}`}
          style={{ fontSize: scale(15), marginBottom: scale(40) }}
          allowFontScaling={false}
        >
          {isListening ? `"${myTranscript}"` : myTranscript}
        </Text>

        <TouchableOpacity
          onPress={toggleListening}
          disabled={isLoading}
          activeOpacity={0.7}
          className={`rounded-full items-center justify-center transition-colors duration-300 z-20 ${isLoading ? "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" : isListening ? "bg-red-500" : "bg-primary-600"}`}
          style={[isLoading ? {} : safeShadow, { width: scale(80), height: scale(80) }]}
        >
          <Ionicons
            name={isLoading ? "ellipsis-horizontal" : (isListening ? "stop" : "mic")}
            size={scale(32)}
            color={isLoading ? "#94A3B8" : "white"}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}