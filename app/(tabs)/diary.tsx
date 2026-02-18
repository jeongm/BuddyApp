import { useFocusEffect, useRouter } from 'expo-router';
import { FileText, Plus, Search } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input } from '../../components/ui/Input';
import { DiaryEntry, storage } from '../../utils/storage';

export default function DiariesScreen() {
    const router = useRouter();
    const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    useFocusEffect(
        useCallback(() => {
            const loadDiaries = async () => {
                const data = await storage.getDiaries();
                setDiaries(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            };
            loadDiaries();
        }, [])
    );

    const allTags = Array.from(new Set(diaries.flatMap((diary) => diary.tags))).sort();

    const filteredDiaries = diaries.filter((diary) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            searchQuery === "" ||
            diary.title.toLowerCase().includes(query) ||
            diary.content.toLowerCase().includes(query);
        const matchesTag = !selectedTag || (diary.tags && diary.tags.includes(selectedTag));
        return matchesSearch && matchesTag;
    });

    const renderItem = ({ item, index }: { item: DiaryEntry; index: number }) => {
        const hasImage = item.images && item.images.length > 0;

        // 날짜 포맷팅
        const dateStr = new Date(item.date).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            weekday: "long"
        });

        return (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push(`/diary/${item.id}`)}
                    className="mb-3 mx-1"
                >
                    <View
                        className="bg-white rounded-2xl p-4 border border-gray-100 flex-row gap-4"
                        style={{
                            elevation: 2,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 5,
                        }}
                    >
                        {/* 1. [좌측] 텍스트 그룹 (이미지가 커졌으니 공간 확보를 위해 flex-1 필수) */}
                        <View className="flex-1 justify-center">
                            {/* justify-center를 넣으면 텍스트 양이 적어도 중앙 정렬돼서 예쁩니다 */}

                            <Text className="text-[11px] text-gray-400 font-medium mb-1.5">
                                {dateStr}
                            </Text>

                            <Text className="text-[16px] font-bold text-gray-900 leading-tight mb-1" numberOfLines={1}>
                                {item.title}
                            </Text>

                            <Text className="text-[13px] text-gray-500 leading-5 mb-3" numberOfLines={2}>
                                {item.content}
                            </Text>

                            {/* 태그 */}
                            {(item.tags?.length > 0 || item.emotion) && (
                                <View className="flex-row flex-wrap gap-1.5">
                                    {item.emotion && (
                                        <View className="bg-purple-50 px-2 py-1 rounded-md">
                                            <Text className="text-purple-600 text-[10px] font-medium">
                                                {item.emotion}
                                            </Text>
                                        </View>
                                    )}
                                    {item.tags?.slice(0, 3).map((tag, i) => (
                                        <View key={i} className="bg-gray-100 px-2 py-1 rounded-md">
                                            <Text className="text-gray-600 text-[10px] font-medium">
                                                {tag.startsWith('#') ? tag : `#${tag}`}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* 2. [우측] 이미지 (크기 수정됨!) */}
                        {hasImage && (
                            <Image
                                source={{ uri: item.images![0] }}
                                // ✅ w-20 h-20 -> w-24 h-24 (약 96px)로 변경
                                // 더 크게 하고 싶으면 w-28 h-28 (112px)로 하시면 됩니다.
                                className="w-24 h-24 rounded-xl bg-gray-100 border border-gray-50"
                                resizeMode="cover"
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };


    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>

            {/* === Header (가운데 정렬) === */}
            <View className="py-4 bg-white items-center justify-center border-b border-gray-50">
                <Text className="text-lg font-bold text-gray-900">나의 기록</Text>
            </View>

            {/* === Search & Filters === */}
            <View className="px-5 py-3 bg-white z-10">
                <View className="relative justify-center mb-3">
                    <View className="absolute left-4 z-10">
                        <Search size={16} color="#94A3B8" />
                    </View>
                    <Input
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="검색어 입력"
                        className="pl-10 h-10 rounded-xl bg-gray-50 border-none text-sm"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                {allTags.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: 20 }}>
                        <TouchableOpacity
                            onPress={() => setSelectedTag(null)}
                            className={`px-3 py-1.5 rounded-full border ${selectedTag === null
                                ? "bg-gray-900 border-gray-900"
                                : "bg-white border-gray-200"
                                }`}
                        >
                            <Text className={`text-xs ${selectedTag === null ? "text-white font-bold" : "text-gray-500"}`}>
                                전체
                            </Text>
                        </TouchableOpacity>

                        {allTags.map((tag) => (
                            <TouchableOpacity
                                key={tag}
                                onPress={() => setSelectedTag(tag)}
                                className={`px-3 py-1.5 rounded-full border ${selectedTag === tag
                                    ? "bg-[#7C3AED] border-[#7C3AED]"
                                    : "bg-white border-gray-200"
                                    }`}
                            >
                                <Text className={`text-xs ${selectedTag === tag ? "text-white font-bold" : "text-gray-500"}`}>
                                    #{tag}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* === List === */}
            <View className="flex-1 bg-gray-50/50">
                <FlatList
                    data={filteredDiaries}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20 opacity-40">
                            <FileText size={40} color="#CBD5E1" />
                            <Text className="text-gray-400 mt-3 text-sm">작성된 일기가 없어요</Text>
                        </View>
                    }
                />
            </View>

            {/* === FAB === */}
            <TouchableOpacity
                className="absolute bottom-6 right-6 w-14 h-14 bg-[#7C3AED] rounded-full items-center justify-center shadow-lg shadow-purple-400 z-50"
                onPress={() => router.push("/diary/new")}
                activeOpacity={0.9}
                style={{ elevation: 5 }}
            >
                <Plus size={28} color="white" />
            </TouchableOpacity>

        </SafeAreaView>
    );
}