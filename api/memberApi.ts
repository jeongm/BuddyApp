import { publicApi, authApi as tokenApi } from './axios';
import type { AuthResponse, SignupRequest, SignupResult, Member } from '../types/auth';

export const memberApi = {
    // ✨ [수정] 주소 변경: /api/v1/members/signup -> /api/v1/auth/signup
    signup: async (data: SignupRequest) => {
        const response = await publicApi.post<AuthResponse<SignupResult>>('/api/v1/auth/signup', data);
        return response.data;
    },

    // 내 정보 조회 (여긴 보통 그대로 /members 유지)
    getMe: async () => {
        const response = await tokenApi.get<AuthResponse<Member>>('/api/v1/members/me');
        return response.data;
    },

    // 닉네임 변경 (여기도 /members 유지일 확률 높음)
    updateNickname: async (newNickname: string) => {
        const response = await tokenApi.patch<AuthResponse<{ nickname: string }>>('/api/v1/members/me/nickname', {
            nickname: newNickname
        });
        return response.data;
    },

    // 캐릭터 이름 변경
    updateCharacterName: async (data: { characterName: string }) => {
        const response = await tokenApi.patch<AuthResponse<string>>('/api/v1/members/me/character-name', data);
        return response.data;
    },

    // 캐릭터 종류 변경
    updateCharacter: async (data: { characterSeq: number }) => {
        const response = await tokenApi.patch<AuthResponse<Member>>('/api/v1/members/me/character', data);
        return response.data;
    },

    // 비밀번호 수정
    updatePassword: async (password: string) => {
        const response = await tokenApi.patch<AuthResponse<string>>('/api/v1/members/me/password', {
            password
        });
        return response.data;
    },

    // 회원 탈퇴
    deleteAccount: async () => {
        // 명세서: DELETE /api/v1/members/me
        const response = await tokenApi.delete<AuthResponse<string>>('/api/v1/members/me');
        return response.data;
    }
};