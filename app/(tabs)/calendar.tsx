import { Ionicons } from '@expo/vector-icons';
import { addDays, addMonths, endOfMonth, endOfWeek, format, getMonth, getYear, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { diaryApi, type DailyDiaryCount } from "../../api/diaryApi";
import type { DiarySummary } from "../../types/diary";

const fabShadow = { elevation: 8, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } };

export default function CalendarScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const params = useLocalSearchParams<{ sessionId?: string, date?: string, openDiaryId?: string, targetDate?: string }>();

    const [selectedDate, setSelectedDate] = useState(() => params.date ? new Date(params.date) : new Date());
    const [currentMonth, setCurrentMonth] = useState(() => params.targetDate ? new Date(params.targetDate) : new Date());
    const [dailyDiaries, setDailyDiaries] = useState<DiarySummary[]>([]);
    const [monthlyCounts, setMonthlyCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    // ✨ 핵심 버그 해결: 이미 처리한 sessionId나 openDiaryId를 기억하여 중복 실행 방지!
    const processedSession = useRef<string | null>(null);
    const processedDiary = useRef<string | null>(null);

    useEffect(() => {
        // 1. 대화 종료 후 AI 일기 생성 모드로 넘어올 때
        if (params.sessionId && processedSession.current !== params.sessionId) {
            processedSession.current = params.sessionId; // ✨ 톨게이트 통과 기록 남기기
            router.push({ pathname: '/diary-screen/editor', params: { mode: 'create', date: params.date, sessionId: params.sessionId } });
        }

        // 2. 특정 일기를 열어볼 때
        if (params.openDiaryId && params.targetDate && processedDiary.current !== params.openDiaryId) {
            processedDiary.current = params.openDiaryId; // ✨ 톨게이트 통과 기록 남기기
            const target = new Date(params.targetDate);
            setSelectedDate(target);
            setCurrentMonth(target);
            router.push({ pathname: '/diary-screen/viewer', params: { id: params.openDiaryId } });
        }
        // ✨ 의존성 배열(dependency array)에 params 전체가 아닌 원시값들만 명시하여 불필요한 재실행 완벽 차단!
    }, [params.sessionId, params.date, params.openDiaryId, params.targetDate]);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const fetchMonthlyData = async () => {
        try {
            const year = getYear(currentMonth);
            const month = getMonth(currentMonth) + 1;
            const response = await diaryApi.getMonthlyDiaryCounts(year, month);
            const countMap: Record<string, number> = {};

            if (response.result && Array.isArray(response.result)) {
                response.result.forEach((item: DailyDiaryCount) => {
                    countMap[item.diaryDate] = item.count;
                });
            }
            setMonthlyCounts(countMap);
        } catch (error) {
            console.error("월간 데이터 로드 실패", error);
        }
    };

    const fetchDailyDiaries = async () => {
        setLoading(true);
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        try {
            const response = await diaryApi.getDiariesByDate(dateStr);
            setDailyDiaries(response.result && Array.isArray(response.result) ? response.result : []);
        } catch (error) {
            setDailyDiaries([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMonthlyData(); }, [currentMonth]);
    useEffect(() => { fetchDailyDiaries(); }, [selectedDate]);

    const handleDiaryClick = (diarySeq: number) => {
        router.push({ pathname: '/diary-screen/viewer', params: { id: diarySeq } });
    };

    const handleWriteNew = () => {
        router.push({ pathname: '/diary-screen/editor', params: { mode: 'create', date: format(selectedDate, "yyyy-MM-dd") } });
    };

    const renderDays = () => {
        const days = ["일", "월", "화", "수", "목", "금", "토"];
        return (
            <View className="flex-row border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-2">
                {days.map((d, i) => (
                    <Text key={i} className={`flex-1 text-center text-[11px] font-extrabold tracking-widest uppercase ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
                        {d}
                    </Text>
                ))}
            </View>
        );
    };

    const renderCells = () => {
        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const formattedDate = format(day, "d");
                const dateKey = format(day, "yyyy-MM-dd");
                const cloneDay = day;
                const isSelected = isSameDay(day, selectedDate);
                const isNotCurrentMonth = !isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());
                const count = monthlyCounts[dateKey] || 0;

                let dotColorClass = "";
                if (!isNotCurrentMonth && count > 0) {
                    if (count === 1) dotColorClass = "bg-primary-300 dark:bg-primary-500";
                    else if (count === 2) dotColorClass = "bg-primary-500 dark:bg-primary-400";
                    else dotColorClass = "bg-primary-700 dark:bg-primary-300";
                }

                days.push(
                    <TouchableOpacity
                        key={day.toString()}
                        onPress={() => {
                            setSelectedDate(cloneDay);
                            if (!isSameMonth(cloneDay, currentMonth)) setCurrentMonth(cloneDay);
                        }}
                        activeOpacity={0.6}
                        className="flex-1 items-center justify-start py-2 min-h-[56px]"
                    >
                        <View className={`w-9 h-9 items-center justify-center rounded-full transition-colors duration-200 ${isSelected ? "bg-primary-600" : (isToday ? "bg-slate-100 dark:bg-slate-800" : "bg-transparent")}`}>
                            <Text className={`text-[15px] font-bold ${isNotCurrentMonth ? "text-slate-300 dark:text-slate-600" :
                                isSelected ? "text-white font-extrabold" :
                                    isToday ? "text-slate-900 dark:text-white" :
                                        "text-slate-700 dark:text-slate-300"
                                }`}>
                                {formattedDate}
                            </Text>
                        </View>
                        <View className="h-2 mt-1 justify-center">
                            {dotColorClass ? <View className={`w-1 h-1 rounded-full ${dotColorClass}`} /> : null}
                        </View>
                    </TouchableOpacity>
                );
                day = addDays(day, 1);
            }
            rows.push(<View className="flex-row w-full" key={day.toString()}>{days}</View>);
            days = [];
        }
        return rows;
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 relative" edges={['top']}>
            <View className="px-6 py-4 pb-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-10 border-b border-slate-100 dark:border-slate-800/60">
                <Text className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Calendar</Text>
            </View>

            <View className="px-6 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 z-10">
                <View className="flex-row items-center justify-between mb-6 px-1">
                    <TouchableOpacity onPress={prevMonth} className="w-10 h-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <Ionicons name="chevron-back" size={20} color="#64748b" />
                    </TouchableOpacity>
                    <Text className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{format(currentMonth, "yyyy년 M월")}</Text>
                    <TouchableOpacity onPress={nextMonth} className="w-10 h-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <Ionicons name="chevron-forward" size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>
                {renderDays()}
                <View>{renderCells()}</View>
            </View>

            <View className="flex-1 bg-white dark:bg-slate-950">
                <View className="flex-row items-center justify-between px-6 py-5">
                    <Text className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {format(selectedDate, "M월 d일")}
                        <Text className="text-sm font-medium text-slate-400 dark:text-slate-500">  ·  {loading ? "..." : dailyDiaries.length}개의 기록</Text>
                    </Text>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center pb-10">
                        <ActivityIndicator color="#0F172A" />
                    </View>
                ) : dailyDiaries.length > 0 ? (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                        {dailyDiaries.map((diary) => {
                            const d = diary as any;
                            const hasImage = !!d.imageUrl || (d.images && d.images.length > 0);
                            const previewUrl = d.imageUrl || (d.images?.[0]?.url || d.images?.[0]);

                            return (
                                <TouchableOpacity key={diary.diarySeq} onPress={() => handleDiaryClick(diary.diarySeq)} activeOpacity={0.6} className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex-row gap-4">
                                    <View className="flex-1 justify-center gap-1.5">
                                        <Text className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight" numberOfLines={1}>{diary.title || "제목 없음"}</Text>
                                        <Text className="text-sm text-slate-500 dark:text-slate-400 leading-6" numberOfLines={2}>{diary.summary || d.content}</Text>
                                        {diary.tags && diary.tags.length > 0 && (
                                            <View className="flex-row flex-wrap gap-1.5 mt-2">
                                                {diary.tags.map((tag: any, idx) => (
                                                    <View key={idx} className="bg-primary-50 dark:bg-primary-900/40 px-2 py-1 rounded-md border border-primary-100/50 dark:border-primary-800/50">
                                                        <Text className="text-[10px] text-primary-600 dark:text-primary-300 font-extrabold tracking-wide uppercase">#{typeof tag === 'string' ? tag : tag.name}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                    {hasImage && previewUrl && (
                                        <View className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 self-center border border-slate-200 dark:border-slate-700">
                                            <Image source={{ uri: previewUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                ) : (
                    <View className="flex-1 items-center justify-center pb-20 opacity-60">
                        <Ionicons name="leaf-outline" size={32} color="#94A3B8" className="mb-3" />
                        <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">이 날의 기록이 없습니다.</Text>
                    </View>
                )}
            </View>

            <View className="absolute bottom-6 right-6 z-50">
                <TouchableOpacity onPress={handleWriteNew} activeOpacity={0.8} style={fabShadow} className="w-14 h-14 bg-primary-600 rounded-full items-center justify-center">
                    <Ionicons name="add" size={30} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}