import { Bell, BriefcaseBusiness, Home, Search, UserRound } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { colors } from '@/constants/Colors';

export default function MainLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.blue,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { height: 78, paddingTop: 10, paddingBottom: 12, borderTopColor: colors.border, backgroundColor: colors.background },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="cases" options={{ title: 'Cases', tabBarIcon: ({ color, size }) => <BriefcaseBusiness color={color} size={size} /> }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ color, size }) => <Search color={color} size={size} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifications', tabBarIcon: ({ color, size }) => <Bell color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }} />
    </Tabs>
  );
}
