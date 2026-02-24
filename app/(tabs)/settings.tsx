import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
});

import { memberApi } from "../../api/memberApi";
import { IS_TEST_MODE } from "../../config";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore, type AccentColor } from "../../store/useThemeStore";

// ✨ 마법의 스케일링 함수
const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

export default function SettingsScreen() {
    const { user, logout, updateUserInfo } = useAuthStore();
    const { theme, setTheme, accent, setAccent } = useThemeStore();

    const [editingField, setEditingField] = useState<"nickname" | "buddyName" | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [selectedCharSeq, setSelectedCharSeq] = useState<number>(user?.characterSeq || 1);

    useEffect(() => {
        if (user?.characterSeq) setSelectedCharSeq(user.characterSeq);
    }, [user?.characterSeq]);

    const characters = [
        { seq: 1, name: "햄스터", img: require('../../assets/images/characters/Hamster.png') },
        { seq: 2, name: "여우", img: require('../../assets/images/characters/Fox.png') },
        { seq: 3, name: "판다", img: require('../../assets/images/characters/Panda.png') },
    ];

    const myCharacter = characters.find(c => c.seq === user?.characterSeq) || characters[0];
    const isCurrentChar = user?.characterSeq === selectedCharSeq;

    const handleCharacterSave = async () => {
        if (isCurrentChar) return;
        try {
            if (!IS_TEST_MODE) await memberApi.updateCharacter({ characterSeq: selectedCharSeq });
            updateUserInfo({ characterSeq: selectedCharSeq });
            Alert.alert("성공", "캐릭터가 변경되었습니다! 🎉");
        } catch (error) {
            Alert.alert("알림", "캐릭터 변경에 실패했습니다.");
        }
    };

    const handleEditStart = (field: "nickname" | "buddyName", currentVal: string) => {
        setEditingField(field);
        setInputValue(currentVal);
    };

    const handleEditSave = async () => {
        if (!inputValue.trim()) return setEditingField(null);
        try {
            if (editingField === "nickname") {
                if (!IS_TEST_MODE) await memberApi.updateNickname(inputValue);
                updateUserInfo({ nickname: inputValue });
            } else if (editingField === "buddyName") {
                if (!IS_TEST_MODE) await memberApi.updateCharacterName({ characterName: inputValue });
                updateUserInfo({ characterNickname: inputValue });
            }
            setEditingField(null);
        } catch (error) {
            Alert.alert("알림", "정보 수정에 실패했습니다.");
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert("회원 탈퇴", "정말 탈퇴하시겠습니까?\n모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.", [
            { text: "취소", style: "cancel" },
            {
                text: "탈퇴하기", style: "destructive",
                onPress: async () => {
                    try {
                        if (!IS_TEST_MODE) await memberApi.deleteAccount();
                        logout();
                        router.replace("/");
                    } catch (error) {
                        Alert.alert("오류", "회원 탈퇴 처리에 실패했습니다.");
                    }
                }
            }
        ]);
    };

    const handleLogout = () => {
        Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
            { text: "취소", style: "cancel" },
            { text: "확인", onPress: () => { logout(); router.replace("/"); } }
        ]);
    };

    const accentColors: { id: AccentColor; hex: string; label: string }[] = [
        { id: 'default', hex: '#64748B', label: '모노' },
        { id: 'violet', hex: '#8B5CF6', label: '바이올렛' },
        { id: 'rose', hex: '#F43F5E', label: '로즈' },
        { id: 'blue', hex: '#3B82F6', label: '블루' },
        { id: 'green', hex: '#22C55E', label: '그린' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>

            {/* ✨ 메인 탭 방어막: 스와이프 뒤로가기 완벽 차단! */}
            <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

            {/* ✨ 헤더 타이틀 (다른 탭들과 동일한 안정적인 규격) */}
            <View className="px-6 py-4 pb-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800/60">
                <Text className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight" allowFontScaling={false}>
                    Settings
                </Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(120) }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* 1. 상단 프로필 영역 */}
                <View className="items-center" style={{ paddingTop: scale(40), paddingBottom: scale(40) }}>
                    <View className="rounded-full bg-slate-50 dark:bg-slate-900 items-center justify-center border border-slate-100 dark:border-slate-800/60 shadow-sm" style={{ width: scale(112), height: scale(112), marginBottom: scale(20) }}>
                        <Image source={myCharacter.img} style={{ width: scale(84), height: scale(84) }} contentFit="contain" />
                    </View>
                    <Text className="font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(24), marginBottom: scale(4) }} allowFontScaling={false}>{user?.nickname}</Text>
                    <Text className="font-medium text-slate-400 dark:text-slate-500" style={{ fontSize: scale(14), marginBottom: scale(16) }} allowFontScaling={false}>{user?.email}</Text>

                    <View className="bg-primary-50 dark:bg-primary-900/40 rounded-full border border-primary-100/50 dark:border-primary-800/50" style={{ paddingHorizontal: scale(16), paddingVertical: scale(6) }}>
                        <Text className="font-extrabold tracking-wide text-primary-600 dark:text-primary-400 uppercase" style={{ fontSize: scale(12) }} allowFontScaling={false}>
                            단짝 버디 : {user?.characterNickname || myCharacter.name}
                        </Text>
                    </View>
                </View>

                {/* 2. 내 정보 수정 영역 */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(32) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest" style={{ fontSize: scale(12), marginLeft: scale(16), marginBottom: scale(8) }} allowFontScaling={false}>Profile Info</Text>

                    <View className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 overflow-hidden" style={{ borderRadius: scale(24) }}>
                        {/* 닉네임 수정 */}
                        <View className="flex-row items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50" style={{ paddingHorizontal: scale(20), paddingVertical: scale(16) }}>
                            <Text className="font-bold text-slate-700 dark:text-slate-300" style={{ fontSize: scale(15), width: scale(80) }} allowFontScaling={false}>내 닉네임</Text>
                            {editingField === "nickname" ? (
                                <View className="flex-row items-center flex-1 justify-end" style={{ gap: scale(12) }}>
                                    <TextInput autoFocus className="flex-1 text-right font-bold text-slate-900 dark:text-white border-b border-primary-500/50" style={{ fontSize: scale(15), paddingVertical: scale(4) }} value={inputValue} onChangeText={setInputValue} onSubmitEditing={handleEditSave} allowFontScaling={false} />
                                    <TouchableOpacity onPress={handleEditSave} className="bg-primary-600 rounded-full" style={{ paddingHorizontal: scale(12), paddingVertical: scale(6) }}>
                                        <Text className="text-white font-extrabold tracking-wide" style={{ fontSize: scale(11) }} allowFontScaling={false}>저장</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => handleEditStart("nickname", user?.nickname || "")} className="flex-row items-center flex-1 justify-end" style={{ gap: scale(8) }} activeOpacity={0.6}>
                                    <Text className="font-medium text-slate-500 dark:text-slate-400" style={{ fontSize: scale(15) }} allowFontScaling={false}>{user?.nickname}</Text>
                                    <Ionicons name="chevron-forward" size={scale(16)} color="#CBD5E1" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* 버디 이름 수정 */}
                        <View className="flex-row items-center justify-between" style={{ paddingHorizontal: scale(20), paddingVertical: scale(16) }}>
                            <Text className="font-bold text-slate-700 dark:text-slate-300" style={{ fontSize: scale(15), width: scale(80) }} allowFontScaling={false}>버디 이름</Text>
                            {editingField === "buddyName" ? (
                                <View className="flex-row items-center flex-1 justify-end" style={{ gap: scale(12) }}>
                                    <TextInput autoFocus className="flex-1 text-right font-bold text-slate-900 dark:text-white border-b border-primary-500/50" style={{ fontSize: scale(15), paddingVertical: scale(4) }} value={inputValue} onChangeText={setInputValue} onSubmitEditing={handleEditSave} allowFontScaling={false} />
                                    <TouchableOpacity onPress={handleEditSave} className="bg-primary-600 rounded-full" style={{ paddingHorizontal: scale(12), paddingVertical: scale(6) }}>
                                        <Text className="text-white font-extrabold tracking-wide" style={{ fontSize: scale(11) }} allowFontScaling={false}>저장</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => handleEditStart("buddyName", user?.characterNickname || "")} className="flex-row items-center flex-1 justify-end" style={{ gap: scale(8) }} activeOpacity={0.6}>
                                    <Text className="font-medium text-slate-500 dark:text-slate-400" style={{ fontSize: scale(15) }} allowFontScaling={false}>{user?.characterNickname}</Text>
                                    <Ionicons name="chevron-forward" size={scale(16)} color="#CBD5E1" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>

                {/* 3. 디스플레이 & 테마 */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(40) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest" style={{ fontSize: scale(12), marginLeft: scale(16), marginBottom: scale(8) }} allowFontScaling={false}>Display & Color</Text>

                    <View className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 overflow-hidden" style={{ borderRadius: scale(24), paddingHorizontal: scale(20), paddingVertical: scale(24) }}>
                        <View className="flex-row bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl" style={{ padding: scale(6), marginBottom: scale(32) }}>
                            {[{ id: 'system', label: '기기 설정' }, { id: 'light', label: '라이트' }, { id: 'dark', label: '다크' }].map((t) => {
                                const isSelected = theme === t.id;
                                if (isSelected) {
                                    return (
                                        <View key={t.id} className="flex-1 rounded-xl items-center justify-center bg-white dark:bg-slate-700 shadow-sm" style={{ paddingVertical: scale(12) }}>
                                            <Text className="tracking-tight font-extrabold text-slate-900 dark:text-white" style={{ fontSize: scale(13) }} allowFontScaling={false}>{t.label}</Text>
                                        </View>
                                    );
                                }
                                return (
                                    <TouchableOpacity
                                        key={t.id}
                                        onPress={() => setTimeout(() => setTheme(t.id as any), 50)}
                                        activeOpacity={0.8}
                                        className="flex-1 rounded-xl items-center justify-center bg-transparent"
                                        style={{ paddingVertical: scale(12) }}
                                    >
                                        <Text className="tracking-tight font-bold text-slate-500 dark:text-slate-400" style={{ fontSize: scale(13) }} allowFontScaling={false}>{t.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View className="flex-row justify-between items-center" style={{ paddingHorizontal: scale(8) }}>
                            {accentColors.map((color) => {
                                const isSelected = accent === color.id;
                                return (
                                    <TouchableOpacity
                                        key={color.id}
                                        onPress={() => setTimeout(() => setAccent(color.id), 50)}
                                        activeOpacity={0.8}
                                        className="items-center"
                                        style={{ gap: scale(8) }}
                                    >
                                        <View className={`rounded-full items-center justify-center transition-all duration-300 ${isSelected ? 'scale-110 shadow-md' : 'scale-100'}`} style={{ width: scale(40), height: scale(40), backgroundColor: color.hex, opacity: isSelected ? 1 : 0.3 }}>
                                            {isSelected && <Ionicons name="checkmark" size={scale(20)} color="white" />}
                                        </View>
                                        <Text className={`font-extrabold tracking-wide ${isSelected ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`} style={{ fontSize: scale(10) }} allowFontScaling={false}>{color.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* 4. 캐릭터 변경 */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(40) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest" style={{ fontSize: scale(12), marginLeft: scale(16), marginBottom: scale(8) }} allowFontScaling={false}>Select Buddy</Text>

                    <View className="flex-row justify-between" style={{ marginBottom: scale(24) }}>
                        {characters.map((char) => {
                            const isSelected = selectedCharSeq === char.seq;
                            return (
                                <TouchableOpacity
                                    key={char.seq}
                                    onPress={() => setSelectedCharSeq(char.seq)}
                                    activeOpacity={0.7}
                                    className={`items-center justify-center border-2 transition-all duration-300 ${isSelected ? "bg-primary-50 dark:bg-primary-900/40 border-primary-500" : "bg-slate-50 dark:bg-slate-900 border-transparent opacity-60"}`}
                                    style={{ width: '31%', aspectRatio: 1, borderRadius: scale(24) }}
                                >
                                    <Image source={char.img} style={{ width: scale(56), height: scale(56), marginBottom: scale(8) }} contentFit="contain" />
                                    <Text className={`font-extrabold ${isSelected ? "text-primary-600 dark:text-primary-400" : "text-slate-500 dark:text-slate-400"}`} style={{ fontSize: scale(11) }} allowFontScaling={false}>{char.name}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {isCurrentChar ? (
                        <View className="w-full rounded-2xl items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60" style={{ paddingVertical: scale(16) }}>
                            <Text className="font-extrabold text-slate-400 dark:text-slate-500" style={{ fontSize: scale(13) }} allowFontScaling={false}>현재 함께하고 있는 버디입니다</Text>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={handleCharacterSave} className="w-full rounded-2xl items-center justify-center bg-primary-600 active:opacity-80 shadow-sm shadow-primary-300 dark:shadow-none" style={{ paddingVertical: scale(16) }}>
                            <Text className="font-extrabold tracking-wide text-white" style={{ fontSize: scale(13) }} allowFontScaling={false}>이 버디로 변경하기</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* 5. 계정 관리 */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(24) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest" style={{ fontSize: scale(12), marginLeft: scale(16), marginBottom: scale(8) }} allowFontScaling={false}>Account</Text>

                    <View className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 overflow-hidden" style={{ borderRadius: scale(24) }}>
                        <TouchableOpacity onPress={handleLogout} activeOpacity={0.6} className="flex-row items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50" style={{ paddingHorizontal: scale(20), paddingVertical: scale(16) }}>
                            <Text className="font-bold text-slate-700 dark:text-slate-300" style={{ fontSize: scale(15) }} allowFontScaling={false}>로그아웃</Text>
                            <Ionicons name="log-out-outline" size={scale(20)} color="#94A3B8" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.6} className="flex-row items-center justify-between" style={{ paddingHorizontal: scale(20), paddingVertical: scale(16) }}>
                            <Text className="font-bold text-red-500 dark:text-red-400" style={{ fontSize: scale(15) }} allowFontScaling={false}>회원 탈퇴</Text>
                            <Ionicons name="warning-outline" size={scale(20)} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="items-center opacity-30" style={{ marginTop: scale(24), marginBottom: scale(40) }}>
                    <Text className="text-slate-500 font-extrabold tracking-widest uppercase" style={{ fontSize: scale(10), marginBottom: scale(4) }} allowFontScaling={false}>My Buddy</Text>
                    <Text className="text-slate-500 font-bold tracking-wider" style={{ fontSize: scale(9) }} allowFontScaling={false}>Version 1.0.0</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}