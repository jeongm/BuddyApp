import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DiaryData, DiaryEditor } from '../../../components/DiaryEditor'; // 경로 확인!
import { DiaryEntry, storage } from '../../../utils/storage';

export default function EditDiaryScreen() {
    const { id } = useLocalSearchParams(); // URL에서 id 가져오기
    const router = useRouter();
    const [diary, setDiary] = useState<DiaryEntry | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // 1. 기존 데이터 불러오기
    useEffect(() => {
        const loadDiary = async () => {
            if (id) {
                // storage.ts에 있는 getDiaryById 사용
                const data = await storage.getDiaryById(id.toString());
                if (data) {
                    setDiary(data);
                } else {
                    Alert.alert("오류", "일기를 찾을 수 없습니다.");
                    router.back();
                }
            }
        };
        loadDiary();
    }, [id]);

    // 2. 수정 완료 버튼 눌렀을 때 실행
    const handleUpdate = async (data: DiaryData) => {
        if (!diary) return;
        setIsSaving(true);

        // 수정된 내용으로 객체 업데이트
        const updatedDiary: DiaryEntry = {
            ...diary,       // 기존 ID, messages 등 유지
            ...data,        // 제목, 내용, 태그 등 덮어쓰기
            date: data.date.toISOString() // 날짜는 문자열로 변환해서 저장
        };

        // storage.ts의 updateDiary는 인자 하나만 받음!
        await storage.updateDiary(updatedDiary);

        setIsSaving(false);
        Alert.alert("성공", "일기가 수정되었습니다.", [
            { text: "확인", onPress: () => router.back() }
        ]);
    };

    // 데이터 로딩 중일 때 빈 화면 보여주기
    if (!diary) return <View className="flex-1 bg-white" />;

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <DiaryEditor
                headerTitle="일기 수정"
                // 저장된 데이터(String 날짜)를 에디터용(Date 객체)으로 변환해서 전달
                initialData={{
                    title: diary.title,
                    content: diary.content,
                    emotion: diary.emotion || "neutral",
                    tags: diary.tags || [],
                    images: diary.images || [],
                    date: new Date(diary.date) // 문자열 -> Date 객체 변환
                }}
                onSubmit={handleUpdate}
                isSaving={isSaving}
            />
        </SafeAreaView>
    );
}