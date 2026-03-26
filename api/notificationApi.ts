import type { AuthResponse } from '../types/auth';
import { authApi as tokenApi } from './axios';

// ✨ 백엔드 명세서(Response)와 1000% 일치하는 타입 정의!
export interface NotificationSettings {
    chatAlert: boolean;
    dailyAlert: boolean;
    marketingAlert: boolean;
    nightAlert: boolean;
}

export const notificationApi = {
    // 1. 알림 설정 전체 조회 (GET)
    getSettings: async () => {
        const response = await tokenApi.get<AuthResponse<NotificationSettings>>('/api/v1/notifications');
        return response.data;
    },

    // 2. 대화 소멸 경고 알림 변경 (PATCH)
    updateChat: async (enabled: boolean) => {
        const response = await tokenApi.patch<AuthResponse<NotificationSettings>>(`/api/v1/notifications/chat?enabled=${enabled}`);
        return response.data;
    },

    // 3. 데일리 안부 알림 변경 (PATCH)
    updateDaily: async (enabled: boolean) => {
        const response = await tokenApi.patch<AuthResponse<NotificationSettings>>(`/api/v1/notifications/daily?enabled=${enabled}`);
        return response.data;
    },

    // 4. 마케팅 알림 변경 (PATCH)
    updateMarketing: async (enabled: boolean) => {
        const response = await tokenApi.patch<AuthResponse<NotificationSettings>>(`/api/v1/notifications/marketing?enabled=${enabled}`);
        return response.data;
    },

    // 5. 야간 알림 변경 (PATCH)
    updateNight: async (enabled: boolean) => {
        const response = await tokenApi.patch<AuthResponse<NotificationSettings>>(`/api/v1/notifications/night?enabled=${enabled}`);
        return response.data;
    },
};