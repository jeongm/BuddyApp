import { Ionicons } from '@expo/vector-icons';
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
// ✨ RNText 추가!
import { ActivityIndicator, Dimensions, FlatList, RefreshControl, Text as RNText, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { diaryApi } from "../../api/diaryApi";
import { AppText as Text } from '../../components/AppText';
import { useAuthStore } from "../../store/useAuthStore";
// ✨ 스토어 추가!
import { useSettingStore } from "../../store/useSettingStore";
import type { DiarySummary } from "../../types/diary";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

type SearchFilterType = "all" | "title" | "content" | "tag";

export default function DiaryFeedScreen() {
    const router = useRouter();
    const { user } = useAuthStore();

    // ✨ 폰트 상태 불러오기
    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const [allDiaries, setAllDiaries] = useState<DiarySummary[]>([]);
    const [filteredDiaries, setFilteredDiaries] = useState<DiarySummary[]>([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState<SearchFilterType>("all");

    // ✨ 무한 스크롤을 위한 상태값들 추가
    const [loading, setLoading] = useState(false); // 처음 렌더링 시 로딩
    const [refreshing, setRefreshing] = useState(false); // 당겨서 새로고침 로딩
    const [isFetchingMore, setIsFetchingMore] = useState(false); // 바닥에 닿아서 더 불러올 때 로딩
    const [page, setPage] = useState(0); // 현재 페이지 번호
    const [isEnd, setIsEnd] = useState(false); // 마지막 페이지인지 여부

    const PAGE_SIZE = 10; // ✨ 황금 비율 15개!

    // ✨ 페이지 번호(pageNum)와 새로고침 여부(isRefresh)를 받도록 함수 업그레이드!
    const fetchDiaries = useCallback(async (pageNum = 0, isRefresh = false) => {
        if (!user) return;

        if (isRefresh) {
            setLoading(true);
            setIsEnd(false); // 새로고침 시 끝(end) 상태 초기화
        } else {
            setIsFetchingMore(true);
        }

        try {
            // ✨ API에 페이지 번호와 사이즈(15개)를 넘겨줍니다.
            const response = await diaryApi.getDiaries("", pageNum, PAGE_SIZE, "diaryDate,desc");

            if (response?.result?.content) {
                const newContent = response.result.content;

                if (isRefresh) {
                    setAllDiaries(newContent); // 새로고침이면 덮어쓰기
                } else {
                    setAllDiaries(prev => [...prev, ...newContent]); // 더 불러오기면 기존 리스트 뒤에 이어 붙이기
                }

                // 가져온 데이터가 15개보다 적으면, 그게 마지막 페이지라는 뜻!
                if (newContent.length < PAGE_SIZE || response.result.last) {
                    setIsEnd(true);
                }
            } else {
                if (isRefresh) setAllDiaries([]);
                setIsEnd(true);
            }
        } catch (error) {
            console.error("일기 목록 로드 실패", error);
            if (isRefresh) setAllDiaries([]);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    }, [user]);

    // ✨ 화면에 포커스 될 때 무조건 첫 페이지(0)부터 다시 로드!
    useFocusEffect(
        useCallback(() => {
            setPage(0);
            fetchDiaries(0, true);
        }, [fetchDiaries])
    );

    // ✨ 당겨서 새로고침할 때도 첫 페이지(0)로 리셋!
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setPage(0);
        await fetchDiaries(0, true);
        setRefreshing(false);
    }, [fetchDiaries]);

    // ✨ 바닥에 닿았을 때 다음 페이지 불러오는 함수
    const handleLoadMore = () => {
        // 이미 로딩 중이거나, 마지막 페이지면 실행하지 않음 (중복 호출 방지)
        if (!isEnd && !loading && !isFetchingMore && !refreshing) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchDiaries(nextPage, false);
        }
    };

    // ✨ 검색/필터 로직 (현재 로드된 allDiaries 내에서 필터링)
    React.useEffect(() => {
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
        router.push({ pathname: '/diary-screen/viewer', params: { id: diarySeq, origin: 'diary' } });
    };

    const renderDiaryCard = ({ item }: { item: DiarySummary }) => {
        const d = item as any;
        const hasImage = !!d.imageUrl || (d.images && d.images.length > 0);
        const previewUrl = d.imageUrl || (d.images?.[0]?.url || d.images?.[0]);
        const dateStr = d.diaryDate || d.date || d.createdAt || d.createAt;

        return (
            <TouchableOpacity activeOpacity={0.8} onPress={() => handleDiaryClick(d.diarySeq)} className="border-b border-slate-100 dark:border-slate-800/60" style={{ paddingHorizontal: scale(24), paddingVertical: scale(28), gap: scale(14) }}>
                <Text className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest" style={{ fontSize: scale(11) }} allowFontScaling={false}>
                    {dateStr ? format(new Date(dateStr), "yyyy. MM. dd EEEE", { locale: ko }) : "날짜 없음"}
                </Text>

                <Text className="font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(20), lineHeight: scale(28) }} allowFontScaling={false} numberOfLines={2}>
                    {d.title || "제목 없음"}
                </Text>

                {hasImage && previewUrl && (
                    <View className="w-full rounded-[1.5rem] overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800/60 shadow-sm" style={{ aspectRatio: 4 / 3 }}>
                        <Image source={{ uri: previewUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={300} />
                    </View>
                )}

                <Text className="font-normal text-slate-600 dark:text-slate-300" style={{ fontSize: scale(15), lineHeight: scale(28) }} allowFontScaling={false} numberOfLines={3}>
                    {d.summary || d.content}
                </Text>

                {d.tags && d.tags.length > 0 && (
                    <View className="flex-row flex-wrap" style={{ gap: scale(8) }}>
                        {d.tags.map((tag: any, idx: number) => {
                            const tagName = typeof tag === 'string' ? tag : tag.name;
                            return (
                                <View key={idx} className="bg-primary-50 dark:bg-primary-900/40 rounded-md border border-primary-100/50 dark:border-primary-800/50" style={{ paddingHorizontal: scale(10), paddingVertical: scale(6) }}>
                                    <Text className="text-primary-600 dark:text-primary-300 font-extrabold uppercase tracking-wide" style={{ fontSize: scale(11) }} allowFontScaling={false}>#{tagName}</Text>
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
            <View className="px-6 py-4 pb-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20">
                {/* 🚨 헤더 교체 완료 (크기 유지, 폰트 연동) 🚨 */}
                <RNText className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: customFontFamily }} allowFontScaling={false}>Story</RNText>
            </View>

            <View className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-10 border-b border-slate-100 dark:border-slate-800/60" style={{ paddingHorizontal: scale(24), paddingTop: scale(12), paddingBottom: scale(16) }}>
                <View className="flex-row items-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800" style={{ height: scale(46), paddingHorizontal: scale(16) }}>
                    <Ionicons name="search" size={scale(20)} color="#94A3B8" />
                    {/* 검색창 내부 텍스트는 폰트를 적용하면 레이아웃이 튈 수 있으니, TextInput 자체의 style에 fontFamily를 주입합니다. */}
                    <TextInput
                        placeholder="검색어를 입력하세요..."
                        placeholderTextColor="#94A3B8"
                        className="flex-1 font-medium text-slate-900 dark:text-white py-0"
                        style={{ marginLeft: scale(12), fontSize: scale(15), paddingVertical: 0, marginVertical: 0, textAlignVertical: 'center', fontFamily: customFontFamily }}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        clearButtonMode="while-editing"
                        returnKeyType="search"
                        allowFontScaling={false}
                    />
                </View>
                <View className="flex-row" style={{ gap: scale(8), marginTop: scale(16) }}>
                    {filterOptions.map((filter) => {
                        const isSelected = searchType === filter.id;
                        return (
                            <TouchableOpacity key={filter.id} onPress={() => setSearchType(filter.id)} activeOpacity={0.7} className={`rounded-full border transition-colors ${isSelected ? "bg-primary-600 border-primary-600" : "bg-transparent border-slate-200 dark:border-slate-800"}`} style={{ paddingHorizontal: scale(16), paddingVertical: scale(8) }}>
                                <Text className={`font-extrabold tracking-tight ${isSelected ? "text-white" : "text-slate-500 dark:text-slate-400"}`} style={{ fontSize: scale(12) }} allowFontScaling={false}>{filter.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View className="flex-1 bg-white dark:bg-slate-950">
                {loading && !refreshing ? (
                    <View className="flex-1 items-center justify-center" style={{ paddingBottom: scale(80) }}>
                        <ActivityIndicator size="large" color="#94A3B8" />
                    </View>
                ) : filteredDiaries.length === 0 ? (
                    <ScrollView contentContainerStyle={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#94A3B8" />}>
                        <View className="flex-1 items-center justify-center opacity-60" style={{ paddingBottom: scale(80) }}>
                            <Ionicons name="document-text-outline" size={scale(48)} color="#94A3B8" style={{ marginBottom: scale(16) }} />
                            <Text className="text-slate-500 dark:text-slate-400 font-bold" style={{ fontSize: scale(14) }} allowFontScaling={false}>{searchQuery ? "검색 결과가 없습니다." : "작성된 일기가 없습니다."}</Text>
                        </View>
                    </ScrollView>
                ) : (
                    <FlatList
                        data={filteredDiaries}
                        keyExtractor={(item) => item.diarySeq.toString()}
                        renderItem={renderDiaryCard}
                        contentContainerStyle={{ paddingBottom: scale(120) }}
                        showsVerticalScrollIndicator={false}
                        keyboardDismissMode="on-drag"
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#94A3B8" />}
                        // ✨ 무한 스크롤 마법 발동!
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5} // 바닥에서 절반(0.5)쯤 남았을 때 몰래 불러오기 시작!
                        ListFooterComponent={ // 바닥에 닿았을 때 로딩 중이면 보여줄 스피너
                            isFetchingMore ? (
                                <View style={{ paddingVertical: scale(24), alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color="#94A3B8" />
                                </View>
                            ) : null
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}