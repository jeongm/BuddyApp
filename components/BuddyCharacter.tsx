import React, { useEffect } from 'react';
import { Image } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';

interface BuddyCharacterProps {
  size?: "small" | "medium" | "large";
}

export function BuddyCharacter({ size = "medium" }: BuddyCharacterProps) {
  // 1. 크기 매핑 (Tailwind 클래스 그대로 사용)
  const sizeMap = {
    small: "w-16 h-16",
    medium: "w-32 h-32",
    large: "w-40 h-40",
  };

  // 2. 애니메이션 값 설정 (Y축 이동값)
  const translateY = useSharedValue(0);

  useEffect(() => {
    // 0 -> -10px 이동을 무한 반복 (withRepeat)
    // duration: 1000ms (1초) 동안 올라갔다가, reverse(true)로 1초 동안 내려옴 = 총 2초 주기
    translateY.value = withRepeat(
      withTiming(-10, {
        duration: 1000,
        easing: Easing.inOut(Easing.quad)
      }),
      -1, // -1은 무한 반복을 의미
      true // true는 "갔다가 다시 돌아옴(Reverse)"을 의미
    );
  }, []);

  // 3. 애니메이션 스타일 정의
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    // motion.div 대신 Animated.View 사용
    <Animated.View
      className={`${sizeMap[size]} items-center justify-center`}
      style={animatedStyle}
    >
      {/* img 태그 대신 Image 컴포넌트 사용 */}
      <Image
        source={{
          uri: "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Hamster.png"
        }}
        className="w-full h-full"
        resizeMode="contain" // object-contain 대신 resizeMode 사용
      />
    </Animated.View>
  );
}