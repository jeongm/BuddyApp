import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';

import { DiaryEntry, storage } from '../../utils/storage';

const { width } = Dimensions.get('window');

export default function DiaryDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [diary, setDiary] = useState<DiaryEntry | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showChatModal, setShowChatModal] = useState(false);

    // 1. 데이터 불러오기
    useEffect(() => {
        const loadDiary = async () => {
            if (id) {
                const data = await storage.getDiaryById(id.toString());
                if (data) setDiary(data);
                else {
                    Alert.alert("오류", "삭제되거나 없는 일기입니다.");
                    router.back();
                }
            }
        };
        loadDiary();
    }, [id]);

    // 2. 삭제 핸들러
    const handleDelete = () => {
        Alert.alert("삭제 확인", "정말 삭제하시겠습니까?", [
            { text: "취소", style: "cancel" },
            {
                text: "삭제",
                style: "destructive",
                onPress: async () => {
                    if (diary) {
                        await storage.deleteDiary(diary.id);
                        router.back();
                    }
                }
            }
        ]);
    };

    if (!diary) return <View className="flex-1 bg-white" />;

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>

            {/* === Header (님의 Button 컴포넌트 사용) === */}
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
                <Button variant="ghost" size="icon" onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </Button>
                <Text className="text-lg font-bold text-gray-900">일기</Text>
                <View className="flex-row gap-1">
                    <Button variant="ghost" size="icon" onPress={() => router.push(`/diary/edit/${diary.id}`)}>
                        <Ionicons name="create-outline" size={22} color="#1F2937" />
                    </Button>
                    <Button variant="ghost" size="icon" onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={22} color="#EF4444" />
                    </Button>
                </View>
            </View>

            {/* === Content === */}
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <Animated.View entering={FadeInDown.duration(500).springify()}>

                    {/* Header Info */}
                    <View className="items-center mb-6 space-y-2">
                        <Text className="text-2xl font-bold text-gray-900 text-center leading-tight">
                            {diary.title}
                        </Text>
                        <Text className="text-sm text-gray-500">
                            {new Date(diary.date).toLocaleDateString("ko-KR", {
                                year: "numeric", month: "long", day: "numeric", weekday: "long"
                            })}
                        </Text>
                    </View>

                    {/* Tags (님의 Badge 컴포넌트 사용) */}
                    {/* Badge 코드를 보니 children으로 내용을 받으시네요! */}
                    <View className="flex-row flex-wrap justify-center gap-2 mb-6">
                        {diary.emotion && (
                            // 감정은 보라색 느낌을 내기 위해 className으로 색상 덮어쓰기
                            <Badge variant="default" className="bg-purple-100 border-purple-200">
                                <Text className="text-purple-700">{diary.emotion}</Text>
                            </Badge>
                        )}
                        {diary.tags?.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="bg-gray-100">
                                <Text className="text-gray-600">#{tag}</Text>
                            </Badge>
                        ))}
                    </View>

                    {/* Images */}
                    {diary.images && diary.images.length > 0 && (
                        <View className="flex-row flex-wrap gap-2 mb-6">
                            {diary.images.map((img, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setSelectedImage(img)}
                                    activeOpacity={0.9}
                                    style={{ width: (width - 40 - 8) / 2, height: (width - 40 - 8) / 2 }}
                                >
                                    <Image
                                        source={{ uri: img }}
                                        className="w-full h-full rounded-2xl bg-gray-100 border border-gray-100"
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Content (님의 Card 컴포넌트 사용) */}
                    <Card className="border-gray-100 bg-white">
                        <CardContent className="pt-6">
                            <Text className="text-base text-gray-800 leading-7">
                                {diary.content}
                            </Text>
                        </CardContent>
                    </Card>

                </Animated.View>
            </ScrollView>

            {/* === Floating Chat Button (목록 화면 FAB와 동일한 스타일) === */}
            {diary.messages && diary.messages.length > 0 && (
                <TouchableOpacity
                    className="absolute bottom-6 right-6 w-14 h-14 bg-[#7C3AED] rounded-full items-center justify-center shadow-lg shadow-purple-400 z-50"
                    onPress={() => setShowChatModal(true)}
                    activeOpacity={0.9}
                    style={{
                        elevation: 5,
                        // iOS 그림자 강조를 위해 추가
                        shadowColor: "#7C3AED",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                    }}
                >
                    <MessageCircle
                        size={24}
                        color="white"
                        style={{ transform: [{ rotate: '260deg' }] }}
                    />
                </TouchableOpacity>
            )}

            {/* === Image Preview Modal === */}
            <Modal visible={!!selectedImage} transparent={true} animationType="fade">
                <View className="flex-1 bg-black/95 justify-center items-center relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-12 right-6 z-10 bg-black/50 rounded-full"
                        onPress={() => setSelectedImage(null)}
                    >
                        <Ionicons name="close" size={24} color="white" />
                    </Button>
                    {selectedImage && (
                        <Image
                            source={{ uri: selectedImage }}
                            style={{ width: width, height: width * 1.3 }}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>

            {/* === Chat History Modal === */}
            <Modal visible={showChatModal} animationType="slide" transparent={true} onRequestClose={() => setShowChatModal(false)}>
                <View className="flex-1 justify-end bg-black/40">
                    <View className="bg-white rounded-t-[30px] h-[80%] overflow-hidden">
                        <View className="flex-row justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
                            <Text className="text-lg font-bold text-gray-900">대화 기록</Text>
                            <Button variant="ghost" size="icon" onPress={() => setShowChatModal(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </Button>
                        </View>
                        <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 40 }}>
                            {diary.messages?.map((msg, index) => (
                                <View key={index} className={`flex-row mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <View
                                        className={`px-4 py-3 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-[#7C3AED] rounded-tr-none' : 'bg-gray-100 rounded-tl-none'
                                            }`}
                                    >
                                        <Text className={`text-sm leading-5 ${msg.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                                            {msg.content}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}