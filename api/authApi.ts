// src/api/authApi.ts
import type { AuthResponse, LoginRequest, LoginResult } from '../types/auth';
import { publicApi, authApi as tokenApi } from './axios';

export const authService = {
  // 1. 일반 로그인
  login: async (data: LoginRequest) => {
    const response = await publicApi.post<AuthResponse<LoginResult>>('/api/v1/auth/login', data);
    return response.data;
  },

  // 2. 로그아웃
  logout: async () => {
    const response = await tokenApi.post<AuthResponse<void>>('/api/v1/auth/logout');
    return response.data;
  },

  // 3. 이메일 인증 코드 발송
  sendSignupEmail: async (data: { email: string }) => {
    const response = await publicApi.post('/api/v1/auth/signup/email', data);
    return response.data;
  },

  // 4. 이메일 인증 코드 검증
  verifySignupEmail: async (data: { email: string; code: string }) => {
    const response = await publicApi.post('/api/v1/auth/signup/email/verify', data);
    return response.data;
  },
};

// ✨ 소셜 로그인 전용 API 모음 (백엔드 명세서 완벽 반영)
export const oauthApi = {
  // 1. 프론트에서 얻은 소셜 '인가 코드(code)'를 백엔드로 보냅니다! (🚀 400 에러 해결의 핵심!)
  loginWithSocialToken: async (data: { provider: string; code: string }) => {
    // 🚨 기존에 token이었던 파라미터를 명세서에 맞게 'code'로 완벽하게 수정했습니다!
    const response = await publicApi.post('/api/v1/auth/login/social', data);
    return response.data;
  },

  // 2. 소셜 계정 연동 완료 (기존 유지)
  // 백엔드 명세서 Request body: { "key": "string" } 에 완벽하게 부합합니다!
  linkSocialAccount: async (key: string) => {
    const response = await publicApi.post(`/api/v1/auth/social/link`, { key });
    return response.data;
  },
};