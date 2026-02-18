import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { Button } from './ui/Button';
import { Input } from './ui/Input';

// TODO 날짜 수정하는 부분이 너무 못생겼으니 수정할수있도록 하자
export interface DiaryData {
    title: string;
    content: string;
    emotion: string;
    tags: string[];
    images: string[];
    date: Date; // 👈 날짜 필드 추가
}

interface DiaryEditorProps {
    initialData?: DiaryData;
    onSubmit: (data: DiaryData) => Promise<void>;
    isSaving: boolean;
    headerTitle: string;
}

export const DiaryEditor = ({ initialData, onSubmit, isSaving, headerTitle }: DiaryEditorProps) => {
    const router = useRouter();

    // 상태 관리
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [emotion, setEmotion] = useState("neutral");
    const [tags, setTags] = useState<string[]>([]);
    const [images, setImages] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState("");

    // ✅ 날짜 상태 추가 (기본값: 오늘)
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // 초기 데이터 로드
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setContent(initialData.content);
            setEmotion(initialData.emotion || "neutral");
            setTags(initialData.tags || []);
            setImages(initialData.images || []);
            // ✅ 날짜도 불러오기
            if (initialData.date) {
                setDate(initialData.date);
            }
        }
    }, [initialData]);

    // ✅ 날짜 변경 핸들러
    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios'); // iOS는 유지, 안드로이드는 닫힘
        setDate(currentDate);
    };

    // ... (이미지, 태그 로직은 그대로 유지) ...
    // TODO : 이미지 여러장일 시 좌우 스크롤가능하게할까? 현재는 밑에 스택처럼 쌓이고있음
    const pickImage = async () => {

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('권한 필요', '사진을 올리려면 갤러리 접근 권한이 필요해요.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({

            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            // TODO : allowsEditing: false, 이미지 자르기 기능 뺄까말까
            allowsEditing: true,
            aspect: [1, 1], // 이미지 비율
            quality: 0.8,

        });

        if (!result.canceled) {
            setImages([...images, result.assets[0].uri]);
        }

    };



    // --- 로직: 태그 관리 ---

    const addTag = () => {

        const cleanTag = currentTag.trim().replace(/#/g, '');

        if (cleanTag && !tags.includes(cleanTag)) {

            setTags([...tags, cleanTag]);

            setCurrentTag("");

        }

    };

    // 저장 버튼 클릭
    const handleSubmit = () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert("알림", "제목과 내용을 입력해주세요.");
            return;
        }
        // ✅ date도 함께 전송
        onSubmit({ title, content, emotion, tags, images, date });
    };

    // 날짜 포맷팅 (예: 2024년 2월 14일 수요일)
    const formattedDate = date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    });

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white">
            {/* Header */}
            <View className="px-5 py-4 flex-row justify-between items-center border-b border-gray-100 bg-white">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text className="text-lg font-bold">{headerTitle}</Text>
                <TouchableOpacity onPress={handleSubmit} disabled={isSaving} className="p-2 -mr-2">
                    <Text className={`font-bold text-base ${isSaving ? 'text-gray-400' : 'text-primary'}`}>
                        {isSaving ? "저장중" : "완료"}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>

                {/* 0. 날짜 선택 */}
                <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">날짜</Text>
                <TouchableOpacity
                    onPress={() => setShowDatePicker(!showDatePicker)}
                    className="flex-row items-center bg-gray-50 p-3 rounded-xl border border-gray-200 mb-6"
                >
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" style={{ marginRight: 8 }} />
                    <Text className="text-base font-bold text-gray-700">
                        {formattedDate}
                    </Text>
                </TouchableOpacity>

                {/* Date Picker 컴포넌트 (조건부 렌더링) */}
                {showDatePicker && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={date}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onChangeDate}
                        locale="ko-KR"
                        maximumDate={new Date()} // 미래 날짜 선택 방지 (선택사항)
                    />
                )}

                {/* 1. 감정 선택 ... (이하 동일) */}
                <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">오늘의 기분</Text>
                <View className="flex-row gap-2 mb-6">
                    {/* ... 기존 감정 코드 ... */}
                    {['😆기쁨', '😢슬픔', '😡화남', '😐보통'].map((emo) => (
                        <TouchableOpacity
                            key={emo}
                            onPress={() => setEmotion(emo)}
                            className={`px-4 py-2 rounded-full border ${emotion === emo ? 'bg-purple-50 border-primary' : 'bg-white border-gray-200'}`}
                        >
                            <Text className={emotion === emo ? 'text-primary font-bold' : 'text-gray-500'}>{emo}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 2. 제목 & 내용 ... (이하 동일) */}
                <Input
                    value={title}
                    onChangeText={setTitle}
                    placeholder="제목을 입력하세요"
                    className="mb-6 font-bold text-lg border-transparent px-0 bg-transparent rounded-none border-b border-gray-100"
                />
                <Input
                    value={content}
                    onChangeText={setContent}
                    placeholder="오늘 무슨 일이 있었나요?"
                    multiline
                    className="mb-6 min-h-[200px] bg-transparent border-transparent px-0 items-start justify-start "
                    textAlignVertical="top"
                />

                {/* 3. 이미지 섹션 ... (이하 동일, View style={{ height: 90 }} 적용된 버전 사용) */}
                <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">사진</Text>
                <View style={{ height: 90, marginBottom: 24 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                        <TouchableOpacity onPress={pickImage} style={{ width: 80, height: 80 }} className="bg-gray-50 rounded-2xl items-center justify-center border border-gray-200 mr-3">
                            <Ionicons name="camera" size={24} color="#9CA3AF" />
                        </TouchableOpacity>
                        {images.map((imgUri, index) => (
                            <View key={index} style={{ width: 80, height: 80, marginRight: 12, position: 'relative' }}>
                                <Image source={{ uri: imgUri }} style={{ width: 80, height: 80, borderRadius: 16 }} resizeMode="cover" />
                                <TouchableOpacity onPress={() => setImages(images.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 bg-gray-900 rounded-full p-1 z-10">
                                    <Ionicons name="close" size={10} color="white" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* 4. 태그 섹션 ... (이하 동일) */}
                <Text className="text-xs font-bold text-gray-400 mb-2 uppercase">태그</Text>
                <View className="flex-row items-center mb-3">
                    <Input
                        value={currentTag}
                        onChangeText={setCurrentTag}
                        placeholder="태그 입력"
                        onSubmitEditing={addTag}
                        className="flex-1 mr-2 bg-gray-50 border-transparent"
                    />
                    <Button size="icon" onPress={addTag} className="rounded-xl w-12 h-10">
                        <Ionicons name="add" size={20} color="white" />
                    </Button>
                </View>
                <View className="flex-row flex-wrap gap-2 mb-20">
                    {tags.map((tag, index) => (
                        <TouchableOpacity key={index} onPress={() => setTags(tags.filter(t => t !== tag))} className="bg-purple-50 px-3 py-1.5 rounded-full flex-row items-center">
                            <Text className="text-primary mr-1">#{tag}</Text>
                            <Ionicons name="close-circle" size={14} color="#7C3AED" />
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};