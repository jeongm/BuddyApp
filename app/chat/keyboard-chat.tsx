import { Ionicons } from '@expo/vector-icons';
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { chatApi } from "../../api/chatApi";
import { IS_TEST_MODE } from "../../config";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";

interface Message {
    id: number;
    text: string;
    sender: "user" | "character";
    timestamp: Date;
}

export default function KeyboardChatScreen() {
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const { user } = useAuthStore();
    const { sessionId, setSessionId } = useChatStore();

    const myNickname = user?.nickname || "친구";
    const myBuddyName = user?.characterNickname || "Buddy";

    const getProfileImage = (seq?: number) => {
        switch (seq) {
            case 1: return require('../../assets/images/characters/Hamster.png');
            case 2: return require('../../assets/images/characters/Fox.png');
            case 3: return require('../../assets/images/characters/Panda.png');
            default: return require('../../assets/images/characters/Hamster.png');
        }
    };
    const currentProfileImg = getProfileImage(user?.characterSeq);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    // ✨ 핵심 버그 수정: 버튼 중복 터치 방지를 위한 잠금 장치(Lock)
    const [isEnding, setIsEnding] = useState(false);
    const isEndingRef = useRef(false);

    useEffect(() => {
        const loadHistory = async () => {
            if (sessionId === 0) {
                setMessages([{ id: 1, text: `안녕, ${myNickname}! 오늘 하루는 어땠어?`, sender: "character", timestamp: new Date() }]);
                return;
            }
            try {
                const res = await chatApi.getChatHistory(sessionId);
                if (res && Array.isArray(res.result)) {
                    const formattedMessages: Message[] = res.result.map((item: any) => ({
                        id: item.messageSeq || Math.random(),
                        text: item.content,
                        sender: (item.role || "").toUpperCase() === "USER" ? "user" : "character",
                        timestamp: new Date(item.createdAt)
                    }));
                    formattedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
                    setMessages(formattedMessages);
                }
            } catch (error) {
                console.error("이전 대화 불러오기 실패", error);
            }
        };
        loadHistory();
    }, [sessionId]);

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: 'numeric', hour12: true }).format(date);
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || isTyping || isEnding) return;
        const userText = inputText;
        setMessages((prev) => [...prev, { id: Date.now(), text: userText, sender: "user", timestamp: new Date() }]);
        setInputText("");
        setIsTyping(true);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            if (IS_TEST_MODE) {
                await new Promise(r => setTimeout(r, 1000));
                setMessages((prev) => [...prev, { id: Date.now() + 1, text: "열심히 들어주고 있어요!", sender: "character", timestamp: new Date() }]);
                if (sessionId === 0) setSessionId(999);
            } else {
                const requestSessionId = sessionId === 0 ? 0 : sessionId;
                const response = await chatApi.sendMessage({ sessionId: requestSessionId, content: userText });
                if (response.result.sessionId && response.result.sessionId !== sessionId) setSessionId(response.result.sessionId);
                setMessages((prev) => [...prev, { id: Date.now() + 1, text: response.result.content, sender: "character", timestamp: new Date(response.result.createdAt) }]);
            }
        } catch (error) {
            setMessages((prev) => [...prev, { id: Date.now() + 1, text: "서버 오류가 발생했어요. 😢", sender: "character", timestamp: new Date() }]);
        } finally {
            setIsTyping(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const handleEndConversation = () => {
        if (isEndingRef.current) return; // ✨ 절대 잠금: 이미 눌렸으면 무조건 튕겨냄

        if (messages.length < 2) {
            Alert.alert("알림", "기록하기엔 대화가 너무 짧아요!");
            return;
        }

        isEndingRef.current = true; // ✨ 누르자마자 즉시 자물쇠 잠금
        setIsEnding(true); // 버튼 UI 변경용 상태

        router.replace({
            pathname: '/calendar',
            params: { sessionId: sessionId, date: new Date().toISOString().split("T")[0] }
        });
        setSessionId(0);
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

                <View className="flex-row items-center justify-between px-5 py-3 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/60 z-10">
                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-2" disabled={isEnding}>
                            <Ionicons name="chevron-back" size={28} color="#64748b" />
                        </TouchableOpacity>

                        <View className="flex-row items-center gap-3">
                            <View className="w-11 h-11 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 items-center justify-center">
                                <Image source={currentProfileImg} style={{ width: 30, height: 30 }} contentFit="contain" />
                            </View>
                            {/* ✨ 텍스트 크기 원상복구 및 적절한 굵기(extrabold)로 타협 */}
                            <Text className="text-[17px] font-extrabold text-slate-900 dark:text-white tracking-tight">
                                {myBuddyName}
                            </Text>
                        </View>
                    </View>

                    {/* ✨ 대화 종료 버튼: 말풍선 크기로 확대 및 둥글기 조절 */}
                    <TouchableOpacity
                        onPress={handleEndConversation}
                        disabled={isEnding}
                        activeOpacity={0.7}
                        className={`px-5 py-3.5 rounded-[1.5rem] shadow-sm transition-colors ${isEnding ? 'bg-slate-300 dark:bg-slate-700' : 'bg-slate-900 dark:bg-white'}`}
                    >
                        <Text className={`text-[14px] font-bold tracking-wide ${isEnding ? 'text-slate-500 dark:text-slate-400' : 'text-white dark:text-slate-900'}`}>
                            {isEnding ? "종료 중..." : "대화 종료"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1 px-5 pt-6"
                    contentContainerStyle={{ paddingBottom: 30 }}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.map((msg) => {
                        const isMe = msg.sender === "user";
                        return (
                            <View key={msg.id} className={`flex-row ${isMe ? "justify-end" : "justify-start"} mb-6`}>
                                {!isMe && (
                                    <View className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 mr-3 mt-1 items-center justify-center border border-slate-100 dark:border-slate-800">
                                        <Image source={currentProfileImg} style={{ width: 20, height: 20 }} contentFit="contain" />
                                    </View>
                                )}

                                <View className={`max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                                    <View className={`flex-row items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                                        {isMe && <Text className="text-[10px] text-slate-400 dark:text-slate-600 mb-1">{formatTime(msg.timestamp)}</Text>}

                                        <View className={`px-5 py-3.5 ${isMe ? "bg-primary-600 rounded-[1.5rem] rounded-tr-md" : "bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[1.5rem] rounded-tl-md"}`}>
                                            <Text className={`text-[15px] leading-6 font-medium ${isMe ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>{msg.text}</Text>
                                        </View>

                                        {!isMe && <Text className="text-[10px] text-slate-400 dark:text-slate-600 mb-1">{formatTime(msg.timestamp)}</Text>}
                                    </View>
                                </View>
                            </View>
                        );
                    })}

                    {isTyping && (
                        <View className="flex-row justify-start items-center mb-6 opacity-60">
                            <View className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 mr-3 items-center justify-center border border-slate-100 dark:border-slate-800">
                                <Image source={currentProfileImg} style={{ width: 20, height: 20 }} contentFit="contain" />
                            </View>
                            <View className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 px-5 py-3 rounded-[1.5rem] rounded-tl-md">
                                <Text className="text-[15px] text-slate-400 dark:text-slate-500 font-medium">타이핑 중...</Text>
                            </View>
                        </View>
                    )}
                </ScrollView>

                <View className="bg-white dark:bg-slate-950 pt-2 pb-6 px-5 border-t border-slate-100 dark:border-slate-900/50">
                    <View className="flex-row items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-full pl-5 pr-2 py-1.5 min-h-[50px]">
                        <TextInput
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="버디에게 말 걸기..."
                            placeholderTextColor="#94a3b8"
                            className="flex-1 py-3 text-[15px] font-medium text-slate-800 dark:text-white leading-5"
                            onSubmitEditing={handleSendMessage}
                        />
                        <TouchableOpacity
                            onPress={handleSendMessage}
                            disabled={!inputText.trim() || isTyping || isEnding}
                            className={`w-10 h-10 rounded-full items-center justify-center transition-colors ${!inputText.trim() || isTyping || isEnding ? "bg-slate-200 dark:bg-slate-800" : "bg-primary-600"}`}
                        >
                            <Ionicons name="arrow-up" size={18} color={!inputText.trim() || isTyping || isEnding ? "#CBD5E1" : "white"} />
                        </TouchableOpacity>
                    </View>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}