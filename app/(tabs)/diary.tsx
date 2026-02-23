import { Ionicons } from '@expo/vector-icons';
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { diaryApi } from "../../api/diaryApi";
import { useAuthStore } from "../../store/useAuthStore";
import type { DiarySummary } from "../../types/diary";

type SearchFilterType = "all" | "title" | "content" | "tag";

export default function DiaryFeedScreen() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [allDiaries, setAllDiaries] = useState<DiarySummary[]>([]);
    const [filteredDiaries, setFilteredDiaries] = useState<DiarySummary[]>([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState<SearchFilterType>("all");
    const [loading, setLoading] = useState(false);

    // ✨ 완벽 최적화: 백엔드의 새 API(getDiaries)를 단 한 번만 호출합니다.
    const fetchAllDiaries = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            // 정렬 기준을 swagger 기본값인 "diaryDate,desc"로 변경
            const response = await diaryApi.getDiaries("", 0, 50, "diaryDate,desc");

            // ✨ 타입 에러 해결됨! 스웨거 구조대로 result.content에서 일기 배열을 꺼냅니다.
            if (response?.result?.content) {
                setAllDiaries(response.result.content);
                setFilteredDiaries(response.result.content);
            }
        } catch (error) {
            console.error("일기 목록 로드 실패", error);
            setAllDiaries([]);
            setFilteredDiaries([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchAllDiaries(); }, [fetchAllDiaries]);

    // 로컬 필터링 로직 (기존과 동일하게 빠르고 스무스하게 동작)
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredDiaries(allDiaries);
            return;
        }

        const lowerQuery = searchQuery.toLowerCase();

        const filtered = allDiaries.filter(diary => {
            const matchTitle = diary.title?.toLowerCase().includes(lowerQuery);
            const matchSummary = (diary.summary || diary.content)?.toLowerCase().includes(lowerQuery);
            const matchTags = diary.tags?.some((tag: any) => {
                const tagName = typeof tag === 'string' ? tag : tag.name;
                return tagName.toLowerCase().includes(lowerQuery);
            });

            if (searchType === "title") return matchTitle;
            if (searchType === "content") return matchSummary;
            if (searchType === "tag") return matchTags;

            return matchTitle || matchSummary || matchTags;
        });

        setFilteredDiaries(filtered);
    }, [searchQuery, searchType, allDiaries]);

    const handleDiaryClick = (diarySeq: number) => {
        router.push({ pathname: '/diary-screen/viewer', params: { id: diarySeq } });
    };

    const renderDiaryCard = ({ item }: { item: DiarySummary }) => {
        const d = item as any;
        const hasImage = !!d.imageUrl || (d.images && d.images.length > 0);
        const previewUrl = d.imageUrl || (d.images?.[0]?.url || d.images?.[0]);
        // ✨ 백엔드 변경 사항 반영 (diaryDate 우선)
        const dateStr = d.diaryDate || d.date || d.createdAt || d.createAt;

        return (
            <TouchableOpacity activeOpacity={0.8} onPress={() => handleDiaryClick(d.diarySeq)} className="px-6 py-8 border-b border-slate-100 dark:border-slate-800/60 flex-col gap-4">
                <View>
                    <Text className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                        {dateStr ? format(new Date(dateStr), "yyyy. MM. dd EEEE", { locale: ko }) : "날짜 없음"}
                    </Text>
                    <Text className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight" numberOfLines={2}>
                        {d.title || "제목 없음"}
                    </Text>
                </View>

                {hasImage && previewUrl && (
                    <View className="w-full aspect-[4/3] rounded-[1.5rem] overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800/60 shadow-sm mt-1 mb-2">
                        <Image source={{ uri: previewUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={300} />
                    </View>
                )}

                <Text className="text-[15px] font-medium text-slate-600 dark:text-slate-300 leading-[28px]" numberOfLines={3}>
                    {d.summary || d.content}
                </Text>

                {d.tags && d.tags.length > 0 && (
                    <View className="flex-row flex-wrap gap-2 mt-2">
                        {d.tags.map((tag: any, idx: number) => {
                            const tagName = typeof tag === 'string' ? tag : tag.name;
                            return (
                                <View key={idx} className="bg-primary-50 dark:bg-primary-900/40 px-2.5 py-1.5 rounded-md border border-primary-100/50 dark:border-primary-800/50">
                                    <Text className="text-[11px] text-primary-600 dark:text-primary-300 font-extrabold uppercase tracking-wide">#{tagName}</Text>
                                </View>
                            );
                        })}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const filterOptions: { id: SearchFilterType, label: string }[] = [
        { id: "all", label: "전체" },
        { id: "title", label: "제목" },
        { id: "content", label: "내용" },
        { id: "tag", label: "태그" }
    ];

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
            <View className="px-6 py-4 pb-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-10 border-b border-slate-100 dark:border-slate-800/60">
                <Text className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-5">Diaries</Text>

                <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-800">
                    <Ionicons name="search" size={20} color="#94A3B8" />
                    <TextInput placeholder="검색어를 입력하세요..." placeholderTextColor="#94A3B8" className="flex-1 ml-3 text-slate-900 dark:text-white font-medium text-[15px]" value={searchQuery} onChangeText={setSearchQuery} clearButtonMode="while-editing" returnKeyType="search" />
                </View>

                <View className="flex-row gap-2 mt-4">
                    {filterOptions.map((filter) => {
                        const isSelected = searchType === filter.id;
                        return (
                            <TouchableOpacity key={filter.id} onPress={() => setSearchType(filter.id)} activeOpacity={0.7} className={`px-4 py-1.5 rounded-full border transition-colors ${isSelected ? "bg-slate-900 border-slate-900 dark:bg-white dark:border-white" : "bg-transparent border-slate-200 dark:border-slate-800"}`}>
                                <Text className={`text-[12px] font-extrabold tracking-tight ${isSelected ? "text-white dark:text-slate-900" : "text-slate-500 dark:text-slate-400"}`}>{filter.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View className="flex-1 bg-white dark:bg-slate-950">
                {loading ? (
                    <View className="flex-1 items-center justify-center pb-20">
                        <ActivityIndicator size="large" color="#94A3B8" />
                    </View>
                ) : filteredDiaries.length === 0 ? (
                    <View className="flex-1 items-center justify-center pb-20 opacity-60">
                        <Ionicons name="document-text-outline" size={48} color="#94A3B8" className="mb-4" />
                        <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm">{searchQuery ? "검색 결과가 없습니다." : "작성된 일기가 없습니다."}</Text>
                    </View>
                ) : (
                    <FlatList data={filteredDiaries} keyExtractor={(item) => item.diarySeq.toString()} renderItem={renderDiaryCard} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false} keyboardDismissMode="on-drag" />
                )}
            </View>
        </SafeAreaView>
    );
}