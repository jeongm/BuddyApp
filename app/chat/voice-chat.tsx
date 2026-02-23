import { Ionicons } from '@expo/vector-icons';
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { chatApi } from "../../api/chatApi";
import { IS_TEST_MODE } from "../../config";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";

export default function VoiceChatScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { sessionId, setSessionId } = useChatStore();

    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [myTranscript, setMyTranscript] = useState("마이크 버튼을 눌러 대화를 시작해보세요.");
    const [aiMessage, setAiMessage] = useState(`안녕, ${user?.nickname || "친구"}! 오늘 하루는 어땠어?`);

    const getProfileImage = (seq?: number) => {
        switch (seq) {
            case 1: return require('../../assets/images/characters/Hamster.png');
            case 2: return require('../../assets/images/characters/Fox.png');
            case 3: return require('../../assets/images/characters/Panda.png');
            default: return require('../../assets/images/characters/Hamster.png');
        }
    };
    const currentProfileImg = getProfileImage(user?.characterSeq);

    // [임시] 앱 전용 TTS(음성 출력) 모듈 연동 전까지는 콘솔 출력
    const speak = (text: string) => {
        console.log(`[🗣️ 챗봇 음성 출력]: ${text}`);
    };

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
                const response = await chatApi.sendMessage({
                    sessionId: sessionId,
                    content: text
                });
                aiReply = response.result.content;
                if (response.result.sessionId && response.result.sessionId !== sessionId) {
                    setSessionId(response.result.sessionId);
                }
            }
            setAiMessage(aiReply);
            speak(aiReply);
        } catch (error) {
            setAiMessage("서버 연결이 불안정해요. 😢");
        } finally {
            setIsLoading(false);
            setMyTranscript("마이크 버튼을 눌러 대답하기");
        }
    };

    // [임시] 앱에서는 window.SpeechRecognition 대신 터치로 모의 작동
    const toggleListening = () => {
        if (isLoading) return;

        if (isListening) {
            // 녹음 끝 (모의 데이터 전송)
            setIsListening(false);
            const mockText = "오늘 하루 정말 힘들었어."; // 실제 음성 인식 텍스트 대체
            setMyTranscript(mockText);
            handleSendMessage(mockText);
        } else {
            // 녹음 시작
            setIsListening(true);
            setMyTranscript("듣고 있어요... 👂 (다시 누르면 전송)");
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
            <Stack.Screen options={{ headerShown: false }} />
            {/* 상단 버튼 영역 */}
            <View className="flex-row justify-between items-center px-4 pt-4 z-20">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center gap-1 bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full shadow-sm"
                >
                    <Ionicons name="arrow-back" size={16} color="#64748b" />
                    <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">뒤로</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push('/chat/keyboard-chat')}
                    className="flex-row items-center gap-1 bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full shadow-sm border border-primary-100 dark:border-slate-700"
                >
                    <Text className="text-sm font-bold text-primary-600 dark:text-primary-400">키보드 대화 ⌨️</Text>
                </TouchableOpacity>
            </View>

            {/* 상단 텍스트 (AI 메시지) */}
            <View className="mt-12 px-8 items-center">
                <Text className="text-xl font-bold text-slate-800 dark:text-white text-center leading-8">
                    {isLoading ? "생각하는 중... 🤔" : aiMessage}
                </Text>
            </View>

            {/* 캐릭터 이미지 (가운데) */}
            <View className="flex-1 items-center justify-center relative w-full pb-8">
                {isListening && (
                    <View className="absolute items-center justify-center">
                        {/* 핑 애니메이션 효과 흉내 */}
                        <View className="absolute w-56 h-56 bg-primary-100/50 dark:bg-primary-900/30 rounded-full" />
                        <View className="absolute w-40 h-40 bg-primary-200/50 dark:bg-primary-800/30 rounded-full" />
                    </View>
                )}

                <View className={isListening ? "scale-110" : "scale-100"}>
                    <Image
                        source={currentProfileImg}
                        style={{ width: 192, height: 192 }}
                        contentFit="contain"
                    />
                </View>
            </View>

            {/* 하단 컨트롤 영역 */}
            <View className="mx-4 mb-6 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] p-6 items-center shadow-lg">

                {/* 텍스트 표시 박스 */}
                <View className="w-full min-h-[50px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl p-4 items-center justify-center mb-5">
                    <Text className={`text-sm font-medium text-center ${isListening ? "text-primary-600 dark:text-primary-400" : "text-slate-700 dark:text-slate-200"}`}>
                        {isListening ? `"${myTranscript}"` : myTranscript}
                    </Text>
                </View>

                {/* 마이크 버튼 */}
                <TouchableOpacity
                    onPress={toggleListening}
                    disabled={isLoading}
                    activeOpacity={0.8}
                    className={`w-16 h-16 rounded-full items-center justify-center shadow-md mb-4
                        ${isLoading ? "bg-slate-300 dark:bg-slate-600" : (isListening ? "bg-red-500" : "bg-primary-600")}
                    `}
                    style={isListening ? { borderWidth: 4, borderColor: 'rgba(254, 226, 226, 0.5)' } : {}}
                >
                    <Text className="text-2xl">{isLoading ? "⏳" : (isListening ? "⏹" : "🎙️")}</Text>
                </TouchableOpacity>

                {/* 하단 안내 */}
                <Text className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {isLoading ? "대답을 준비하고 있어요" : (isListening ? "말이 끝나면 한 번 더 눌러주세요" : "터치해서 말하기")}
                </Text>
            </View>
        </SafeAreaView>
    );
}