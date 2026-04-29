import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router"; // ✨ useFocusEffect 추가
import React, { useCallback, useEffect, useState } from "react"; // ✨ useCallback 추가
import { ActivityIndicator, Alert, Dimensions, Platform, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { memberApi } from "../../api/memberApi";
import { AppText as Text } from '../../components/AppText';
import { useAuthStore } from "../../store/useAuthStore";
import { useSettingStore } from "../../store/useSettingStore";
import { ACCENT_HEX_COLORS, useThemeStore } from "../../store/useThemeStore";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const safeShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    android: { elevation: 2 },
});

export default function BuddySettingsScreen() {
    const router = useRouter();

    // ✨ refreshUser를 가져옵니다.
    const { user, updateUserInfo, refreshUser } = useAuthStore();

    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const { accent } = useThemeStore();
    const accentHex = ACCENT_HEX_COLORS[accent];

    const characters = [
        { seq: 1, name: "햄찌", desc: "작지만 에너지가 넘치는 귀여운 수다쟁이", img: require('../../assets/images/characters/Hamster.webp') },
        { seq: 2, name: "폭스", desc: "고민을 차분하게 들어주는 다정한 숲속 조언자", img: require('../../assets/images/characters/Fox.webp') },
        { seq: 3, name: "곰곰이", desc: "언제나 묵묵하고 따뜻하게 안아주는 든든한 친구", img: require('../../assets/images/characters/Bear.webp') },
    ];

    const [selectedCharId, setSelectedCharId] = useState<number>(user?.characterId || 1);
    const [isSavingChar, setIsSavingChar] = useState(false);

    const isCurrentChar = user?.characterId === selectedCharId;
    const selectedCharacterInfo = characters.find(c => c.seq === selectedCharId) || characters[0];

    // ✨ [동기화] 이 화면에 들어올 때마다 서버에서 최신 캐릭터 정보를 가져옵니다.
    useFocusEffect(
        useCallback(() => {
            refreshUser();
        }, [refreshUser])
    );

    // [상태] 서버 데이터(user)가 갱신되면 선택된 캐릭터 상태도 동기화
    useEffect(() => {
        if (user?.characterId) setSelectedCharId(user.characterId);
    }, [user?.characterId]);

    // [통신] 캐릭터 변경 사항 서버 저장
    const handleSaveCharacter = async () => {
        if (isCurrentChar || isSavingChar) return;

        setIsSavingChar(true);
        try {
            await memberApi.updateCharacter({ characterId: selectedCharId });

            // ✨ 서버 저장 성공 후 즉시 전체 유저 정보 새로고침 (동기화 쐐기 박기)
            await refreshUser();

            Alert.alert("성공", "버디가 성공적으로 변경되었습니다! 🎉");
        } catch (error) {
            Alert.alert("알림", "캐릭터 변경에 실패했습니다.");
            setSelectedCharId(user?.characterId || 1);
        } finally {
            setIsSavingChar(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top']}>
            {/* ... 나머지 UI 코드는 동일 ... */}

            {/* (생략) 헤더 영역 */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800/60">
                <TouchableOpacity onPress={() => router.back()} className="p-2" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={scale(28)} color="#64748B" />
                </TouchableOpacity>
                <View className="absolute left-0 right-0 h-full items-center justify-center pointer-events-none" style={{ zIndex: -1 }}>
                    <Text className="font-black text-slate-900 dark:text-white tracking-tight" style={{ fontSize: scale(18), fontFamily: customFontFamily }} allowFontScaling={false}>
                        버디 설정
                    </Text>
                </View>
                <View style={{ width: scale(44) }} />
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(80), paddingTop: scale(24) }} showsVerticalScrollIndicator={false}>

                {/* 버디 이름 변경 */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(32) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Buddy Name</Text>
                    <View className="bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800/60" style={safeShadow}>
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

                {/* 캐릭터 선택 카드 */}
                <View style={{ paddingHorizontal: scale(20), marginBottom: scale(40) }}>
                    <Text className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Select Buddy</Text>
                    <View className="flex-row justify-between" style={{ marginBottom: scale(16) }}>
                        {characters.map((char) => {
                            const isSelected = selectedCharId === char.seq;
                            return (
                                <TouchableOpacity
                                    key={char.seq}
                                    onPress={() => setSelectedCharId(char.seq)}
                                    activeOpacity={0.7}
                                    className={`items-center justify-center border-2 ${isSelected ? "bg-primary-50 dark:bg-primary-900/40 border-primary-500" : "bg-slate-50 dark:bg-slate-900 border-transparent opacity-60"}`}
                                    style={[{ width: '31%', aspectRatio: 1, borderRadius: scale(24) }, isSelected && safeShadow]}
                                >
                                    <Image source={char.img} style={{ width: scale(56), height: scale(56), marginBottom: scale(8) }} contentFit="contain" />
                                    <Text className={`font-extrabold ${isSelected ? "text-primary-500 dark:text-primary-400" : "text-slate-500 dark:text-slate-400"}`} style={{ fontSize: scale(11) }} allowFontScaling={false}>
                                        {char.name}
                                    </Text>
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
                        < TouchableOpacity onPress={handleSaveCharacter} disabled={isSavingChar} className={`w-full rounded-[20px] items-center justify-center ${isSavingChar ? 'bg-slate-300 dark:bg-slate-700' : 'bg-primary-500'} active:opacity-80`} style={[{ paddingVertical: scale(16) }, safeShadow]}>
                            {isSavingChar ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text className="font-extrabold tracking-wide text-white" style={{ fontSize: scale(14), fontFamily: customFontFamily }} allowFontScaling={false}>이 버디로 변경하기</Text>}
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView >
    );
}