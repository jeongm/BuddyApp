import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface ButtonProps {
    label?: string;
    children?: React.ReactNode;
    onPress?: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
    disabled?: boolean;
}

export const Button = ({
    label, children, onPress, variant = 'default', size = 'default', className = "", disabled
}: ButtonProps) => {

    // 1. 배경/테두리 스타일 매핑
    const variants = {
        default: "bg-primary",
        destructive: "bg-destructive",
        outline: "border border-input bg-background",
        secondary: "bg-secondary",
        ghost: "bg-transparent",
        link: "bg-transparent",
    };

    // 2. 크기 스타일 매핑
    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 rounded-md",
        lg: "h-12 px-8 rounded-md",
        icon: "h-10 w-10",
    };

    // 3. 텍스트 색상 매핑
    const textColors = {
        default: "text-primary-foreground",
        destructive: "text-white",
        outline: "text-foreground",
        secondary: "text-secondary-foreground",
        ghost: "text-foreground",
        link: "text-primary underline",
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
            className={`flex-row items-center justify-center rounded-md ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50' : ''} ${className}`}
        >
            {label ? (
                <Text className={`font-medium ${variant === 'link' ? 'text-sm' : 'text-sm'} ${textColors[variant]}`}>
                    {label}
                </Text>
            ) : children}
        </TouchableOpacity>
    );
};