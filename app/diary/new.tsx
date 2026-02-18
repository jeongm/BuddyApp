import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DiaryData, DiaryEditor } from '../../components/DiaryEditor';
import { DiaryEntry, storage } from '../../utils/storage'; // storage 경로 확인!

export default function NewDiaryScreen() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const handleCreate = async (data: DiaryData) => {
        setIsSaving(true);

        // 1. 저장할 데이터 객체 만들기 (storage.ts의 DiaryEntry 형식에 맞춤)
        const newDiary: DiaryEntry = {
            id: Date.now().toString(),       // ID 생성
            date: data.date.toISOString(),   // Date 객체 -> 문자열 변환
            title: data.title,
            content: data.content,
            emotion: data.emotion,
            tags: data.tags,
            images: data.images,
            messages: [] // 새 일기니까 채팅 기록은 빈 배열
        };

        // 2. 저장 함수 호출 (이름을 saveDiary로 통일)
        await storage.saveDiary(newDiary);

        setIsSaving(false);
        router.back(); // 뒤로가기
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            <DiaryEditor
                headerTitle="새 일기 작성"
                onSubmit={handleCreate}
                isSaving={isSaving}
            />
        </SafeAreaView>
    );
}