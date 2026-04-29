import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LoginResult, Member } from '../types/auth';
// ✨ [수정] 재호님이 보내주신 memberApi 임포트
import { memberApi } from '../api/memberApi';

interface AuthState {
  user: Member | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;

  login: (data: LoginResult) => void;
  logout: () => void;
  updateUserInfo: (updatedData: Partial<Member>) => void;

  // ✨ [추가] 서버 동기화 함수
  refreshUser: () => Promise<void>;

  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: Member) => void;
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoggedIn: false,

      login: (data) => {
        set({
          user: data.member,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || null,
          isLoggedIn: true
        });
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isLoggedIn: false });
      },

      updateUserInfo: (updatedData) => set((state) => ({
        user: state.user ? { ...state.user, ...updatedData } : null
      })),

      // ✨ [구현 완료] 서버에 '나'의 최신 정보를 물어보고 업데이트함
      refreshUser: async () => {
        try {
          const response = await memberApi.getMe();
          if (response.result) {
            set({ user: response.result });
            console.log("🔄 기기 데이터 동기화 완료:", response.result.characterNickname);
          }
        } catch (error) {
          console.error("❌ 동기화 실패:", error);
          throw error; // ✅ 이 한 줄이 핵심! 에러를 호출한 곳으로 전달
        }
      },


      setTokens: (access, refresh) => {
        set({ accessToken: access, refreshToken: refresh, isLoggedIn: true });
      },

      setUser: (user) => set({ user }),

      setAccessToken: (token) => {
        set({ accessToken: token });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);