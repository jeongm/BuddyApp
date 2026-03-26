import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { Image } from "expo-image";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import React, { useCallback, useEffect, useRef, useState } from "react";
// ✅ react-native의 Animated 제거, reanimated로 교체
import { Dimensions, Modal, TouchableOpacity, View, useColorScheme } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from "react-native-safe-area-context";

import { notificationApi } from "@/api/notificationApi";
import { chatApi } from "../../api/chatApi";
import { memberApi } from "../../api/memberApi";
import { AppText as Text } from '../../components/AppText';
import { usePushNotifications } from '../../hooks/usePushNotifications';
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

const SILENCE_TIMEOUT_MS = 1500;

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const params = useLocalSearchParams();
  const isNewUser = params.isNewUser === 'true';

  const { user, refreshUser } = useAuthStore();
  const { sessionId, setSessionId } = useChatStore();
  const { pushToken } = usePushNotifications();

  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [myTranscript, setMyTranscript] = useState("마이크를 눌러 편하게 이야기해 보세요.");
  const [aiMessage, setAiMessage] = useState("");
  const [recognizedText, setRecognizedText] = useState("");

  const recognizedTextRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showNightModal, setShowNightModal] = useState(false);
  const [isDailyAgreed, setIsDailyAgreed] = useState(false);

  // ✅ reanimated SharedValue로 교체
  const pulseScale = useSharedValue(1);

  // ✅ reanimated AnimatedStyle
  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const updateRecognizedText = (text: string) => {
    recognizedTextRef.current = text;
    setRecognizedText(text);
  };

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  useSpeechRecognitionEvent("start", () => {
    setIsListening(true);
    clearSilenceTimer();
    Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
  });

  useSpeechRecognitionEvent("end", () => {
    clearSilenceTimer();
    setIsListening(false);
    if (recognizedTextRef.current.trim().length > 0) {
      handleSendMessage(recognizedTextRef.current);
      recognizedTextRef.current = "";
      setRecognizedText("");
    } else {
      setMyTranscript("듣지 못했어요. 다시 말해주세요!");
    }
  });

  useSpeechRecognitionEvent("error", () => {
    clearSilenceTimer();
    setIsListening(false);
    setMyTranscript("잘 듣지 못했어요. 다시 시도해 주세요!");
    Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
  });

  useSpeechRecognitionEvent("result", (event) => {
    if (event.results?.[0]?.transcript) {
      setMyTranscript(event.results[0].transcript);
      updateRecognizedText(event.results[0].transcript);
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        ExpoSpeechRecognitionModule.stop();
      }, SILENCE_TIMEOUT_MS);
    }
  });

  useEffect(() => {
    if (isNewUser) {
      setTimeout(() => setShowNightModal(true), 500);
    }
  }, [isNewUser]);

  const handleNotificationSubmit = async (accepted: boolean) => {
    setShowNightModal(false);
    try {
      if (accepted) {
        await notificationApi.updateNight(true);
        console.log("✅ 야간 알림 설정 완료");
        if (isDailyAgreed) {
          await notificationApi.updateDaily(true);
          console.log("✅ 데일리 알림 설정 완료");
        }
      }
    } catch (error) {
      console.error("❌ 알림 설정 실패:", error);
    }
  };

  useEffect(() => {
    if (pushToken && user) {
      memberApi.updatePushToken(pushToken)
        .then(() => console.log('✅ 토큰 전송 완료!'))
        .catch((error) => console.error("❌ 푸시 토큰 전송 실패:", error));
    }
  }, [pushToken, user]);

  useFocusEffect(
    useCallback(() => {
      refreshUser();

      const syncLatestChat = async () => {
        if (sessionId === 0) {
          setAiMessage(`안녕, ${user?.nickname || "친구"}!\n오늘 하루는 어땠어?`);
          setMyTranscript("마이크를 눌러 편하게 이야기해 보세요.");
          return;
        }
        try {
          const res = await chatApi.getChatHistory(sessionId);
          const resultData = res?.result as any;

          if (resultData?.messages && Array.isArray(resultData.messages)) {
            const sortedMessages = [...resultData.messages].sort((a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            const lastAiMsg = sortedMessages.find((m: any) => (m.role || "").toUpperCase() !== "USER");
            if (lastAiMsg) setAiMessage(lastAiMsg.content);

            const lastUserMsg = sortedMessages.find((m: any) => (m.role || "").toUpperCase() === "USER");
            setMyTranscript(lastUserMsg ? lastUserMsg.content : "마이크를 눌러 편하게 이야기해 보세요.");
          }
        } catch (error: any) {
          if (String(error).includes("404")) {
            setSessionId(0);
            setAiMessage(`안녕, ${user?.nickname || "친구"}!\n오늘 하루는 어땠어?`);
            setMyTranscript("마이크를 눌러 편하게 이야기해 보세요.");
          }
        }
      };
      syncLatestChat();

      return () => clearSilenceTimer();
    }, [sessionId, user?.nickname, refreshUser])
  );

  const currentProfileImg = (() => {
    switch (user?.characterId) {
      case 1: return require('../../assets/images/characters/Hamster.webp');
      case 2: return require('../../assets/images/characters/Fox.webp');
      case 3: return require('../../assets/images/characters/Bear.webp');
      default: return require('../../assets/images/characters/Hamster.webp');
    }
  })();

  // ✅ reanimated로 교체 - release 빌드에서도 안정적으로 작동
  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1, // 무한 반복
        false
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isListening]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage({ sessionId: sessionId, content: text });
      const resultData = response.result as any;

      if (resultData?.sessionId && resultData.sessionId !== sessionId) {
        setSessionId(resultData.sessionId);
      }
      setAiMessage(resultData?.message?.content || "응답을 이해하지 못했어요.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      if (String(error).includes("404")) {
        setSessionId(0);
        setAiMessage("앗, 대화방 시간이 만료되었어!\n다시 말을 걸어줄래?");
      } else {
        setAiMessage("서버 연결이 불안정해요.\n다시 말해줄래? 😢");
      }
    } finally {
      setIsLoading(false);
      setRecognizedText("");
    }
  };

  const toggleListening = async () => {
    if (isLoading) return;

    if (isListening) {
      clearSilenceTimer();
      ExpoSpeechRecognitionModule.stop();
    } else {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        setMyTranscript("마이크 권한이 필요해요. 설정에서 허용해 주세요!");
        return;
      }
      recognizedTextRef.current = "";
      setRecognizedText("");
      setMyTranscript("듣고 있어요... 👂");
      ExpoSpeechRecognitionModule.start({
        lang: "ko-KR",
        interimResults: true,
      });
    }
  };

  const isAiMessageLong = aiMessage.length > 20;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      {/* 키보드 버튼 - 고정 */}
      <View className="flex-row justify-end items-center px-6 w-full" style={{ height: scale(60) }}>
        <TouchableOpacity
          onPress={() => router.push('/chat/keyboard-chat')}
          activeOpacity={0.7}
          style={{ width: scale(48), height: scale(48) }}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full items-center justify-center shadow-sm"
        >
          <MaterialIcons name="keyboard" size={scale(24)} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* AI 텍스트 - 키보드 버튼 아래 ~ 캐릭터 위 공간에서 상하좌우 중앙정렬 */}
      <View className="flex-1 items-center justify-center px-6">
        <Text
          className="font-extrabold text-slate-900 dark:text-white text-center tracking-tight"
          style={{ fontSize: isAiMessageLong ? scale(20) : scale(28), lineHeight: isAiMessageLong ? scale(30) : scale(42) }}
          allowFontScaling={false}
        >
          {isLoading ? "버디가 생각하는 중..." : aiMessage}
        </Text>
      </View>

      {/* 캐릭터 이미지 - 고정 */}
      <View className="items-center justify-center" style={{ height: scale(280), marginBottom: scale(60) }}>
        {/* ✅ reanimated Animated.View + useAnimatedStyle 적용 */}
        <Animated.View
          style={[{ width: scale(280), aspectRatio: 1 }, pulseAnimatedStyle]}
          className="items-center justify-center relative"
        >
          <View className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 ${isListening ? 'bg-primary-500/30 scale-110' : 'bg-transparent scale-100'}`} />
          <Image source={currentProfileImg} style={{ width: scale(220), height: scale(220), zIndex: 10 }} contentFit="contain" />
          <View
            className="absolute bg-slate-200/50 dark:bg-slate-800/50 rounded-[100%] blur-md"
            style={{ width: scale(160), height: scale(32), bottom: scale(-5), transform: [{ scaleY: 0.5 }] }}
          />
        </Animated.View>
      </View>

      {/* 유저 텍스트 + 마이크 버튼 - 고정 */}
      <View className="px-6 pb-12 pt-6 items-center w-full">
        <Text
          className={`font-bold text-center transition-colors duration-300 w-full ${isListening ? "text-primary-500" : "text-slate-400 dark:text-slate-500"}`}
          style={{ fontSize: scale(15), marginBottom: scale(40), paddingHorizontal: scale(10) }}
          numberOfLines={2}
          ellipsizeMode="tail"
          allowFontScaling={false}
        >
          {isListening ? `"${myTranscript}"` : myTranscript}
        </Text>

        <TouchableOpacity
          onPress={toggleListening}
          disabled={isLoading}
          activeOpacity={0.8}
          className={`items-center justify-center transition-all duration-300 z-20 
                    ${isLoading
              ? "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full"
              : isListening
                ? "bg-red-500 rounded-[24px] scale-95"
                : "bg-primary-500 rounded-full scale-100"}`}
          style={[isLoading ? {} : safeShadow, { width: scale(80), height: scale(80) }]}
        >
          <Ionicons
            name={isLoading ? "ellipsis-horizontal" : (isListening ? "stop" : "mic")}
            size={scale(32)}
            color={isLoading ? "#94A3B8" : "white"}
          />
        </TouchableOpacity>
      </View>

      <Modal visible={showNightModal} transparent={true} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white dark:bg-slate-900 w-full rounded-[2rem] p-8 items-center" style={safeShadow}>

            <View className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mb-5">
              <Ionicons name="moon" size={scale(32)} color="#F59E0B" />
            </View>

            <Text className="font-black text-slate-900 dark:text-white text-center mb-3" style={{ fontSize: scale(22) }} allowFontScaling={false}>
              버디의 밤인사 받기 🌙
            </Text>

            <Text className="font-medium text-slate-500 dark:text-slate-400 text-center mb-6" style={{ fontSize: scale(14), lineHeight: scale(22) }} allowFontScaling={false}>
              늦은 밤(21시~08시)에도 버디가 안부를 묻고 위로의 말을 건넬 수 있도록 알림을 허용하시겠어요?
            </Text>

            <TouchableOpacity
              onPress={() => setIsDailyAgreed(prev => !prev)}
              activeOpacity={0.7}
              className="flex-row items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl w-full mb-8 border border-slate-100 dark:border-slate-800"
            >
              <View className={`w-5 h-5 rounded-md border-2 items-center justify-center mr-3 ${isDailyAgreed ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white' : 'bg-transparent border-slate-300 dark:border-slate-600'}`}>
                {isDailyAgreed && <Ionicons name="checkmark" size={scale(14)} color={colorScheme === 'dark' ? '#0F172A' : '#FFFFFF'} />}
              </View>
              <Text className="font-bold text-slate-700 dark:text-slate-300" style={{ fontSize: scale(13) }} allowFontScaling={false}>
                [선택] 버디의 데일리 안부도 받을게요 💌
              </Text>
            </TouchableOpacity>

            <View className="w-full" style={{ gap: scale(10) }}>
              <TouchableOpacity
                onPress={() => handleNotificationSubmit(true)}
                activeOpacity={0.8}
                className="w-full bg-slate-900 dark:bg-white rounded-2xl items-center justify-center"
                style={{ height: scale(56) }}
              >
                <Text className="font-extrabold text-white dark:text-slate-900" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                  네, 받을게요!
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleNotificationSubmit(false)}
                activeOpacity={0.8}
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl items-center justify-center"
                style={{ height: scale(56) }}
              >
                <Text className="font-bold text-slate-500 dark:text-slate-400" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                  나중에 할게요
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}