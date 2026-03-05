import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Platform, Text as RNText, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText as Text } from '../../components/AppText';

import { memberApi } from "../../api/memberApi";
import { useAuthStore } from "../../store/useAuthStore";
import { useSettingStore } from "../../store/useSettingStore";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const safeShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    android: { elevation: 2 },
});

export default function BuddySettingsScreen() {
    const router = useRouter();
    const { user, updateUserInfo } = useAuthStore();
    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const characters = [
        { seq: 1, name: "햄찌", desc: "작지만 에너지가 넘치는 귀여운 수다쟁이", img: require('../../assets/images/characters/Hamster.png') },
        { seq: 2, name: "폭스", desc: "고민을 차분하게 들어주는 다정한 숲속 조언자", img: require('../../assets/images/characters/Fox.png') },
        { seq: 3, name: "곰곰이", desc: "언제나 묵묵하고 따뜻하게 안아주는 든든한 친구", img: require('../../assets/images/characters/Bear.png') },
    ];

    const [selectedCharSeq, setSelectedCharSeq] = useState<number>(user?.characterSeq || 1);
    const [isSavingChar, setIsSavingChar] = useState(false);

    const isCurrentChar = user?.characterSeq === selectedCharSeq;
    const selectedCharacterInfo = characters.find(c => c.seq === selectedCharSeq) || characters[0];

    useEffect(() => {
        if (user?.characterSeq) setSelectedCharSeq(user.characterSeq);
    }, [user?.characterSeq]);

    const handleSaveCharacter = async () => {
        if (isCurrentChar || isSavingChar) return;

        setIsSavingChar(true);
        try {
            await memberApi.updateCharacter({ characterSeq: selectedCharSeq });
            updateUserInfo({ characterSeq: selectedCharSeq });
            Alert.alert("성공", "버디가 성공적으로 변경되었습니다! 🎉");
        } catch (error) {
            Alert.alert("알림", "캐릭터 변경에 실패했습니다.");
            setSelectedCharSeq(user?.characterSeq || 1);
        } finally {
            setIsSavingChar(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
            <View className="flex-row items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800/60">
                <TouchableOpacity onPress={() => router.back()} className="p-2" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={scale(28)} color="#64748B" />
                </TouchableOpacity>
                <View className="absolute left-0 right-0 h-full items-center justify-center pointer-events-none" style={{ zIndex: -1 }}>
                    <RNText className="font-black text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(18), fontFamily: customFontFamily }} allowFontScaling={false}>
                        버디 설정
                    </RNText>
                </View>
                <View style={{ width: scale(44) }} />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(80), paddingTop: scale(24) }} showsVerticalScrollIndicator={false}>

                {/* [그룹 1] 버디 이름 설정 */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(32) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Buddy Name</Text>
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>
                        {/* 🚨 팝업(openNameModal) 대신 예쁜 새 페이지로 넘어가도록 수정! */}
                        <TouchableOpacity onPress={() => router.push('/settings/edit-buddy-name')} activeOpacity={0.6} className="flex-row items-center justify-between px-5 py-5">
                            <Text className="font-bold text-slate-700 dark:text-slate-300" style={{ fontSize: scale(15) }} allowFontScaling={false}>버디 이름</Text>
                            <View className="flex-row items-center" style={{ gap: scale(8) }}>
                                <Text className="font-medium text-slate-500 dark:text-slate-400" style={{ fontSize: scale(15) }} allowFontScaling={false}>
                                    {user?.characterNickname || "Buddy"}
                                </Text>
                                <Ionicons name="chevron-forward" size={scale(18)} color="#CBD5E1" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* [그룹 2] 버디 캐릭터 변경 */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(40) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Select Buddy</Text>

                    <View className="flex-row justify-between" style={{ marginBottom: scale(16) }}>
                        {characters.map((char) => {
                            const isSelected = selectedCharSeq === char.seq;
                            return (
                                <TouchableOpacity
                                    key={char.seq}
                                    onPress={() => setSelectedCharSeq(char.seq)}
                                    activeOpacity={0.7}
                                    className={`items-center justify-center border-2 ${isSelected ? "bg-primary-50 dark:bg-primary-900/40 border-primary-500" : "bg-slate-50 dark:bg-slate-900 border-transparent opacity-60"}`}
                                    style={[{ width: '31%', aspectRatio: 1, borderRadius: scale(24) }, isSelected && safeShadow]}
                                >
                                    <Image source={char.img} style={{ width: scale(56), height: scale(56), marginBottom: scale(8) }} contentFit="contain" />
                                    <Text className={`font-extrabold ${isSelected ? "text-primary-600 dark:text-primary-400" : "text-slate-500 dark:text-slate-400"}`} style={{ fontSize: scale(11) }} allowFontScaling={false}>{char.name}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View className="items-center justify-center mb-6" style={{ paddingHorizontal: scale(16) }}>
                        <Text className="font-medium text-slate-500 dark:text-slate-400 text-center leading-6" style={{ fontSize: scale(13) }} allowFontScaling={false}>
                            "{selectedCharacterInfo.desc}"
                        </Text>
                    </View>

                    {isCurrentChar ? (
                        <View className="w-full rounded-[20px] items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60" style={{ paddingVertical: scale(16) }}>
                            <Text className="font-extrabold text-slate-400 dark:text-slate-500" style={{ fontSize: scale(14) }} allowFontScaling={false}>현재 함께하고 있는 버디입니다</Text>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={handleSaveCharacter} disabled={isSavingChar} className={`w-full rounded-[20px] items-center justify-center ${isSavingChar ? 'bg-slate-300 dark:bg-slate-700' : 'bg-primary-600'} active:opacity-80`} style={[{ paddingVertical: scale(16) }, safeShadow]}>
                            {isSavingChar ? <ActivityIndicator size="small" color="#FFFFFF" /> : <RNText className="font-extrabold tracking-wide text-white" style={{ fontSize: scale(14), fontFamily: customFontFamily }} allowFontScaling={false}>이 버디로 변경하기</RNText>}
                        </TouchableOpacity>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}