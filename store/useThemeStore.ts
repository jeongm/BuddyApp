import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ThemeMode = 'system' | 'light' | 'dark';
// ✨ 5가지 프리미엄 포인트 컬러 정의 (기본값은 시크한 블랙앤화이트)
export type AccentColor = 'default' | 'violet' | 'rose' | 'blue' | 'green';

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
            accent: 'default', // 앱을 처음 깔면 무조건 '모노톤(Black & White)'으로 시작

            setTheme: (theme) => set({ theme }),
            setAccent: (accent) => set({ accent }),
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);