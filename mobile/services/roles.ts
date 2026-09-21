import type { Href } from 'expo-router';

export type UserRole = 'VOLUNTEER' | 'CASE_MANAGER' | 'REPORTER' | 'ADMIN';

export type RoleOption = {
  id: UserRole;
  title: string;
  description: string;
  destination: Href;
};

export const roleOptions: RoleOption[] = [
  { id: 'VOLUNTEER', title: 'Volunteer', description: 'Join authorized searches and report observations.', destination: '/main' },
  { id: 'CASE_MANAGER', title: 'Case Manager', description: 'Coordinate cases, volunteers, search zones and escalation.', destination: '/main' },
  { id: 'REPORTER', title: 'Reporter', description: 'Create and manage a missing-person report.', destination: '/main' },
  { id: 'ADMIN', title: 'Admin', description: 'Manage platform-level operations.', destination: '/main' },
];

export const roleNavigation: Record<UserRole, readonly string[]> = {
  VOLUNTEER: ['Home', 'Cases', 'Search', 'Notifications', 'Profile'],
  CASE_MANAGER: ['Home', 'Cases', 'Control', 'Notifications', 'Profile'],
  REPORTER: ['Home', 'Cases', 'Notifications', 'Profile'],
  ADMIN: ['Home', 'Cases', 'Control', 'Notifications', 'Profile'],
};

export const ROLE_STORAGE_KEY = '@traceone/selected-role';
