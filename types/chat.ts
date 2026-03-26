// 1. 채팅 메시지 하나
export interface ChatMessage {
    messageId: number;
    role: "USER" | "ASSISTANT" | string;
    content: string;
    createdAt: string;
}

// 2. 메시지 보낼 때 (요청)
export interface SendMessageRequest {
    sessionId: number; // ✨ 통일 완료
    content: string;
}

// 3. 메시지 보내기 응답 (중요: 명세서의 result 구조와 일치)
export interface SendMessageResponse {
    sessionId: number; // ✨ sessionId 삭제 및 타입 고정
    message: ChatMessage; // ✨ 메시지 객체가 별도로 들어옴
}

// 4. 대화 내역 조회 응답 (추가: 명세서의 result 구조)
export interface ChatHistoryResponse {
    sessionId: number;
    characterId: number;
    messages: ChatMessage[];
}