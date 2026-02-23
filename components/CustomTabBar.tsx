import { BarChart3, BookOpen, Calendar, Home, Settings } from 'lucide-react-native';
import { useColorScheme } from 'nativewind'; // ✨ NativeWind의 다크모드 훅 사용
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Platform, TouchableOpacity, View } from 'react-native';
import { useThemeStore } from '../store/useThemeStore'; // ✨ 테마 저장소 불러오기

export function CustomTabBar({ state, descriptors, navigation }: any) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { accent } = useThemeStore(); // ✨ 유저가 고른 테마 색상 가져오기

    // ✨ 유저가 선택한 테마(accent)에 맞춰 실제 Hex 컬러 코드를 반환하는 함수
    const getActiveColor = () => {
        switch (accent) {
            case 'violet': return '#7C3AED'; // violet-600
            case 'rose': return '#E11D48';   // rose-600
            case 'blue': return '#2563EB';   // blue-600
            case 'green': return '#16A34A';  // green-600
            default: return isDark ? '#FFFFFF' : '#0F172A'; // 모노(default) - 라이트:까망 / 다크:하양
        }
    };

    const activeColor = getActiveColor();
    const inactiveColor = isDark ? '#475569' : '#94A3B8'; // 비활성 회색 (slate-600 / slate-400)

    const icons: any = {
        diary: BookOpen,
        calendar: Calendar,
        home: Home,
        report: BarChart3,
        settings: Settings,
    };

    const tabsOrder = ["diary", "calendar", "home", "report", "settings"];

    // 화면 전체 너비를 탭 개수(5개)로 정확히 나눈 값을 구합니다.
    const tabWidth = Dimensions.get('window').width / tabsOrder.length;

    // 애니메이션 값: 선택된 인덱스 * 탭 하나의 너비만큼 X좌표를 이동시킵니다.
    const translateX = useRef(new Animated.Value(state.index * tabWidth)).current;

    useEffect(() => {
        // 부드럽게 미끄러지는 스프링(Spring) 애니메이션
        Animated.spring(translateX, {
            toValue: state.index * tabWidth,
            useNativeDriver: true,
            tension: 60,
            friction: 8,
        }).start();
    }, [state.index]);

    return (
        // ✨ 미니멀리즘 디자인에 맞춰 배경색을 bg-slate-950으로 깊게, 테두리 라인을 얇게 조정
        <View className={`flex-row bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/60 items-center transition-colors duration-300 relative ${Platform.OS === 'ios' ? 'h-20 pb-5' : 'h-16'}`}>

            {/* 스르륵 움직이는 슬라이딩 바 (절대 위치) */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: -1, // 테두리 선 바로 위를 덮으면서 이동하도록 살짝 올림
                    left: 0,
                    width: tabWidth,
                    height: 3,
                    alignItems: 'center',
                    transform: [{ translateX }],
                    zIndex: 10,
                }}
            >
                <View
                    style={{
                        width: 40,
                        height: '100%',
                        backgroundColor: activeColor, // ✨ 선택된 테마 색상 적용!
                        borderBottomLeftRadius: 4,
                        borderBottomRightRadius: 4,
                    }}
                />
            </Animated.View>

            {tabsOrder.map((routeName) => {
                const route = state.routes.find((r: any) => r.name === routeName);
                if (!route) return null;

                const index = state.routes.indexOf(route);
                const isFocused = state.index === index;
                const Icon = icons[routeName] || Home;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        onPress={onPress}
                        activeOpacity={0.5}
                        className="flex-1 items-center justify-center h-full"
                    >
                        <Icon
                            size={routeName === 'home' ? 28 : 26}
                            color={isFocused ? activeColor : inactiveColor} // ✨ 선택된 테마 색상 적용!
                            strokeWidth={isFocused ? 2.5 : 1.5}
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}