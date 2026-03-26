// src/types/diary.ts

// 1. 일기 목록 조회용 (CalendarPage, HomePage 리스트)
export interface DiarySummary {
    thumbnailUrl: any;
    diaryId: number;
    title: string;
    summary: string;
    createAt: string; // 리스트에서는 createAt 사용

    content?: string; // Vercel 에러 방지용 Optional

    // 날짜 관련 필드 (유연하게)
    date?: string;
    diaryDate?: string;
    createdAt?: string;

    tags?: string[] | { tagId: number; name: string }[];
    images?: { url: string }[] | string[];
    thumbnail?: string;
    imageUrl?: string;
}

// ✨ 2. 일기 상세 조회용 (DiaryViewPage 뷰어) - JSON 명세 반영
export interface DiaryDetail {
    diaryId: number;
    title: string;
    content: string;

    // ✨ 날짜 필드 (JSON 기준)
    diaryDate: string;  // "2026-02-05" (필수)
    createdAt: string;  // "2026-02-05T03:17:34..." (필수)

    // 태그 (JSON: [{ tagId: 79, name: "분노" }, ...])
    tags: {
        tagId: number;
        name: string;
    }[];

    // 이미지 (JSON: imageUrl 문자열 1개)
    imageUrl?: string;

    // 세션 정보
    sessionId?: number;

    // 레거시 호환용 (혹시 몰라 남겨둠)
    createAt?: string;
    images?: { url: string }[];
}

// 3. 일기 생성/수정 요청
export interface CreateDiaryRequest {
    title: string;
    content: string;
    diaryDate?: string;
    imageUrl?: string;
    tags: string[];
    sessionId?: number; // ✨ [추가!] 백엔드에 채팅방 번호를 넘겨주기 위해 필수!
}