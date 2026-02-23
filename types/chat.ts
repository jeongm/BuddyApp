// src/types/chat.ts

// 1. 채팅 메시지 하나 (공통)
// API 명세의 result 배열 안에 들어가는 객체 구조와 일치시킴
export interface ChatMessage {
    sessionId: number;
    messageSeq: number;
    // UI에서 내 말/AI 말을 구분하기 위해 구체적인 값이 좋지만, 
    // 백엔드 값(대소문자)이 확실하지 않을 땐 string도 허용해두는 게 안전합니다.
    role: "USER" | "ASSISTANT" | string;
    content: string;
    createdAt: string;
}

// 2. 메시지 보낼 때 (요청)
export interface SendMessageRequest {
    sessionId: number;
    content: string;
}

// 3. 메시지 보내기 응답
export interface SendMessageResponse {
    sessionId: number;
    messageSeq: number;
    role: string;
    content: string;
    createdAt: string;
}