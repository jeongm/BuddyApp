import AsyncStorage from '@react-native-async-storage/async-storage'; // ✨ [수정] 앱 저장소 임포트
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LoginResult, Member } from '../types/auth';

interface AuthState {
  user: Member | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;

  // 액션 함수들
  login: (data: LoginResult) => void;
  logout: () => void;
  updateUserInfo: (updatedData: Partial<Member>) => void;

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

      // 1. 일반 로그인
      login: (data) => {
        // ✨ [수정] localStorage.setItem 삭제!
        // set()만 하면 persist 미들웨어가 알아서 AsyncStorage에 저장해줍니다.
        set({
          user: data.member,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || null,
          isLoggedIn: true
        });
      },

      // 2. 로그아웃
      logout: () => {
        // ✨ [수정] localStorage.removeItem 삭제 -> set으로 초기화하면 알아서 삭제됨
        set({ user: null, accessToken: null, refreshToken: null, isLoggedIn: false });
      },

      // 3. 유저 정보 수정
      updateUserInfo: (updatedData) => set((state) => ({
        user: state.user ? { ...state.user, ...updatedData } : null
      })),

      // 4. 토큰 설정 (OAuthCallback 용)
      setTokens: (access, refresh) => {
        set({
          accessToken: access,
          refreshToken: refresh,
          isLoggedIn: true
        });
      },

      // 5. 유저 정보 설정
      setUser: (user) => set({ user }),

      // 6. 액세스 토큰만 갱신
      setAccessToken: (token) => {
        set({ accessToken: token });
      },
    }),
    {
      name: 'auth-storage', // 저장소 키 이름
      // ✨ [핵심 수정] localStorage -> AsyncStorage로 교체
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);