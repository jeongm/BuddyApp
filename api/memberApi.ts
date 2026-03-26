import type { AuthResponse, Member } from '../types/auth';
import { authApi as tokenApi } from './axios';

export const memberApi = {
    // ==========================================
    // 1. 내 정보 및 프로필 설정
    // ==========================================

    // 내 정보 조회
    getMe: async () => {
        const response = await tokenApi.get<AuthResponse<Member>>('/api/v1/members/me');
        return response.data;
    },

    // ✨ 통합 온보딩 완료
    onboarding: async (data: {
        nickname: string;
        characterId: number;
        characterName: string;
        isNightAgreed: boolean;
    }) => {
        const response = await tokenApi.patch('/api/v1/members/me/onboarding', data);
        return response.data;
    },

    // 닉네임 변경
    updateNickname: async (newNickname: string) => {
        const response = await tokenApi.patch<AuthResponse<{ nickname: string }>>('/api/v1/members/me/nickname', {
            nickname: newNickname
        });
        return response.data;
    },

    // 캐릭터 종류 변경
    updateCharacter: async (data: { characterId: number }) => {
        const response = await tokenApi.patch<AuthResponse<Member>>('/api/v1/members/me/character', data);
        return response.data;
    },

    // 캐릭터 이름 변경
    updateCharacterName: async (data: { characterName: string }) => {
        const response = await tokenApi.patch<AuthResponse<string>>('/api/v1/members/me/character-name', data);
        return response.data;
    },

    // ==========================================
    // 2. 계정 보안 및 기타 설정
    // ==========================================

    // 현재 비밀번호 검증
    verifyPassword: async (data: { currentPassword: string }) => {
        const response = await tokenApi.post('/api/v1/members/me/password/verify', data);
        return response.data;
    },

    // 비밀번호 수정
    updatePassword: async (data: { currentPassword: string; newPassword: string }) => {
        const response = await tokenApi.patch('/api/v1/members/me/password', data);
        return response.data;
    },

    // FCM 토큰 갱신 (카멜케이스로 이름 살짝 수정: updatePushToken)
    updatePushToken: async (token: string) => {
        const response = await tokenApi.patch('/api/v1/members/push-token', {
            pushToken: token
        });
        return response.data;
    },

    // 회원 탈퇴
    deleteAccount: async (data?: { socialAccessToken?: string }) => {
        const response = await tokenApi.delete('/api/v1/members/me', {
            data: data
        });
        return response.data;
    },
};