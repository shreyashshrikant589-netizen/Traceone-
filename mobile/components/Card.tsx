import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
  testID?: string;
};

export function Card({ children, onPress, className = '', testID }: CardProps) {
  const cardClassName = `rounded-xl border border-border bg-surface p-4 shadow-sm ${className}`;

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" className={`${cardClassName} active:opacity-80`} onPress={onPress} testID={testID}>
        {children}
      </Pressable>
    );
  }

  return <View className={cardClassName} testID={testID}>{children}</View>;
}
