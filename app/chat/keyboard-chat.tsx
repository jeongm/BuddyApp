import { Ionicons } from '@expo/vector-icons';
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
// ✨ 1. Keyboard 모듈 추가!
import { Alert, Dimensions, Keyboard, KeyboardAvoidingView, Modal, Platform, Text as RNText, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
// ✨ 2. useSafeAreaInsets 추가!
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { chatApi } from "../../api/chatApi";
import { AppText as Text } from '../../components/AppText';
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { useSettingStore } from "../../store/useSettingStore";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const safeShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    android: { elevation: 2 },
});

const popupShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 24 },
    android: { elevation: 12 },
});

interface Message {
    id: number;
    text: string;
    sender: "user" | "character";
    timestamp: Date;
}

export default function KeyboardChatScreen() {
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);

    // ✨ 기기별 하단 네비게이션바(소프트키) 여백 가져오기
    const insets = useSafeAreaInsets();

    const { user } = useAuthStore();
    const { sessionId, setSessionId } = useChatStore();
    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const myNickname = user?.nickname || "친구";
    const myBuddyName = user?.characterNickname || "Buddy";

    const getProfileImage = (seq?: number): any => {
        switch (seq) {
            case 1: return require('../../assets/images/characters/Hamster.webp');
            case 2: return require('../../assets/images/characters/Fox.webp');
            case 3: return require('../../assets/images/characters/Bear.webp');
            default: return require('../../assets/images/characters/Hamster.webp');
        }
    };
    const currentProfileImg = getProfileImage(user?.characterId);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showExitPopup, setShowExitPopup] = useState(false);

    // ✨ 3. 안드로이드 키보드 억까 방어용 상태값
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const isEndingRef = useRef(false);
    const hasFetchedHistory = useRef(false);

    // ✨ 4. 안드로이드 키보드 높이 실시간 감지 마법사
    useEffect(() => {
        if (Platform.OS === 'android') {
            const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
                setKeyboardHeight(e.endCoordinates.height);
            });
            const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
                setKeyboardHeight(0);
            });

            return () => {
                showSubscription.remove();
                hideSubscription.remove();
            };
        }
    }, []);

    useEffect(() => {
        if (hasFetchedHistory.current) return;

        const loadHistory = async () => {
            if (sessionId === 0) {
                setMessages([{ id: 1, text: `안녕, ${myNickname}! 오늘 하루는 어땠어?`, sender: "character", timestamp: new Date() }]);
                hasFetchedHistory.current = true;
                return;
            }
            try {
                const res = await chatApi.getChatHistory(sessionId);
                const resultData = res?.result as any;

                if (resultData?.messages && Array.isArray(resultData.messages)) {
                    const formattedMessages: Message[] = resultData.messages.map((item: any) => ({
                        id: item.messageId || Math.random(),
                        text: item.content,
                        sender: (item.role || "").toUpperCase() === "USER" ? "user" : "character",
                        timestamp: new Date(item.createdAt)
                    }));
                    formattedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
                    setMessages(formattedMessages);
                }
                hasFetchedHistory.current = true;
            } catch (error) {
                console.error("이전 대화 불러오기 실패", error);
            }
        };

        loadHistory();
    }, [sessionId]);

    const formatTime = (date: any) => {
        if (!date) return "";
        const d = new Date(date);
        if (isNaN(d.getTime())) return "";
        return new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: 'numeric', hour12: true }).format(d);
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || isTyping) return;
        const userText = inputText;
        setMessages((prev) => [...prev, { id: Date.now(), text: userText, sender: "user", timestamp: new Date() }]);
        setInputText("");
        setIsTyping(true);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const requestSessionId = sessionId === 0 ? 0 : sessionId;
            const response = await chatApi.sendMessage({ sessionId: requestSessionId, content: userText });
            const resultData = response.result as any;

            const newsessionId = resultData?.sessionId;
            if (newsessionId && newsessionId !== sessionId) {
                setSessionId(newsessionId);
            }

            const aiMsg = resultData?.message;
            if (aiMsg) {
                setMessages((prev) => [...prev, {
                    id: aiMsg.messageId || Date.now() + 1,
                    text: aiMsg.content,
                    sender: "character",
                    timestamp: new Date(aiMsg.createdAt)
                }]);
            }
        } catch (error) {
            setMessages((prev) => [...prev, { id: Date.now() + 1, text: "서버 오류가 발생했어요. 😢", sender: "character", timestamp: new Date() }]);
        } finally {
            setIsTyping(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const handleWriteDiary = async () => {
        if (isEndingRef.current) return;

        if (messages.length < 4) {
            Alert.alert("알림", "기록하기엔 대화가 너무 짧아요!");
            return;
        }

        router.push({
            pathname: '/diary-screen/editor',
            params: {
                sessionId: sessionId,
                mode: 'create',
                origin: 'chat'
            }
        });
    };

    const handleBackPress = () => {
        if (messages.length <= 1) {
            router.back();
        } else {
            setShowExitPopup(true);
        }
    };

    const handleKeepSession = () => {
        setShowExitPopup(false);
        router.back();
    };

    const handleDiscardSession = async () => {
        setShowExitPopup(false);
        if (sessionId !== 0) {
            try {
                await chatApi.endChatSession(sessionId);
            } catch (e) {
                console.error("세션 종료 실패", e);
            }
            setSessionId(0);
        }
        router.back();
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* 헤더 영역 */}
                <View
                    className="flex-row items-center justify-between bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/60 z-10"
                    style={{ paddingHorizontal: scale(16), height: scale(60) }}
                >
                    <TouchableOpacity onPress={handleBackPress} className="p-2" style={{ zIndex: 10 }}>
                        <Ionicons name="chevron-back" size={scale(28)} color="#64748b" />
                    </TouchableOpacity>

                    <View className="absolute left-0 right-0 h-full items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
                        <RNText
                            className="font-black text-slate-900 dark:text-white tracking-tight"
                            style={{ fontSize: scale(18), fontFamily: customFontFamily }}
                            allowFontScaling={false}
                        >
                            {myBuddyName}
                        </RNText>
                    </View>

                    <TouchableOpacity
                        onPress={handleWriteDiary}
                        disabled={messages.length < 4}
                        activeOpacity={0.7}
                        className={`rounded-full border transition-colors ${messages.length < 4
                            ? 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                            : 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-400'
                            }`}
                        style={{ paddingHorizontal: scale(16), paddingVertical: scale(8), zIndex: 10 }}
                    >
                        <RNText
                            className={`font-black tracking-tight ${messages.length < 4 ? 'text-slate-400 dark:text-slate-500' : 'text-primary-600 dark:text-primary-300'
                                }`}
                            style={{ fontSize: scale(13), fontFamily: customFontFamily }}
                            allowFontScaling={false}
                        >
                            일기 작성
                        </RNText>
                    </TouchableOpacity>
                </View>

                {/* 채팅 영역 */}
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1 bg-slate-50/50 dark:bg-slate-950"
                    contentContainerStyle={{ paddingBottom: scale(20), paddingTop: scale(24), paddingHorizontal: scale(16) }}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                    keyboardShouldPersistTaps="handled"
                >
                    {messages.map((msg) => {
                        const isMe = msg.sender === "user";
                        return (
                            <View key={msg.id} className={`flex-row w-full ${isMe ? "justify-end" : "justify-start"}`} style={{ marginBottom: scale(20) }}>
                                {!isMe && (
                                    <View className="mr-3 items-start mt-0.5">
                                        <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 items-center justify-center overflow-hidden rounded-full" style={[{ width: scale(40), height: scale(40) }, safeShadow]}>
                                            <Image source={currentProfileImg} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                                        </View>
                                    </View>
                                )}
                                <View className={`${isMe ? "items-end" : "items-start"}`} style={{ maxWidth: '75%' }}>
                                    <View className={`flex-row items-end ${isMe ? "justify-end" : "justify-start"}`}>
                                        {isMe && <Text className="text-slate-400 dark:text-slate-600 font-bold mr-1.5 mb-1" style={{ fontSize: scale(10) }} allowFontScaling={false}>{formatTime(msg.timestamp)}</Text>}

                                        <View className={`px-4 ${isMe ? "bg-primary-600 rounded-[20px] rounded-tr-[4px]" : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[20px] rounded-tl-[4px]"}`} style={[{ paddingVertical: scale(10) }, safeShadow]}>
                                            <Text className={`font-medium ${isMe ? "text-white" : "text-slate-800 dark:text-slate-200"}`} style={{ fontSize: scale(15), lineHeight: scale(24) }}>{msg.text}</Text>
                                        </View>

                                        {!isMe && <Text className="text-slate-400 dark:text-slate-600 font-bold ml-1.5 mb-1" style={{ fontSize: scale(10) }} allowFontScaling={false}>{formatTime(msg.timestamp)}</Text>}
                                    </View>
                                </View>
                            </View>
                        );
                    })}

                    {isTyping && (
                        <View className="flex-row justify-start items-center opacity-60" style={{ marginBottom: scale(20) }}>
                            <View className="mr-3 items-start mt-0.5">
                                <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 items-center justify-center overflow-hidden rounded-full" style={[{ width: scale(40), height: scale(40) }, safeShadow]}>
                                    <Image source={currentProfileImg} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                                </View>
                            </View>
                            <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[20px] rounded-tl-[4px] px-4" style={[{ paddingVertical: scale(10), paddingHorizontal: scale(16) }, safeShadow]}>
                                <RNText className="text-slate-500 font-bold tracking-widest" style={{ fontSize: scale(14) }}>
                                    ···
                                </RNText>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* 입력창 영역 */}
                <View
                    className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900/50"
                    style={{
                        paddingTop: scale(Platform.OS === 'ios' ? 16 : 12),
                        // ✨ 5. 키보드가 닫혀있을 때 하단 네비게이션바(소프트키)랑 겹치지 않게 여백 챙겨주기!
                        paddingBottom: Platform.OS === 'ios' ? scale(24) : Math.max(scale(16), insets.bottom + scale(8)),
                        paddingHorizontal: scale(16)
                    }}
                >
                    <View className="flex-row items-end" style={{ gap: scale(8) }}>
                        <View
                            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-[24px]"
                            style={{ paddingHorizontal: scale(16), minHeight: scale(44), justifyContent: 'center' }}
                        >
                            <TextInput
                                allowFontScaling={false}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder={`${myBuddyName}에게 말 걸기...`}
                                placeholderTextColor="#94a3b8"
                                className="font-medium text-slate-800 dark:text-white"
                                style={{
                                    fontSize: scale(15),
                                    lineHeight: scale(20),
                                    maxHeight: scale(120),
                                    textAlignVertical: 'center',
                                    paddingTop: Platform.OS === 'ios' ? scale(12) : scale(10),
                                    paddingBottom: Platform.OS === 'ios' ? scale(12) : scale(10),
                                }}
                                multiline={true}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleSendMessage}
                            disabled={!inputText.trim() || isTyping}
                            className={`rounded-full items-center justify-center transition-colors ${!inputText.trim() || isTyping
                                ? "bg-slate-100 dark:bg-slate-800"
                                : "bg-primary-600"
                                }`}
                            style={{ width: scale(44), height: scale(44) }}
                        >
                            <Ionicons
                                name="send"
                                size={scale(18)}
                                color={!inputText.trim() || isTyping ? "#CBD5E1" : "white"}
                                style={{ marginLeft: scale(3), marginTop: scale(1) }}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

            </KeyboardAvoidingView>

            {/* 나가기 경고 팝업 */}
            <Modal
                visible={showExitPopup}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowExitPopup(false)}
            >
                <View className="flex-1 bg-black/40 justify-center items-center px-12">
                    <View className="bg-white dark:bg-slate-900 w-full rounded-[24px] overflow-hidden" style={[{ padding: scale(20) }, popupShadow]}>

                        <View className="items-center mb-5 mt-2">
                            <RNText className="text-slate-900 dark:text-white font-black text-center mb-2" style={{ fontSize: scale(18), fontFamily: customFontFamily }} allowFontScaling={false}>
                                대화를 멈출까요?
                            </RNText>
                            <Text className="text-slate-500 dark:text-slate-400 font-medium text-center leading-5" style={{ fontSize: scale(13) }} allowFontScaling={false}>
                                나중에 이어서 할 수 있지만,{"\n"}<Text className="text-rose-500 font-bold">12시간 후에는 완전히 사라져요.</Text>
                            </Text>
                        </View>

                        <View className="flex-row" style={{ gap: scale(8) }}>
                            <TouchableOpacity
                                onPress={handleDiscardSession}
                                activeOpacity={0.8}
                                className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl items-center justify-center"
                                style={{ paddingVertical: scale(12) }}
                            >
                                <RNText className="text-slate-600 dark:text-slate-300 font-bold" style={{ fontSize: scale(14), fontFamily: customFontFamily }} allowFontScaling={false}>
                                    종료하기
                                </RNText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleKeepSession}
                                activeOpacity={0.8}
                                className="flex-1 bg-primary-600 rounded-xl items-center justify-center"
                                style={{ paddingVertical: scale(12) }}
                            >
                                <RNText className="text-white font-bold" style={{ fontSize: scale(14), fontFamily: customFontFamily }} allowFontScaling={false}>
                                    유지하기
                                </RNText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ✨ 6. 대망의 매직 트릭: 안드로이드 키보드가 올라올 때, 그 높이만큼 바닥에서부터 투명 블록을 세워서 입력창을 밀어올립니다! */}
            {Platform.OS === 'android' && (
                <View style={{
                    height: keyboardHeight > 0
                        ? Math.max(0, keyboardHeight - (keyboardHeight > 100 ? 0 : insets.bottom))
                        : 0
                }} />
            )}
        </SafeAreaView>
    );
}