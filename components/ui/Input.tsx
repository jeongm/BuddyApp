import React from "react";
import { TextInput, TextInputProps } from "react-native";

export function Input({ className = "", ...props }: TextInputProps) {
    return (
        <TextInput
            // ✅ 고정 높이(h-11)와 flex를 제거했습니다.
            className={`
                w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-base 
                focus:border-primary focus:border-2
                ${className} 
            `}
            placeholderTextColor="#9CA3AF"
            {...props}
        />
    );
}