import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../../api/axios';
import { AppText as Text } from '../../components/AppText';
import { useAuthStore } from '../../store/useAuthStore';

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

export default function LoginScreen() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const { setColorScheme } = useNativeWindColorScheme();

  // ✅ [수정] 라이트 고정이라 항상 다크 컬러
  const activeColor = '#0F172A';

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // ✅ [추가] 라이트 모드 강제
  useFocusEffect(useCallback(() => {
    setColorScheme('light');
    return () => setColorScheme('system');
  }, []));

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("알림", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">

        <View className="px-6 pt-2 pb-2">
          <TouchableOpacity onPress={() => router.back()} style={{ width: scale(40), height: scale(40) }} className="justify-center">
            <Ionicons name="arrow-back" size={scale(26)} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingTop: scale(32), paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: scale(48) }}>
            <Text className="font-extrabold text-slate-900 tracking-tight mb-2" style={{ fontSize: scale(36) }} allowFontScaling={false}>
              Welcome
            </Text>
            <Text className="font-medium text-slate-500" style={{ fontSize: scale(16) }} allowFontScaling={false}>
              버디와 함께 하루를 기록해봐요.
            </Text>
          </View>

          <View style={{ marginBottom: scale(20) }}>
            <Text className="font-extrabold text-slate-500 uppercase tracking-widest ml-1 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Email</Text>
            <View
              style={{ height: scale(56) }}
              className={`flex-row items-center bg-slate-50 px-4 rounded-2xl border-2 ${isEmailFocused ? "border-slate-900" : "border-transparent"}`}
            >
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
                className="flex-1 ml-3 font-bold text-slate-900"
                style={{ fontSize: scale(15), paddingVertical: 0, fontFamily: 'Pretendard-Regular' }}
                allowFontScaling={false}
              />
            </View>
          </View>

          <View style={{ marginBottom: scale(32) }}>
            <Text className="font-extrabold text-slate-500 uppercase tracking-widest ml-1 mb-2" style={{ fontSize: scale(12) }} allowFontScaling={false}>Password</Text>
            <View
              style={{ height: scale(56) }}
              className={`flex-row items-center bg-slate-50 px-4 rounded-2xl border-2 ${isPasswordFocused ? "border-slate-900" : "border-transparent"}`}
            >
              <Ionicons name="lock-closed" size={scale(20)} color={isPasswordFocused ? activeColor : "#94A3B8"} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                secureTextEntry={!showPassword}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor="#94A3B8"
                className="flex-1 ml-3 font-bold text-slate-900"
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
            className={`w-full rounded-2xl items-center justify-center shadow-sm ${loading ? "bg-slate-300" : "bg-slate-900"}`}
          >
            <Text
              className={`font-extrabold tracking-widest uppercase ${loading ? "text-slate-500" : "text-white"}`}
              style={{ fontSize: scale(15) }}
              allowFontScaling={false}
            >
              {loading ? "로그인 중..." : "Login"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-8">
            <Text className="font-medium text-slate-500 mr-2" style={{ fontSize: scale(13) }} allowFontScaling={false}>
              아직 계정이 없으신가요?
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
              <Text className="text-slate-900 font-extrabold underline" style={{ fontSize: scale(13) }} allowFontScaling={false}>
                회원가입
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}