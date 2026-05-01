import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { Image } from "expo-image";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Dimensions, Modal, TouchableOpacity, View, useColorScheme } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
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
import { ACCENT_HEX_COLORS, useThemeStore } from "../../store/useThemeStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = (size: number) => Math.round((SCREEN_WIDTH / 430) * size);

const safeShadow = {
  elevation: 8,
  shadowColor: '#000',
  shadowOpacity: 0.15,
  shadowRadius: scale(16),
  shadowOffset: { width: 0, height: scale(8) }
};

const SILENCE_TIMEOUT_MS = 1500;
const SWIPE_THRESHOLD = scale(80);

// ─────────────────────────────────────────────────────────────────────────────
// ActionBarSwipeMic 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
interface ActionBarSwipeMicProps {
  isListening: boolean;
  isLoading: boolean;
  myTranscript: string;
  sessionId: number;
  accentHex: string;
  onToggleListening: () => void;
  onGoToKeyboardChat: () => void;
  onGoToDiary: () => void;
}

function ActionBarSwipeMic({
  isListening,
  isLoading,
  myTranscript,
  sessionId,
  accentHex,
  onToggleListening,
  onGoToKeyboardChat,
  onGoToDiary,
}: ActionBarSwipeMicProps) {
  const translateX = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const leftChevron1 = useSharedValue(0.15);
  const leftChevron2 = useSharedValue(0.15);
  const leftChevron3 = useSharedValue(0.15);
  const rightChevron1 = useSharedValue(0.15);
  const rightChevron2 = useSharedValue(0.15);
  const rightChevron3 = useSharedValue(0.15);

  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 900 }),
          withTiming(1, { duration: 900 })
        ),
        -1, false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isListening]);

  useEffect(() => {
    if (!isListening && !isLoading) {
      leftChevron3.value = withRepeat(withSequence(withTiming(0.6, { duration: 500 }), withTiming(0.15, { duration: 700 })), -1, false);
      leftChevron2.value = withRepeat(withSequence(withTiming(0.15, { duration: 200 }), withTiming(0.6, { duration: 500 }), withTiming(0.15, { duration: 500 })), -1, false);
      leftChevron1.value = withRepeat(withSequence(withTiming(0.15, { duration: 400 }), withTiming(0.6, { duration: 500 }), withTiming(0.15, { duration: 300 })), -1, false);
      rightChevron1.value = withRepeat(withSequence(withTiming(0.6, { duration: 500 }), withTiming(0.15, { duration: 700 })), -1, false);
      rightChevron2.value = withRepeat(withSequence(withTiming(0.15, { duration: 200 }), withTiming(0.6, { duration: 500 }), withTiming(0.15, { duration: 500 })), -1, false);
      rightChevron3.value = withRepeat(withSequence(withTiming(0.15, { duration: 400 }), withTiming(0.6, { duration: 500 }), withTiming(0.15, { duration: 300 })), -1, false);
    } else {
      leftChevron1.value = withTiming(0, { duration: 200 });
      leftChevron2.value = withTiming(0, { duration: 200 });
      leftChevron3.value = withTiming(0, { duration: 200 });
      rightChevron1.value = withTiming(0, { duration: 200 });
      rightChevron2.value = withTiming(0, { duration: 200 });
      rightChevron3.value = withTiming(0, { duration: 200 });
    }
  }, [isListening, isLoading]);

  const panGesture = Gesture.Pan()
    .enabled(!isLoading && !isListening)
    .onUpdate((e) => {
      translateX.value = Math.max(-SWIPE_THRESHOLD * 1.2, Math.min(SWIPE_THRESHOLD * 1.2, e.translationX));
    })
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD) runOnJS(onGoToKeyboardChat)();
      else if (e.translationX > SWIPE_THRESHOLD) runOnJS(onGoToDiary)();
      translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
    });

  const tapGesture = Gesture.Tap()
    .enabled(!isLoading)
    .onEnd(() => { runOnJS(onToggleListening)(); });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: pulseScale.value }],
  }));

  const micBgStyle = useAnimatedStyle(() => ({
    backgroundColor: isListening ? '#EF4444' : (isLoading ? '#E2E8F0' : interpolateColor(
      translateX.value, [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD], ['#6366F1', accentHex, '#10B981']
    )),
  }));

  const leftHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, -20, 0], [1, 0.85, 0.7]),
    transform: [{ scale: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1.1, 1]) }],
  }));

  const rightHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 20, SWIPE_THRESHOLD], [0.7, 0.85, 1]),
    transform: [{ scale: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [1, 1.1]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: isLoading ? 0 : interpolate(Math.abs(translateX.value), [0, SWIPE_THRESHOLD], [0.25, 0.5]),
  }));

  const leftChevron1Style = useAnimatedStyle(() => ({ opacity: leftChevron1.value }));
  const leftChevron2Style = useAnimatedStyle(() => ({ opacity: leftChevron2.value }));
  const leftChevron3Style = useAnimatedStyle(() => ({ opacity: leftChevron3.value }));
  const rightChevron1Style = useAnimatedStyle(() => ({ opacity: rightChevron1.value }));
  const rightChevron2Style = useAnimatedStyle(() => ({ opacity: rightChevron2.value }));
  const rightChevron3Style = useAnimatedStyle(() => ({ opacity: rightChevron3.value }));

  return (
    <View className="px-6 pb-12 pt-6 items-center w-full">
      {/* 유저 트랜스크립트 텍스트 */}
      <Text
        className={`font-bold text-center w-full ${!isListening ? "text-slate-400 dark:text-slate-500" : ""}`}
        style={{
          fontSize: scale(15),
          marginBottom: scale(40),
          paddingHorizontal: scale(10),
          color: isListening ? accentHex : undefined,
        }}
        numberOfLines={2}
        ellipsizeMode="tail"
        allowFontScaling={false}
      >
        {isListening ? `"${myTranscript}"` : myTranscript}
      </Text>

      {/* 스와이프 마이크 행 */}
      <View className="flex-row items-center justify-center w-full">

        {/* 왼쪽: 채팅 힌트 */}
        <Animated.View style={[leftHintStyle, { alignItems: 'center', width: scale(60), paddingTop: scale(10) }]}>
          <View
            className="bg-indigo-50 dark:bg-indigo-900/30 rounded-full items-center justify-center"
            style={{ width: scale(42), height: scale(42), marginBottom: scale(6) }}
          >
            <Ionicons name="chatbubble-outline" size={scale(18)} color="#4F46E5" />
          </View>
          <Text className="text-indigo-600 dark:text-indigo-400 font-semibold" style={{ fontSize: scale(11) }} allowFontScaling={false}>
            채팅
          </Text>
        </Animated.View>

        {/* 왼쪽 쉐브론 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: scale(8) }}>
          <Animated.View style={leftChevron1Style}><Ionicons name="chevron-back" size={scale(13)} color="#64748B" /></Animated.View>
          <Animated.View style={[leftChevron2Style, { marginLeft: -scale(4) }]}><Ionicons name="chevron-back" size={scale(14)} color="#64748B" /></Animated.View>
          <Animated.View style={[leftChevron3Style, { marginLeft: -scale(4) }]}><Ionicons name="chevron-back" size={scale(15)} color="#64748B" /></Animated.View>
        </View>

        {/* 마이크 버튼 */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[micAnimatedStyle, micBgStyle, glowStyle, {
              width: scale(80), height: scale(80), borderRadius: scale(40),
              alignItems: 'center', justifyContent: 'center',
              shadowColor: accentHex, shadowRadius: scale(20),
              shadowOffset: { width: 0, height: scale(8) },
              elevation: isLoading ? 0 : 8,
            }]}
          >
            <Ionicons
              name={isLoading ? "ellipsis-horizontal" : (isListening ? "stop" : "mic")}
              size={scale(32)}
              color={isLoading ? "#94A3B8" : "white"}
            />
          </Animated.View>
        </GestureDetector>

        {/* 오른쪽 쉐브론 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: scale(8) }}>
          <Animated.View style={rightChevron1Style}><Ionicons name="chevron-forward" size={scale(15)} color="#64748B" /></Animated.View>
          <Animated.View style={[rightChevron2Style, { marginLeft: -scale(4) }]}><Ionicons name="chevron-forward" size={scale(14)} color="#64748B" /></Animated.View>
          <Animated.View style={[rightChevron3Style, { marginLeft: -scale(4) }]}><Ionicons name="chevron-forward" size={scale(13)} color="#64748B" /></Animated.View>
        </View>

        {/* 오른쪽: 일기 힌트 */}
        <Animated.View style={[rightHintStyle, { alignItems: 'center', width: scale(60), paddingTop: scale(10) }]}>
          <View
            className={`rounded-full items-center justify-center ${sessionId === 0 ? 'bg-slate-100 dark:bg-slate-800' : 'bg-emerald-50 dark:bg-emerald-900/30'}`}
            style={{ width: scale(42), height: scale(42), marginBottom: scale(6) }}
          >
            <Ionicons name="pencil-outline" size={scale(18)} color={sessionId === 0 ? "#64748B" : "#059669"} />
          </View>
          <Text
            className={`font-semibold ${sessionId === 0 ? "text-slate-600 dark:text-slate-400" : "text-emerald-600 dark:text-emerald-400"}`}
            style={{ fontSize: scale(11) }}
            allowFontScaling={false}
          >
            일기
          </Text>
        </Animated.View>

      </View>
    </View>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const params = useLocalSearchParams();
  const isNewUser = params.isNewUser === 'true';

  const { user, refreshUser } = useAuthStore();
  const { sessionId, setSessionId } = useChatStore();
  const { pushToken } = usePushNotifications();

  const { accent } = useThemeStore();
  const accentHex = ACCENT_HEX_COLORS[accent] || '#0EA5E9';

  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [myTranscript, setMyTranscript] = useState("마이크를 눌러 편하게 이야기해 보세요.");
  const [aiMessage, setAiMessage] = useState("");
  const [recognizedText, setRecognizedText] = useState("");

  const recognizedTextRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showNightModal, setShowNightModal] = useState(false);
  const [isDailyAgreed, setIsDailyAgreed] = useState(false);

  const charPulseScale = useSharedValue(1);
  const charGlowScale = useSharedValue(1);
  const charGlowOpacity = useSharedValue(0);

  const charPulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: charPulseScale.value }],
  }));

  const charGlowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: charGlowOpacity.value,
    transform: [{ scale: charGlowScale.value }],
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
        if (isDailyAgreed) {
          await notificationApi.updateDaily(true);
        }
      }
    } catch (error) {
      console.error("❌ 알림 설정 실패:", error);
    }
  };

  useEffect(() => {
    if (pushToken && user) {
      memberApi.updatePushToken(pushToken).catch((error) => console.error("❌ 푸시 토큰 전송 실패:", error));
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

  useEffect(() => {
    if (isListening) {
      charPulseScale.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1, false
      );
      charGlowOpacity.value = withTiming(0.6, { duration: 500 });
      charGlowScale.value = withRepeat(
        withSequence(withTiming(1.15, { duration: 1200 }), withTiming(1.05, { duration: 1200 })),
        -1, true
      );
    } else {
      cancelAnimation(charPulseScale);
      charPulseScale.value = withTiming(1, { duration: 200 });
      cancelAnimation(charGlowScale);
      charGlowOpacity.value = withTiming(0, { duration: 300 });
      charGlowScale.value = withTiming(1, { duration: 300 });
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
      ExpoSpeechRecognitionModule.start({ lang: "ko-KR", interimResults: true });
    }
  };

  const isAiMessageLong = aiMessage.length > 20;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
        <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

        {/* 상단: 키보드 버튼 - 고정 높이
        <View className="flex-row justify-end items-center px-6 w-full" style={{ height: scale(60) }}>
          <TouchableOpacity
            onPress={() => router.push('/chat/keyboard-chat')}
            activeOpacity={0.7}
            style={{ width: scale(48), height: scale(48) }}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full items-center justify-center"
          >
            <MaterialIcons name="keyboard" size={scale(24)} color="#64748B" />
          </TouchableOpacity>
        </View> */}

        {/* AI 텍스트 - flex-1로 남은 공간 차지하며 중앙정렬 */}
        <View className="flex-1 items-center justify-center px-6">
          <Text
            className="font-extrabold text-slate-900 dark:text-white text-center tracking-tight"
            style={{
              fontSize: isAiMessageLong ? scale(20) : scale(28),
              lineHeight: isAiMessageLong ? scale(30) : scale(42),
            }}
            allowFontScaling={false}
          >
            {isLoading ? "버디가 생각하는 중..." : aiMessage}
          </Text>
        </View>

        {/* 캐릭터 이미지 - 고정 높이 */}
        <View className="items-center justify-center" style={{ height: scale(280), marginBottom: scale(60) }}>
          <Animated.View
            style={[{ width: scale(280), aspectRatio: 1 }, charPulseAnimatedStyle]}
            className="items-center justify-center relative"
          >
            {/* 글로우 */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: scale(140),
                  backgroundColor: `${accentHex}4D`,
                },
                charGlowAnimatedStyle,
              ]}
            />
            <Image
              source={currentProfileImg}
              style={{ width: scale(220), height: scale(220), zIndex: 10 }}
              contentFit="contain"
            />
            {/* 바닥 그림자 */}
            <View
              className="absolute bg-slate-200/50 dark:bg-slate-800/50 rounded-[100%] blur-md"
              style={{ width: scale(160), height: scale(32), bottom: scale(-5), transform: [{ scaleY: 0.5 }] }}
            />
          </Animated.View>
        </View>

        {/* 하단: 스와이프 마이크 액션바 - 고정 */}
        <ActionBarSwipeMic
          isListening={isListening}
          isLoading={isLoading}
          myTranscript={myTranscript}
          sessionId={sessionId}
          accentHex={accentHex}
          onToggleListening={toggleListening}
          onGoToKeyboardChat={() => router.push('/chat/keyboard-chat')}
          onGoToDiary={() => {
            if (sessionId === 0) {
              Alert.alert("알림", "버디와 대화를 먼저 나누어주세요!");
              return;
            }
            router.push({
              pathname: '/diary-screen/editor',
              params: { sessionId: sessionId, mode: 'create', origin: 'home' }
            });
          }}
        />

        {/* 야간 알림 모달 */}
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
    </GestureHandlerRootView>
  );
}