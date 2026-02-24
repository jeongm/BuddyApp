import { Ionicons } from '@expo/vector-icons';
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Image } from "expo-image";
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { diaryApi } from "../../api/diaryApi";
import { IS_TEST_MODE } from "../../config";

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

export default function DiaryEditorScreen() {
    const router = useRouter();
    // ✨ origin 파라미터 받기 추가!
    const params = useLocalSearchParams<{ mode: string, date?: string, diaryId?: string, sessionId?: string, origin?: string }>();

    const mode = params.mode as "create" | "edit";
    const diaryId = params.diaryId ? Number(params.diaryId) : undefined;
    const sessionId = params.sessionId ? Number(params.sessionId) : undefined;
    const origin = params.origin; // 출발지 꼬리표

    const [targetDate, setTargetDate] = useState(params.date || new Date().toISOString().split("T")[0]);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [inputTag, setInputTag] = useState("");

    const [images, setImages] = useState<string[]>([]);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // ✨ 핵심: 저장 중복 방지 로딩 상태!
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (mode === "edit" && diaryId) fetchDiaryDetail(diaryId);
        else if (mode === "create" && sessionId) fetchAIDiary(sessionId);
    }, [mode, diaryId, sessionId]);

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
            if (IS_TEST_MODE) {
                setTitle("테스트 일기");
                setContent("내용");
            } else {
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

    const handleSave = async () => {
        // ✨ 중복 클릭 철벽 방어!
        if (isSaving) return;
        if (!title.trim() || !content.trim()) return Alert.alert("알림", "제목과 내용을 입력해주세요.");

        setIsSaving(true); // 로딩 켜기

        try {
            if (IS_TEST_MODE) {
                // ✨ 테스트 모드에서도 목적지로 정확히 복귀
                router.replace(origin === 'diary' ? '/(tabs)/diary' : '/(tabs)/calendar');
                return;
            }

            const formData = new FormData();
            formData.append("request", JSON.stringify({ title, content, tags, diaryDate: targetDate, sessionSeq: sessionId }));

            if (selectedImageUri) {
                const filename = selectedImageUri.split('/').pop() || 'photo.jpg';
                const match = /\.(\w+)$/.exec(filename);
                formData.append("image", { uri: selectedImageUri, name: filename, type: match ? `image/${match[1]}` : `image` } as any);
            }

            if (mode === "edit" && diaryId) await diaryApi.updateDiary(diaryId, formData);
            else await diaryApi.createDiary(formData);

            // ✨ 진짜 핵심: 다이어리에서 왔으면 다이어리로, 아니면 캘린더로 이동!
            router.replace(origin === 'diary' ? '/(tabs)/diary' : '/(tabs)/calendar');
        } catch (error) {
            Alert.alert("오류", "저장 중 오류가 발생했습니다.");
            setIsSaving(false); // 에러 시에만 로딩 풀기 (성공 시엔 화면이 전환되므로 놔둠)
        }
    };

    const formattedDate = format(new Date(targetDate), "yyyy년 M월 d일 EEEE", { locale: ko });

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-950" edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">

                <View className="flex-row items-center justify-between bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-20 border-b border-slate-100 dark:border-slate-800/60" style={{ paddingHorizontal: scale(16), paddingVertical: scale(6) }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ padding: scale(6) }} disabled={isSaving}>
                        <Ionicons name="close" size={scale(28)} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleSave} disabled={isSaving} className={`${isSaving ? 'bg-slate-300 dark:bg-slate-700' : 'bg-primary-600'} rounded-full shadow-sm`} style={{ paddingVertical: scale(8), paddingHorizontal: scale(16) }}>
                        <Text className="font-extrabold text-white tracking-wide" style={{ fontSize: scale(14) }} allowFontScaling={false}>
                            {isSaving ? "저장 중" : "완료"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ✨ 저장 시 뜨는 전면 로딩 오버레이! (이게 있어야 연타를 물리적으로 못합니다) */}
                {(isAiLoading || isSaving) && (
                    <View className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md items-center justify-center">
                        <ActivityIndicator size="large" color="#94A3B8" />
                        <Text className="text-slate-500 font-bold" style={{ marginTop: scale(16), fontSize: scale(14) }} allowFontScaling={false}>
                            {isSaving ? "일기를 저장하고 있어요..." : "버디가 초안을 정리하고 있어요..."}
                        </Text>
                    </View>
                )}

                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: scale(140), paddingTop: scale(32) }} showsVerticalScrollIndicator={false}>
                    {/* ... (이하 스크롤뷰 내부는 기존과 100% 동일) ... */}
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
        </SafeAreaView>
    );
}