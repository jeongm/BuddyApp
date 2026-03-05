import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../../api/axios';
import { useAuthStore } from '../../store/useAuthStore';
// ✨ 기본 Text 대신 우리가 만든 AppText 임포트!
import { AppText as Text } from '../../components/AppText';

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

export default function LoginScreen() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();

  const colorScheme = useColorScheme();
  const activeColor = colorScheme === 'dark' ? '#FFFFFF' : '#0F172A';

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
      // 🚨 테스트 모드 삭제 및 실제 API 호출만 남김
      const response = await authApi.post('/api/v1/auth/login', { email, password });
      const result = response.data.result || response.data;

      setTokens(result.accessToken, result.refreshToken);
      if (result.member) setUser(result.member);

      router.replace("/(tabs)/home");
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

        <View className="px-6 pt-2 pb-2">
          <TouchableOpacity onPress={() => router.back()} style={{ width: scale(40), height: scale(40) }} className="justify-center">
            <Ionicons name="arrow-back" size={scale(26)} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: scale(32), paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={{ marginBottom: scale(48) }}>
            <Text className="font-extrabold text-slate-900 dark:text-white tracking-tight mb-2" style={{ fontSize: scale(36) }} allowFontScaling={false}>
              Welcome
            </Text>
            <Text className="font-medium text-slate-500 dark:text-slate-400" style={{ fontSize: scale(16) }} allowFontScaling={false}>
              버디와 함께 하루를 기록해봐요.
            </Text>
          </View>

          <View style={{ marginBottom: scale(20) }}>
            <Text className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Email</Text>

            <View style={{ height: scale(56) }} className={`flex-row items-center bg-slate-50 dark:bg-slate-900 px-4 rounded-2xl border-2 transition-colors ${isEmailFocused ? "border-slate-900 dark:border-white" : "border-transparent"}`}>
              <Ionicons name="mail" size={scale(20)} color={isEmailFocused ? activeColor : "#94A3B8"} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="이메일을 입력하세요"
                placeholderTextColor="#94A3B8"
                className="flex-1 ml-3 font-bold text-slate-900 dark:text-white"
                // ✨ TextInput에도 명시적으로 프리텐다드를 주입합니다!
                style={{ fontSize: scale(15), paddingVertical: 0, fontFamily: 'Pretendard-Regular' }}
                allowFontScaling={false}
              />
            </View>
          </View>

          <View style={{ marginBottom: scale(32) }}>
            <Text className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Password</Text>

            <View style={{ height: scale(56) }} className={`flex-row items-center bg-slate-50 dark:bg-slate-900 px-4 rounded-2xl border-2 transition-colors ${isPasswordFocused ? "border-slate-900 dark:border-white" : "border-transparent"}`}>
              <Ionicons name="lock-closed" size={scale(20)} color={isPasswordFocused ? activeColor : "#94A3B8"} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                secureTextEntry={!showPassword}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor="#94A3B8"
                className="flex-1 ml-3 font-bold text-slate-900 dark:text-white"
                // ✨ 여기도 프리텐다드 주입!
                style={{ fontSize: scale(15), paddingVertical: 0, fontFamily: 'Pretendard-Regular' }}
                allowFontScaling={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={scale(20)} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
            style={{ height: scale(56) }}
            className={`w-full rounded-2xl items-center justify-center shadow-sm ${loading ? "bg-slate-300 dark:bg-slate-700" : "bg-slate-900 dark:bg-white"}`}
          >
            <Text className={`font-extrabold tracking-widest uppercase ${loading ? "text-slate-500 dark:text-slate-400" : "text-white dark:text-slate-900"}`} style={{ fontSize: scale(15) }} allowFontScaling={false}>
              {loading ? "로그인 중..." : "Login"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-8">
            <Text className="font-medium text-slate-500 dark:text-slate-400 mr-2" style={{ fontSize: scale(13) }} allowFontScaling={false}>
              아직 계정이 없으신가요?
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
              <Text className="text-slate-900 dark:text-white font-extrabold underline" style={{ fontSize: scale(13) }} allowFontScaling={false}>
                회원가입
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}