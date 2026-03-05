import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingState {
    fontFamily: string;
    fontSizeScale: number;
    setFontFamily: (font: string) => void;
    setFontSizeScale: (scale: number) => void;
}

export const useSettingStore = create<SettingState>()(
    persist(
        (set) => ({
            fontFamily: 'Pretendard-Regular', // 기본 폰트
            fontSizeScale: 1.0,  // 기본 크기 배율 (100%)
            setFontFamily: (font) => set({ fontFamily: font }),
            setFontSizeScale: (scale) => set({ fontSizeScale: scale }),
        }),
        {
            name: 'setting-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);