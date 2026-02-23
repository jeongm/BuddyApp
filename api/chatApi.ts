// src/api/chatApi.ts
import { authApi } from './axios';
import type { AuthResponse } from '../types/auth';
import type { SendMessageRequest, SendMessageResponse, ChatMessage } from '../types/chat';

export const chatApi = {
    // 1. 메시지 전송
    sendMessage: async (data: SendMessageRequest) => {
        const response = await authApi.post<AuthResponse<SendMessageResponse>>('/api/v1/chats', data);
        return response.data;
    },

    // 2. 대화 내역 조회 (API 명세와 완벽 일치!)
    getChatHistory: async (sessionId: number) => {
        // GET /api/v1/chats/{sessionId} 호출
        const response = await authApi.get<AuthResponse<ChatMessage[]>>(`/api/v1/chats/${sessionId}`);
        return response.data;
    },

    // 3. 대화 종료
    endChatSession: async (sessionId: number) => {
        const response = await authApi.patch<AuthResponse<string>>(`/api/v1/chats/${sessionId}/end`);
        return response.data;
    },
};