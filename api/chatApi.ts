// src/api/chatApi.ts
import type { AuthResponse } from '../types/auth';
import type { ChatHistoryResponse, SendMessageRequest, SendMessageResponse } from '../types/chat';
import { authApi } from './axios';

export const chatApi = {
    // 1. 메시지 전송
    sendMessage: async (data: SendMessageRequest) => {
        const response = await authApi.post<AuthResponse<SendMessageResponse>>('/api/v1/chats', data);
        return response.data;
    },

    // 2. 대화 내역 조회
    getChatHistory: async (sessionSeq: number) => {
        // ✨ 반환 타입을 ChatHistoryResponse로 변경
        const response = await authApi.get<AuthResponse<ChatHistoryResponse>>(`/api/v1/chats/${sessionSeq}`);
        return response.data;
    },

    // 3. 대화 종료
    endChatSession: async (sessionSeq: number) => {
        const response = await authApi.patch<AuthResponse<string>>(`/api/v1/chats/${sessionSeq}/end`);
        return response.data;
    },
};