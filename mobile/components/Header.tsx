import type { LucideIcon } from 'lucide-react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type HeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  fallbackRoute?: string;
  onBackPress?: () => void;
  actionIcon?: LucideIcon;
  onActionPress?: () => void;
  actionLabel?: string;
};

export function Header({
  title,
  subtitle,
  showBack,
  fallbackRoute,
  onBackPress,
  actionIcon: ActionIcon,
  onActionPress,
  actionLabel,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
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

  const hasBack = Boolean(showBack || onBackPress || fallbackRoute);

  return (
    <View className="min-h-[52px] flex-row items-center justify-between gap-3">
      <View className="flex-1 flex-row items-center gap-3">
        {hasBack ? (
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" className="rounded-lg p-2 active:bg-background-muted" onPress={handleBack}>
            <ArrowLeft stroke="#0F172A" size={21} />
          </Pressable>
        ) : null}
        <View className="flex-1">
          <Text className="text-2xl font-bold text-navy">{title}</Text>
          {subtitle ? <Text className="mt-1 text-sm text-muted">{subtitle}</Text> : null}
        </View>
      </View>
      {ActionIcon ? (
        <Pressable accessibilityLabel={actionLabel} accessibilityRole="button" className="rounded-lg p-2 active:bg-background-muted" onPress={onActionPress}>
          <ActionIcon stroke="#2563EB" size={21} />
        </Pressable>
      ) : null}
    </View>
  );
}
