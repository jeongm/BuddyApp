import { Ionicons } from '@expo/vector-icons';
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Image } from "expo-image";
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Modal, Platform, Text as RNText, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { diaryApi } from "../../api/diaryApi";
import { AppText as Text } from '../../components/AppText';
import { useChatStore } from "../../store/useChatStore"; // ✨ 1. 세션 리셋을 위해 추가
import { useSettingStore } from "../../store/useSettingStore";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

const popupShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 24 },
    android: { elevation: 12 },
});

export default function DiaryEditorScreen() {
    const router = useRouter();
    const { setSessionId } = useChatStore(); // ✨ 2. 세션 ID 변경 함수 가져오기

    const { fontFamily } = useSettingStore();
    const customFontFamily = fontFamily === 'System' ? undefined : fontFamily;

    const params = useLocalSearchParams<{ mode: string, date?: string, diaryId?: string, sessionSeq?: string, sessionId?: string, origin?: string }>();

    const mode = params.mode as "create" | "edit";
    const diaryId = params.diaryId ? Number(params.diaryId) : undefined;
    const parsedSessionSeq = params.sessionSeq || params.sessionId;
    const sessionSeq = parsedSessionSeq ? Number(parsedSessionSeq) : undefined;
    const origin = params.origin;

    const [targetDate, setTargetDate] = useState(params.date || format(new Date(), 'yyyy-MM-dd'));
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [inputTag, setInputTag] = useState("");

    const [images, setImages] = useState<string[]>([]);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

    const [isAiLoading, setIsAiLoading] = useState(origin === 'chat');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (mode === "edit" && diaryId) {
            fetchDiaryDetail(diaryId);
        } else if (mode === "create" && sessionSeq) {
            fetchAIDiary(sessionSeq);
        } else {
            setIsAiLoading(false);
        }
    }, [mode, diaryId, sessionSeq]);

    const fetchAIDiary = async (seq: number) => {
        setIsAiLoading(true);
        try {
            const response = await diaryApi.createDiaryFromChat(seq);
            if (response?.result) {
                const d = response.result;
                setTitle(d.title);
                setContent(d.content);
                if (d.tags) setTags(d.tags.map((t: any) => (typeof t === "string" ? t : t.name)));
            }
        } catch (error) {
            Alert.alert("알림", "AI 초안을 불러오지 못했습니다.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const fetchDiaryDetail = async (seq: number) => {
        try {
            const response = await diaryApi.getDiaryDetail(seq);
            if (response?.result) {
                const d = response.result;
                setTitle(d.title);
                setContent(d.content);
                setTags(d.tags?.map((t: any) => t.name) || []);
                if (d.imageUrl) setImages([d.imageUrl]);
                else if (d.images && Array.isArray(d.images) && d.images.length > 0) {
                    setImages(d.images.map((img: any) => typeof img === 'string' ? img : img.url));
                }
                if (d.diaryDate) setTargetDate(d.diaryDate);
            }
        } catch (error) {
            Alert.alert("알림", "일기를 불러오지 못했습니다.");
            router.back();
        }
    };

    const handleTagSubmit = () => {
        if (inputTag.trim() && !tags.includes(inputTag.trim())) setTags([...tags, inputTag.trim()]);
        setInputTag("");
    };

    const removeTag = (t: string) => setTags(tags.filter((tag) => tag !== t));

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled) {
            setSelectedImageUri(result.assets[0].uri);
            setImages([result.assets[0].uri]);
        }
    };

    const handleClosePress = () => {
        router.back();
    };

    const handleSave = async () => {
        if (isSaving || isAiLoading) return;
        if (!title.trim() || !content.trim()) return Alert.alert("알림", "제목과 내용을 입력해주세요.");

        setIsSaving(true);

        try {
            const formData = new FormData();
            formData.append("request", JSON.stringify({ title, content, tags, diaryDate: targetDate, sessionSeq: sessionSeq }));

            if (selectedImageUri) {
                const filename = selectedImageUri.split('/').pop() || 'photo.jpg';
                const match = /\.(\w+)$/.exec(filename);
                formData.append("image", { uri: selectedImageUri, name: filename, type: match ? `image/${match[1]}` : `image` } as any);
            }

            if (mode === "edit" && diaryId) {
                await diaryApi.updateDiary(diaryId, formData);
            } else {
                await diaryApi.createDiary(formData);
                // ✨ 3. [핵심 로직] 저장 성공 시, 대화 중이던 세션을 0으로 초기화하여 새 세션을 유도합니다.
                if (sessionSeq) {
                    setSessionId(0);
                }
            }

            router.replace(origin === 'diary' ? '/(tabs)/diary' : '/(tabs)/calendar');
        } catch (error) {
            Alert.alert("오류", "저장 중 오류가 발생했습니다.");
            setIsSaving(false);
        }
    };

    const formattedDate = format(new Date(targetDate), "yyyy년 M월 d일 EEEE", { locale: ko });

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">

                <View className="flex-row items-center justify-between bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-20 border-b border-slate-100 dark:border-slate-800/60" style={{ paddingHorizontal: scale(16), paddingVertical: scale(6) }}>
                    <TouchableOpacity onPress={handleClosePress} style={{ padding: scale(6) }} disabled={isSaving || isAiLoading}>
                        <Ionicons name="close" size={scale(28)} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleSave} disabled={isSaving || isAiLoading} className={`${isSaving || isAiLoading ? 'bg-slate-100 dark:bg-slate-800' : 'bg-primary-600'} rounded-full shadow-sm`} style={{ paddingVertical: scale(8), paddingHorizontal: scale(16) }}>
                        <RNText className={`font-black tracking-wide ${isSaving || isAiLoading ? 'text-slate-400' : 'text-white'}`} style={{ fontSize: scale(14), fontFamily: customFontFamily }} allowFontScaling={false}>
                            {isSaving ? "저장 중" : "완료"}
                        </RNText>
                    </TouchableOpacity>
                </View>

                {isSaving && (
                    <View className="absolute inset-0 z-50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm items-center justify-center">
                        <ActivityIndicator size="large" color="#64748B" />
                    </View>
                )}

                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(140), paddingTop: scale(32) }} showsVerticalScrollIndicator={false}>
                    <View className="items-center" style={{ paddingHorizontal: scale(28), marginBottom: scale(40) }}>
                        <Text className="font-extrabold text-primary-600 dark:text-primary-400 uppercase tracking-widest" style={{ marginBottom: scale(16), fontSize: scale(13) }} allowFontScaling={false}>
                            {formattedDate}
                        </Text>
                        <TextInput
                            placeholder="제목을 입력하세요"
                            placeholderTextColor="#CBD5E1"
                            className="font-extrabold text-slate-900 dark:text-white text-center w-full"
                            style={{ fontSize: scale(26), paddingVertical: scale(10) }}
                            value={title}
                            onChangeText={setTitle}
                            multiline
                            allowFontScaling={false}
                        />
                        <View className="flex-row flex-wrap justify-center items-center" style={{ gap: scale(8), marginTop: scale(16) }}>
                            {tags.map((tag) => (
                                <TouchableOpacity key={tag} onPress={() => removeTag(tag)} activeOpacity={0.6} className="bg-primary-50 dark:bg-primary-900/40 rounded-md border border-primary-100/50 dark:border-primary-800/50 flex-row items-center" style={{ paddingHorizontal: scale(12), paddingVertical: scale(6), gap: scale(6) }}>
                                    <Text className="text-primary-600 dark:text-primary-300 font-extrabold uppercase tracking-wider" style={{ fontSize: scale(11) }} allowFontScaling={false}>#{tag}</Text>
                                    <Ionicons name="close" size={scale(12)} color="#94A3B8" />
                                </TouchableOpacity>
                            ))}
                            <View className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md justify-center" style={{ paddingHorizontal: scale(12) }}>
                                <TextInput
                                    value={inputTag}
                                    onChangeText={setInputTag}
                                    onSubmitEditing={handleTagSubmit}
                                    placeholder="+ 태그 추가"
                                    placeholderTextColor="#94A3B8"
                                    className="font-extrabold tracking-wider text-slate-500 dark:text-slate-400 text-center"
                                    style={{ fontSize: scale(12), paddingVertical: scale(6), minWidth: scale(70) }}
                                    returnKeyType="done"
                                    blurOnSubmit={false}
                                    allowFontScaling={false}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={{ paddingHorizontal: scale(20), marginBottom: scale(32) }}>
                        {images.length > 0 ? (
                            <View className="relative shadow-sm">
                                <Image source={{ uri: images[0] }} style={{ width: '100%', height: scale(280), borderRadius: scale(24), backgroundColor: '#F1F5F9' }} contentFit="cover" />
                                <TouchableOpacity
                                    onPress={() => { setImages([]); setSelectedImageUri(null); }}
                                    className="absolute bg-slate-900/60 backdrop-blur-md rounded-full items-center justify-center"
                                    style={{ top: scale(16), right: scale(16), width: scale(32), height: scale(32) }}
                                >
                                    <Ionicons name="close" size={scale(16)} color="white" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={pickImage} activeOpacity={0.6} className="w-full border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 items-center justify-center flex-row" style={{ height: scale(96), borderRadius: scale(32), gap: scale(8) }}>
                                <Ionicons name="image-outline" size={scale(24)} color="#94A3B8" />
                                <Text className="font-bold text-slate-400 dark:text-slate-500" style={{ fontSize: scale(14) }} allowFontScaling={false}>사진 첨부하기</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={{ paddingHorizontal: scale(28) }}>
                        <TextInput
                            placeholder="오늘의 이야기를 자유롭게 기록해보세요..."
                            placeholderTextColor="#94A3B8"
                            multiline
                            textAlignVertical="top"
                            className="w-full text-slate-700 dark:text-slate-300 font-medium"
                            style={{ fontSize: scale(16), lineHeight: scale(28), paddingTop: scale(10), minHeight: scale(300), marginBottom: scale(40) }}
                            value={content}
                            onChangeText={setContent}
                            allowFontScaling={false}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal
                visible={isAiLoading}
                transparent={true}
                animationType="fade"
            >
                <View className="flex-1 bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm items-center justify-center px-8">
                    <View className="items-center justify-center bg-white dark:bg-slate-900 rounded-[32px] w-full py-10 px-6 border border-slate-100 dark:border-slate-800" style={popupShadow}>
                        <View className="bg-primary-50 dark:bg-primary-900/30 w-20 h-20 rounded-full items-center justify-center mb-6">
                            <ActivityIndicator size="large" color="#3B82F6" />
                        </View>

                        <RNText className="text-slate-900 dark:text-white font-black text-center mb-3" style={{ fontSize: scale(20), fontFamily: customFontFamily }} allowFontScaling={false}>
                            일기를 정리하고 있어요 ✨
                        </RNText>
                        <Text className="text-slate-500 dark:text-slate-400 font-medium text-center leading-6" style={{ fontSize: scale(14) }} allowFontScaling={false}>
                            버디가 방금 나눈 대화를 바탕으로{"\n"}멋진 일기를 쓰고 있습니다.
                        </Text>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}