import { Ionicons } from '@expo/vector-icons';
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { chatApi } from "../../api/chatApi";
import { diaryApi } from "../../api/diaryApi";
import type { ChatMessage } from "../../types/chat";
import type { DiaryDetail } from "../../types/diary";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);
const fabShadow = { elevation: 8, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: scale(12), shadowOffset: { width: 0, height: scale(6) } };

export default function DiaryViewerScreen() {
    const router = useRouter();
    // ✨ 받은 origin 꼬리표를 여기서도 보관합니다.
    const { id, origin } = useLocalSearchParams<{ id: string, origin?: string }>();
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
                        // 삭제 성공 시 단순히 스택을 빼버립니다. 
                        // (그러면 자동으로 calendar/diary가 보이고, useFocusEffect가 발동되어 새로고침됨!)
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

            <View className="flex-row items-center justify-between bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-20 border-b border-slate-100 dark:border-slate-800/60" style={{ paddingHorizontal: scale(16), paddingVertical: scale(6) }}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: scale(6) }}>
                    <Ionicons name="chevron-back" size={scale(28)} color="#64748B" />
                </TouchableOpacity>

                <View className="flex-row items-center" style={{ gap: scale(4) }}>
                    {/* ✨ 에디터로 갈 때 params에 내가 받은 origin을 그대로 던져줍니다! */}
                    <TouchableOpacity onPress={() => router.push({ pathname: '/diary-screen/editor', params: { mode: 'edit', diaryId: diary.diarySeq, origin } })} style={{ padding: scale(6) }}>
                        <Ionicons name="create-outline" size={scale(24)} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} style={{ padding: scale(6) }}>
                        <Ionicons name="trash-outline" size={scale(24)} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(140), paddingTop: scale(32) }} showsVerticalScrollIndicator={false}>
                {/* ... (이하 스크롤뷰 내부는 기존과 100% 동일하므로 공간 절약을 위해 생략/동일합니다. 이전 코드 복붙) ... */}
                {!showChat ? (
                    <View className="animate-[fade-in_0.3s]">
                        <View className="items-center" style={{ paddingHorizontal: scale(28), marginBottom: scale(32) }}>
                            <Text className="font-extrabold text-primary-600 dark:text-primary-400 uppercase tracking-widest" style={{ marginBottom: scale(16), fontSize: scale(13) }} allowFontScaling={false}>
                                {format(headerDateObj, "yyyy년 M월 d일 EEEE", { locale: ko })}
                            </Text>
                            <Text className="font-extrabold text-slate-900 dark:text-white text-center" style={{ fontSize: scale(28), lineHeight: scale(42), marginBottom: scale(24), letterSpacing: scale(-0.5) }} allowFontScaling={false}>
                                {diary.title || "제목 없음"}
                            </Text>
                            {diary.tags && diary.tags.length > 0 && (
                                <View className="flex-row flex-wrap justify-center" style={{ gap: scale(8) }}>
                                    {diary.tags.map((tag: any, idx: number) => (
                                        <View key={idx} className="bg-primary-50 dark:bg-primary-900/40 rounded-md border border-primary-100/50 dark:border-primary-800/50" style={{ paddingHorizontal: scale(12), paddingVertical: scale(6) }}>
                                            <Text className="text-primary-600 dark:text-primary-300 font-extrabold uppercase tracking-wider" style={{ fontSize: scale(11) }} allowFontScaling={false}>
                                                #{typeof tag === 'string' ? tag : tag.name}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                        {hasImages && (
                            <View className="shadow-sm" style={{ paddingHorizontal: scale(20), marginBottom: scale(32) }}>
                                {diary.imageUrl ? (
                                    <Image source={{ uri: diary.imageUrl }} style={{ width: '100%', height: scale(280), borderRadius: scale(24), backgroundColor: '#F1F5F9' }} contentFit="cover" transition={300} />
                                ) : (
                                    diary.images?.map((img: any, idx: number) => {
                                        const imgUrl = typeof img === 'string' ? img : img.url;
                                        return (
                                            <Image key={idx} source={{ uri: imgUrl }} style={{ width: '100%', height: scale(280), borderRadius: scale(24), backgroundColor: '#F1F5F9', marginBottom: scale(16) }} contentFit="cover" transition={300} />
                                        )
                                    })
                                )}
                            </View>
                        )}
                        <View style={{ paddingHorizontal: scale(28), marginBottom: scale(48) }}>
                            <Text className="text-slate-700 dark:text-slate-300 font-medium text-left" style={{ fontSize: scale(16), lineHeight: scale(32) }} allowFontScaling={false}>
                                {diary.content}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View className="animate-[fade-in_0.3s]" style={{ paddingHorizontal: scale(20) }}>
                        <View className="border-b border-slate-100 dark:border-slate-800/60 flex-row items-center justify-between" style={{ marginTop: scale(-20), marginBottom: scale(24), paddingBottom: scale(12) }}>
                            <Text className="font-extrabold text-slate-900 dark:text-white tracking-widest uppercase" style={{ fontSize: scale(14) }} allowFontScaling={false}>Chat History</Text>
                            <Ionicons name="chatbubbles-outline" size={scale(20)} color="#94A3B8" />
                        </View>
                        {isChatLoading ? (
                            <ActivityIndicator size="large" color="#94A3B8" style={{ marginVertical: scale(40) }} />
                        ) : chatHistory.length === 0 ? (
                            <View className="items-center opacity-50" style={{ paddingVertical: scale(80) }}>
                                <Ionicons name="chatbox-ellipses-outline" size={scale(48)} color="#94A3B8" style={{ marginBottom: scale(16) }} />
                                <Text className="text-slate-500 font-bold" style={{ fontSize: scale(15) }} allowFontScaling={false}>{diary?.sessionSeq ? "대화 내역이 없습니다." : "채팅으로 작성된 일기가 아닙니다."}</Text>
                            </View>
                        ) : (
                            <View style={{ gap: scale(24) }}>
                                {chatHistory.map((chat) => {
                                    const isUser = chat.role.toLowerCase() === "user";
                                    return (
                                        <View key={chat.messageSeq} className={`flex-row w-full ${isUser ? "justify-end" : "justify-start"}`}>
                                            <View className={`max-w-[80%] rounded-[1.5rem] ${isUser ? "bg-primary-600 rounded-tr-md" : "bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-tl-md"}`} style={{ paddingHorizontal: scale(20), paddingVertical: scale(16) }}>
                                                <Text className={`font-medium ${isUser ? "text-white" : "text-slate-800 dark:text-slate-200"}`} style={{ fontSize: scale(15), lineHeight: scale(24) }} allowFontScaling={false}>{chat.content}</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            <View className="absolute z-50" style={{ bottom: scale(40), right: scale(24) }}>
                <TouchableOpacity onPress={handleToggleChat} activeOpacity={0.8} style={[fabShadow, { width: scale(56), height: scale(56) }]} className="bg-primary-600 rounded-full items-center justify-center transition-colors">
                    <Ionicons name={showChat ? "book" : "chatbubbles"} size={scale(26)} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}