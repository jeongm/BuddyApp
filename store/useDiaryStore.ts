import AsyncStorage from '@react-native-async-storage/async-storage'; // ✨ [수정] 앱 저장소 임포트
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// 일기 데이터 타입
export interface Diary {
    id: string;
    userId: string;
    date: string;
    mood: string;
    content: string;
    images?: string[];
}

interface DiaryState {
    diaries: Diary[];
    addDiary: (diary: Diary) => void;
    getDiaryByDate: (date: string) => Diary | undefined;
    getDiariesByDate: (date: string) => Diary[];
}

export const useDiaryStore = create<DiaryState>()(
    persist(
        (set, get) => ({
            diaries: [],

            addDiary: (newDiary) =>
                set((state) => ({
                    // ID가 같으면 수정(덮어쓰기), 다르면 추가
                    diaries: [
                        ...state.diaries.filter((d) => d.id !== newDiary.id),
                        newDiary,
                    ],
                })),

            // 특정 날짜의 첫 번째 일기 반환
            getDiaryByDate: (date) => {
                return get().diaries.find((d) => d.date === date);
            },

            // 특정 날짜의 모든 일기 반환
            getDiariesByDate: (date) => {
                return get().diaries.filter((d) => d.date === date);
            },
        }),
        {
            name: 'diary-storage', // 저장소 키 이름
            storage: createJSONStorage(() => AsyncStorage), // ✨ [핵심 수정] localStorage -> AsyncStorage
        }
    )
);