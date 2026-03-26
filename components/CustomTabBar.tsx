import { BarChart3, BookOpen, Calendar, Home, Settings } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Platform, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// [추가] 글로벌 테마 색상 임포트!
import { ACCENT_HEX_COLORS, useThemeStore } from '../store/useThemeStore';

const { width } = Dimensions.get('window');
const scale = (size: number) => Math.round((width / 430) * size);

export function CustomTabBar({ state, descriptors, navigation }: any) {
    const { colorScheme } = useColorScheme();
    const { accent } = useThemeStore();
    const insets = useSafeAreaInsets();
    const isDark = colorScheme === 'dark';

    // [UI] 기기별 하단 안전 여백(Safe Area) 최적화
    const bottomPadding = Platform.OS === 'ios' && insets.bottom > 0
        ? insets.bottom - 14
        : insets.bottom;

    // ✨ [수정] 스위치문 박멸! 
    // 기본 테마(Soft Black)인데 다크모드일 때만 예외적으로 흰색(#FFFFFF)으로 반전!
    const activeColor = accent === 'default' && isDark
        ? '#FFFFFF'
        : ACCENT_HEX_COLORS[accent];

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

    // [애니메이션] 탭 상단 이동 인디케이터 바
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
                height: scale(56) + bottomPadding,
                paddingBottom: bottomPadding,
            }}
        >
            {/* 상단 포인트 인디케이터 바 */}
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

            {/* 탭 아이콘 렌더링 */}
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