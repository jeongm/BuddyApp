import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
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

export default function SettingsScreen() {
    const { user, logout, updateUserInfo } = useAuthStore();

    // ✨ 상태 관리는 100% 안전한 기존 방식(Zustand)만 사용!
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
                        router.replace("/auth/login");
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
            { text: "확인", onPress: () => { logout(); router.replace("/auth/login"); } }
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
            <View className="px-6 py-4 pb-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-10 border-b border-slate-100 dark:border-slate-800/60">
                <Text className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Settings
                </Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

                {/* 1. 히어로 프로필 */}
                <View className="items-center pt-10 pb-10">
                    <View className="w-28 h-28 rounded-full bg-slate-50 dark:bg-slate-900 items-center justify-center border border-slate-100 dark:border-slate-800/60 shadow-sm mb-5">
                        <Image source={myCharacter.img} style={{ width: 84, height: 84 }} contentFit="contain" />
                    </View>
                    <Text className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">{user?.nickname}</Text>
                    <Text className="text-sm font-medium text-slate-400 dark:text-slate-500 mb-4">{user?.email}</Text>

                    <View className="bg-primary-50 dark:bg-primary-900/40 px-4 py-1.5 rounded-full border border-primary-100/50 dark:border-primary-800/50">
                        <Text className="text-xs font-extrabold tracking-wide text-primary-600 dark:text-primary-400 uppercase">
                            단짝 버디 : {user?.characterNickname || myCharacter.name}
                        </Text>
                    </View>
                </View>

                {/* 2. 일반 설정 (애플 Inset Grouped 박스) */}
                <View className="px-5 mb-8">
                    <Text className="text-[12px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2">Profile Info</Text>

                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 overflow-hidden">
                        <View className="px-5 py-4 flex-row items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
                            <Text className="text-[15px] font-bold text-slate-700 dark:text-slate-300 w-24">내 닉네임</Text>
                            {editingField === "nickname" ? (
                                <View className="flex-row items-center flex-1 justify-end gap-3">
                                    <TextInput autoFocus className="flex-1 text-right text-[15px] font-bold text-slate-900 dark:text-white border-b border-primary-500/50 py-1" value={inputValue} onChangeText={setInputValue} onSubmitEditing={handleEditSave} />
                                    <TouchableOpacity onPress={handleEditSave} className="bg-primary-600 px-3 py-1.5 rounded-full"><Text className="text-white text-[11px] font-extrabold tracking-wide">저장</Text></TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => handleEditStart("nickname", user?.nickname || "")} className="flex-row items-center flex-1 justify-end gap-2" activeOpacity={0.6}>
                                    <Text className="text-[15px] font-medium text-slate-500 dark:text-slate-400">{user?.nickname}</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View className="px-5 py-4 flex-row items-center justify-between">
                            <Text className="text-[15px] font-bold text-slate-700 dark:text-slate-300 w-24">버디 이름</Text>
                            {editingField === "buddyName" ? (
                                <View className="flex-row items-center flex-1 justify-end gap-3">
                                    <TextInput autoFocus className="flex-1 text-right text-[15px] font-bold text-slate-900 dark:text-white border-b border-primary-500/50 py-1" value={inputValue} onChangeText={setInputValue} onSubmitEditing={handleEditSave} />
                                    <TouchableOpacity onPress={handleEditSave} className="bg-primary-600 px-3 py-1.5 rounded-full"><Text className="text-white text-[11px] font-extrabold tracking-wide">저장</Text></TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => handleEditStart("buddyName", user?.characterNickname || "")} className="flex-row items-center flex-1 justify-end gap-2" activeOpacity={0.6}>
                                    <Text className="text-[15px] font-medium text-slate-500 dark:text-slate-400">{user?.characterNickname}</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>

                {/* 3. 디스플레이 & 테마 */}
                <View className="px-5 mb-10">
                    <Text className="text-[12px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2">Display & Color</Text>

                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 overflow-hidden px-5 py-6">
                        <View className="flex-row bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl mb-8">
                            {[{ id: 'system', label: '기기 설정' }, { id: 'light', label: '라이트' }, { id: 'dark', label: '다크' }].map((t) => {
                                const isSelected = theme === t.id;
                                if (isSelected) {
                                    return (
                                        <View key={t.id} className="flex-1 py-3 rounded-xl items-center justify-center bg-white dark:bg-slate-700 shadow-sm">
                                            <Text className="text-[13px] tracking-tight font-extrabold text-slate-900 dark:text-white">{t.label}</Text>
                                        </View>
                                    );
                                }
                                return (
                                    <TouchableOpacity
                                        key={t.id}
                                        // ✨ 에러를 유발하던 코드를 빼고 안전하게 기존 상태만 업데이트합니다!
                                        onPress={() => setTheme(t.id as any)}
                                        activeOpacity={0.8}
                                        className="flex-1 py-3 rounded-xl items-center justify-center bg-transparent"
                                    >
                                        <Text className="text-[13px] tracking-tight font-bold text-slate-500 dark:text-slate-400">{t.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View className="flex-row justify-between items-center px-2">
                            {accentColors.map((color) => {
                                const isSelected = accent === color.id;
                                return (
                                    <TouchableOpacity key={color.id} onPress={() => setAccent(color.id)} activeOpacity={0.8} className="items-center gap-2">
                                        <View className={`w-10 h-10 rounded-full items-center justify-center transition-all duration-300 ${isSelected ? 'scale-110 shadow-md' : 'scale-100'}`} style={{ backgroundColor: color.hex, opacity: isSelected ? 1 : 0.3 }}>
                                            {isSelected && <Ionicons name="checkmark" size={20} color="white" />}
                                        </View>
                                        <Text className={`text-[10px] font-extrabold tracking-wide ${isSelected ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>{color.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* 4. 캐릭터 변경 */}
                <View className="px-5 mb-10">
                    <Text className="text-[12px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2">Select Buddy</Text>

                    <View className="flex-row justify-between mb-6">
                        {characters.map((char) => {
                            const isSelected = selectedCharSeq === char.seq;
                            return (
                                <TouchableOpacity
                                    key={char.seq}
                                    onPress={() => setSelectedCharSeq(char.seq)}
                                    activeOpacity={0.7}
                                    className={`w-[30%] aspect-square rounded-[2rem] items-center justify-center border-2 transition-all duration-300 ${isSelected
                                            ? "bg-primary-50 dark:bg-primary-900/40 border-primary-500"
                                            : "bg-slate-50 dark:bg-slate-900 border-transparent opacity-60"
                                        }`}
                                >
                                    <Image source={char.img} style={{ width: 56, height: 56, marginBottom: 8 }} contentFit="contain" />
                                    <Text className={`text-[11px] font-extrabold ${isSelected ? "text-primary-600 dark:text-primary-400" : "text-slate-500 dark:text-slate-400"}`}>{char.name}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {isCurrentChar ? (
                        <View className="w-full py-4 rounded-2xl items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60">
                            <Text className="font-extrabold text-[13px] text-slate-400 dark:text-slate-500">현재 함께하고 있는 버디입니다</Text>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={handleCharacterSave} className="w-full py-4 rounded-2xl items-center justify-center bg-primary-600 active:opacity-80 shadow-sm shadow-primary-300 dark:shadow-none">
                            <Text className="font-extrabold text-[13px] tracking-wide text-white">이 버디로 변경하기</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* 5. 계정 관리 */}
                <View className="px-5 mb-6">
                    <Text className="text-[12px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2">Account</Text>

                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 overflow-hidden">
                        <TouchableOpacity onPress={handleLogout} activeOpacity={0.6} className="px-5 py-4 flex-row items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
                            <Text className="text-[15px] font-bold text-slate-700 dark:text-slate-300">로그아웃</Text>
                            <Ionicons name="log-out-outline" size={20} color="#94A3B8" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.6} className="px-5 py-4 flex-row items-center justify-between">
                            <Text className="text-[15px] font-bold text-red-500 dark:text-red-400">회원 탈퇴</Text>
                            <Ionicons name="warning-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="items-center mt-6 mb-10 opacity-30">
                    <Text className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase mb-1">My Buddy</Text>
                    <Text className="text-[9px] text-slate-500 font-bold tracking-wider">Version 1.0.0</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}