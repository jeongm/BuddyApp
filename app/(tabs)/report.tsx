import { Ionicons } from "@expo/vector-icons";
import { differenceInDays, endOfWeek, format, getWeekOfMonth, startOfWeek, subMonths } from "date-fns";
import { Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// api & store
import { diaryApi } from "../../api/diaryApi";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import type { DiarySummary } from "../../types/diary";

// ✨ 마법의 스케일링 함수
const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

export default function ReportScreen() {
    const { user } = useAuthStore();
    const { accent } = useThemeStore();

    const [diaries, setDiaries] = useState<DiarySummary[]>([]);
    const [loading, setLoading] = useState(true);

    const getAccentColor = () => {
        switch (accent) {
            case 'violet': return '#8B5CF6';
            case 'rose': return '#F43F5E';
            case 'blue': return '#3B82F6';
            case 'green': return '#22C55E';
            default: return '#64748B';
        }
    };

    const fetchStatsData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await diaryApi.getDiaries("", 0, 50, "diaryDate,desc");
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

    const getDiaryDate = (d: any) => new Date(d.diaryDate || d.date || d.createdAt || d.createAt);
    const totalDiaries = diaries.length;

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

    const now = new Date();
    const thisMonthDiaries = diaries.filter((diary) => {
        const dDate = getDiaryDate(diary);
        return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear();
    });

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

    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
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

    const monthLabel = format(now, "M월");
    const weekOfMonth = getWeekOfMonth(now);
    const weekLabel = `${monthLabel} ${weekOfMonth}주차`;

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>

            {/* ✨ 메인 탭 방어막: 스와이프 뒤로가기 완벽 차단! */}
            <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

            {/* ✨ 헤더 타이틀 */}
            <View className="px-6 py-4 pb-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800/60">
                <Text className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight" allowFontScaling={false}>
                    Insights
                </Text>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center pb-20">
                    <ActivityIndicator size="large" color={getAccentColor()} />
                    <Text className="font-bold mt-4" style={{ color: getAccentColor(), fontSize: scale(14) }} allowFontScaling={false}>데이터를 분석하고 있어요...</Text>
                </View>
            ) : diaries.length === 0 ? (
                <View className="flex-1 items-center justify-center opacity-60" style={{ paddingBottom: scale(80) }}>
                    <Ionicons name="bar-chart-outline" size={scale(48)} color="#94A3B8" style={{ marginBottom: scale(16) }} />
                    <Text className="text-slate-500 dark:text-slate-400 font-bold" style={{ fontSize: scale(14) }} allowFontScaling={false}>아직 분석할 데이터가 부족해요.</Text>
                </View>
            ) : (
                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(120), paddingTop: scale(24), paddingHorizontal: scale(20) }} showsVerticalScrollIndicator={false}>

                    {/* 1. Stats Grid (2x2) */}
                    <View className="flex-row flex-wrap justify-between" style={{ marginBottom: scale(32) }}>
                        <Animated.View entering={FadeInDown.duration(600).delay(100).springify()} style={{ width: '48%', marginBottom: scale(16) }}>
                            <View className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm justify-between" style={{ padding: scale(20), borderRadius: scale(32), aspectRatio: 1 }}>
                                <View className="rounded-full bg-blue-100 dark:bg-blue-900/50 items-center justify-center" style={{ width: scale(40), height: scale(40) }}>
                                    <Ionicons name="library" size={scale(20)} color="#3B82F6" />
                                </View>
                                <View>
                                    <Text className="font-extrabold text-slate-900 dark:text-white tracking-tighter" style={{ fontSize: scale(36), marginBottom: scale(4) }} allowFontScaling={false}>{totalDiaries}</Text>
                                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest" style={{ fontSize: scale(11) }} allowFontScaling={false}>전체 기록</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.duration(600).delay(200).springify()} style={{ width: '48%', marginBottom: scale(16) }}>
                            <View className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm justify-between" style={{ padding: scale(20), borderRadius: scale(32), aspectRatio: 1 }}>
                                <View className="rounded-full bg-orange-100 dark:bg-orange-900/50 items-center justify-center" style={{ width: scale(40), height: scale(40) }}>
                                    <Ionicons name="flame" size={scale(20)} color="#F97316" />
                                </View>
                                <View>
                                    <Text className="font-extrabold text-slate-900 dark:text-white tracking-tighter" style={{ fontSize: scale(36), marginBottom: scale(4) }} allowFontScaling={false}>
                                        {currentStreak}<Text className="text-slate-400 font-bold tracking-normal" style={{ fontSize: scale(20) }} allowFontScaling={false}>일</Text>
                                    </Text>
                                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest" style={{ fontSize: scale(11) }} allowFontScaling={false}>연속 기록</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.duration(600).delay(300).springify()} style={{ width: '48%' }}>
                            <View className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm justify-between" style={{ padding: scale(20), borderRadius: scale(32), aspectRatio: 1 }}>
                                <View className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 items-center justify-center" style={{ width: scale(40), height: scale(40) }}>
                                    <Ionicons name="leaf" size={scale(20)} color="#10B981" />
                                </View>
                                <View>
                                    <Text className="font-extrabold text-slate-900 dark:text-white tracking-tighter" style={{ fontSize: scale(36), marginBottom: scale(4) }} allowFontScaling={false}>{thisMonthDiaries.length}</Text>
                                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest" style={{ fontSize: scale(11) }} allowFontScaling={false}>이번 달 기록</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.duration(600).delay(400).springify()} style={{ width: '48%' }}>
                            <View className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm justify-between" style={{ padding: scale(20), borderRadius: scale(32), aspectRatio: 1 }}>
                                <View className="rounded-full bg-purple-100 dark:bg-purple-900/50 items-center justify-center" style={{ width: scale(40), height: scale(40) }}>
                                    <Ionicons name="pricetags" size={scale(20)} color="#8B5CF6" />
                                </View>
                                <View>
                                    <Text className="font-extrabold text-slate-900 dark:text-white tracking-tighter" style={{ fontSize: scale(36), marginBottom: scale(4) }} allowFontScaling={false}>{Object.keys(tagCounts).length}</Text>
                                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest" style={{ fontSize: scale(11) }} allowFontScaling={false}>관심사 키워드</Text>
                                </View>
                            </View>
                        </Animated.View>
                    </View>

                    {/* 2. 주간 활동 차트 */}
                    <Animated.View entering={FadeInUp.duration(600).delay(500).springify()} style={{ marginBottom: scale(32) }}>
                        <View className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm" style={{ padding: scale(24), borderRadius: scale(32) }}>

                            <View className="flex-row items-center justify-between" style={{ marginBottom: scale(32) }}>
                                <View className="flex-row items-center" style={{ gap: scale(8) }}>
                                    <Text className="font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(18) }} allowFontScaling={false}>이번 주 활동</Text>
                                    <View className="bg-primary-50 dark:bg-primary-900/40 rounded-md border border-primary-100/50 dark:border-primary-800/50" style={{ paddingHorizontal: scale(8), paddingVertical: scale(2) }}>
                                        <Text className="font-extrabold text-primary-600 dark:text-primary-400 tracking-wider" style={{ fontSize: scale(10) }} allowFontScaling={false}>{weekLabel}</Text>
                                    </View>
                                </View>
                                <Ionicons name="bar-chart" size={scale(20)} color="#94A3B8" />
                            </View>

                            <View className="flex-row justify-between items-end px-1" style={{ height: scale(160) }}>
                                {weeklyData.map((data) => {
                                    const heightPercent = (data.count / maxWeeklyCount) * 100;
                                    const barHeight = data.count > 0 ? Math.max(heightPercent, 15) : 0;

                                    return (
                                        <View key={data.day} className="items-center" style={{ width: scale(32) }}>
                                            <View className="justify-end" style={{ height: scale(24), marginBottom: scale(8) }}>
                                                {data.count > 0 && (
                                                    <Text className="font-extrabold text-slate-700 dark:text-slate-300" style={{ fontSize: scale(12) }} allowFontScaling={false}>{data.count}</Text>
                                                )}
                                            </View>
                                            <View className="bg-slate-200/50 dark:bg-slate-800 rounded-full justify-end overflow-hidden" style={{ height: scale(96), width: scale(20), marginBottom: scale(12) }}>
                                                <View className="w-full bg-primary-500 rounded-full transition-all duration-500" style={{ height: `${barHeight}%` }} />
                                            </View>
                                            <Text className={`font-extrabold ${data.index === 0 ? 'text-red-400' : data.index === 6 ? 'text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} style={{ fontSize: scale(12) }} allowFontScaling={false}>
                                                {data.day}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </Animated.View>

                    {/* 3. 나의 키워드 */}
                    <Animated.View entering={FadeInUp.duration(600).delay(600).springify()} style={{ marginBottom: scale(24) }}>
                        <View className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm" style={{ padding: scale(24), borderRadius: scale(32) }}>
                            <View className="flex-row items-center justify-between" style={{ marginBottom: scale(24) }}>
                                <Text className="font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(18) }} allowFontScaling={false}>나의 키워드</Text>
                                <Ionicons name="pricetag" size={scale(20)} color="#94A3B8" />
                            </View>

                            {topTags.length === 0 ? (
                                <View className="items-center opacity-60" style={{ paddingVertical: scale(24) }}>
                                    <Text className="text-slate-500 font-bold" style={{ fontSize: scale(14) }} allowFontScaling={false}>아직 사용된 태그가 없습니다.</Text>
                                </View>
                            ) : (
                                <View className="flex-row flex-wrap" style={{ gap: scale(10) }}>
                                    {topTags.map(([tag, count], idx) => {
                                        const isFirst = idx === 0;
                                        return (
                                            <View
                                                key={tag}
                                                className={`rounded-full flex-row items-center border ${isFirst
                                                    ? "bg-primary-600 border-primary-600 shadow-sm shadow-primary-300 dark:shadow-none"
                                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                                    }`}
                                                style={{ paddingHorizontal: scale(16), paddingVertical: scale(8) }}
                                            >
                                                <Text className={`font-extrabold tracking-wide ${isFirst ? "text-white" : "text-slate-700 dark:text-slate-300"}`} style={{ fontSize: scale(13), marginRight: scale(8) }} allowFontScaling={false}>
                                                    #{tag}
                                                </Text>
                                                <View className={`rounded-md ${isFirst ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"}`} style={{ paddingHorizontal: scale(6), paddingVertical: scale(2) }}>
                                                    <Text className={`font-extrabold ${isFirst ? "text-white" : "text-slate-500 dark:text-slate-400"}`} style={{ fontSize: scale(10) }} allowFontScaling={false}>
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