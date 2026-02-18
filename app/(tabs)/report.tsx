import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Dimensions, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// utils
import { DiaryEntry, storage } from "../../utils/storage";

const { width } = Dimensions.get("window");

export default function ReportScreen() {
    const [diaries, setDiaries] = useState<DiaryEntry[]>([]);

    // 1. 데이터 로드 (탭 열 때마다 갱신)
    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                const data = await storage.getDiaries();
                setDiaries(data);
            };
            loadData();
        }, [])
    );

    // === 통계 로직 ===
    const totalDiaries = diaries.length;

    // 감정 카운트
    const emotionCounts: Record<string, number> = {};
    diaries.forEach((diary) => {
        if (diary.emotion) {
            emotionCounts[diary.emotion] = (emotionCounts[diary.emotion] || 0) + 1;
        }
    });

    // 태그 빈도수 (전처리: # 제거)
    const tagCounts: Record<string, number> = {};
    diaries.forEach((diary) => {
        diary.tags.forEach((rawTag) => {
            const cleanTag = rawTag.replace(/#/g, ''); // # 제거
            tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
        });
    });

    // 상위 태그 5개
    const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    // 이번 달 기록 수
    const now = new Date();
    const thisMonthDiaries = diaries.filter((diary) => {
        const diaryDate = new Date(diary.date);
        return (
            diaryDate.getMonth() === now.getMonth() &&
            diaryDate.getFullYear() === now.getFullYear()
        );
    });

    // Streak(연속 기록) 계산
    const sortedDiaries = [...diaries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (const diary of sortedDiaries) {
        const diaryDate = new Date(diary.date);
        diaryDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor(
            (checkDate.getTime() - diaryDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) continue;
        if (diffDays === 1) {
            currentStreak++;
            checkDate = new Date(diaryDate);
        } else {
            break;
        }
    }

    if (sortedDiaries.length > 0) {
        const lastDiaryDate = new Date(sortedDiaries[0].date);
        lastDiaryDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (lastDiaryDate.getTime() === today.getTime() && currentStreak === 0) {
            currentStreak = 1;
        }
    }

    // === UI 렌더링 ===
    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="px-5 py-4 border-b border-gray-100 mb-2 items-center justify-center">
                <Text className="text-2xl font-bold text-gray-900">리포트</Text>
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

                {/* 1. Stats Grid (2x2) */}
                <View className="flex-row flex-wrap justify-between mb-2">
                    {/* 카드 1: 전체 일기 */}
                    <Animated.View entering={FadeInDown.delay(100)} className="w-[48%] mb-4">
                        <View className="bg-white p-5 rounded-3xl items-center shadow-sm border border-gray-100" style={{ elevation: 2 }}>
                            <Text className="text-3xl mb-2">📝</Text>
                            <Text className="text-2xl font-bold text-[#7C3AED]">{totalDiaries}</Text>
                            <Text className="text-xs text-gray-400 mt-1 font-medium">전체 일기</Text>
                        </View>
                    </Animated.View>

                    {/* 카드 2: 연속 기록 */}
                    <Animated.View entering={FadeInDown.delay(200)} className="w-[48%] mb-4">
                        <View className="bg-white p-5 rounded-3xl items-center shadow-sm border border-gray-100" style={{ elevation: 2 }}>
                            <Text className="text-3xl mb-2">🔥</Text>
                            <Text className="text-2xl font-bold text-[#7C3AED]">{currentStreak}</Text>
                            <Text className="text-xs text-gray-400 mt-1 font-medium">연속 기록</Text>
                        </View>
                    </Animated.View>

                    {/* 카드 3: 이번 달 */}
                    <Animated.View entering={FadeInDown.delay(300)} className="w-[48%] mb-4">
                        <View className="bg-white p-5 rounded-3xl items-center shadow-sm border border-gray-100" style={{ elevation: 2 }}>
                            <Text className="text-3xl mb-2">📅</Text>
                            <Text className="text-2xl font-bold text-[#7C3AED]">{thisMonthDiaries.length}</Text>
                            <Text className="text-xs text-gray-400 mt-1 font-medium">이번 달</Text>
                        </View>
                    </Animated.View>

                    {/* 카드 4: 관심사 */}
                    <Animated.View entering={FadeInDown.delay(400)} className="w-[48%] mb-4">
                        <View className="bg-white p-5 rounded-3xl items-center shadow-sm border border-gray-100" style={{ elevation: 2 }}>
                            <Text className="text-3xl mb-2">💡</Text>
                            <Text className="text-2xl font-bold text-[#7C3AED]">{Object.keys(tagCounts).length}</Text>
                            <Text className="text-xs text-gray-400 mt-1 font-medium">태그 종류</Text>
                        </View>
                    </Animated.View>
                </View>

                {/* 2. 감정 분포 (Progress Bar Style) */}
                <Animated.View entering={FadeInDown.delay(500)} className="mb-6">
                    <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm" style={{ elevation: 2 }}>
                        <View className="flex-row items-center mb-5">
                            <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center mr-3">
                                <Ionicons name="happy" size={16} color="#7C3AED" />
                            </View>
                            <Text className="text-lg font-bold text-gray-800">감정 분포</Text>
                        </View>

                        {Object.keys(emotionCounts).length === 0 ? (
                            <Text className="text-gray-400 text-center py-4">아직 기록된 감정이 없어요</Text>
                        ) : (
                            <View className="space-y-4">
                                {Object.entries(emotionCounts)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([emotion, count], idx) => {
                                        const percentage = (count / totalDiaries) * 100;
                                        return (
                                            <View key={emotion} className="mb-4">
                                                <View className="flex-row justify-between mb-2">
                                                    <Text className="text-sm font-bold text-gray-700 capitalize">{emotion}</Text>
                                                    <Text className="text-xs text-gray-500">{count}회 ({percentage.toFixed(0)}%)</Text>
                                                </View>
                                                <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <View
                                                        className="h-full bg-[#7C3AED] rounded-full"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </View>
                                            </View>
                                        );
                                    })}
                            </View>
                        )}
                    </View>
                </Animated.View>

                {/* 3. 자주 쓴 태그 (Top Tags) */}
                <Animated.View entering={FadeInDown.delay(600)} className="mb-6">
                    <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm" style={{ elevation: 2 }}>
                        <View className="flex-row items-center mb-5">
                            <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center mr-3">
                                <Ionicons name="pricetag" size={16} color="#7C3AED" />
                            </View>
                            <Text className="text-lg font-bold text-gray-800">자주 쓴 태그</Text>
                        </View>

                        {topTags.length === 0 ? (
                            <Text className="text-gray-400 text-center py-4">아직 태그가 없어요</Text>
                        ) : (
                            <View className="flex-row flex-wrap gap-2">
                                {topTags.map(([tag, count]) => (
                                    <View key={tag} className="bg-gray-50 px-4 py-2 rounded-2xl flex-row items-center border border-gray-100">
                                        {/* 여기 태그에는 #을 하나만 붙여줌 */}
                                        <Text className="text-gray-700 font-medium mr-1">#{tag}</Text>
                                        <Text className="text-[#7C3AED] font-bold text-xs">{count}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </Animated.View>

                {/* 4. 주간 활동 (Weekly Activity) */}
                <Animated.View entering={FadeInDown.delay(700)} className="mb-10">
                    <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm" style={{ elevation: 2 }}>
                        <View className="flex-row items-center mb-6">
                            <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center mr-3">
                                <Ionicons name="trending-up" size={16} color="#7C3AED" />
                            </View>
                            <Text className="text-lg font-bold text-gray-800">주간 활동</Text>
                        </View>

                        <View className="flex-row justify-around items-end h-40 pb-2">
                            {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => {
                                // 해당 요일의 일기 개수 계산
                                const count = diaries.filter((d) => new Date(d.date).getDay() === index).length;

                                // 최대값 계산 (0으로 나누기 방지)
                                const maxCount = Math.max(...Array.from({ length: 7 }, (_, i) =>
                                    diaries.filter(d => new Date(d.date).getDay() === i).length
                                )) || 1;

                                const heightPercent = (count / maxCount) * 100;
                                const barHeight = count > 0 ? Math.max(heightPercent, 10) : 4; // 최소 높이

                                return (
                                    <View key={day} className="items-center flex-1">
                                        <View className="h-32 justify-end w-full items-center mb-2">
                                            <View
                                                className={`w-3 rounded-full ${count > 0 ? 'bg-[#7C3AED]' : 'bg-gray-100'}`}
                                                style={{ height: `${barHeight}%` }}
                                            />
                                        </View>
                                        <Text className={`text-xs font-medium ${index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
                                            {day}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </Animated.View>

            </ScrollView>
        </SafeAreaView>
    );
}