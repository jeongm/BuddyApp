import { authApi } from "./axios"; // 기존에 쓰시던 axios 인스턴스 경로에 맞게 수정해주세요!

export interface WeeklyTag {
    tagName: string;
    count: number;
}

export interface WeeklyIdentity {
    weeklyIdentity: string;
    weeklyKeyword: string;
}

interface ApiResponse<T> {
    code: string;
    message: string;
    result: T;
}

export const insightApi = {
    // 1. 주간 최다 빈도 태그 조회
    getWeeklyTags: async () => {
        const response = await authApi.get<ApiResponse<WeeklyTag[]>>('/api/v1/insight/weekly/tags');
        return response.data.result;
    },

    // 2. 주간 아이덴티티(칭호) 조회
    getWeeklyIdentity: async () => {
        const response = await authApi.get<ApiResponse<WeeklyIdentity | null>>('/api/v1/insight/weekly/identity');
        return response.data.result;
    }
};