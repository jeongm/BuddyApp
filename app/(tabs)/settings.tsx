import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { Alert, Dimensions, Platform, Text as RNText, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText as Text } from '../../components/AppText';

import { memberApi } from "../../api/memberApi";
import { useAuthStore } from "../../store/useAuthStore";
import { useSettingStore } from "../../store/useSettingStore";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

// ✨ 기존의 깔끔한 안전 그림자 유지
const safeShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    android: { elevation: 2 },
});

export default function SettingsScreen() {
    const { user, logout } = useAuthStore();
    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const characters = [
        { seq: 1, name: "햄찌", img: require('../../assets/images/characters/Hamster.png') },
        { seq: 2, name: "폭스", img: require('../../assets/images/characters/Fox.png') },
        { seq: 3, name: "곰곰이", img: require('../../assets/images/characters/Bear.png') },
    ];
    const myCharacter = characters.find(c => c.seq === user?.characterSeq) || characters[0];

    // ✨ 공통 리스트 아이템 컴포넌트 (배경은 투명하게 두고 부모 Wrapper에서 회색 배경 처리)
    const SettingItem = ({ icon, title, subtitle, onPress, isLast, iconColor = "#64748B" }: any) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.6}
            className={`flex-row items-center justify-between px-5 py-4 ${!isLast ? 'border-b border-slate-200/60 dark:border-slate-700/60' : ''}`}
        >
            <View className="flex-row items-center gap-4">
                {/* ✨ 리스트 배경이 회색(slate-50)이므로, 아이콘 배경을 흰색(white)으로 주어 대비를 살림! */}
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

    const handleLogout = () => {
        Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
            { text: "취소", style: "cancel" },
            { text: "로그아웃", style: "destructive", onPress: () => { logout(); router.replace("/"); } }
        ]);
    };

    const handleDeleteAccount = () => {
        Alert.alert("회원 탈퇴", "모든 데이터가 삭제되며 복구할 수 없습니다.\n정말 탈퇴하시겠습니까?", [
            { text: "취소", style: "cancel" },
            {
                text: "탈퇴하기", style: "destructive", onPress: async () => {
                    try {
                        await memberApi.deleteAccount();
                        logout();
                        router.replace("/");
                    } catch (error) {
                        Alert.alert("오류", "탈퇴 처리에 실패했습니다.");
                    }
                }
            }
        ]);
    };

    return (
        // ✨ 전체 배경을 다시 흰색(bg-white)으로 원복!
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
            {/* ✨ 오리지널 헤더 완벽 복구 */}
            <View className="px-6 py-4 pb-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800/60">
                <RNText
                    className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight"
                    style={{ fontFamily: customFontFamily }}
                    allowFontScaling={false}
                >
                    Settings
                </RNText>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(80) }} showsVerticalScrollIndicator={false}>

                {/* 1. 상단 프로필 영역 */}
                <View className="items-center" style={{ paddingTop: scale(32), paddingBottom: scale(32) }}>
                    {/* ✨ 프로필 이미지 배경을 회색(slate-50)으로! */}
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-full items-center justify-center border border-slate-100 dark:border-slate-800/60" style={[{ width: scale(112), height: scale(112), marginBottom: scale(16) }, safeShadow]}>
                        <Image source={myCharacter.img} style={{ width: scale(84), height: scale(84) }} contentFit="contain" />
                    </View>
                    <Text className="font-black text-slate-900 dark:text-white tracking-tight mt-4" style={{ fontSize: scale(24) }} allowFontScaling={false}>
                        {user?.nickname}
                    </Text>
                    <Text className="font-medium text-slate-400 dark:text-slate-500 mt-1" style={{ fontSize: scale(14) }} allowFontScaling={false}>
                        {user?.email}
                    </Text>

                    <View className="bg-primary-50 dark:bg-primary-900/40 rounded-full border border-primary-100/50 dark:border-primary-800/50 mt-5" style={{ paddingHorizontal: scale(16), paddingVertical: scale(6) }}>
                        <Text className="font-extrabold tracking-wide text-primary-600 dark:text-primary-400 uppercase" style={{ fontSize: scale(12) }} allowFontScaling={false}>
                            단짝 버디 : {user?.characterNickname || myCharacter.name}
                        </Text>
                    </View>
                </View>

                {/* 2. 설정 리스트 그룹 */}
                <View style={{ paddingHorizontal: scale(20), gap: scale(24) }}>

                    {/* [그룹 1] 계정 관리 */}
                    <View>
                        <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Account</Text>
                        {/* ✨ 리스트 박스 배경을 회색(slate-50)으로! */}
                        <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>
                            <SettingItem
                                icon="person"
                                iconColor="#3B82F6"
                                title="내 정보"
                                subtitle="닉네임, 비밀번호 변경"
                                onPress={() => router.push('/settings/account')}
                                isLast
                            />
                        </View>
                    </View>

                    {/* [그룹 2] 버디 설정 */}
                    <View>
                        <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>My Buddy</Text>
                        <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>
                            <SettingItem
                                icon="paw"
                                iconColor="#F59E0B"
                                title="버디 프로필 설정"
                                subtitle="버디 종류 및 이름 변경"
                                onPress={() => router.push('/settings/buddy')}
                                isLast
                            />
                        </View>
                    </View>

                    {/* [그룹 3] 화면 설정 */}
                    <View>
                        <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Display & Color</Text>
                        <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>
                            <SettingItem
                                icon="color-palette"
                                iconColor="#8B5CF6"
                                title="테마 및 색상"
                                onPress={() => router.push('/settings/theme')}
                            />
                            <SettingItem
                                icon="text"
                                iconColor="#10B981"
                                title="글꼴 및 크기"
                                onPress={() => router.push('/settings/font')}
                                isLast
                            />
                        </View>
                    </View>

                    {/* [그룹 4] 앱 정보 */}
                    <View>
                        <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Information</Text>
                        <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>
                            <SettingItem
                                icon="notifications"
                                title="공지사항"
                                onPress={() => Alert.alert("알림", "준비 중인 기능입니다.")}
                            />
                            <SettingItem
                                icon="shield-checkmark"
                                title="개인정보 처리방침"
                                onPress={() => Alert.alert("알림", "준비 중인 기능입니다.")}
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

                    {/* [그룹 5] 위험 관리 영역 (간격 완벽 맞춤) */}
                    <View>
                        <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>
                            Account Actions
                        </Text>

                        <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>

                            {/* 로그아웃 */}
                            <TouchableOpacity onPress={handleLogout} activeOpacity={0.6} className="flex-row items-center justify-between px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/60">
                                <View className="flex-row items-center gap-4">
                                    <View className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 items-center justify-center" style={safeShadow}>
                                        <Ionicons name="log-out-outline" size={scale(18)} color="#64748B" />
                                    </View>
                                    <Text className="font-bold text-slate-700 dark:text-slate-300" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                        로그아웃
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* 회원 탈퇴 */}
                            <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.6} className="flex-row items-center justify-between px-5 py-4">
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
        </SafeAreaView>
    );
}