import type { AuthResponse, LoginRequest, LoginResult } from '../types/auth';
import { publicApi, authApi as tokenApi } from './axios';

export const authService = {
  // ✨ 1. 일반 회원가입 (memberApi에서 이사 왔고, publicApi를 사용합니다!)
  signup: async (data: { email: string; password: string; verificationToken: string }) => {
    const response = await publicApi.post<AuthResponse<LoginResult>>('/api/v1/auth/signup', data);
    return response.data;
  },

  // 2. 일반 로그인
  login: async (data: LoginRequest) => {
    const response = await publicApi.post<AuthResponse<LoginResult>>('/api/v1/auth/login', data);
    return response.data;
  },

  // 3. 로그아웃 (토큰이 필요하므로 tokenApi 사용)
  logout: async () => {
    const response = await tokenApi.post<AuthResponse<void>>('/api/v1/auth/logout');
    return response.data;
  },

  // 📧 4. 이메일 인증 코드 발송 (회원가입 & 비밀번호 찾기 공통)
  sendEmailAuthCode: async (data: { email: string; purpose: "SIGNUP" | "PASSWORD_RESET" }) => {
    const response = await publicApi.post('/api/v1/auth/email/send', data);
    return response.data;
  },

  // ✅ 5. 이메일 인증 코드 검증 (결과값으로 증명서(token)를 string으로 받음)
  verifyEmailAuthCode: async (data: { email: string; code: string; purpose: "SIGNUP" | "PASSWORD_RESET" }) => {
    const response = await publicApi.post<AuthResponse<string>>('/api/v1/auth/email/verify', data);
    return response.data;
  },

  // ✨ 6. 비밀번호 찾기 - 재설정
  resetPassword: async (data: { email: string; verificationToken: string; newPassword: string }) => {
    const response = await publicApi.patch('/api/v1/auth/password/reset', data);
    return response.data;
  },
};

// ==========================================
// 소셜 로그인 전용 API 모음 (oauthApi)
// ==========================================
export const oauthApi = {
  // ✨ 수정: 백엔드 명세서에 맞춰 code 대신 token을 받습니다!
  loginWithSocialToken: async (data: { provider: string; token: string }) => {
    const response = await publicApi.post<AuthResponse<LoginResult>>('/api/v1/auth/login/social', data);
    return response.data;
  },

  // 2. 소셜 계정 연동 (명세서에 맞춰 주소 변경: /api/v1/auth/social/link)
  linkSocialAccount: async (key: string) => {
    const response = await publicApi.post<AuthResponse<LoginResult>>('/api/v1/auth/social/link', { key });
    return response.data;
  },
};