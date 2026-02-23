import { Ionicons } from '@expo/vector-icons';
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { chatApi } from "../../api/chatApi";
import { diaryApi } from "../../api/diaryApi";
import type { ChatMessage } from "../../types/chat";
import type { DiaryDetail } from "../../types/diary";

const fabShadow = { elevation: 8, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } };

export default function DiaryViewerScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const diaryId = Number(id);

    const [diary, setDiary] = useState<DiaryDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!diaryId) return;
            try {
                const response = await diaryApi.getDiaryDetail(diaryId);
                if (response?.result) setDiary(response.result);
                else throw new Error("데이터가 없습니다.");
            } catch (error) {
                Alert.alert("알림", "일기를 불러올 수 없습니다.");
                router.back();
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [diaryId]);

    const handleDelete = () => {
        Alert.alert("일기 삭제", "정말 이 일기를 삭제하시겠습니까?\n(복구 불가)", [
            { text: "취소", style: "cancel" },
            {
                text: "삭제", style: "destructive",
                onPress: async () => {
                    try {
                        await diaryApi.deleteDiary(diaryId);
                        router.back();
                    } catch (error) {
                        Alert.alert("오류", "삭제 중 오류가 발생했습니다.");
                    }
                }
            }
        ]);
    };

    const handleToggleChat = async () => {
        if (!showChat && chatHistory.length === 0) {
            if (diary?.sessionSeq) {
                setIsChatLoading(true);
                try {
                    const response = await chatApi.getChatHistory(diary.sessionSeq);
                    if (response?.result) {
                        const sortedChats = [...response.result].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                        setChatHistory(sortedChats);
                    }
                } catch (error) {
                    console.error("대화 내역 로드 실패", error);
                } finally {
                    setIsChatLoading(false);
                }
            }
        }
        setShowChat(!showChat);
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
                <ActivityIndicator size="large" color="#94A3B8" />
            </View>
        );
    }

    if (!diary) return null;

    const headerDateObj = new Date(diary.diaryDate || diary.createdAt || diary.createAt || new Date());
    const hasImages = !!diary.imageUrl || (diary.images?.length ?? 0) > 0;

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 relative" edges={['top', 'bottom']}>

            <Stack.Screen options={{ headerShown: false }} />

            {/* 상단 헤더 */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-20 border-b border-slate-100 dark:border-slate-800/60">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <Ionicons name="chevron-back" size={28} color="#64748B" />
                </TouchableOpacity>

                <View className="flex-row items-center gap-2">
                    <TouchableOpacity onPress={() => router.push({ pathname: '/diary-screen/editor', params: { mode: 'edit', diaryId: diary.diarySeq } })} className="p-2">
                        <Ionicons name="create-outline" size={24} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} className="p-2">
                        <Ionicons name="trash-outline" size={24} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1 pt-8" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
                {!showChat ? (
                    <View className="animate-[fade-in_0.3s]">

                        {/* ✨ 1. 헤드라인 영역 (날짜, 제목, 태그는 화면 중앙에서 시선을 확 끕니다) */}
                        <View className="px-7 mb-10 items-center">
                            <Text className="text-[13px] font-extrabold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-4">
                                {format(headerDateObj, "yyyy년 M월 d일 EEEE", { locale: ko })}
                            </Text>

                            <Text className="text-3xl font-extrabold text-slate-900 dark:text-white leading-[44px] tracking-tight text-center mb-6">
                                {diary.title || "제목 없음"}
                            </Text>

                            {diary.tags && diary.tags.length > 0 && (
                                <View className="flex-row flex-wrap justify-center gap-2">
                                    {diary.tags.map((tag: any, idx: number) => (
                                        <View key={idx} className="bg-primary-50 dark:bg-primary-900/40 px-3 py-1.5 rounded-md border border-primary-100/50 dark:border-primary-800/50">
                                            <Text className="text-primary-600 dark:text-primary-300 text-[11px] font-extrabold uppercase tracking-wider">
                                                #{typeof tag === 'string' ? tag : tag.name}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* ✨ 2. 본문 영역 (가독성을 위해 좌측 정렬, 넓은 줄간격 유지) */}
                        <View className="px-7 mb-12">
                            <Text className="text-slate-700 dark:text-slate-300 text-[16px] leading-[32px] font-medium text-left">
                                {diary.content}
                            </Text>
                        </View>

                        {/* ✨ 3. 사진 영역 (글을 다 읽은 후 마지막에 감성적으로 배치) */}
                        {hasImages && (
                            <View className="px-5 shadow-sm">
                                {diary.imageUrl ? (
                                    <Image
                                        source={{ uri: diary.imageUrl }}
                                        style={{ width: '100%', height: 280, borderRadius: 24, backgroundColor: '#F1F5F9' }}
                                        contentFit="cover"
                                        transition={300}
                                    />
                                ) : (
                                    diary.images?.map((img: any, idx: number) => {
                                        const imgUrl = typeof img === 'string' ? img : img.url;
                                        return (
                                            <Image
                                                key={idx}
                                                source={{ uri: imgUrl }}
                                                style={{ width: '100%', height: 280, borderRadius: 24, backgroundColor: '#F1F5F9', marginBottom: 16 }}
                                                contentFit="cover"
                                                transition={300}
                                            />
                                        )
                                    })
                                )}
                            </View>
                        )}

                    </View>
                ) : (
                    <View className="animate-[fade-in_0.3s] px-5">
                        <View className="mb-8 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                            <Text className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">이날의 대화 💬</Text>
                            <Text className="text-sm text-slate-500 mt-1">버디와 나누었던 이야기</Text>
                        </View>

                        {isChatLoading ? (
                            <ActivityIndicator size="large" color="#94A3B8" className="my-10" />
                        ) : chatHistory.length === 0 ? (
                            <View className="items-center py-20 opacity-50">
                                <Ionicons name="chatbox-ellipses-outline" size={48} color="#94A3B8" className="mb-4" />
                                <Text className="text-slate-500 font-bold">{diary?.sessionSeq ? "대화 내역이 없습니다." : "채팅으로 작성된 일기가 아닙니다."}</Text>
                            </View>
                        ) : (
                            <View className="gap-6">
                                {chatHistory.map((chat) => {
                                    const isUser = chat.role.toLowerCase() === "user";
                                    return (
                                        <View key={chat.messageSeq} className={`flex-row w-full ${isUser ? "justify-end" : "justify-start"}`}>
                                            <View className={`max-w-[80%] rounded-[1.5rem] px-5 py-4 ${isUser ? "bg-primary-600 rounded-tr-md" : "bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-tl-md"}`}>
                                                <Text className={`text-[15px] leading-6 font-medium ${isUser ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
                                                    {chat.content}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* 플로팅 버튼 (위치 고정) */}
            <View className="absolute bottom-10 right-6 z-50">
                <TouchableOpacity
                    onPress={handleToggleChat}
                    activeOpacity={0.8}
                    style={fabShadow}
                    className="w-14 h-14 bg-primary-600 rounded-full items-center justify-center transition-colors"
                >
                    <Ionicons name={showChat ? "book" : "chatbubbles"} size={26} color="white" />
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}