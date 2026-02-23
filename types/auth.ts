// src/types/auth.ts

// 1. 공통 응답 껍데기
export interface AuthResponse<T> {
  code: string;
  message: string;
  result: T;
}

// 2. 핵심: 사용자 정보 (Member)
// 서버가 주는 "result.member" 또는 "result" 안의 내용물입니다.
export interface Member {
  memberSeq: number;      // 기존 userSeq -> memberSeq
  email: string;
  nickname: string;
  characterSeq: number;
  characterNickname: string;
  avatarUrl: string;      // ✨ 서버가 이미지 주소도 줍니다!
}

// 3. 로그인 관련
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  member: Member; // ✨ 서버는 'user'가 아니라 'member'라는 이름으로 줍니다.
}

// 4. 회원가입 관련
export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
  characterSeq: number;
  characterNickname: string;
}

// 회원가입 성공 시 서버가 Member 정보를 그대로 줍니다.
export type SignupResult = Member;