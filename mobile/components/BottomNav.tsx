// mobile/components/BottomNav.tsx
import { View, Pressable, Text } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useBottomNavTabs } from '@/hooks/useBottomNavTabs';
import { useUserRole } from '@/hooks/useUserRole';

export default function BottomNav() {
  const role = useUserRole();
  const tabs = useBottomNavTabs(role);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-border rounded-t-lg shadow-md flex-row justify-around items-center py-2 safe-area-inset-bottom">
      {tabs.map(tab => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.href}
            className={`flex-1 items-center py-1 ${isActive ? 'bg-teal-100' : ''}`}
            onPress={() => router.push(tab.href as any)}
          >
            <Icon size={20} color={isActive ? '#0D9488' : '#64748B'} />
            <Text className={`text-xs ${isActive ? 'text-teal-800' : 'text-muted'}`}>{tab.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
