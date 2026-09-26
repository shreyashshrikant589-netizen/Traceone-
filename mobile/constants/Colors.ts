export const colors = {
  background: '#FFFFFF',
  backgroundMuted: '#F8FAFC',
  navy: '#0F172A',
  navySoft: '#172554',
  blue: '#2563EB',
  blueLight: '#3B82F6',
  teal: '#0D9488',
  tealLight: '#14B8A6',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  muted: '#64748B',
  border: '#E2E8F0',
} as const;

export type ColorName = keyof typeof colors;
