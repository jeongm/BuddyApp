import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';
export type AccentColor = 'default' | 'rose' | 'blue' | 'green' | 'yellow';

// [테마] 전역 색상 상수 정의 (이제 모든 컴포넌트에서 이걸 가져다 씁니다!)
export const ACCENT_HEX_COLORS: Record<AccentColor, string> = {
    default: '#27272A', // ✨ 미드나잇 블랙 -> 부드러운 '소프트 블랙'으로 변경!
    rose: '#FB7185',    // 코랄 로즈 (유지)
    blue: '#60A5FA',    // 세레니티 블루 (유지)
    green: '#059669',   // ✨ 포레스트 그린 (차분하고 따뜻함)
    yellow: '#F97316'   // ✨ 선셋 망고 (옐로우 대신 가독성 높은 따뜻한 오렌지)
};

interface ThemeState {
    theme: ThemeMode;
    accent: AccentColor;
    setTheme: (theme: ThemeMode) => void;
    setAccent: (accent: AccentColor) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'system',
            accent: 'default',
            setTheme: (theme) => set({ theme }),
            setAccent: (accent) => set({ accent }),
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);