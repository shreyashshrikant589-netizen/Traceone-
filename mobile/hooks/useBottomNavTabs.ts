// mobile/hooks/useBottomNavTabs.ts
import { Home, FolderOpen, Search, User } from 'lucide-react-native';

// List of routes that definitely exist in the app (verified from _layout.tsx)
const EXISTING_ROUTES = new Set([
  '/volunteer',
  '/manager',
  '/reporter',
  '/admin',
  '/cases',
  '/search',
  '/profile',
]);

/**
 * Return tab configuration based on the authenticated user's role.
 * If a route does not exist it will be filtered out.
 */
export const useBottomNavTabs = (role: string) => {
  const baseTabs = [
    {
      name: 'Home',
      href: role === 'CASE_MANAGER' ? '/manager' : role === 'REPORTER' ? '/reporter' : '/volunteer',
      icon: Home,
    },
    { name: 'Cases', href: '/cases', icon: FolderOpen },
    { name: 'Search', href: '/search', icon: Search },
    // Activity tab could be added later when a route exists.
    // { name: 'Activity', href: '/activity', icon: Zap },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  // Keep only tabs whose href is known to exist.
  return baseTabs.filter(tab => EXISTING_ROUTES.has(tab.href));
};
