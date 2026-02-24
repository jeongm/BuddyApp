import { BarChart3, BookOpen, Calendar, Home, Settings } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useRef } from 'react';
// ✨ Platform import 추가!
import { Animated, Dimensions, Platform, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/useThemeStore';

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

export function CustomTabBar({ state, descriptors, navigation }: any) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { accent } = useThemeStore();

    // 현재 기기의 실시간 안전 여백 가져오기
    const insets = useSafeAreaInsets();

    // ✨ 핵심 다이어트 로직: 아이폰이면 하단 여백을 14px 깎아내고, 안드로이드는 원래 여백(소프트키) 유지!
    const bottomPadding = Platform.OS === 'ios' && insets.bottom > 0
        ? insets.bottom - 14
        : insets.bottom;

    const getActiveColor = () => {
        switch (accent) {
            case 'violet': return '#7C3AED';
            case 'rose': return '#E11D48';
            case 'blue': return '#2563EB';
            case 'green': return '#16A34A';
            default: return isDark ? '#FFFFFF' : '#0F172A';
        }
    };

    const activeColor = getActiveColor();
    const inactiveColor = isDark ? '#475569' : '#94A3B8';

    const icons: any = {
        diary: BookOpen,
        calendar: Calendar,
        home: Home,
        report: BarChart3,
        settings: Settings,
    };

    const tabsOrder = ["diary", "calendar", "home", "report", "settings"];

    const tabWidth = width / tabsOrder.length;
    const translateX = useRef(new Animated.Value(state.index * tabWidth)).current;

    useEffect(() => {
        Animated.spring(translateX, {
            toValue: state.index * tabWidth,
            useNativeDriver: true,
            tension: 60,
            friction: 8,
        }).start();
    }, [state.index]);

    return (
        <View
            className="flex-row bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/60 transition-colors duration-300 relative"
            style={{
                // ✨ 계산된 다이어트 여백 적용! (기본 높이는 56으로 슬림하게)
                height: scale(56) + bottomPadding,
                paddingBottom: bottomPadding,
            }}
        >
            <Animated.View
                style={{
                    position: 'absolute',
                    top: -1,
                    left: 0,
                    width: tabWidth,
                    height: scale(3),
                    alignItems: 'center',
                    transform: [{ translateX }],
                    zIndex: 10,
                }}
            >
                <View
                    style={{
                        width: scale(40),
                        height: '100%',
                        backgroundColor: activeColor,
                        borderBottomLeftRadius: scale(4),
                        borderBottomRightRadius: scale(4),
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
                        className="flex-1 items-center justify-center"
                    >
                        <Icon
                            size={routeName === 'home' ? scale(28) : scale(24)}
                            color={isFocused ? activeColor : inactiveColor}
                            strokeWidth={isFocused ? 2.5 : 2}
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}