import React from "react";
import { Text, View } from "react-native";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "secondary" | "destructive" | "outline";
    className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
    // 1. 배경 스타일
    const bgStyles = {
        default: "bg-primary border-transparent",   // 보라색 배경
        secondary: "bg-secondary border-transparent", // 회색 배경
        destructive: "bg-destructive border-transparent",
        outline: "bg-transparent border-border border", // 테두리만
    };

    // 2. 글자 스타일
    const textStyles = {
        default: "text-primary-foreground", // 흰색 글씨
        secondary: "text-secondary-foreground", // 검은 글씨
        destructive: "text-destructive-foreground",
        outline: "text-foreground",
    };

    return (
        <View
            className={`rounded-full border px-2.5 py-0.5 items-center justify-center self-start ${bgStyles[variant]} ${className}`}
        >
            <Text className={`text-xs font-semibold ${textStyles[variant]}`}>
                {children}
            </Text>
        </View>
    );
}