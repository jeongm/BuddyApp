import { Ionicons } from "@expo/vector-icons";
import { endOfWeek, startOfWeek } from "date-fns";
import { Image } from "expo-image";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, Platform, RefreshControl, Text as RNText, ScrollView, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText as Text } from '../../components/AppText';

// api & store
import { diaryApi } from "../../api/diaryApi";
import { insightApi, type WeeklyIdentity, type WeeklyTag } from "../../api/insightApi";
import { useAuthStore } from "../../store/useAuthStore";
import { useSettingStore } from "../../store/useSettingStore";
import { useThemeStore } from "../../store/useThemeStore";
import type { DiarySummary } from "../../types/diary";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const safeShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    android: { elevation: 3 },
});

export default function ReportScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { accent } = useThemeStore();
    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const accentHex = { default: '#64748B', violet: '#8B5CF6', rose: '#F43F5E', blue: '#3B82F6', green: '#22C55E' }[accent] || '#64748B';

    const [diaries, setDiaries] = useState<DiarySummary[]>([]);
    const [tags, setTags] = useState<WeeklyTag[]>([]);
    const [identity, setIdentity] = useState<WeeklyIdentity | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const getBuddyImage = (seq?: number) => {
        switch (seq) {
            case 1: return require('../../assets/images/characters/Hamster.png');
            case 2: return require('../../assets/images/characters/Fox.png');
            case 3: return require('../../assets/images/characters/Bear.png');
            default: return require('../../assets/images/characters/Hamster.png');
        }
    };

    const fetchAllData = useCallback(async () => {
        if (!user) return;
        try {
            const [diaryRes, tagsData, identityData] = await Promise.all([
                diaryApi.getDiaries("", 0, 100, "diaryDate,desc"),
                insightApi.getWeeklyTags(),
                insightApi.getWeeklyIdentity()
            ]);

            // ✨ 여기에 로그를 찍어서 터미널(Metro)을 확인해보세요!
            console.log("나온 데이터 확인용:", identityData);

            if (diaryRes?.result?.content) setDiaries(diaryRes.result.content);
            setTags(tagsData || []);
            setIdentity(identityData);
        } catch (error) {
            console.error("통계 데이터 로드 실패", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useFocusEffect(useCallback(() => {
        setLoading(true);
        fetchAllData();
    }, [fetchAllData]));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAllData();
        setRefreshing(false);
    }, [fetchAllData]);

    const reportData = useMemo(() => {
        const now = new Date();
        const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
        const getSafeDate = (d: any) => new Date(d.diaryDate || d.createdAt || d.date || new Date());

        const weekStart = startOfWeek(now, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

        const thisWeekDiaries = diaries.filter((diary) => {
            const dDate = getSafeDate(diary);
            return dDate >= weekStart && dDate <= weekEnd;
        });

        const weeklyData = daysOfWeek.map((day, index) => {
            const count = thisWeekDiaries.filter(d => getSafeDate(d).getDay() === index).length;
            return { day, count };
        });

        const maxWeeklyCount = Math.max(...weeklyData.map(d => d.count)) || 1;
        const total = diaries.length;
        const level = Math.floor(total / 10) + 1;
        const progress = (total % 10) / 10;
        const levelTitle = level > 5 ? "비밀을 공유하는 단짝" : level > 2 ? "친해지는 중인 친구" : "어색한 시작";

        return { now, daysOfWeek, weeklyData, maxWeeklyCount, level, progress, levelTitle, total };
    }, [diaries]);

    if (loading && !refreshing) {
        return (
            <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
                <ActivityIndicator size="large" color={accentHex} />
            </View>
        );
    }

    const { now, daysOfWeek, weeklyData, maxWeeklyCount, level, progress, levelTitle, total } = reportData;
    const maxTagCount = tags.length > 0 ? Math.max(...tags.map(t => t.count)) : 1;

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View className="px-6 py-4 pb-2 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-200/60 dark:border-slate-800/60">
                <RNText className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter" style={{ fontFamily: customFontFamily }} allowFontScaling={false}>
                    Insights
                </RNText>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: scale(20), paddingTop: scale(24), paddingBottom: scale(100) }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentHex} />}
            >
                {/* 🌟 1. 위클리 아이덴티티 카드 (요청하신 반전 테마 디자인 적용) */}
                <Animated.View entering={FadeInUp.duration(800).springify()} style={{ marginBottom: scale(24) }}>
                    {identity ? (
                        <View className="bg-slate-900 dark:bg-white" style={[{ padding: scale(28), borderRadius: scale(32) }, safeShadow]}>
                            <View className="flex-row justify-between items-start">
                                <View className="flex-1 pr-4">
                                    <Text className="text-primary-400 dark:text-primary-600 font-bold uppercase tracking-widest mb-2" style={{ fontSize: scale(11) }} allowFontScaling={false}>
                                        Weekly Identity
                                    </Text>
                                    <Text className="text-white dark:text-slate-900 font-black" style={{ fontSize: scale(28) }} allowFontScaling={false}>
                                        {identity.weeklyIdentity}
                                    </Text>
                                </View>
                                {/* 노란색 리본 아이콘으로 감성 보충! */}
                                <Ionicons name="ribbon" size={scale(32)} color="#FACC15" />
                            </View>

                            <Text className="text-slate-400 dark:text-slate-500 font-medium mt-4 leading-5" style={{ fontSize: scale(14) }} allowFontScaling={false}>
                                이번 주 {user?.nickname || '나'}님은 주로 <Text className="text-white dark:text-slate-900 font-bold">{identity.weeklyKeyword}</Text>에 대해 이야기를 나누며 마음을 돌보셨네요.
                            </Text>
                        </View>
                    ) : (
                        <View className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 items-center justify-center" style={[{ padding: scale(32), borderRadius: scale(32) }, safeShadow]}>
                            <Ionicons name="book-outline" size={scale(40)} color="#CBD5E1" style={{ marginBottom: scale(12) }} />
                            <Text className="font-bold text-slate-700 dark:text-slate-300 text-center mb-1" style={{ fontSize: scale(15) }} allowFontScaling={false}>아직 분석할 일기가 없어요</Text>
                            <Text className="font-medium text-slate-400 text-center" style={{ fontSize: scale(13) }} allowFontScaling={false}>일기를 꾸준히 쓰면 AI가 멋진 칭호를 달아줄 거예요!</Text>
                        </View>
                    )}
                </Animated.View>

                {/* 🤝 2. 우정 레벨 카드 */}
                <Animated.View entering={FadeInUp.delay(150).duration(800).springify()} style={{ marginBottom: scale(24) }}>
                    <View className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800" style={[{ padding: scale(24), borderRadius: scale(32) }, safeShadow]}>
                        <View className="flex-row items-center mb-6" style={{ gap: scale(16) }}>
                            <Image source={getBuddyImage(user?.characterSeq)} style={{ width: scale(56), height: scale(56) }} contentFit="contain" />
                            <View>
                                <Text className="text-slate-900 dark:text-white font-black" style={{ fontSize: scale(18) }} allowFontScaling={false}>{user?.characterNickname || '버디'}와의 우정</Text>
                                <Text className="text-slate-500 font-bold" style={{ fontSize: scale(13) }} allowFontScaling={false}>{levelTitle}</Text>
                            </View>
                            <View className="flex-1 items-end">
                                <Text className="font-black" style={{ color: accentHex, fontSize: scale(22) }} allowFontScaling={false}>Lv.{level}</Text>
                            </View>
                        </View>
                        <View className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <View className="h-full rounded-full" style={{ width: `${(progress || 0) * 100}%`, backgroundColor: accentHex }} />
                        </View>
                        <View className="flex-row justify-between mt-3">
                            <Text className="text-slate-400 font-bold" style={{ fontSize: scale(11) }} allowFontScaling={false}>총 {total}번의 교감</Text>
                            <Text className="text-slate-400 font-bold" style={{ fontSize: scale(11) }} allowFontScaling={false}>다음 레벨까지 {10 - (total % 10)}회</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* 📊 3. 활동 리듬 섹션 */}
                <Animated.View entering={FadeInUp.delay(300).duration(800).springify()} style={{ marginBottom: scale(24) }}>
                    <View className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800" style={[{ padding: scale(24), borderRadius: scale(32) }, safeShadow]}>
                        <View className="flex-row items-center justify-between mb-8">
                            <Text className="font-black text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(18) }} allowFontScaling={false}>기록의 리듬</Text>
                            <Ionicons name="pulse" size={scale(20)} color="#94A3B8" />
                        </View>

                        <View className="flex-row justify-between items-end px-1" style={{ height: scale(100) }}>
                            {weeklyData.map((data, idx) => {
                                const h = (data.count / maxWeeklyCount) * 100;
                                const isToday = idx === now.getDay();
                                return (
                                    <View key={idx} className="items-center" style={{ width: scale(32) }}>
                                        <View
                                            className="rounded-full"
                                            style={{
                                                height: `${Math.max(h, 15)}%`,
                                                width: scale(14),
                                                backgroundColor: isToday ? accentHex : '#F1F5F9'
                                            }}
                                        />
                                        <Text className={`mt-3 font-bold ${isToday ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`} style={{ fontSize: scale(11), color: isToday ? accentHex : undefined }} allowFontScaling={false}>{daysOfWeek[idx]}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </Animated.View>

                {/* 🏷️ 4. 감정 키워드 Top 5 */}
                <Animated.View entering={FadeInUp.delay(450).duration(800).springify()}>
                    <Text className="font-black text-slate-900 dark:text-white mb-4 px-2" style={{ fontSize: scale(18) }} allowFontScaling={false}>이번 주, 자주 찾은 마음들</Text>

                    {tags.length > 0 ? (
                        <View className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800" style={[{ padding: scale(24), borderRadius: scale(32) }, safeShadow]}>
                            {tags.map((tag, index) => {
                                const isTop1 = index === 0;
                                const safeMax = Math.max(1, maxTagCount);
                                const barWidthPercentage = `${(tag.count / safeMax) * 100}%` as any;

                                return (
                                    <View key={index} className="mb-5 last:mb-0">
                                        <View className="flex-row justify-between items-end mb-2">
                                            <View className="flex-row items-center" style={{ gap: scale(10) }}>
                                                <Text className={`font-black ${isTop1 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`} style={{ fontSize: scale(14), color: isTop1 ? accentHex : undefined }} allowFontScaling={false}>{index + 1}</Text>
                                                <RNText className={`font-bold ${isTop1 ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`} style={{ fontSize: scale(15), fontFamily: customFontFamily }} allowFontScaling={false}>
                                                    #{tag.tagName}
                                                </RNText>
                                            </View>
                                            <Text className="font-bold text-slate-400" style={{ fontSize: scale(13) }} allowFontScaling={false}>{tag.count}회</Text>
                                        </View>

                                        <View className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <View
                                                className="h-full rounded-full"
                                                style={{ width: barWidthPercentage, backgroundColor: isTop1 ? accentHex : '#CBD5E1' }}
                                            />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 items-center justify-center" style={[{ padding: scale(32), borderRadius: scale(32) }, safeShadow]}>
                            <Text className="font-bold text-slate-500 dark:text-slate-400" style={{ fontSize: scale(14) }} allowFontScaling={false}>이번 주에 사용한 태그가 없습니다.</Text>
                        </View>
                    )}
                </Animated.View>

            </ScrollView>
        </SafeAreaView>
    );
}