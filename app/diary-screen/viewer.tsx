import { Ionicons } from '@expo/vector-icons';
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { diaryApi } from "../../api/diaryApi";
import { AppText as Text } from '../../components/AppText';
import { ACCENT_HEX_COLORS, useThemeStore } from "../../store/useThemeStore";
import type { DiaryDetail } from "../../types/diary";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);
const fabShadow = { elevation: 8, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: scale(12), shadowOffset: { width: 0, height: scale(6) } };

export default function DiaryViewerScreen() {
    const router = useRouter();
    const { id, origin } = useLocalSearchParams<{ id: string, origin?: string }>();
    const diaryId = Number(id);

    // [테마] 전역 색상 동기화
    const { accent } = useThemeStore();
    const accentHex = ACCENT_HEX_COLORS[accent];

    const [diary, setDiary] = useState<DiaryDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // [통신] 일기 상세 내용 로드
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

    // [로직] 일기 삭제 처리
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

    if (loading) {
        return (
            <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
                <ActivityIndicator size="large" color={accentHex} />
            </View>
        );
    }

    if (!diary) return null;

    const headerDateObj = new Date(diary.diaryDate || diary.createdAt || diary.createAt || new Date());
    const hasImages = !!diary.imageUrl || (diary.images?.length ?? 0) > 0;

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 relative" edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />

            {/* 상단 헤더 (뒤로가기, 수정, 삭제) */}
            <View className="flex-row items-center justify-between bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-20 border-b border-slate-100 dark:border-slate-800/60 relative" style={{ paddingHorizontal: scale(16), height: scale(52) }}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: scale(6), zIndex: 10 }}>
                    <Ionicons name="chevron-back" size={scale(28)} color="#64748B" />
                </TouchableOpacity>

                <View className="flex-row items-center" style={{ gap: scale(4), zIndex: 10 }}>
                    <TouchableOpacity onPress={() => router.push({ pathname: '/diary-screen/editor', params: { mode: 'edit', diaryId: diary.diaryId, origin } })} style={{ padding: scale(6) }}>
                        <Ionicons name="create-outline" size={scale(24)} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} style={{ padding: scale(6) }}>
                        <Ionicons name="trash-outline" size={scale(24)} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(140), paddingTop: scale(32) }} showsVerticalScrollIndicator={false}>
                <View className="animate-[fade-in_0.3s]">
                    {/* 제목 및 메타 정보 */}
                    <View className="items-center" style={{ paddingHorizontal: scale(28), marginBottom: scale(32) }}>
                        {/* ✨ 날짜 텍스트를 primary-500으로 변경! */}
                        <Text className="font-extrabold text-primary-500 uppercase tracking-widest" style={{ marginBottom: scale(16), fontSize: scale(13) }} allowFontScaling={false}>
                            {format(headerDateObj, "yyyy년 M월 d일 EEEE", { locale: ko })}
                        </Text>
                        <Text className="font-extrabold text-slate-900 dark:text-white text-center" style={{ fontSize: scale(28), lineHeight: scale(42), marginBottom: scale(24), letterSpacing: scale(-0.5) }} allowFontScaling={false}>
                            {diary.title || "제목 없음"}
                        </Text>
                        {diary.tags && diary.tags.length > 0 && (
                            <View className="flex-row flex-wrap justify-center" style={{ gap: scale(8) }}>
                                {diary.tags.map((tag: any, idx: number) => (
                                    <View key={idx} className="bg-primary-50 dark:bg-primary-900/40 rounded-md border border-primary-100/50 dark:border-primary-800/50" style={{ paddingHorizontal: scale(12), paddingVertical: scale(6) }}>
                                        {/* ✨ 해시태그 텍스트를 primary-500으로 변경! */}
                                        <Text className="text-primary-500 dark:text-primary-300 font-extrabold uppercase tracking-wider" style={{ fontSize: scale(11) }} allowFontScaling={false}>
                                            #{typeof tag === 'string' ? tag : tag.name}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* 이미지 갤러리 */}
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

                    {/* 본문 내용 */}
                    <View style={{ paddingHorizontal: scale(28), marginBottom: scale(48) }}>
                        <Text className="text-slate-700 dark:text-slate-300 font-medium text-left" style={{ fontSize: scale(16), lineHeight: scale(32) }} allowFontScaling={false}>
                            {diary.content}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* ✨ 채팅방 이동 플로팅 버튼(FAB) 배경색을 primary-500으로 변경! */}
            <View className="absolute z-50" style={{ bottom: scale(40), right: scale(24) }}>
                <TouchableOpacity
                    onPress={() => {
                        if (diary.sessionId) {
                            router.push({ pathname: '/diary-screen/chat-history', params: { sessionId: diary.sessionId } });
                        } else {
                            Alert.alert("알림", "이 일기에는 버디와 나눈 대화가 없습니다.");
                        }
                    }}
                    activeOpacity={0.8}
                    style={[fabShadow, { width: scale(56), height: scale(56) }]}
                    className="bg-primary-500 rounded-full items-center justify-center transition-colors"
                >
                    <Ionicons name="chatbubbles" size={scale(26)} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}