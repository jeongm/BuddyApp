import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { Keyboard } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from "react-native-safe-area-context";

import { BuddyCharacter } from '../../components/BuddyCharacter';
import { Button } from '../../components/ui/Button';
import { Card, CardDescription, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { DiaryEntry, Message, mockAI, storage } from '../../utils/storage';

// --- WaveBar 컴포넌트는 그대로 유지 (애니메이션 로직) ---
const WaveBar = ({ delay, isRecording }: { delay: number, isRecording: boolean }) => {
    const height = useSharedValue(20);
    useEffect(() => {
        if (isRecording) {
            const randomHeight = 30 + Math.random() * 20;
            height.value = withRepeat(withSequence(withTiming(randomHeight, { duration: 200 + delay }), withTiming(20, { duration: 200 + delay })), -1, true);
        } else { height.value = withTiming(20); }
    }, [isRecording]);
    const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));
    return <Animated.View className="w-2 bg-primary rounded-full mx-1" style={animatedStyle} />;
};

export default function ChatScreen() {
    const router = useRouter();
    const [mode, setMode] = useState<"voice" | "text">("voice");
    const [messages, setMessages] = useState<Message[]>([
        { id: "1", role: "buddy", content: "안녕! 오늘 하루는 어땠어? 편하게 이야기해줘 😊", timestamp: new Date() },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [showEndDialog, setShowEndDialog] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        const userMessage: Message = { id: Date.now().toString(), role: "user", content: inputValue, timestamp: new Date() };
        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setTimeout(() => {
            const aiResponse: Message = { id: (Date.now() + 1).toString(), role: "buddy", content: mockAI.generateResponse(inputValue), timestamp: new Date() };
            setMessages((prev) => [...prev, aiResponse]);
        }, 1000);
    };

    const handleEndConversation = async () => {
        const userMsgCount = messages.filter((m) => m.role === "user").length;
        if (userMsgCount < 1) {
            Alert.alert("알림", "대화가 너무 짧아요. 조금 더 이야기해볼까요?");
            setShowEndDialog(false);
            return;
        }
        const diaryData = mockAI.generateDiary(messages);
        const newDiary: DiaryEntry = {
            id: Date.now().toString(), title: diaryData.title, content: diaryData.content,
            tags: diaryData.tags, date: new Date().toISOString(), messages, emotion: diaryData.emotion, images: []
        };
        await storage.saveDiary(newDiary);
        setShowEndDialog(false);
        router.replace(`/diary/edit/${newDiary.id}`);
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* === [Header] === */}
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-border bg-white">
                <Button
                    variant="ghost"
                    // size="sm"
                    className="rounded-full"
                    onPress={() => setShowEndDialog(true)}
                >
                    <View className="flex-row items-center">
                        <Ionicons name="close" size={21} color="#666" />
                        <Text className="ml-1 text-gray-900 font-medium text-[15px]">대화 종료</Text>
                    </View>
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="bg-secondary/50 rounded-full"
                    onPress={() => setMode(mode === "voice" ? "text" : "voice")}
                >
                    {mode === "voice" ? (
                        <Keyboard size={20} color="#4B5563" />
                    ) : (
                        <Ionicons name="mic" size={22} color="#4B5563" />
                    )}
                </Button>
            </View>

            {/* === [Content] === */}
            {mode === "voice" ? (
                <View className="flex-1 items-center justify-center p-6 pb-20">
                    <BuddyCharacter size="large" />
                    <View className="flex-row items-center h-16 mt-12 gap-1">
                        {[0, 50, 100, 150, 200].map((delay, i) => (
                            <WaveBar key={i} delay={delay} isRecording={isRecording} />
                        ))}
                    </View>
                    <Text className="mt-8 text-muted-foreground text-lg font-medium">
                        {isRecording ? "듣고 있어요..." : "마이크를 눌러 이야기해주세요"}
                    </Text>
                    <TouchableOpacity
                        onPress={() => setIsRecording(!isRecording)}
                        className={`mt-10 w-20 h-20 rounded-full items-center justify-center shadow-xl ${isRecording ? "bg-destructive" : "bg-primary"}`}
                    >
                        <Ionicons name="mic" size={36} color="white" />
                    </TouchableOpacity>
                </View>
            ) : (
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    className="flex-1"
                // keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
                >
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                        renderItem={({ item }) => (
                            <View className={`flex-row mb-4 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {item.role === 'buddy' && (
                                    <View className="mr-2.5 items-start">
                                        <View className="w-10 h-10 rounded-[16px] bg-white border border-gray-100 items-center justify-center shadow-sm overflow-hidden">
                                            <View style={{ transform: [{ scale: 0.65 }] }}>
                                                <BuddyCharacter size="small" />
                                            </View>
                                        </View>
                                    </View>
                                )}
                                <View className={`max-w-[75%] px-5 py-3 rounded-[20px] ${item.role === 'user' ? 'bg-primary rounded-tr-none' : 'bg-secondary rounded-tl-none'}`}>
                                    <Text className={`text-[16px] leading-6 ${item.role === 'user' ? 'text-white' : 'text-foreground'}`}>
                                        {item.content}
                                    </Text>
                                    <Text className={`text-[10px] mt-1 text-right ${item.role === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                                        {new Date(item.timestamp).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                                    </Text>
                                </View>
                            </View>
                        )}
                    />
                    {/* Input Area (우리가 만든 Input 부품 활용) */}
                    <View className="p-4 bg-white border-t border-border">
                        <View className="flex-row items-center gap-2">
                            <View className="flex-1">
                                <Input
                                    value={inputValue}
                                    onChangeText={setInputValue}
                                    placeholder="메시지를 입력하세요..."
                                    className="h-12 rounded-full border-none bg-secondary/50 px-5"
                                    onSubmitEditing={handleSendMessage}
                                />
                            </View>
                            <Button
                                size="icon"
                                className={`rounded-full ${inputValue.trim() ? 'bg-primary' : 'bg-muted'}`}
                                onPress={handleSendMessage}
                                disabled={!inputValue.trim()}
                            >
                                <Ionicons
                                    name="paper-plane"
                                    size={20}
                                    color="white"
                                    style={{ transform: [{ rotate: '45deg' }], marginLeft: -2 }}
                                />
                            </Button>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            )}

            {/* === [Dialog: 대화 종료] === */}
            <Modal animationType="fade" transparent={true} visible={showEndDialog}>
                <View className="flex-1 bg-black/50 items-center justify-center px-6">
                    <Animated.View entering={FadeIn}>
                        <Card className="w-full max-w-sm items-center shadow-2xl p-8">
                            <CardTitle className="text-2xl mb-2">대화 종료</CardTitle>
                            <CardDescription className="text-center mb-8 text-base">
                                오늘 이야기를 바탕으로{"\n"}일기를 자동으로 작성할까요?
                            </CardDescription>

                            <View className="flex-row gap-3 w-full">
                                <Button
                                    variant="outline"
                                    label="나중에"
                                    className="flex-1 h-14 rounded-2xl"
                                    onPress={() => { setShowEndDialog(false); router.back(); }}
                                />
                                <Button
                                    label="일기 쓰기"
                                    className="flex-1 h-14 rounded-2xl"
                                    onPress={handleEndConversation}
                                />
                            </View>
                        </Card>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}