import type { AuthResponse } from '../types/auth';
import type { DiaryDetail, DiarySummary } from '../types/diary';
import { authApi } from './axios';

// 📅 캘린더 잔디 심기용 타입
export interface DailyDiaryCount {
    diaryDate: string;
    count: number;
}

// ✨ [NEW] 백엔드 페이징(Page) 응답 타입 정의
export interface PageResponse<T> {
    content: T[];
    pageable: any;
    last: boolean;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    sort: any;
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

export const diaryApi = {
    // =================================================================
    // 1. 조회 (Read)
    // =================================================================

    // ✨ [MODIFIED] 반환 타입을 배열이 아닌 PageResponse로 감싸줍니다!
    // GET /api/v1/diaries?search=&page=&size=&sort=
    getDiaries: async (search: string = "", page: number = 0, size: number = 50, sort: string = "diaryDate,desc") => {
        // sort의 기본값을 스웨거에 맞게 "diaryDate,desc"로 맞췄습니다.
        const response = await authApi.get<AuthResponse<PageResponse<DiarySummary>>>('/api/v1/diaries', {
            params: { search, page, size, sort }
        });
        return response.data;
    },

    // 1-1. 날짜별 일기 목록 조회
    // GET /api/v1/diaries/date?date=2024-02-12
    getDiariesByDate: async (date: string) => {
        const response = await authApi.get<AuthResponse<DiarySummary[]>>('/api/v1/diaries/date', {
            params: { date },
        });
        return response.data;
    },

    // 1-2. 월간 일기 목록 조회
    getMonthlyDiaries: async (year: number, month: number) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;
        const response = await authApi.get<AuthResponse<DiarySummary[]>>('/api/v1/diaries', {
            params: { date: dateStr, type: 'MONTHLY' }
        });
        return response.data;
    },

    // 1-3. 월별 일기 개수 조회 (캘린더)
    getMonthlyDiaryCounts: async (year: number, month: number) => {
        const response = await authApi.get<AuthResponse<DailyDiaryCount[]>>('/api/v1/diaries/calendar', {
            params: { year, month }
        });
        return response.data;
    },

    // 1-4. 일기 상세 조회
    getDiaryDetail: async (diarySeq: number) => {
        const response = await authApi.get<AuthResponse<DiaryDetail>>(`/api/v1/diaries/${diarySeq}`);
        return response.data;
    },

    // =================================================================
    // 2. 작성 (Create)
    // =================================================================
    createDiary: async (data: FormData) => {
        const response = await authApi.post<AuthResponse<number>>('/api/v1/diaries', data, {
            headers: { "Content-Type": undefined }
        });
        return response.data;
    },

    createDiaryFromChat: async (sessionSeq: number) => {
        const response = await authApi.post<AuthResponse<{
            title: string;
            content: string;
            tags: { tagSeq: number; name: string }[];
        }>>('/api/v1/diaries/from-chat', { sessionSeq });
        return response.data;
    },

    // =================================================================
    // 3. 수정 및 삭제 (Update & Delete)
    // =================================================================
    updateDiary: async (diarySeq: number, data: FormData) => {
        const response = await authApi.patch<AuthResponse<number>>(`/api/v1/diaries/${diarySeq}`, data, {
            headers: { "Content-Type": undefined }
        });
        return response.data;
    },

    deleteDiary: async (diarySeq: number) => {
        const response = await authApi.delete<AuthResponse<{}>>(`/api/v1/diaries/${diarySeq}`);
        return response.data;
    },
};