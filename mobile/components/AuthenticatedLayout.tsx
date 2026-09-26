// mobile/components/AuthenticatedLayout.tsx
import { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { usePathname } from 'expo-router';
import BottomNav from '@/components/BottomNav';
import { useUserRole } from '@/hooks/useUserRole';

// Routes where the bottom navigation should NOT appear
const NO_NAV_ROUTES = [
  '/landing',
  '/auth',
  '/register',
  '/role-selection',
  '/admin-login',
  '/qr-scanner',
  '/join-case',
  '/case-preview',
  '/join-confirmation',
  '/search-session',
  '/active-search',
  '/case-details',
  '/case-timeline',
  '/create-case',
  '/session-entry',
  '/splash',
  '/onboarding',
  '/forgot-password',
];

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const role = useUserRole();

  // Admin has its own flow; we keep the nav hidden for admin screens.
  const showNav = role !== 'ADMIN' && !NO_NAV_ROUTES.includes(pathname);

  // Add bottom padding when nav is shown so scrollable content is not covered.
  return (
    <SafeAreaView className="flex-1 bg-background relative" edges={['bottom']}>
      <View className={showNav ? 'flex-1 pb-16' : 'flex-1'}>{children}</View>
      {showNav && <BottomNav />}
    </SafeAreaView>
  );
}
