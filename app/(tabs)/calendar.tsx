import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 컴포넌트 & 유틸
import { Card } from '../../components/ui/Card';
import { DiaryEntry, storage } from '../../utils/storage';

const { width } = Dimensions.get('window');
const CELL_WIDTH = (width - 40) / 7;

export default function CalendarScreen() {
    const router = useRouter();

    // State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [diaries, setDiaries] = useState<DiaryEntry[]>([]);

    // 1. 데이터 로드 (안정적인 방식)
    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                const data = await storage.getDiaries();
                setDiaries(data);
            };
            loadData();
        }, [])
    );

    // 2. 달력 날짜 생성
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const calendar: Date[] = [];
    const tempDate = new Date(startDate);
    for (let i = 0; i < 42; i++) {
        calendar.push(new Date(tempDate));
        tempDate.setDate(tempDate.getDate() + 1);
    }

    // 3. 월 이동
    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // 4. 선택된 날짜의 일기 필터링 (최신순 정렬)
    const selectedDiaries = useMemo(() => {
        return diaries.filter((diary) => {
            const diaryDate = new Date(diary.date);
            return (
                diaryDate.getFullYear() === selectedDate.getFullYear() &&
                diaryDate.getMonth() === selectedDate.getMonth() &&
                diaryDate.getDate() === selectedDate.getDate()
            );
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedDate, diaries]);


    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>

            {/* === 1. 캘린더 헤더 === */}
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-100">
                <TouchableOpacity onPress={handlePrevMonth} className="p-2">
                    <Ionicons name="chevron-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">
                    {year}년 {month + 1}월
                </Text>
                <TouchableOpacity onPress={handleNextMonth} className="p-2">
                    <Ionicons name="chevron-forward" size={24} color="#374151" />
                </TouchableOpacity>
            </View>

            {/* === 2. 캘린더 그리드 === */}
            <View className="p-4 bg-white shadow-sm z-10">
                <View className="flex-row mb-2">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                        <View key={idx} style={{ width: CELL_WIDTH }} className="items-center">
                            <Text className={`text-sm font-medium ${idx === 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                {day}
                            </Text>
                        </View>
                    ))}
                </View>

                <View className="flex-row flex-wrap">
                    {calendar.map((date, index) => {
                        const isCurrentMonth = date.getMonth() === month;
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isSelected = selectedDate.toDateString() === date.toDateString();
                        const hasDiary = diaries.some(d => {
                            const dDate = new Date(d.date);
                            return dDate.getDate() === date.getDate() &&
                                dDate.getMonth() === date.getMonth() &&
                                dDate.getFullYear() === date.getFullYear();
                        });

                        return (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setSelectedDate(date)}
                                activeOpacity={0.7}
                                style={{ width: CELL_WIDTH, height: CELL_WIDTH }}
                                className={`items-center justify-center rounded-xl mb-1 relative ${isSelected ? 'bg-[#7C3AED]' : isToday ? 'bg-purple-50' : ''
                                    }`}
                            >
                                <Text className={`text-sm font-medium ${isSelected ? 'text-white font-bold' :
                                    !isCurrentMonth ? 'text-gray-300' :
                                        isToday ? 'text-[#7C3AED]' : 'text-gray-700'
                                    }`}>
                                    {date.getDate()}
                                </Text>
                                {hasDiary && (
                                    <View className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#7C3AED]'
                                        }`} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* === 3. 하단 리스트 (Card 디자인 적용 + FlatList 사용) === */}
            <View className="flex-1 bg-gray-50 border-t border-gray-100">
                <View className="px-5 py-4 bg-white border-b border-gray-100">
                    <Text className="text-base font-bold text-gray-900 border-l-4 border-[#7C3AED] pl-3">
                        {selectedDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" })}
                    </Text>
                </View>

                <FlatList
                    data={selectedDiaries}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-12">
                            <Ionicons name="calendar-clear-outline" size={48} color="#CBD5E1" />
                            <Text className="text-gray-400 mt-2">작성된 일기가 없어요</Text>
                        </View>
                    }
                    // ✅ 여기가 핵심! 님이 원하시던 Card 디자인을 FlatList에 적용
                    renderItem={({ item }) => {
                        const hasImage = item.images && item.images.length > 0;
                        return (
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => router.push(`/diary/${item.id}`)}
                                className="mb-3" // 카드 간 간격
                            >
                                <Card className="bg-white border-gray-100 shadow-sm p-4">
                                    <View className="flex-row items-center justify-between">

                                        {/* [왼쪽] 텍스트 영역 */}
                                        <View className="flex-1 mr-4">
                                            {/* 제목 */}
                                            <Text className="text-[15px] font-bold text-gray-900 mb-1 leading-tight" numberOfLines={1}>
                                                {item.title}
                                            </Text>

                                            {/* 내용 */}
                                            <Text className="text-[13px] text-gray-500 mb-2 leading-5" numberOfLines={2}>
                                                {item.content}
                                            </Text>

                                            {/* 태그 영역 (감정 + 태그) */}
                                            <View className="flex-row flex-wrap gap-1.5">
                                                {item.emotion && (
                                                    <View className="bg-purple-50 px-2 py-1 rounded-md">
                                                        <Text className="text-[#7C3AED] text-[10px] font-medium">{item.emotion}</Text>
                                                    </View>
                                                )}
                                                {item.tags?.slice(0, 2).map((tag, i) => (
                                                    <View key={i} className="bg-gray-100 px-2 py-1 rounded-md">
                                                        <Text className="text-gray-500 text-[10px]">#{tag}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>

                                        {/* [오른쪽] 이미지 (있을 때만) */}
                                        {hasImage && (
                                            <Image
                                                source={{ uri: item.images![0] }}
                                                className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-100"
                                                resizeMode="cover"
                                            />
                                        )}
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </SafeAreaView>
    );
}