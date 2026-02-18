import AsyncStorage from '@react-native-async-storage/async-storage';

// --- [1] 타입 정의 ---
export interface UserSettings {
  nickname: string;
  characterName: string;
  themeColor: string;
}

export interface Message {
  id: string;
  role: "user" | "buddy";
  content: string;
  timestamp: Date;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  date: string;
  messages?: Message[]; // 채팅 기록
  emotion?: string;
  images?: string[];    // 사진 (UI에서 쓰므로 추가)
}

// --- [2] 상수 및 기본값 ---
const STORAGE_KEYS = {
  DIARIES: "buddy_diaries",
  SETTINGS: "buddy_settings",
  USER_INFO: "buddy_user_info",
};

const DEFAULT_SETTINGS: UserSettings = {
  nickname: '사용자',
  characterName: '버디',
  themeColor: '#7C3AED',
};

// --- [3] 스토리지 로직 (핵심) ---
export const storage = {
  // ============================
  // ⚙️ 설정 (Settings) - 여기가 없어서 에러났던 것!
  // ============================
  async getSettings(): Promise<UserSettings> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return jsonValue != null ? JSON.parse(jsonValue) : DEFAULT_SETTINGS;
    } catch (e) {
      console.error('설정 로드 실패', e);
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: UserSettings) {
    try {
      const jsonValue = JSON.stringify(settings);
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, jsonValue);
    } catch (e) {
      console.error('설정 저장 실패', e);
    }
  },

  // ============================
  // 👤 사용자 (User / Auth)
  // ============================
  async setUser(user: { name: string; isLoggedIn: boolean }) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  },

  async clearAll() {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error(e);
    }
  },

  // ============================
  // 📖 일기 (Diaries) - 님이 주신 코드 통합
  // ============================
  async saveDiary(diary: DiaryEntry) {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.DIARIES);
      const diaries: DiaryEntry[] = existingData ? JSON.parse(existingData) : [];
      diaries.unshift(diary); // 최신순 저장
      await AsyncStorage.setItem(STORAGE_KEYS.DIARIES, JSON.stringify(diaries));
    } catch (e) {
      console.error("Failed to save diary", e);
    }
  },

  async getDiaries(): Promise<DiaryEntry[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DIARIES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to fetch diaries", e);
      return [];
    }
  },

  async getDiaryById(id: string): Promise<DiaryEntry | undefined> {
    try {
      const diaries = await this.getDiaries();
      return diaries.find((d) => d.id === id);
    } catch (e) {
      return undefined;
    }
  },

  // utils/storage.ts 내 storage 객체에 추가
  async deleteDiary(id: string) {
    try {
      const diaries = await this.getDiaries();
      const newDiaries = diaries.filter((d) => d.id !== id);
      await AsyncStorage.setItem("buddy_diaries", JSON.stringify(newDiaries));
    } catch (e) {
      console.error("Failed to delete diary", e);
    }
  },

  async updateDiary(updatedEntry: DiaryEntry) {
    try {
      const diaries = await this.getDiaries();
      // ID가 같은 일기를 찾아 교체(map)
      const newDiaries = diaries.map((d) =>
        d.id === updatedEntry.id ? updatedEntry : d
      );
      await AsyncStorage.setItem("buddy_diaries", JSON.stringify(newDiaries));
    } catch (e) {
      console.error("Failed to update diary", e);
    }
  },
};

// --- [4] AI Mock 데이터 (채팅용) ---
export const mockAI = {
  generateResponse: (input: string) => {
    const responses = [
      "그랬구나, 정말 힘들었겠다.",
      "오! 정말 멋진 일인데? 더 자세히 말해줄래?",
      "음, 그런 감정을 느꼈구나. 나도 이해해.",
      "오늘 하루 중 가장 기억에 남는 순간이었어?",
      "너의 이야기를 들으니 마음이 따뜻해져.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  },

  generateDiary: (messages: Message[]) => {
    const userMessages = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join(" ");

    return {
      title: "Buddy와 함께한 특별한 하루",
      content: userMessages || "오늘 하루는 정말 다채로웠어...",
      tags: ["일상", "대화", "Buddy"],
      emotion: "😁기쁨",
    };
  }
};

