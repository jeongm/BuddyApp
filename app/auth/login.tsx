import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../../api/axios';
import { IS_TEST_MODE } from '../../config';
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginScreen() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();

  // ✨ 시스템 테마(라이트/다크) 감지
  const colorScheme = useColorScheme();
  const activeColor = colorScheme === 'dark' ? '#FFFFFF' : '#0F172A'; // 다크모드: 화이트, 라이트모드: 블랙(Slate-900)

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("알림", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      if (IS_TEST_MODE) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const fakeResponse = {
          accessToken: "fake-jwt-token",
          refreshToken: "fake-refresh-token",
          member: { memberSeq: 1, email: email, nickname: "테스트유저", characterSeq: 1, characterNickname: "Hamster", avatarUrl: "" }
        };
        setTokens(fakeResponse.accessToken, fakeResponse.refreshToken);
        setUser(fakeResponse.member);
        router.replace("/(tabs)/home");
      } else {
        const response = await authApi.post('/api/v1/auth/login', { email, password });
        const result = response.data.result || response.data;

        setTokens(result.accessToken, result.refreshToken);
        if (result.member) setUser(result.member);
        router.replace("/(tabs)/home");
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "로그인에 실패했습니다.";
      Alert.alert("오류", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: 80, paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View className="mb-12">
            <Text className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              Welcome
            </Text>
            <Text className="text-base font-medium text-slate-500 dark:text-slate-400">
              버디와 함께 하루를 기록해봐요.
            </Text>
          </View>

          {/* 1. 이메일 입력 */}
          <View className="mb-5">
            <Text className="text-[12px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2">Email</Text>
            {/* ✨ 포커스 시 블랙/화이트 보더 적용 */}
            <View className={`flex-row items-center bg-slate-50 dark:bg-slate-900 h-14 px-4 rounded-2xl border-2 transition-colors ${isEmailFocused ? "border-slate-900 dark:border-white" : "border-transparent"}`}>
              <Ionicons name="mail" size={20} color={isEmailFocused ? activeColor : "#94A3B8"} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="이메일을 입력하세요"
                placeholderTextColor="#94A3B8"
                className="flex-1 ml-3 text-[15px] font-bold text-slate-900 dark:text-white"
              />
            </View>
          </View>

          {/* 2. 비밀번호 입력 */}
          <View className="mb-8">
            <Text className="text-[12px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2">Password</Text>
            {/* ✨ 포커스 시 블랙/화이트 보더 적용 */}
            <View className={`flex-row items-center bg-slate-50 dark:bg-slate-900 h-14 px-4 rounded-2xl border-2 transition-colors ${isPasswordFocused ? "border-slate-900 dark:border-white" : "border-transparent"}`}>
              <Ionicons name="lock-closed" size={20} color={isPasswordFocused ? activeColor : "#94A3B8"} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                secureTextEntry={!showPassword}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor="#94A3B8"
                className="flex-1 ml-3 text-[15px] font-bold text-slate-900 dark:text-white"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ✨ 로그인 버튼 (블랙 & 화이트) */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
            className={`w-full h-14 rounded-2xl items-center justify-center shadow-sm ${loading ? "bg-slate-300 dark:bg-slate-700" : "bg-slate-900 dark:bg-white"}`}
          >
            <Text className={`font-extrabold text-[15px] tracking-widest uppercase ${loading ? "text-slate-500 dark:text-slate-400" : "text-white dark:text-slate-900"}`}>
              {loading ? "로그인 중..." : "Login"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mr-2">
              아직 계정이 없으신가요?
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
              {/* ✨ 회원가입 링크 색상도 모노톤으로 통일 */}
              <Text className="text-[13px] text-slate-900 dark:text-white font-extrabold underline">
                회원가입
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}