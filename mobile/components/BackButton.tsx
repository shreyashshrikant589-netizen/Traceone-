import React from 'react';
import { Pressable, Text, StyleProp, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export type BackButtonProps = {
  fallbackRoute?: string;
  label?: string;
  color?: string;
  variant?: 'default' | 'circle' | 'ghost' | 'card';
  className?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export function BackButton({
  fallbackRoute = '/landing',
  label = 'Back',
  color = '#0F172A',
  variant = 'default',
  className = '',
  style,
  onPress,
}: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else if (fallbackRoute) {
      router.replace(fallbackRoute as any);
    } else {
      router.replace('/landing');
    }
  };

  if (variant === 'circle') {
    return (
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        onPress={handlePress}
        className={`h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/90 active:bg-slate-100 ${className}`}
        style={style}
      >
        <ArrowLeft stroke={color} size={20} />
      </Pressable>
    );
  }

  if (variant === 'ghost') {
    return (
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        onPress={handlePress}
        className={`flex-row items-center gap-1.5 rounded-lg px-2 py-1 active:bg-slate-100 ${className}`}
        style={style}
      >
        <ArrowLeft stroke={color} size={19} />
        {label ? <Text className="text-sm font-semibold text-slate-800">{label}</Text> : null}
      </Pressable>
    );
  }

  if (variant === 'card') {
    return (
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        onPress={handlePress}
        className={`flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xs active:bg-slate-50 ${className}`}
        style={style}
      >
        <ArrowLeft stroke={color} size={18} />
        <Text className="text-xs font-bold text-navy">{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={handlePress}
      className={`flex-row items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xs active:bg-slate-100 ${className}`}
      style={style}
    >
      <ArrowLeft stroke={color} size={19} />
      {label ? <Text className="text-sm font-semibold text-slate-800">{label}</Text> : null}
    </Pressable>
  );
}
