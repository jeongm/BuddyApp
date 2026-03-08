import { Ionicons } from "@expo/vector-icons";
import { endOfWeek, format, startOfWeek, subDays, subWeeks } from "date-fns";
import { Image } from "expo-image";
import { Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, Platform, RefreshControl, Text as RNText, ScrollView, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";
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
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 12 },
    android: { elevation: 3 },
});

export default function ReportScreen() {
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

    const reportData = useMemo(() => {
        const now = new Date();
        const daysOfWeek = ["월", "화", "수", "목", "금", "토", "일"];
        const getSafeDate = (d: any) => new Date(d.diaryDate || d.createdAt || d.date || new Date());

        const sortedDates = Array.from(new Set(diaries.map(d => format(getSafeDate(d), 'yyyy-MM-dd'))))
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        let streak = 0;
        const todayStr = format(now, 'yyyy-MM-dd');
        const yesterdayStr = format(subDays(now, 1), 'yyyy-MM-dd');
        if (sortedDates.includes(todayStr) || sortedDates.includes(yesterdayStr)) {
            let tempDate = sortedDates.includes(todayStr) ? now : subDays(now, 1);
            while (sortedDates.includes(format(tempDate, 'yyyy-MM-dd'))) {
                streak++;
                tempDate = subDays(tempDate, 1);
            }
        }

        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        const lastWeekRange = `${format(lastWeekStart, 'M.dd')} - ${format(lastWeekEnd, 'M.dd')}`;

        const thisWeekDiaries = diaries.filter(d => {
            const date = getSafeDate(d);
            return date >= weekStart && date <= weekEnd;
        });
        const lastWeekDiaries = diaries.filter(d => {
            const date = getSafeDate(d);
            return date >= lastWeekStart && date <= lastWeekEnd;
        });

        const weeklyData = daysOfWeek.map((day, index) => {
            const dayMap = [1, 2, 3, 4, 5, 6, 0];
            const count = thisWeekDiaries.filter(d => getSafeDate(d).getDay() === dayMap[index]).length;
            return { day, count };
        });

        const thisWeekCount = thisWeekDiaries.length;
        const lastWeekCount = lastWeekDiaries.length;
        const comparison = thisWeekCount - lastWeekCount;
        const activeDays = weeklyData.filter(d => d.count > 0).length;
        const maxWeeklyCount = Math.max(...weeklyData.map(d => d.count)) || 1;

        const totalCount = diaries.length;
        const getLevelInfo = (count: number) => {
            let currentLevel = 1;
            let totalNeeded = 0;
            while (count >= totalNeeded + currentLevel) {
                totalNeeded += currentLevel;
                currentLevel++;
            }
            return { level: currentLevel, progress: (count - totalNeeded) / currentLevel, remaining: currentLevel - (count - totalNeeded) };
        };
        const { level, progress, remaining } = getLevelInfo(totalCount);
        const levelTitle = level > 10 ? "영혼의 단짝" : level > 5 ? "말하지 않아도 아는 사이" : level > 2 ? "친해지는 중인 친구" : "어색한 시작";

        const topTags = tags
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(tag => [tag.tagName, tag.count]);

        return {
            now, daysOfWeek, weeklyData, maxWeeklyCount, level, progress,
            remaining, levelTitle, total: totalCount, currentStreak: streak,
            thisWeekCount, activeDays, comparison, topTags, lastWeekRange
        };
    }, [diaries, tags]);

    if (loading && !refreshing) {
        return (
            <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
                <ActivityIndicator size="large" color={accentHex} />
            </View>
        );
    }

    const {
        now, daysOfWeek, weeklyData, maxWeeklyCount, level, progress,
        remaining, levelTitle, total, currentStreak, thisWeekCount, activeDays, comparison, lastWeekRange, topTags
    } = reportData;

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View className="px-6 py-4 pb-2 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-200/60 dark:border-slate-800/60">
                <RNText className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter" style={{ fontFamily: customFontFamily }} allowFontScaling={false}>
                    Reflection
                </RNText>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: scale(20), paddingTop: scale(24), paddingBottom: scale(100) }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchAllData(); setRefreshing(false); }} tintColor={accentHex} />}
            >
                {/* 🤝 1. 우정 레벨 카드 */}
                <Animated.View entering={FadeInUp.delay(100).duration(800).springify()} style={{ marginBottom: scale(32) }}>
                    <View className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800" style={[{ padding: scale(24), borderRadius: scale(32) }, safeShadow]}>
                        <View className="flex-row items-center mb-6">
                            <View className="relative">
                                <Image source={getBuddyImage(user?.characterSeq)} style={{ width: scale(80), height: scale(80), marginRight: scale(16) }} contentFit="contain" />
                                <View className="absolute -bottom-1 left-0 right-0 items-center" style={{ marginRight: scale(16) }}>
                                    <View className="px-2.5 py-0.5 rounded-full border-2 border-white dark:border-slate-900" style={{ backgroundColor: accentHex }}>
                                        <Text className="text-white font-black" style={{ fontSize: scale(11) }} allowFontScaling={false}>Lv.{level}</Text>
                                    </View>
                                </View>
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center mb-1.5">
                                    {/* 📍 primary-500 -> primary-600 적용 */}
                                    <View className="bg-primary-600 px-2 py-0.5 rounded-md mr-2">
                                        <Text className="text-white font-black" style={{ fontSize: scale(10) }} allowFontScaling={false}>BESTIE</Text>
                                    </View>
                                    <Text className="text-slate-400 font-bold" style={{ fontSize: scale(12) }} allowFontScaling={false}>벌써 {total}번째 만남</Text>
                                </View>
                                <Text className="text-slate-900 dark:text-white font-black" style={{ fontSize: scale(22), marginBottom: scale(4) }} allowFontScaling={false}>{user?.characterNickname}</Text>
                                <View className="flex-row items-center">
                                    <Ionicons name="heart" size={scale(14)} color={accentHex} style={{ marginRight: scale(4) }} />
                                    <Text className="text-slate-500 dark:text-slate-400 font-extrabold" style={{ fontSize: scale(14) }} allowFontScaling={false}>{levelTitle}</Text>
                                </View>
                            </View>
                        </View>
                        <View>
                            <View className="flex-row justify-between items-end mb-2.5 px-1">
                                <Text className="text-slate-400 font-black tracking-widest" style={{ fontSize: scale(10) }} allowFontScaling={false}>RELATIONSHIP SYNC</Text>
                                <Text className="font-black" style={{ color: accentHex, fontSize: scale(16) }} allowFontScaling={false}>{Math.floor((progress || 0) * 100)}%</Text>
                            </View>
                            <View className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <View className="h-full rounded-full" style={{ width: `${(progress || 0) * 100}%`, backgroundColor: accentHex }} />
                            </View>
                            <View className="flex-row justify-between items-center mt-4">
                                <View className="flex-row items-center bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full" style={{ gap: scale(6) }}>
                                    <Ionicons name="lock-closed" size={scale(12)} color="#94A3B8" />
                                    <Text className="text-slate-500 font-bold" style={{ fontSize: scale(11) }} allowFontScaling={false}>Lv.{level + 1} 달성 시 새로운 기능</Text>
                                </View>
                                <Text className="text-slate-400 font-bold" style={{ fontSize: scale(12) }} allowFontScaling={false}>
                                    <Text className="text-slate-900 dark:text-white font-black">{remaining}번 더</Text> 대화하면 레벨업
                                </Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* 🌟 2. 아이덴티티 카드 */}
                <Animated.View entering={FadeInUp.delay(200).duration(800).springify()} style={{ marginBottom: scale(32) }}>
                    {identity && identity.weeklyIdentity ? (
                        <View className="bg-slate-900 dark:bg-white overflow-hidden" style={[{ padding: scale(28), borderRadius: scale(32) }, safeShadow]}>
                            <View className="absolute opacity-[0.08] dark:opacity-[0.05]" style={{ bottom: scale(-10), right: scale(0), transform: [{ rotate: '-15deg' }] }}>
                                <Ionicons name="paw" size={scale(180)} color={accent === 'default' ? '#FFF' : accentHex} />
                            </View>
                            <View className="flex-row justify-between items-start mb-6 z-10">
                                <View className="flex-1">
                                    <View className="flex-row items-center mb-1.5" style={{ gap: scale(6) }}>
                                        <Text className="text-primary-400 dark:text-primary-600 font-extrabold uppercase tracking-widest" style={{ fontSize: scale(11) }} allowFontScaling={false}>Weekly Identity</Text>
                                        <View className="w-1 h-1 rounded-full bg-slate-700 dark:bg-slate-300" />
                                        <Text className="text-slate-500 dark:text-slate-400 font-bold" style={{ fontSize: scale(11) }} allowFontScaling={false}>{lastWeekRange}</Text>
                                    </View>
                                    <Text className="text-white dark:text-slate-900 font-black" style={{ fontSize: scale(28) }} allowFontScaling={false}>{identity.weeklyIdentity}✨</Text>
                                </View>
                                <TouchableOpacity activeOpacity={0.7} className="bg-white/10 dark:bg-slate-100 p-2.5 rounded-full border border-white/10 dark:border-slate-200">
                                    <Ionicons name="share-outline" size={scale(20)} color={accent === 'default' && Platform.OS === 'ios' ? '#FFF' : '#64748B'} />
                                </TouchableOpacity>
                            </View>
                            <View className="z-10">
                                <Text className="text-slate-400 dark:text-slate-500 font-medium leading-6" style={{ fontSize: scale(14.5) }} allowFontScaling={false}>
                                    지난주 {user?.nickname || '나'}님은 주로 <Text className="text-white dark:text-slate-900 font-bold">{identity.weeklyKeyword}</Text>에 대해 이야기를 나누며 마음을 돌보셨네요.
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 items-center justify-center" style={[{ padding: scale(32), borderRadius: scale(32) }, safeShadow]}>
                            <Ionicons name="sparkles-outline" size={scale(32)} color="#CBD5E1" style={{ marginBottom: scale(12) }} />
                            <Text className="font-bold text-slate-700 dark:text-slate-300 text-center mb-1" style={{ fontSize: scale(14) }}>아직 분석할 일기가 없어요</Text>
                        </View>
                    )}
                </Animated.View>

                {/* 📊 3. 기록의 리듬 */}
                <Animated.View entering={FadeInUp.delay(400).duration(800).springify()} style={{ marginBottom: scale(32) }}>
                    <View className="mb-4 px-2">
                        <Text className="font-black text-slate-900 dark:text-white" style={{ fontSize: scale(18) }} allowFontScaling={false}>기록의 리듬</Text>
                        <Text className="text-slate-400 font-bold mt-1" style={{ fontSize: scale(12) }} allowFontScaling={false}>버디와 함께 마음의 온기를 이어가고 있어요</Text>
                    </View>

                    <View className="flex-row flex-wrap justify-between">
                        <SummaryCard icon="flame" color="#F97316" bg="bg-orange-100" value={currentStreak} unit="일" label="연속 기록" delay={200} />
                        <SummaryCard icon="calendar" color="#3B82F6" bg="bg-blue-100" value={thisWeekCount} unit="회" label="이번 주 합계" delay={300} />
                        <SummaryCard icon="checkbox" color="#10B981" bg="bg-emerald-100" value={activeDays} unit="일" label="기록한 날들" delay={400} />
                        <SummaryCard icon="trending-up" color="#8B5CF6" bg="bg-purple-100" value={comparison === 0 ? "-" : (comparison > 0 ? `+${comparison}` : comparison)} unit={comparison === 0 ? "" : "회"} label="지난주 대비" delay={500} />
                    </View>

                    <View className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800" style={[{ padding: scale(24), borderRadius: scale(32) }, safeShadow]}>
                        <View className="flex-row justify-around items-center mb-8">
                            <View className="items-center">
                                <Text className="text-slate-400 font-bold mb-1" style={{ fontSize: scale(11) }} allowFontScaling={false}>연속 기록</Text>
                                <View className="flex-row items-end">
                                    <Text className="font-black" style={{ color: accentHex, fontSize: scale(32) }} allowFontScaling={false}>{currentStreak}</Text>
                                    <Text className="text-slate-400 font-bold ml-1 mb-2" style={{ fontSize: scale(14) }} allowFontScaling={false}>일째</Text>
                                </View>
                            </View>

                            <View className="w-[1px] h-10 bg-slate-100 dark:bg-slate-800" />

                            <View className="items-center">
                                <Text className="text-slate-400 font-bold mb-1" style={{ fontSize: scale(11) }} allowFontScaling={false}>최고 기록</Text>
                                <View className="flex-row items-end">
                                    <Text className="text-slate-900 dark:text-white font-black" style={{ fontSize: scale(32) }} allowFontScaling={false}>{currentStreak > 0 ? Math.max(currentStreak, 10) : 0}</Text>
                                    <Text className="text-slate-400 font-bold ml-1 mb-2" style={{ fontSize: scale(14) }} allowFontScaling={false}>일</Text>
                                </View>
                            </View>
                        </View>

                        <View className="flex-row justify-between items-end px-1" style={{ height: scale(120) }}>
                            {weeklyData.map((data, idx) => {
                                const h = (data.count / maxWeeklyCount) * 65;
                                const isToday = daysOfWeek[idx] === daysOfWeek[(now.getDay() + 6) % 7];
                                const hasRecord = data.count > 0;
                                return (
                                    <View key={idx} className="items-center justify-end" style={{ width: scale(38), height: '100%' }}>
                                        {hasRecord && <Ionicons name="flame" size={scale(16)} color={isToday ? accentHex : "#CBD5E1"} style={{ marginBottom: scale(6) }} />}
                                        <View
                                            className="rounded-full"
                                            style={{
                                                height: hasRecord ? `${Math.max(h, 15)}%` : '15%',
                                                width: scale(18),
                                                backgroundColor: isToday ? accentHex : (hasRecord ? `${accentHex}30` : '#F1F5F9'),
                                                borderWidth: isToday ? 0 : (hasRecord ? 1 : 0),
                                                borderColor: accentHex
                                            }}
                                        />
                                        <Text className={`mt-3 font-bold ${isToday ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`} style={{ fontSize: scale(11), color: isToday ? accentHex : undefined }} allowFontScaling={false}>
                                            {data.day}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </Animated.View>

                {/* ✨ 4. 마음 조각들 */}
                <Animated.View entering={FadeInUp.duration(600).delay(800).springify()} style={{ marginBottom: scale(32) }}>
                    <View className="mb-3 px-2">
                        <Text className="font-black text-slate-900 dark:text-white" style={{ fontSize: scale(18) }} allowFontScaling={false}>마음을 채운 조각들</Text>
                        <Text className="text-slate-400 font-bold mt-1" style={{ fontSize: scale(12) }}>최근 7일 동안 가장 많이 언급된 감정들이에요</Text>
                    </View>

                    <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60" style={[{ padding: scale(20), borderRadius: scale(32) }, safeShadow]}>
                        <View className="flex-row flex-wrap justify-center" style={{ gap: scale(8) }}>
                            {topTags.map(([tag, count], idx) => {
                                const isRanked = idx < 3;
                                const medalColors = ['#FBBF24', '#94A3B8', '#B45309'];
                                const medalColor = isRanked ? medalColors[idx] : 'transparent';

                                return (
                                    <Animated.View
                                        key={tag as string}
                                        entering={ZoomIn.delay(1000 + (idx * 100)).springify()}
                                    >
                                        <View
                                            // 📍 캡슐형으로 컴백: rounded-full 적용
                                            className="bg-primary-50 dark:bg-primary-900/40 rounded-full border border-primary-100/50 dark:border-primary-800/50 flex-row items-center"
                                            style={{
                                                paddingHorizontal: scale(14), // 캡슐형은 좌우 여백이 조금 더 길어야 예쁩니다
                                                paddingVertical: scale(8)
                                            }}
                                        >
                                            {isRanked && (
                                                <Ionicons
                                                    name="medal"
                                                    size={scale(14)}
                                                    color={medalColor}
                                                    style={{ marginRight: scale(4) }}
                                                />
                                            )}
                                            <Text
                                                className="text-primary-600 dark:text-primary-300 font-extrabold uppercase tracking-wide"
                                                style={{ fontSize: scale(13) }}
                                                allowFontScaling={false}
                                            >
                                                #{tag} <Text className="text-primary-600 dark:text-primary-300" style={{ opacity: 0.6, fontSize: scale(11) }}>{count as number}</Text>
                                            </Text>
                                        </View>
                                    </Animated.View>
                                );
                            })}
                        </View>

                        {topTags.length === 0 && (
                            <View className="items-center py-6">
                                <Ionicons name="receipt-outline" size={scale(32)} color="#CBD5E1" />
                                <Text className="text-slate-400 font-medium mt-2" allowFontScaling={false}>아직 수집된 조각이 없어요.</Text>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const SummaryCard = ({ icon, color, bg, value, unit, label, delay }: any) => {
    return (
        <Animated.View entering={FadeInUp.duration(600).delay(delay).springify()} style={{ width: '48%', marginBottom: scale(14) }}>
            <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 flex-row items-center" style={[{ padding: scale(16), borderRadius: scale(24) }, safeShadow]}>
                <View className={`rounded-2xl ${bg} dark:bg-opacity-20 items-center justify-center`} style={{ width: scale(44), height: scale(44) }}>
                    <Ionicons name={icon} size={scale(22)} color={color} />
                </View>
                <View className="ml-3 flex-1">
                    <Text className="font-black text-slate-900 dark:text-white tracking-tighter" style={{ fontSize: scale(20), lineHeight: scale(24) }} allowFontScaling={false}>
                        {value}
                        <Text className="text-slate-400 font-bold" style={{ fontSize: scale(13) }}>{unit}</Text>
                    </Text>
                    <Text className="font-bold text-slate-400 uppercase tracking-tighter mt-0.5" style={{ fontSize: scale(10) }} allowFontScaling={false}>
                        {label}
                    </Text>
                </View>
            </View>
        </Animated.View>
    );
};