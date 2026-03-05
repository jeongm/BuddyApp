import { Ionicons } from '@expo/vector-icons';
import { addDays, addMonths, endOfMonth, endOfWeek, format, getMonth, getYear, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
// ✨ 순정 Text를 RNText로 추가 임포트
import { ActivityIndicator, Dimensions, Text as RNText, RefreshControl, ScrollView, TouchableOpacity, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { diaryApi, type DailyDiaryCount } from "../../api/diaryApi";
import { AppText as Text } from '../../components/AppText';
import type { DiarySummary } from "../../types/diary";
// ✨ 폰트 스토어 임포트 추가
import { useSettingStore } from "../../store/useSettingStore";

const { width } = Dimensions.get("window");
const scale = (size: number) => Math.round((width / 430) * size);
const fabShadow = { elevation: 8, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: scale(12), shadowOffset: { width: 0, height: scale(6) } };

export default function CalendarScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // ✨ 폰트 상태 불러오기
    const { fontFamily } = useSettingStore();
    // (기본 폰트 예외 처리를 편하게 하기 위한 변수)
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const params = useLocalSearchParams<{ sessionId?: string, date?: string, openDiaryId?: string, targetDate?: string }>();

    const [selectedDate, setSelectedDate] = useState(() => params.date ? new Date(params.date) : new Date());
    const [currentMonth, setCurrentMonth] = useState(() => params.targetDate ? new Date(params.targetDate) : new Date());
    const [dailyDiaries, setDailyDiaries] = useState<DiarySummary[]>([]);
    const [monthlyCounts, setMonthlyCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    const [refreshing, setRefreshing] = useState(false);

    const processedSession = useRef<string | null>(null);
    const processedDiary = useRef<string | null>(null);

    useEffect(() => {
        if (params.sessionId && processedSession.current !== params.sessionId) {
            processedSession.current = params.sessionId;
            router.push({ pathname: '/diary-screen/editor', params: { mode: 'create', date: params.date, sessionId: params.sessionId } });
        }
        if (params.openDiaryId && params.targetDate && processedDiary.current !== params.openDiaryId) {
            processedDiary.current = params.openDiaryId;
            const target = new Date(params.targetDate);
            setSelectedDate(target);
            setCurrentMonth(target);
            router.push({ pathname: '/diary-screen/viewer', params: { id: params.openDiaryId } });
        }
    }, [params.sessionId, params.date, params.openDiaryId, params.targetDate]);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const handlePrevMonth = () => {
        const newMonth = subMonths(currentMonth, 1);
        setCurrentMonth(newMonth);
        setSelectedDate(isSameMonth(newMonth, new Date()) ? new Date() : startOfMonth(newMonth));
    };

    const handleNextMonth = () => {
        const newMonth = addMonths(currentMonth, 1);
        setCurrentMonth(newMonth);
        setSelectedDate(isSameMonth(newMonth, new Date()) ? new Date() : startOfMonth(newMonth));
    };

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

    useFocusEffect(
        useCallback(() => {
            fetchMonthlyData();
            fetchDailyDiaries();
        }, [currentMonth, selectedDate])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchMonthlyData(), fetchDailyDiaries()]);
        setRefreshing(false);
    }, [currentMonth, selectedDate]);

    const handleDiaryClick = (diarySeq: number) => {
        router.push({ pathname: '/diary-screen/viewer', params: { id: diarySeq } });
    };

    const handleWriteNew = () => {
        router.push({ pathname: '/diary-screen/editor', params: { mode: 'create', date: format(selectedDate, "yyyy-MM-dd") } });
    };

    const renderDays = () => {
        const days = ["일", "월", "화", "수", "목", "금", "토"];
        return (
            <View className="flex-row border-b border-slate-100 dark:border-slate-800/60" style={{ paddingBottom: scale(12), marginBottom: scale(8) }}>
                {days.map((d, i) => (
                    // 요일 표시 부분 (크기 유지를 위해 RNText 사용)
                    <RNText key={i} className={`flex-1 text-center font-extrabold tracking-widest uppercase ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-slate-400 dark:text-slate-500"}`} style={{ fontSize: scale(11), fontFamily: customFontFamily }} allowFontScaling={false}>{d}</RNText>
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
                        activeOpacity={0.6} className="flex-1 items-center justify-start" style={{ paddingVertical: scale(4), minHeight: scale(44) }}
                    >
                        <View className={`items-center justify-center rounded-full transition-colors duration-200 ${isSelected ? "bg-primary-600" : (isToday ? "bg-slate-100 dark:bg-slate-800" : "bg-transparent")}`} style={{ width: scale(32), height: scale(32) }}>
                            {/* 달력 날짜 숫자 (크기 유지를 위해 RNText 사용) */}
                            <RNText className={`font-bold ${isNotCurrentMonth ? "text-slate-300 dark:text-slate-600" : isSelected ? "text-white font-extrabold" : isToday ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`} style={{ fontSize: scale(14), fontFamily: customFontFamily }} allowFontScaling={false}>{formattedDate}</RNText>
                        </View>
                        <View className="justify-center" style={{ height: scale(8), marginTop: scale(2) }}>
                            {dotColorClass ? <View className={`rounded-full ${dotColorClass}`} style={{ width: scale(4), height: scale(4) }} /> : null}
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
                {/* 🚨 최상단 헤더 (RNText + 폰트 연동) */}
                <RNText className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: customFontFamily }} allowFontScaling={false}>Calendar</RNText>
            </View>
            <View className="border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 z-10" style={{ paddingHorizontal: scale(4), paddingTop: scale(24), paddingBottom: scale(8) }}>
                <View className="flex-row items-center justify-between" style={{ marginBottom: scale(24), paddingHorizontal: scale(4) }}>

                    <TouchableOpacity onPress={handlePrevMonth} className="items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800" style={{ width: scale(40), height: scale(40) }}><Ionicons name="chevron-back" size={scale(20)} color="#64748b" /></TouchableOpacity>

                    {/* 🚨 NNNN년 M월 타이틀 (RNText + 폰트 연동) */}
                    <RNText className="font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(20), fontFamily: customFontFamily }} allowFontScaling={false}>{format(currentMonth, "yyyy년 M월")}</RNText>

                    <TouchableOpacity onPress={handleNextMonth} className="items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800" style={{ width: scale(40), height: scale(40) }}><Ionicons name="chevron-forward" size={scale(20)} color="#64748b" /></TouchableOpacity>

                </View>
                {renderDays()}
                <View>{renderCells()}</View>
            </View>

            <View className="flex-1 bg-white dark:bg-slate-950">
                <View className="flex-row items-center justify-between" style={{ paddingHorizontal: scale(24), paddingVertical: scale(20) }}>
                    {/* 🚨 선택된 M월 d일 (RNText + 폰트 연동) */}
                    <RNText className="font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(16), fontFamily: customFontFamily }} allowFontScaling={false}>
                        {format(selectedDate, "M월 d일")}
                        <RNText className="font-medium text-slate-400 dark:text-slate-500" style={{ fontSize: scale(14), fontFamily: customFontFamily }} allowFontScaling={false}>  ·  {loading ? "..." : dailyDiaries.length}개의 기록</RNText>
                    </RNText>
                </View>

                {loading && !refreshing ? (
                    <View className="flex-1 items-center justify-center" style={{ paddingBottom: scale(40) }}>
                        <ActivityIndicator color="#0F172A" />
                    </View>
                ) : dailyDiaries.length > 0 ? (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: scale(120) }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#94A3B8" />}
                    >
                        {dailyDiaries.map((diary) => {
                            const d = diary as any;
                            const hasImage = !!d.imageUrl || (d.images && d.images.length > 0);
                            const previewUrl = d.imageUrl || (d.images?.[0]?.url || d.images?.[0]);
                            return (
                                <TouchableOpacity key={diary.diarySeq} onPress={() => handleDiaryClick(diary.diarySeq)} activeOpacity={0.6} className="border-b border-slate-100 dark:border-slate-800/60 flex-row" style={{ paddingHorizontal: scale(24), paddingVertical: scale(20), gap: scale(16) }}>
                                    <View className="flex-1 justify-center" style={{ gap: scale(6) }}>
                                        {/* 여기서부터는 AppText가 작동하여 글꼴과 배율이 모두 자동 적용됩니다! */}
                                        <Text className="font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(16) }} allowFontScaling={false} numberOfLines={1}>{diary.title || "제목 없음"}</Text>
                                        <Text className="text-slate-500 dark:text-slate-400" style={{ fontSize: scale(14), lineHeight: scale(24) }} allowFontScaling={false} numberOfLines={2}>{diary.summary || d.content}</Text>
                                        {diary.tags && diary.tags.length > 0 && (
                                            <View className="flex-row flex-wrap" style={{ gap: scale(6), marginTop: scale(8) }}>
                                                {diary.tags.map((tag: any, idx) => (
                                                    <View key={idx} className="bg-primary-50 dark:bg-primary-900/40 rounded-md border border-primary-100/50 dark:border-primary-800/50" style={{ paddingHorizontal: scale(8), paddingVertical: scale(4) }}>
                                                        <Text className="text-primary-600 dark:text-primary-300 font-extrabold tracking-wide uppercase" style={{ fontSize: scale(10) }} allowFontScaling={false}>#{typeof tag === 'string' ? tag : tag.name}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                    {hasImage && previewUrl && (
                                        <View className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 self-center border border-slate-200 dark:border-slate-700" style={{ width: scale(80), height: scale(80) }}><Image source={{ uri: previewUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" /></View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                ) : (
                    <ScrollView
                        contentContainerStyle={{ flex: 1 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#94A3B8" />}
                    >
                        <View className="flex-1 items-center justify-center opacity-60" style={{ paddingBottom: scale(80) }}>
                            <Ionicons name="leaf-outline" size={scale(32)} color="#94A3B8" style={{ marginBottom: scale(12) }} />
                            <Text className="font-bold text-slate-500 dark:text-slate-400" style={{ fontSize: scale(14) }} allowFontScaling={false}>이 날의 기록이 없습니다.</Text>
                        </View>
                    </ScrollView>
                )}
            </View>

            <View className="absolute z-50" style={{ bottom: scale(24), right: scale(24) }}>
                <TouchableOpacity onPress={handleWriteNew} activeOpacity={0.8} style={[fabShadow, { width: scale(56), height: scale(56) }]} className="bg-primary-600 rounded-full items-center justify-center"><Ionicons name="add" size={scale(30)} color="white" /></TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}