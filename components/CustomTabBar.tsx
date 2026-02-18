import { BarChart3, BookOpen, Calendar, Home, Settings } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

export function CustomTabBar({ state, descriptors, navigation }: any) {
    // 아이콘 매핑
    const icons: any = {
        home: Home,        // app/(tabs)/home.tsx -> 홈
        diary: BookOpen,  // app/(tabs)/diary.tsx -> 다이어리
        calendar: Calendar, // app/(tabs)/calendar.tsx -> 캘린더
        report: BarChart3,  // app/(tabs)/report.tsx -> 리포트
        settings: Settings, // app/(tabs)/settings.tsx -> 설정
    };

    const labels: any = {
        home: "홈",
        diary: "다이어리",
        calendar: "캘린더",
        report: "리포트",
        settings: "설정",
    };

    return (
        <View className="flex-row h-16 bg-white border-t border-gray-200 items-center justify-around">
            {state.routes.map((route: any, index: number) => {
                const isFocused = state.index === index;
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
                        {/* 상단 보라색 선 (활성화될 때만 보임) */}
                        {isFocused && (
                            <View className="absolute top-0 w-12 h-[3px] bg-[#7C3AED] rounded-b-full" />
                        )}

                        {/* 아이콘 */}
                        <Icon
                            size={24}
                            color={isFocused ? "#7C3AED" : "#71717A"}
                            strokeWidth={isFocused ? 2 : 1.5}
                        />

                        {/* 라벨 텍스트 */}
                        <Text
                            className={`text-[10px] mt-1 font-medium ${isFocused ? "text-[#7C3AED]" : "text-gray-500"
                                }`}
                        >
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
