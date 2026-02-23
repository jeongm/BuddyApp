// src/api/authApi.ts
import { publicApi, authApi as tokenApi } from './axios';
import type { AuthResponse, LoginRequest, LoginResult } from '../types/auth';

export const authService = {
  // ✨ [확인] 일반 로그인: /api/v1/auth/login
  login: async (data: LoginRequest) => {
    const response = await publicApi.post<AuthResponse<LoginResult>>('/api/v1/auth/login', data);
    return response.data;
  },

  // ✨ [수정] 로그아웃: /api/v1/auth/logout (보통 토큰이 필요하므로 tokenApi 사용)
  logout: async () => {
    const response = await tokenApi.post<AuthResponse<void>>('/api/v1/auth/logout');
    return response.data;
  },

  // ✨ [수정] 소셜 로그인 연동: /api/v1/auth/oauth-link
  linkOAuth: async (data: { email: string; provider: string; oauthId: string }) => {
    const response = await publicApi.post<AuthResponse<LoginResult>>('/api/v1/auth/oauth-link', data);
    return response.data;
  },

  // ✨ 1. 이메일 인증 코드 발송
  sendSignupEmail: async (data: { email: string }) => {
    const response = await publicApi.post('/api/v1/auth/signup/email', data);
    return response.data;
  },

  // ✨ 2. 이메일 인증 코드 검증
  verifySignupEmail: async (data: { email: string; code: string }) => {
    const response = await publicApi.post('/api/v1/auth/signup/email/verify', data);
    return response.data;
  },
};