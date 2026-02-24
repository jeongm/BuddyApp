import { Ionicons } from '@expo/vector-icons';
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { chatApi } from "../../api/chatApi";
import { IS_TEST_MODE } from "../../config";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";

// ✨ 마법의 스케일링 함수 추가
const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

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
        if (isEndingRef.current) return;

        if (messages.length < 2) {
            Alert.alert("알림", "기록하기엔 대화가 너무 짧아요!");
            return;
        }

        isEndingRef.current = true;
        setIsEnding(true);

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

                {/* ✨ 헤더 영역 스케일링 */}
                <View className="flex-row items-center justify-between bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/60 z-10" style={{ paddingHorizontal: scale(20), paddingVertical: scale(12) }}>
                    <View className="flex-row items-center" style={{ gap: scale(12) }}>
                        <TouchableOpacity onPress={() => router.back()} disabled={isEnding} style={{ padding: scale(4), marginLeft: scale(-8) }}>
                            <Ionicons name="chevron-back" size={scale(28)} color="#64748b" />
                        </TouchableOpacity>

                        <View className="flex-row items-center" style={{ gap: scale(12) }}>
                            <View className="rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 items-center justify-center" style={{ width: scale(44), height: scale(44) }}>
                                <Image source={currentProfileImg} style={{ width: scale(30), height: scale(30) }} contentFit="contain" />
                            </View>
                            <Text className="font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(17) }} allowFontScaling={false}>
                                {myBuddyName}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleEndConversation}
                        disabled={isEnding}
                        activeOpacity={0.7}
                        className={`rounded-[1.5rem] shadow-sm transition-colors ${isEnding ? 'bg-slate-300 dark:bg-slate-700' : 'bg-primary-600'}`}
                        style={{ paddingHorizontal: scale(20), paddingVertical: scale(14) }}
                    >
                        <Text className={`font-bold tracking-wide ${isEnding ? 'text-slate-500 dark:text-slate-400' : 'text-white'}`} style={{ fontSize: scale(14) }} allowFontScaling={false}>
                            {isEnding ? "종료 중..." : "대화 종료"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ✨ 채팅 목록 영역 스케일링 */}
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: scale(30), paddingTop: scale(24), paddingHorizontal: scale(20) }}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.map((msg) => {
                        const isMe = msg.sender === "user";
                        return (
                            <View key={msg.id} className={`flex-row ${isMe ? "justify-end" : "justify-start"}`} style={{ marginBottom: scale(24) }}>
                                {!isMe && (
                                    <View className="rounded-full bg-slate-50 dark:bg-slate-900 items-center justify-center border border-slate-100 dark:border-slate-800" style={{ width: scale(32), height: scale(32), marginRight: scale(12), marginTop: scale(4) }}>
                                        <Image source={currentProfileImg} style={{ width: scale(20), height: scale(20) }} contentFit="contain" />
                                    </View>
                                )}

                                <View className={`${isMe ? "items-end" : "items-start"}`} style={{ maxWidth: '75%' }}>
                                    <View className={`flex-row items-end ${isMe ? "justify-end" : "justify-start"}`} style={{ gap: scale(8) }}>
                                        {isMe && <Text className="text-slate-400 dark:text-slate-600" style={{ fontSize: scale(10), marginBottom: scale(4) }} allowFontScaling={false}>{formatTime(msg.timestamp)}</Text>}

                                        <View className={`${isMe ? "bg-primary-600 rounded-[1.5rem] rounded-tr-md" : "bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[1.5rem] rounded-tl-md"}`} style={{ paddingHorizontal: scale(20), paddingVertical: scale(14) }}>
                                            {/* ✨ 말풍선 본문은 기기 폰트 설정을 존중하도록 allowFontScaling을 넣지 않았습니다! */}
                                            <Text className={`font-medium ${isMe ? "text-white" : "text-slate-800 dark:text-slate-200"}`} style={{ fontSize: scale(15), lineHeight: scale(24) }}>{msg.text}</Text>
                                        </View>

                                        {!isMe && <Text className="text-slate-400 dark:text-slate-600" style={{ fontSize: scale(10), marginBottom: scale(4) }} allowFontScaling={false}>{formatTime(msg.timestamp)}</Text>}
                                    </View>
                                </View>
                            </View>
                        );
                    })}

                    {isTyping && (
                        <View className="flex-row justify-start items-center opacity-60" style={{ marginBottom: scale(24) }}>
                            <View className="rounded-full bg-slate-50 dark:bg-slate-900 items-center justify-center border border-slate-100 dark:border-slate-800" style={{ width: scale(32), height: scale(32), marginRight: scale(12) }}>
                                <Image source={currentProfileImg} style={{ width: scale(20), height: scale(20) }} contentFit="contain" />
                            </View>
                            <View className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[1.5rem] rounded-tl-md" style={{ paddingHorizontal: scale(20), paddingVertical: scale(12) }}>
                                <Text className="text-slate-400 dark:text-slate-500 font-medium" style={{ fontSize: scale(15) }} allowFontScaling={false}>타이핑 중...</Text>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* ✨ 하단 입력창 영역 스케일링 */}
                <View className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900/50" style={{ paddingTop: scale(8), paddingBottom: scale(24), paddingHorizontal: scale(20) }}>
                    <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-full" style={{ gap: scale(8), paddingLeft: scale(20), paddingRight: scale(6), height: scale(46) }}>
                        <TextInput
                            allowFontScaling={false}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="버디에게 말 걸기..."
                            placeholderTextColor="#94a3b8"
                            className="flex-1 font-medium text-slate-800 dark:text-white h-full"
                            style={{ fontSize: scale(14), paddingVertical: 0, marginVertical: 0, textAlignVertical: 'center' }}
                            onSubmitEditing={handleSendMessage}
                        />
                        <TouchableOpacity
                            onPress={handleSendMessage}
                            disabled={!inputText.trim() || isTyping || isEnding}
                            className={`rounded-full items-center justify-center transition-colors ${!inputText.trim() || isTyping || isEnding ? "bg-slate-200 dark:bg-slate-800" : "bg-primary-600"}`}
                            style={{ width: scale(36), height: scale(36) }}
                        >
                            <Ionicons name="arrow-up" size={scale(18)} color={!inputText.trim() || isTyping || isEnding ? "#CBD5E1" : "white"} />
                        </TouchableOpacity>
                    </View>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}