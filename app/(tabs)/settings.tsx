import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Dimensions, Modal, Platform, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { memberApi } from "../../api/memberApi";
import { AppText, AppText as Text } from '../../components/AppText';
import { useAuthStore } from "../../store/useAuthStore";
import { useSettingStore } from "../../store/useSettingStore";
import { ACCENT_HEX_COLORS, useThemeStore } from "../../store/useThemeStore";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const safeShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    android: { elevation: 2 },
});

export default function SettingsScreen() {
    const router = useRouter();
    const { user, logout, refreshUser } = useAuthStore();
    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const { accent } = useThemeStore();
    const accentHex = ACCENT_HEX_COLORS[accent];

    // ✅ 모달 상태 관리 추가
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useFocusEffect(
        useCallback(() => {
            refreshUser();
        }, [refreshUser])
    );

    const characters = [
        { seq: 1, name: "햄찌", img: require('../../assets/images/characters/Hamster.webp') },
        { seq: 2, name: "폭스", img: require('../../assets/images/characters/Fox.webp') },
        { seq: 3, name: "곰곰이", img: require('../../assets/images/characters/Bear.webp') },
    ];
    const myCharacter = characters.find(c => c.seq === user?.characterId) || characters[0];

    // [컴포넌트] 공통 리스트 아이템
    const SettingItem = ({ icon, title, subtitle, onPress, isLast, iconColor = "#64748B" }: any) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.6}
            className={`flex-row items-center justify-between px-5 py-4 ${!isLast ? 'border-b border-slate-200/60 dark:border-slate-700/60' : ''}`}
        >
            <View className="flex-row items-center gap-4">
                <View className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 items-center justify-center" style={safeShadow}>
                    <Ionicons name={icon} size={scale(18)} color={iconColor} />
                </View>
                <View>
                    <Text className="font-bold text-slate-800 dark:text-slate-200" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text className="font-medium text-slate-400 dark:text-slate-500 mt-0.5" style={{ fontSize: scale(12) }} allowFontScaling={false}>
                            {subtitle}
                        </Text>
                    )}
                </View>
            </View>
            <Ionicons name="chevron-forward" size={scale(18)} color="#CBD5E1" />
        </TouchableOpacity>
    );

    // [로직] 로그아웃 실행
    const confirmLogout = () => {
        setShowLogoutModal(false);
        logout();
        router.replace("/");
    };

    // [로직] 회원 탈퇴 실행
    const confirmDeleteAccount = async () => {
        setShowDeleteModal(false);
        try {
            const provider = (user as any)?.providerType;
            const socialToken = (user as any)?.socialAccessToken || "";

            // 소셜별 추가 로그아웃 처리 공간 (필요시 활성화)
            if (provider === 'GOOGLE') {
                // await GoogleSignin.revokeAccess();
            } else if (provider === 'NAVER') {
                // await NaverLogin.deleteToken();
            }

            // 백엔드 탈퇴 API 호출
            await memberApi.deleteAccount({ socialAccessToken: socialToken });

            logout();
            Alert.alert("탈퇴 완료", "그동안 버디를 이용해 주셔서 감사합니다.");
            router.replace("/");
        } catch (error: any) {
            Alert.alert("오류", error.response?.data?.message || "탈퇴 처리에 실패했습니다.");
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>

            {/* 헤더 영역 */}
            <View className="px-6 py-4 pb-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800/60">
                <AppText
                    className="font-extrabold text-slate-900 dark:text-white tracking-tight"
                    style={{ fontSize: 26, lineHeight: 36, fontFamily: customFontFamily }}
                    allowFontScaling={false}
                >
                    Setting
                </AppText>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(80) }} showsVerticalScrollIndicator={false}>

                {/* 1. 프로필 영역 */}
                <View className="items-center" style={{ paddingTop: scale(28), paddingBottom: scale(24) }}>
                    <View className="relative mb-2">
                        <View className="bg-slate-50 dark:bg-slate-800 rounded-full items-center justify-center border border-slate-100 dark:border-slate-700/60" style={[{ width: scale(96), height: scale(96) }, safeShadow]}>
                            <Image source={myCharacter.img} style={{ width: scale(72), height: scale(72) }} contentFit="contain" />
                        </View>
                        <View
                            className="absolute -bottom-2.5 self-center rounded-full border-[3.5px] border-white dark:border-slate-950"
                            style={{ backgroundColor: accentHex, paddingHorizontal: scale(10), paddingVertical: scale(3) }}
                        >
                            <Text className="text-white font-black tracking-widest uppercase" style={{ fontSize: scale(9.5) }} allowFontScaling={false}>
                                Buddy : {user?.characterNickname || myCharacter.name}
                            </Text>
                        </View>
                    </View>
                    <View className="items-center" style={{ marginTop: scale(16) }}>
                        <Text className="font-black text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(22) }} allowFontScaling={false}>
                            {user?.nickname}
                        </Text>
                        <Text className="font-medium text-slate-400 dark:text-slate-500 mt-0.5" style={{ fontSize: scale(13) }} allowFontScaling={false}>
                            {user?.email}
                        </Text>
                    </View>
                </View>

                {/* 2. 설정 메뉴 리스트 영역 */}
                <View style={{ paddingHorizontal: scale(20), gap: scale(24) }}>

                    {/* [Account] */}
                    <View>
                        <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Account</Text>
                        <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>
                            <SettingItem icon="person" iconColor="#3B82F6" title="내 정보" subtitle="닉네임, 비밀번호 변경" onPress={() => router.push('/settings/account')} isLast />
                        </View>
                    </View>

                    {/* [My Buddy] */}
                    <View>
                        <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>My Buddy</Text>
                        <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>
                            <SettingItem icon="paw" iconColor="#F59E0B" title="버디 프로필 설정" subtitle="버디 종류 및 이름 변경" onPress={() => router.push('/settings/buddy')} isLast />
                        </View>
                    </View>

                    {/* [Display & Color] */}
                    <View>
                        <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Display & Color</Text>
                        <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>
                            <SettingItem icon="color-palette" iconColor="#8B5CF6" title="테마 및 색상" onPress={() => router.push('/settings/theme')} />
                            <SettingItem icon="text" iconColor="#10B981" title="글꼴 및 크기" onPress={() => router.push('/settings/font')} isLast />
                        </View>
                    </View>

                    {/* [Notification] */}
                    <View>
                        <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Notification</Text>
                        <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>
                            <SettingItem icon="notifications" iconColor="#EC4899" title="알림 설정" subtitle="야간, 데일리, 마케팅 알림" onPress={() => router.push('/settings/notification')} isLast />
                        </View>
                    </View>

                    {/* [Information] */}
                    <View>
                        <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Information</Text>
                        <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>
                            <SettingItem icon="megaphone" title="공지사항" onPress={() => Alert.alert("알림", "준비 중인 기능입니다.")} />
                            <SettingItem
                                icon="shield-checkmark"
                                title="개인정보 처리방침"
                                onPress={() => router.push('/settings/privacy')}  // ← Alert → router.push로 변경
                            />
                            <TouchableOpacity activeOpacity={1} className="flex-row items-center justify-between px-5 py-4">
                                <View className="flex-row items-center gap-4">
                                    <View className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 items-center justify-center" style={safeShadow}>
                                        <Ionicons name="information-circle" size={scale(18)} color="#64748B" />
                                    </View>
                                    <Text className="font-bold text-slate-800 dark:text-slate-200" style={{ fontSize: scale(15) }} allowFontScaling={false}>버전 정보</Text>
                                </View>
                                <Text className="font-bold text-slate-400" style={{ fontSize: scale(13) }} allowFontScaling={false}>1.0.0</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* [Account Actions] */}
                    <View>
                        <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Account Actions</Text>
                        <View className="bg-slate-50 dark:bg-slate-950 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>
                            {/* ✅ 모달 오픈 함수로 변경 */}
                            <TouchableOpacity onPress={() => setShowLogoutModal(true)} activeOpacity={0.6} className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/60">
                                <View className="flex-row items-center gap-4">
                                    <View className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 items-center justify-center" style={safeShadow}>
                                        <Ionicons name="log-out-outline" size={scale(18)} color="#64748B" />
                                    </View>
                                    <Text className="font-bold text-slate-700 dark:text-slate-300" style={{ fontSize: scale(15) }} allowFontScaling={false}>로그아웃</Text>
                                </View>
                            </TouchableOpacity>

                            {/* ✅ 모달 오픈 함수로 변경 */}
                            <TouchableOpacity onPress={() => setShowDeleteModal(true)} activeOpacity={0.6} className="flex-row items-center justify-between px-5 py-4">
                                <View className="flex-row items-center gap-4">
                                    <View className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-900/30 items-center justify-center">
                                        <Ionicons name="warning" size={scale(18)} color="#F43F5E" />
                                    </View>
                                    <Text className="font-bold text-rose-500 dark:text-rose-400" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                        회원 탈퇴
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>
            </ScrollView>

            {/* ✨ 1. 로그아웃 확인 모달 ✨ */}
            <Modal visible={showLogoutModal} transparent={true} animationType="fade">
                <View className="flex-1 justify-center items-center bg-black/60 px-6">
                    <View className="bg-white dark:bg-slate-900 w-full rounded-[2rem] p-8 items-center" style={safeShadow}>
                        <View className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mb-5">
                            <Ionicons name="log-out-outline" size={scale(32)} color="#64748B" />
                        </View>
                        <Text className="font-black text-slate-900 dark:text-white text-center mb-2" style={{ fontSize: scale(22) }} allowFontScaling={false}>
                            로그아웃 하시겠어요?
                        </Text>
                        <Text className="font-medium text-slate-500 dark:text-slate-400 text-center mb-8" style={{ fontSize: scale(14), lineHeight: scale(22) }} allowFontScaling={false}>
                            언제든 다시 돌아오실 수 있어요!
                        </Text>
                        <View className="w-full" style={{ gap: scale(10) }}>
                            <TouchableOpacity onPress={confirmLogout} activeOpacity={0.8} className="w-full bg-slate-900 dark:bg-white rounded-2xl items-center justify-center" style={{ height: scale(56) }}>
                                <Text className="font-extrabold text-white dark:text-slate-900" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                    네, 로그아웃 할게요
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowLogoutModal(false)} activeOpacity={0.8} className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl items-center justify-center" style={{ height: scale(56) }}>
                                <Text className="font-bold text-slate-500 dark:text-slate-400" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                    취소
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ✨ 2. 회원 탈퇴 확인 모달 ✨ */}
            <Modal visible={showDeleteModal} transparent={true} animationType="fade">
                <View className="flex-1 justify-center items-center bg-black/60 px-6">
                    <View className="bg-white dark:bg-slate-900 w-full rounded-[2rem] p-8 items-center" style={safeShadow}>
                        {/* 탈퇴 모달은 경고 느낌을 주기 위해 빨간색 포인트 사용 */}
                        <View className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 rounded-full items-center justify-center mb-5">
                            <Ionicons name="warning" size={scale(32)} color="#F43F5E" />
                        </View>
                        <Text className="font-black text-slate-900 dark:text-white text-center mb-3" style={{ fontSize: scale(22) }} allowFontScaling={false}>
                            정말 탈퇴하시겠어요?
                        </Text>
                        <Text className="font-medium text-slate-500 dark:text-slate-400 text-center mb-8" style={{ fontSize: scale(14), lineHeight: scale(22) }} allowFontScaling={false}>
                            모든 데이터가 삭제되며,{'\n'}절대 복구할 수 없어요.
                        </Text>
                        <View className="w-full" style={{ gap: scale(10) }}>
                            {/* 위험한 작업이므로 메인 버튼도 붉은색 톤으로 적용 */}
                            <TouchableOpacity onPress={confirmDeleteAccount} activeOpacity={0.8} className="w-full bg-rose-500 dark:bg-rose-600 rounded-2xl items-center justify-center" style={{ height: scale(56) }}>
                                <Text className="font-extrabold text-white" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                    네, 탈퇴할게요
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowDeleteModal(false)} activeOpacity={0.8} className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl items-center justify-center" style={{ height: scale(56) }}>
                                <Text className="font-bold text-slate-500 dark:text-slate-400" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                    취소
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}