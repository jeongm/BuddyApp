import React from "react";
import { Text, View } from "react-native";

// 카드 전체 박스
export function Card({ className = "", ...props }: View["props"]) {
    return (
        <View
            className={`rounded-xl border border-border bg-card text-card-foreground shadow-sm ${className}`}
            {...props}
        />
    );
}

// 카드 헤더 (제목 영역)
export function CardHeader({ className = "", ...props }: View["props"]) {
    return (
        <View className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
    );
}

// 카드 제목 (진하게)
export function CardTitle({ className = "", ...props }: Text["props"]) {
    return (
        <Text
            className={`text-2xl font-semibold leading-none tracking-tight text-card-foreground ${className}`}
            {...props}
        />
    );
}

// 카드 설명 (연하게)
export function CardDescription({ className = "", ...props }: Text["props"]) {
    return (
        <Text className={`text-sm text-muted-foreground ${className}`} {...props} />
    );
}

// 카드 내용 (본문)
export function CardContent({ className = "", ...props }: View["props"]) {
    return <View className={`p-6 pt-0 ${className}`} {...props} />;
}

// 카드 하단 (버튼 영역 등)
export function CardFooter({ className = "", ...props }: View["props"]) {
    return (
        <View className={`flex flex-row items-center p-6 pt-0 ${className}`} {...props} />
    );
}