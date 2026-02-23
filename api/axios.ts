import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
// ✨ [핵심] Zustand 스토어를 직접 불러옵니다!
import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = 'https://buddy-api.kro.kr';

const commonConfig = {
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
};

export const publicApi = axios.create(commonConfig);
export const authApi = axios.create(commonConfig);

// --------------------------------------------------------------------------
// [요청 인터셉터]
// --------------------------------------------------------------------------
authApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // ✨ [수정] 엉뚱한 SecureStore 대신, Zustand 상태에서 직접 토큰을 꺼냅니다. 
    // 메모리에서 바로 꺼내오므로 await도 필요 없고 엄청 빠릅니다!
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// --------------------------------------------------------------------------
// [응답 인터셉터]
// --------------------------------------------------------------------------
authApi.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const errorData = error.response?.data as { code?: string } | undefined;
    const errorCode = errorData?.code;

    // 토큰 만료 시 (T002, G003)
    if ((errorCode === 'T002' || errorCode === 'G003') && originalRequest && !originalRequest._retry) {
      console.log(`♻️ 토큰 만료 감지 (${errorCode}). 재발급 시도...`);
      originalRequest._retry = true;

      try {
        // ✨ [수정] 리프레시 토큰도 Zustand에서 꺼냅니다.
        const currentRefreshToken = useAuthStore.getState().refreshToken;

        const { data } = await publicApi.post('/api/v1/auth/refresh', {
          refreshToken: currentRefreshToken
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data.result;

        // ✨ [수정] 새 토큰을 Zustand에 저장합니다 (이러면 AsyncStorage에도 알아서 저장됨!)
        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return authApi(originalRequest);
      } catch (refreshError) {
        // ✨ [수정] 갱신 실패 시 Zustand의 logout 액션을 실행시켜 깔끔하게 싹 지웁니다.
        useAuthStore.getState().logout();
        router.replace('/auth/login');

        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);