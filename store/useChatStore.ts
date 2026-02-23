import { create } from 'zustand';

interface ChatState {
    sessionId: number;
    setSessionId: (id: number) => void;
    resetSession: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    sessionId: 0, // 0이면 대화 시작 전
    setSessionId: (id) => set({ sessionId: id }),
    resetSession: () => set({ sessionId: 0 }),
}));