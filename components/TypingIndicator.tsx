// components/TypingIndicator.tsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

interface TypingIndicatorProps {
    color: string;
    dotSize?: number;
}

const Dot = ({ delay, color, size }: { delay: number; color: string; size: number }) => {
    // 1. 위아래로 움직이는 값 (기본 0)
    const translateY = useSharedValue(0);
    // 2. 투명해졌다 진해지는 값 (기본 40% 투명)
    const opacity = useSharedValue(0.4);

    useEffect(() => {
        // 점마다 설정된 딜레이(0초, 0.15초, 0.3초) 후 통통 튀기 시작!
        translateY.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(-size * 0.8, { duration: 350 }), // 위로 살짝 올라감
                    withTiming(0, { duration: 350 })            // 다시 제자리로
                ),
                -1, // -1은 영원히 무한 반복하라는 뜻!
                true
            )
        );

        opacity.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: 350 }),   // 진해짐
                    withTiming(0.4, { duration: 350 })  // 연해짐
                ),
                -1,
                true
            )
        );
    }, [delay, size]);

    // 애니메이션을 뷰에 묶어주기
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2, // 무조건 완벽한 동그라미
                    backgroundColor: color,
                    marginHorizontal: size * 0.4, // 점들 사이의 완벽한 간격
                },
                animatedStyle,
            ]}
        />
    );
};

export function TypingIndicator({ color, dotSize = 10 }: TypingIndicatorProps) {
    return (
        // 3개의 점을 가로로 완벽하게 중앙 정렬! (시각적 어긋남 원천 차단)
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Dot delay={0} color={color} size={dotSize} />
            <Dot delay={150} color={color} size={dotSize} />
            <Dot delay={300} color={color} size={dotSize} />
        </View>
    );
}