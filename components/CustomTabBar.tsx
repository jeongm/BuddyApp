import { BarChart3, BookOpen, Calendar, Home, Settings } from 'lucide-react-native';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
// 👇 아까 만든 responsive 파일 import (경로가 ../utils/responsive 인지 확인하세요)
import { scale } from '../utils/responsive';

export function CustomTabBar({ state, descriptors, navigation }: any) {
    const icons: any = {
        index: Home,       // app/(tabs)/index.tsx 가 홈이라면
        home: Home,        // app/(tabs)/home.tsx 가 홈이라면
        diary: BookOpen,
        calendar: Calendar,
        report: BarChart3,
        settings: Settings,
    };

    const labels: any = {
        index: "홈",
        home: "홈",
        diary: "다이어리",
        calendar: "캘린더",
        report: "리포트",
        settings: "설정",
    };

    return (
        <View
            className="flex-row bg-white border-t border-gray-200 items-center justify-around"
            // 👇 [수정 1] 높이를 h-16(고정) 대신 scale()로 변경
            // 아이폰(iOS)은 하단 홈바 때문에 패딩을 더 줘야 해서 삼항연산자 사용
            style={{
                height: Platform.OS === 'ios' ? scale(85) : scale(65),
                paddingBottom: Platform.OS === 'ios' ? scale(20) : 0
            }}
        >
            {state.routes.map((route: any, index: number) => {
                const isFocused = state.index === index;
                // route.name이 매핑에 없으면 기본값 Home
                const Icon = icons[route.name] || Home;
                const label = labels[route.name] || route.name;

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
                        activeOpacity={0.7}
                        className="items-center justify-center flex-1 h-full relative"
                    >
                        {/* 상단 보라색 선 */}
                        {isFocused && (
                            <View
                                className="absolute top-0 bg-[#7C3AED] rounded-b-full"
                                // 👇 [수정 2] 선의 너비와 두께도 비율에 맞게 늘림
                                style={{ width: scale(45), height: scale(3) }}
                            />
                        )}

                        {/* 아이콘 */}
                        <Icon
                            // 👇 [수정 3] 아이콘 크기를 scale(24)로 변경 (친구 폰에선 자동으로 커짐)
                            size={scale(24)}
                            color={isFocused ? "#7C3AED" : "#71717A"}
                            strokeWidth={isFocused ? 2 : 1.5}
                        />

                        {/* 라벨 텍스트 */}
                        <Text
                            className={`mt-1 font-medium ${isFocused ? "text-[#7C3AED]" : "text-gray-500"}`}
                            // 👇 [수정 4] 폰트 크기(text-[10px]) 제거하고 style로 scale 적용
                            style={{ fontSize: scale(10) }}
                        >
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}