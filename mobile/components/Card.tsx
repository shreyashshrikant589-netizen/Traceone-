import { Pressable, View } from 'react-native';
import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  interactive?: boolean;
  onPress?: () => void;
  className?: string;
};

export function Card({ children, interactive = false, onPress, className = '' }: CardProps) {
  const cardClassName = `rounded-3xl border border-border bg-surface p-4 ${interactive ? 'active:opacity-80' : ''} ${className}`;

  if (interactive) {
    return <Pressable onPress={onPress} className={cardClassName}>{children}</Pressable>;
  }

  return <View className={cardClassName}>{children}</View>;
}