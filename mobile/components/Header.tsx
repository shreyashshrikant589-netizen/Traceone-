import { Pressable, Text, View } from 'react-native';

type HeaderProps = {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function Header({ eyebrow, title, actionLabel, onActionPress }: HeaderProps) {
  return (
    <View className="flex-row items-start justify-between">
      <View className="flex-1 pr-4">
        {eyebrow ? <Text className="mb-2 text-xs font-bold uppercase tracking-[2px] text-teal">{eyebrow}</Text> : null}
        <Text className="text-3xl font-bold tracking-tight text-navy">{title}</Text>
      </View>
      {actionLabel ? <Pressable accessibilityRole="button" onPress={onActionPress} className="rounded-full bg-blue-soft px-3 py-2 active:opacity-70"><Text className="text-sm font-semibold text-blue">{actionLabel}</Text></Pressable> : null}
    </View>
  );
}