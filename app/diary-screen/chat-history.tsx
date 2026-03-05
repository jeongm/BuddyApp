import { Ionicons } from '@expo/vector-icons';
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Platform, Text as RNText, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { chatApi } from "../../api/chatApi";
import { AppText as Text } from '../../components/AppText';
import { useSettingStore } from "../../store/useSettingStore";
import type { ChatMessage } from "../../types/chat";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

// ✨ 캐릭터 번호별 이미지 매핑 함수 추가
const getCharacterImage = (seq?: number) => {
    switch (seq) {
        case 1: return require('../../assets/images/characters/Hamster.png');
        case 2: return require('../../assets/images/characters/Fox.png');
        case 3: return require('../../assets/images/characters/Bear.png');
        default: return require('../../assets/images/characters/Hamster.png'); // 기본값
    }
};

const safeShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    android: { elevation: 2 },
});

export default function ChatHistoryScreen() {
    const router = useRouter();
    const { sessionSeq } = useLocalSearchParams<{ sessionSeq: string }>();
    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [characterSeq, setCharacterSeq] = useState<number | undefined>(); // ✨ characterSeq 상태 추가
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!sessionSeq) {
                setLoading(false);
                return;
            }
            try {
                const response = await chatApi.getChatHistory(Number(sessionSeq));
                const resultData = response?.result as any;

                if (resultData) {
                    // 🚨 1. characterSeq 저장
                    if (resultData.characterSeq) {
                        setCharacterSeq(resultData.characterSeq);
                    }

                    // 🚨 2. 메시지 내역 저장
                    if (resultData.messages && Array.isArray(resultData.messages)) {
                        const sortedChats = [...resultData.messages].sort(
                            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        );
                        setChatHistory(sortedChats);
                    }
                }
            } catch (error) {
                console.error("대화 내역 로드 실패", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [sessionSeq]);

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />

            {/* 헤더 */}
            <View className="flex-row items-center justify-between bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-20 border-b border-slate-100 dark:border-slate-800/60 relative" style={{ paddingHorizontal: scale(16), height: scale(52) }}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: scale(6), zIndex: 10 }}>
                    <Ionicons name="chevron-back" size={scale(28)} color="#64748B" />
                </TouchableOpacity>

                <View className="absolute inset-0 items-center justify-center pointer-events-none">
                    <RNText className="font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(16), fontFamily: customFontFamily }} allowFontScaling={false}>
                        버디와 나눈 이야기
                    </RNText>
                </View>

                <View style={{ width: scale(40) }} />
            </View>

            {/* 채팅 리스트 */}
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(60), paddingTop: scale(20) }} showsVerticalScrollIndicator={false}>
                <View className="animate-[fade-in_0.3s]" style={{ paddingHorizontal: scale(16) }}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#94A3B8" style={{ marginTop: scale(40) }} />
                    ) : chatHistory.length === 0 ? (
                        <View className="items-center opacity-50" style={{ paddingVertical: scale(80) }}>
                            <Ionicons name="chatbox-ellipses-outline" size={scale(48)} color="#94A3B8" style={{ marginBottom: scale(16) }} />
                            <Text className="text-slate-500 font-bold" style={{ fontSize: scale(15) }} allowFontScaling={false}>대화 내역이 없습니다.</Text>
                        </View>
                    ) : (
                        <View style={{ gap: scale(20) }}>
                            {chatHistory.map((chat) => {
                                const isUser = chat.role.toLowerCase() === "user";
                                const chatTime = chat.createdAt ? format(new Date(chat.createdAt), "a h:mm", { locale: ko }) : "";

                                return (
                                    <View key={chat.messageSeq} className={`flex-row w-full ${isUser ? "justify-end" : "justify-start"}`}>

                                        {!isUser && (
                                            <View className="mr-3 items-start mt-0.5">
                                                <View
                                                    className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 items-center justify-center overflow-hidden rounded-full"
                                                    style={[{ width: scale(40), height: scale(40) }, safeShadow]}
                                                >
                                                    {/* ✨ 3. 동적으로 매핑된 이미지 소스 사용 */}
                                                    <Image
                                                        source={getCharacterImage(characterSeq)}
                                                        style={{ width: '100%', height: '100%' }}
                                                        contentFit="contain" // 프로필은 contain이 더 예뻐요!
                                                        transition={200}
                                                    />
                                                </View>
                                            </View>
                                        )}

                                        <View className={`max-w-[75%] flex-row items-end ${isUser ? "justify-end" : "justify-start"}`}>
                                            {isUser && <Text className="text-[10px] text-slate-400 font-bold mr-1.5 mb-1" allowFontScaling={false}>{chatTime}</Text>}

                                            <View
                                                className={`px-4 ${isUser ? "bg-primary-600 rounded-[20px] rounded-tr-[4px]" : "bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[20px] rounded-tl-[4px]"}`}
                                                style={[{ paddingVertical: scale(8) }, safeShadow]}
                                            >
                                                <Text className={`font-medium ${isUser ? "text-white" : "text-slate-800 dark:text-slate-200"}`} style={{ fontSize: scale(15), lineHeight: scale(24) }} allowFontScaling={false}>
                                                    {chat.content}
                                                </Text>
                                            </View>

                                            {!isUser && <Text className="text-[10px] text-slate-400 font-bold ml-1.5 mb-1" allowFontScaling={false}>{chatTime}</Text>}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}