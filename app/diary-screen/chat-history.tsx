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
// [추가] 테마 스토어 연동
import { ACCENT_HEX_COLORS, useThemeStore } from "../../store/useThemeStore";
import type { ChatMessage } from "../../types/chat";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const safeShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    android: { elevation: 2 },
});

export default function ChatHistoryScreen() {
    const router = useRouter();
    const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    // [테마] 전역 색상 동기화
    const { accent } = useThemeStore();
    const accentHex = ACCENT_HEX_COLORS[accent];

    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [characterId, setCharacterId] = useState<number | undefined>();
    const [loading, setLoading] = useState(true);

    // [로직] 캐릭터 프로필 이미지 매핑 (즉시 실행 함수로 최적화)
    const currentProfileImg = (() => {
        switch (characterId) {
            case 1: return require('../../assets/images/characters/Hamster.webp');
            case 2: return require('../../assets/images/characters/Fox.webp');
            case 3: return require('../../assets/images/characters/Bear.webp');
            default: return require('../../assets/images/characters/Hamster.webp');
        }
    })();

    // [통신] 과거 대화 내역 로드
    useEffect(() => {
        const fetchHistory = async () => {
            if (!sessionId) {
                setLoading(false);
                return;
            }
            try {
                const response = await chatApi.getChatHistory(Number(sessionId));
                const resultData = response?.result as any;

                if (resultData) {
                    if (resultData.characterId) {
                        setCharacterId(resultData.characterId);
                    }

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
    }, [sessionId]);

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />

            {/* 헤더 영역 */}
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

            {/* 채팅 리스트 영역 */}
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(60), paddingTop: scale(20) }} showsVerticalScrollIndicator={false}>
                <View className="animate-[fade-in_0.3s]" style={{ paddingHorizontal: scale(16) }}>

                    {loading ? (
                        // ✨ 초기 로딩 바 색상을 accentHex로 동기화!
                        <ActivityIndicator size="large" color={accentHex} style={{ marginTop: scale(40) }} />
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
                                    <View key={chat.messageId} className={`flex-row w-full ${isUser ? "justify-end" : "justify-start"}`}>

                                        {/* 버디 프로필 이미지 */}
                                        {!isUser && (
                                            <View className="mr-3 items-start mt-0.5">
                                                <View
                                                    className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 items-center justify-center overflow-hidden rounded-full"
                                                    style={[{ width: scale(40), height: scale(40) }, safeShadow]}
                                                >
                                                    <Image
                                                        source={currentProfileImg}
                                                        style={{ width: '100%', height: '100%' }}
                                                        contentFit="contain"
                                                        transition={200}
                                                    />
                                                </View>
                                            </View>
                                        )}

                                        {/* 말풍선 및 시간 */}
                                        <View className={`max-w-[75%] flex-row items-end ${isUser ? "justify-end" : "justify-start"}`}>
                                            {isUser && <Text className="text-[10px] text-slate-400 font-bold mr-1.5 mb-1" allowFontScaling={false}>{chatTime}</Text>}

                                            {/* ✨ 내가 보낸 말풍선 배경색을 primary-500으로 변경! */}
                                            <View
                                                className={`px-4 ${isUser ? "bg-primary-500 rounded-[20px] rounded-tr-[4px]" : "bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[20px] rounded-tl-[4px]"}`}
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