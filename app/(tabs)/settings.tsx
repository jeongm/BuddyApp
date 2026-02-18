import { useFocusEffect, useRouter } from "expo-router";
import { ChevronRight, Info, Shield, User, X } from 'lucide-react-native';
import React, { useCallback, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from "react-native-safe-area-context";

// ✅ 우리가 만든 커스텀 UI 컴포넌트 가져오기
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { storage, UserSettings } from '../../utils/storage';

export default function SettingsScreen() {
    const router = useRouter();

    // --- State ---
    const [settings, setSettings] = useState<UserSettings>({
        nickname: "사용자",
        characterName: "버디",
        themeColor: "#7C3AED"
    });

    const [modalType, setModalType] = useState<"nickname" | "character" | "color" | "logout" | "delete" | null>(null);
    const [tempValue, setTempValue] = useState("");

    const themeColors = [
        { name: "보라", color: "#7C3AED" },
        { name: "초록", color: "#22C55E" },
        { name: "파랑", color: "#3B82F6" },
        { name: "분홍", color: "#EC4899" },
        { name: "주황", color: "#F97316" },
        { name: "빨강", color: "#EF4444" },
    ];

    // --- 초기 데이터 로드 ---
    useFocusEffect(
        useCallback(() => {
            const loadSettings = async () => {
                const data = await storage.getSettings();
                if (data) setSettings(data);
            };
            loadSettings();
        }, [])
    );

    // --- 핸들러 ---
    const openModal = (type: "nickname" | "character" | "color" | "logout" | "delete") => {
        if (type === "nickname") setTempValue(settings.nickname);
        if (type === "character") setTempValue(settings.characterName);
        if (type === "color") setTempValue(settings.themeColor);
        setModalType(type);
    };

    const closeModal = () => {
        setModalType(null);
        setTempValue("");
    };

    const handleSave = async () => {
        let newSettings = { ...settings };

        if (modalType === "nickname") {
            newSettings.nickname = tempValue;
        } else if (modalType === "character") {
            newSettings.characterName = tempValue;
        } else if (modalType === "color") {
            newSettings.themeColor = tempValue;
        } else if (modalType === "logout") {
            router.replace("/");
            return;
        } else if (modalType === "delete") {
            await storage.clearAll();
            router.replace("/");
            return;
        }

        setSettings(newSettings);
        await storage.saveSettings(newSettings);
        closeModal();
    };

    // --- 내부 컴포넌트: 설정 메뉴 아이템 ---
    // Button 컴포넌트의 variant="ghost"를 활용해도 되지만, 
    // 양쪽 정렬(justify-between)을 위해 커스텀 TouchableOpacity를 사용하되 스타일은 통일합니다.
    const MenuItem = ({ label, value, onPress, isDestructive = false, showColor = false, colorValue = "" }: any) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-3 mb-1 rounded-xl active:bg-gray-50"
        >
            <Text className={`text-[15px] font-medium ${isDestructive ? 'text-red-500' : 'text-gray-700'}`}>
                {label}
            </Text>
            <View className="flex-row items-center gap-2">
                {showColor && (
                    <View
                        className="w-5 h-5 rounded-full border border-gray-200"
                        style={{ backgroundColor: colorValue }}
                    />
                )}
                {value && <Text className="text-sm text-gray-400">{value}</Text>}
                <ChevronRight size={18} color="#D1D5DB" />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={['top']}>
            {/* Header */}
            <View className="px-5 py-4 bg-white border-b border-gray-100">
                <Text className="text-xl font-bold text-gray-900">설정</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>

                {/* Profile Section */}
                <View className="items-center mb-8">
                    <View className="w-24 h-24 rounded-full bg-purple-50 items-center justify-center mb-4 border border-purple-100">
                        <User size={40} color="#7C3AED" />
                    </View>
                    <Text className="text-xl font-bold text-gray-900">{settings.nickname}</Text>
                    <Text className="text-sm text-gray-500 mt-1">{settings.characterName}와 함께하는 중</Text>
                </View>

                {/* 1. 내 정보 관리 (Card 컴포넌트 사용!) */}
                <View className="mb-6">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <View className="px-4 py-3 border-b border-gray-50 flex-row items-center gap-2">
                            <User size={18} color="#6B7280" />
                            <CardTitle className="text-sm text-gray-500">내 정보 관리</CardTitle>
                        </View>
                        <CardContent className="p-2">
                            <MenuItem label="닉네임 변경" value={settings.nickname} onPress={() => openModal("nickname")} />
                            <MenuItem label="캐릭터 별명 변경" value={settings.characterName} onPress={() => openModal("character")} />
                            <MenuItem label="테마 색상 변경" showColor colorValue={settings.themeColor} onPress={() => openModal("color")} />
                        </CardContent>
                    </Card>
                </View>

                {/* 2. 계정 관리 (Card 컴포넌트 사용!) */}
                <View className="mb-6">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <View className="px-4 py-3 border-b border-gray-50 flex-row items-center gap-2">
                            <Shield size={18} color="#6B7280" />
                            <CardTitle className="text-sm text-gray-500">계정 관리</CardTitle>
                        </View>
                        <CardContent className="p-2">
                            <MenuItem label="로그아웃" onPress={() => openModal("logout")} />
                            <MenuItem label="회원 탈퇴" isDestructive onPress={() => openModal("delete")} />
                        </CardContent>
                    </Card>
                </View>

                {/* 3. 서비스 정보 (Card 컴포넌트 사용!) */}
                <View className="mb-6">
                    <Card className="bg-white border-gray-100 shadow-sm">
                        <View className="px-4 py-3 border-b border-gray-50 flex-row items-center gap-2">
                            <Info size={18} color="#6B7280" />
                            <CardTitle className="text-sm text-gray-500">서비스 정보</CardTitle>
                        </View>
                        <CardContent className="p-2">
                            <MenuItem label="버전 정보" value="1.0.0" onPress={() => { }} />
                            <MenuItem label="이용약관" onPress={() => { }} />
                            <MenuItem label="개인정보 처리방침" onPress={() => { }} />
                        </CardContent>
                    </Card>
                </View>

                <View className="h-24" />
            </ScrollView>

            {/* === Modal (Card, Input, Button 컴포넌트 사용!) === */}
            <Modal transparent visible={!!modalType} animationType="fade" onRequestClose={closeModal}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
                    <TouchableWithoutFeedback onPress={closeModal}>
                        <View className="flex-1 bg-black/50 items-center justify-center px-6">
                            <TouchableWithoutFeedback>
                                <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} className="w-full max-w-sm">

                                    {/* 모달 박스를 Card로 감싸기 */}
                                    <Card className="bg-white p-6 rounded-3xl shadow-xl">

                                        {/* Header */}
                                        <View className="flex-row justify-between items-center mb-6">
                                            <CardTitle className="text-lg font-bold text-gray-900">
                                                {modalType === "nickname" && "닉네임 변경"}
                                                {modalType === "character" && "캐릭터 별명 변경"}
                                                {modalType === "color" && "테마 색상 변경"}
                                                {modalType === "logout" && "로그아웃"}
                                                {modalType === "delete" && "회원 탈퇴"}
                                            </CardTitle>
                                            <TouchableOpacity onPress={closeModal}>
                                                <X size={24} color="#9CA3AF" />
                                            </TouchableOpacity>
                                        </View>

                                        {/* Content */}
                                        <View className="mb-6">
                                            {(modalType === "nickname" || modalType === "character") && (
                                                // ✅ Input 컴포넌트 사용!
                                                <Input
                                                    value={tempValue}
                                                    onChangeText={setTempValue}
                                                    placeholder="입력해주세요"
                                                    autoFocus
                                                    className="h-12 text-base"
                                                />
                                            )}

                                            {modalType === "color" && (
                                                <View className="flex-row flex-wrap gap-4 justify-center">
                                                    {themeColors.map((theme) => (
                                                        <TouchableOpacity
                                                            key={theme.color}
                                                            onPress={() => setTempValue(theme.color)}
                                                            className={`items-center justify-center p-2 rounded-xl border-2 ${tempValue === theme.color ? "border-[#7C3AED] bg-purple-50" : "border-transparent"
                                                                }`}
                                                        >
                                                            <View className="w-10 h-10 rounded-full mb-1" style={{ backgroundColor: theme.color }} />
                                                            <Text className="text-xs text-gray-500">{theme.name}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            )}

                                            {modalType === "logout" && (
                                                <Text className="text-gray-600 text-center leading-6">
                                                    정말 로그아웃 하시겠어요?{"\n"}다시 로그인하여 계속 사용할 수 있습니다.
                                                </Text>
                                            )}
                                            {modalType === "delete" && (
                                                <Text className="text-gray-600 text-center leading-6">
                                                    정말 탈퇴하시겠어요?{"\n"}
                                                    <Text className="text-red-500 font-bold">모든 데이터가 영구 삭제</Text>되며{"\n"}복구할 수 없습니다.
                                                </Text>
                                            )}
                                        </View>

                                        {/* Footer: ✅ Button 컴포넌트 사용! */}
                                        <View className="flex-row gap-3">
                                            <Button
                                                variant="outline"
                                                className="flex-1 h-12 rounded-xl"
                                                onPress={closeModal}
                                            >
                                                <Text className="text-gray-600 font-bold">취소</Text>
                                            </Button>

                                            <Button
                                                className={`flex-1 h-12 rounded-xl ${modalType === 'delete' ? 'bg-red-500' : 'bg-[#7C3AED]'}`}
                                                onPress={handleSave}
                                            >
                                                <Text className="text-white font-bold">
                                                    {modalType === "delete" ? "탈퇴하기" : "저장"}
                                                </Text>
                                            </Button>
                                        </View>

                                    </Card>
                                </Animated.View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}