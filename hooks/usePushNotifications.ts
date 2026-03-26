// hooks/usePushNotifications.ts
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// 앱이 켜져 있을 때 알림이 오면 화면에 보여줄지 설정
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true, // 화면 상단에 팝업(배너)으로 보여줄지?
        shouldShowList: true,   // 알림 센터 리스트에 남겨둘지?
        shouldPlaySound: true,  // 소리 낼지?
        shouldSetBadge: false,  // 앱 아이콘에 빨간 숫자(뱃지) 띄울지?
    }),
});

export function usePushNotifications() {
    const [pushToken, setpushToken] = useState<string | undefined>();

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
            if (token) setpushToken(token);
        });
    }, []);

    async function registerForPushNotificationsAsync() {
        let token;

        if (Device.isDevice) {
            console.log('📱 실제 기기 감지됨');

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            console.log('📱 현재 알림 권한 상태:', existingStatus);

            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
                console.log('📱 권한 요청 후 상태:', finalStatus);
            }

            if (finalStatus !== 'granted') {
                console.log('❌ 알림 권한 거부됨');
                return;
            }

            try {
                const tokenResponse = await Notifications.getDevicePushTokenAsync();
                token = tokenResponse.data;
                console.log('✅ 푸시 토큰 발급 성공:', token);
            } catch (e) {
                console.log('❌ 토큰 발급 실패:', e);
            }
        } else {
            console.log('⚠️ 시뮬레이터 감지됨');
            token = 'MOCK_TOKEN_FOR_SIMULATOR_' + Platform.OS;
        }

        return token;
    }

    return { pushToken };
}