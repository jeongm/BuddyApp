import { Ionicons } from "@expo/vector-icons";
import { differenceInDays, endOfWeek, format, getWeekOfMonth, startOfWeek, subMonths } from "date-fns";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// api & store
import { diaryApi } from "../../api/diaryApi";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore"; // ✨ 테마 스토어 임포트
import type { DiarySummary } from "../../types/diary";

export default function ReportScreen() {
    const { user } = useAuthStore();
    const { accent } = useThemeStore(); // ✨ 현재 선택된 포인트 컬러 가져오기

    const [diaries, setDiaries] = useState<DiarySummary[]>([]);
    const [loading, setLoading] = useState(true);

    // ✨ 선택된 테마(accent)에 맞는 헥스(HEX) 컬러를 반환하는 함수
    const getAccentColor = () => {
        switch (accent) {
            case 'violet': return '#8B5CF6';
            case 'rose': return '#F43F5E';
            case 'blue': return '#3B82F6';
            case 'green': return '#22C55E';
            default: return '#64748B'; // slate (default)
        }
    };

    const fetchStatsData = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            // 정렬 기준을 swagger 기본값인 "diaryDate,desc"로 변경
            const response = await diaryApi.getDiaries("", 0, 50, "diaryDate,desc");

            // ✨ 스웨거 구조에 맞춰 바로 content 추출!
            if (response?.result?.content) {
                setDiaries(response.result.content);
            }
        } catch (error) {
            console.error("통계 데이터 로드 실패", error);
            setDiaries([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchStatsData();
        }, [fetchStatsData])
    );

    // === 통계 데이터 계산 ===
    const getDiaryDate = (d: any) => new Date(d.diaryDate || d.date || d.createdAt || d.createAt);
    const totalDiaries = diaries.length;

    // 태그 빈도수 계산
    const tagCounts: Record<string, number> = {};
    diaries.forEach((diary: any) => {
        if (diary.tags && Array.isArray(diary.tags)) {
            diary.tags.forEach((tagItem: any) => {
                const cleanTag = (typeof tagItem === 'string' ? tagItem : tagItem.name).replace(/#/g, '');
                tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
            });
        }
    });

    const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    // 이번 달 작성량
    const now = new Date();
    const thisMonthDiaries = diaries.filter((diary) => {
        const dDate = getDiaryDate(diary);
        return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear();
    });

    // 연속 기록 (Streak)
    const uniqueDates = [...new Set(diaries.map(d => format(getDiaryDate(d), "yyyy-MM-dd")))]
        .sort()
        .reverse();

    let currentStreak = 0;
    let checkDate = new Date();
    const todayStr = format(checkDate, "yyyy-MM-dd");
    const yesterdayStr = format(subMonths(checkDate, 0).setDate(checkDate.getDate() - 1), "yyyy-MM-dd");

    if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
        let currentDate = new Date(uniqueDates[0]);
        for (const dateStr of uniqueDates) {
            const d = new Date(dateStr);
            const diff = differenceInDays(currentDate, d);

            if (diff === 0) {
                currentStreak++;
            } else if (diff === 1) {
                currentStreak++;
                currentDate = d;
            } else {
                break;
            }
        }
    }

    // 주간 활동 차트 로직 (이번 주)
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // 일요일 시작
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

    const thisWeekDiaries = diaries.filter((diary) => {
        const dDate = getDiaryDate(diary);
        return dDate >= weekStart && dDate <= weekEnd;
    });

    const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
    const weeklyData = daysOfWeek.map((day, index) => {
        const count = thisWeekDiaries.filter((d) => getDiaryDate(d).getDay() === index).length;
        return { day, count, index };
    });
    const maxWeeklyCount = Math.max(...weeklyData.map(d => d.count)) || 1;

    // "몇 월 몇 주차" 텍스트
    const monthLabel = format(now, "M월");
    const weekOfMonth = getWeekOfMonth(now);
    const weekLabel = `${monthLabel} ${weekOfMonth}주차`;

    // === UI 렌더링 ===
    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>

            <View className="px-6 py-4 pb-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-10 border-b border-slate-100 dark:border-slate-800/60">
                <Text className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Insights
                </Text>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center pb-20">
                    {/* ✨ 꼼수 대신 정공법! 테마에 맞는 색상 함수 호출 */}
                    <ActivityIndicator size="large" color={getAccentColor()} />
                    <Text className="text-slate-500 font-bold mt-4">데이터를 분석하고 있어요...</Text>
                </View>
            ) : diaries.length === 0 ? (
                <View className="flex-1 items-center justify-center pb-20 opacity-60">
                    <Ionicons name="bar-chart-outline" size={48} color="#94A3B8" className="mb-4" />
                    <Text className="text-slate-500 dark:text-slate-400 font-bold">아직 분석할 데이터가 부족해요.</Text>
                </View>
            ) : (
                <ScrollView className="flex-1 pt-6 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

                    {/* 1. Stats Grid (2x2) */}
                    <View className="flex-row flex-wrap justify-between mb-8">
                        <Animated.View entering={FadeInDown.duration(600).delay(100).springify()} className="w-[48%] mb-4">
                            <View className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 shadow-sm aspect-square justify-between">
                                <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 items-center justify-center">
                                    <Ionicons name="library" size={20} color="#3B82F6" />
                                </View>
                                <View>
                                    <Text className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-1">{totalDiaries}</Text>
                                    <Text className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">전체 기록</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.duration(600).delay(200).springify()} className="w-[48%] mb-4">
                            <View className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 shadow-sm aspect-square justify-between">
                                <View className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 items-center justify-center">
                                    <Ionicons name="flame" size={20} color="#F97316" />
                                </View>
                                <View>
                                    <Text className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-1">
                                        {currentStreak}<Text className="text-xl text-slate-400 font-bold tracking-normal">일</Text>
                                    </Text>
                                    <Text className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">연속 기록</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.duration(600).delay(300).springify()} className="w-[48%]">
                            <View className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 shadow-sm aspect-square justify-between">
                                <View className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 items-center justify-center">
                                    <Ionicons name="leaf" size={20} color="#10B981" />
                                </View>
                                <View>
                                    <Text className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-1">{thisMonthDiaries.length}</Text>
                                    <Text className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">이번 달 기록</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.duration(600).delay(400).springify()} className="w-[48%]">
                            <View className="bg-slate-50 dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 shadow-sm aspect-square justify-between">
                                <View className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 items-center justify-center">
                                    <Ionicons name="pricetags" size={20} color="#8B5CF6" />
                                </View>
                                <View>
                                    <Text className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tighter mb-1">{Object.keys(tagCounts).length}</Text>
                                    <Text className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">관심사 키워드</Text>
                                </View>
                            </View>
                        </Animated.View>
                    </View>

                    {/* 2. 주간 활동 차트 */}
                    <Animated.View entering={FadeInUp.duration(600).delay(500).springify()} className="mb-8">
                        <View className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 shadow-sm">

                            <View className="flex-row items-center justify-between mb-8">
                                <View className="flex-row items-center gap-2">
                                    <Text className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">이번 주 활동</Text>
                                    <View className="bg-primary-50 dark:bg-primary-900/40 px-2 py-0.5 rounded-md border border-primary-100/50 dark:border-primary-800/50">
                                        <Text className="text-[10px] font-extrabold text-primary-600 dark:text-primary-400 tracking-wider">{weekLabel}</Text>
                                    </View>
                                </View>
                                <Ionicons name="bar-chart" size={20} color="#94A3B8" />
                            </View>

                            <View className="flex-row justify-between items-end h-40 px-1">
                                {weeklyData.map((data) => {
                                    const heightPercent = (data.count / maxWeeklyCount) * 100;
                                    const barHeight = data.count > 0 ? Math.max(heightPercent, 15) : 0;

                                    return (
                                        <View key={data.day} className="items-center w-8">
                                            <View className="h-6 justify-end mb-2">
                                                {data.count > 0 && (
                                                    <Text className="text-[12px] font-extrabold text-slate-700 dark:text-slate-300">{data.count}</Text>
                                                )}
                                            </View>
                                            <View className="h-24 w-5 bg-slate-200/50 dark:bg-slate-800 rounded-full justify-end overflow-hidden mb-3">
                                                <View className="w-full bg-primary-500 rounded-full transition-all duration-500" style={{ height: `${barHeight}%` }} />
                                            </View>
                                            <Text className={`text-[12px] font-extrabold ${data.index === 0 ? 'text-red-400' : data.index === 6 ? 'text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                {data.day}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </Animated.View>

                    {/* 3. 나의 키워드 */}
                    <Animated.View entering={FadeInUp.duration(600).delay(600).springify()} className="mb-6">
                        <View className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 shadow-sm">
                            <View className="flex-row items-center justify-between mb-6">
                                <Text className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">나의 키워드</Text>
                                <Ionicons name="pricetag" size={20} color="#94A3B8" />
                            </View>

                            {topTags.length === 0 ? (
                                <View className="py-6 items-center opacity-60">
                                    <Text className="text-slate-500 font-bold">아직 사용된 태그가 없습니다.</Text>
                                </View>
                            ) : (
                                <View className="flex-row flex-wrap gap-2.5">
                                    {topTags.map(([tag, count], idx) => {
                                        const isFirst = idx === 0;
                                        return (
                                            <View
                                                key={tag}
                                                className={`px-4 py-2 rounded-full flex-row items-center border ${isFirst
                                                    ? "bg-primary-600 border-primary-600 shadow-sm shadow-primary-300 dark:shadow-none"
                                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                                    }`}
                                            >
                                                <Text className={`font-extrabold text-[13px] tracking-wide mr-2 ${isFirst ? "text-white" : "text-slate-700 dark:text-slate-300"}`}>
                                                    #{tag}
                                                </Text>
                                                <View className={`px-1.5 py-0.5 rounded-md ${isFirst ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"}`}>
                                                    <Text className={`text-[10px] font-extrabold ${isFirst ? "text-white" : "text-slate-500 dark:text-slate-400"}`}>
                                                        {count}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    </Animated.View>

                </ScrollView>
            )}
        </SafeAreaView>
    );
}