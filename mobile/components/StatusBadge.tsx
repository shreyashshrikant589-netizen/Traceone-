import type { LucideIcon } from 'lucide-react-native';
import { Check, CircleAlert, CircleDashed, MapPin, RotateCcw, Search, UserRound, WifiOff } from 'lucide-react-native';
import { Text, View } from 'react-native';

export type StatusBadgeStatus =
  | 'LOCAL_SEARCH'
  | 'PUBLIC_ESCALATION_PENDING'
  | 'PUBLIC_SEARCH'
  | 'UNSEARCHED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SEARCHED'
  | 'REOPEN'
  | 'COMPLETED'
  | 'SEARCH_COMPLETED'
  | 'CASE_RESOLVED'
  | 'OFFLINE'
  | 'CRITICAL';


type BadgeStyle = { label: string; container: string; text: string; icon: LucideIcon; iconColor: string };

const styles: Record<StatusBadgeStatus, BadgeStyle> = {
  LOCAL_SEARCH: { label: 'Local search', container: 'bg-blue-50', text: 'text-blue', icon: MapPin, iconColor: '#2563EB' },
  PUBLIC_ESCALATION_PENDING: { label: 'Public escalation pending', container: 'bg-amber-50', text: 'text-warning', icon: CircleAlert, iconColor: '#D97706' },
  PUBLIC_SEARCH: { label: 'Public search', container: 'bg-teal-50', text: 'text-teal', icon: Search, iconColor: '#0D9488' },
  UNSEARCHED: { label: 'Unsearched', container: 'bg-slate-100', text: 'text-muted', icon: CircleDashed, iconColor: '#64748B' },
  ASSIGNED: { label: 'Assigned', container: 'bg-blue-50', text: 'text-blue', icon: UserRound, iconColor: '#2563EB' },
  IN_PROGRESS: { label: 'In progress', container: 'bg-amber-50', text: 'text-warning', icon: Search, iconColor: '#D97706' },
  SEARCHED: { label: 'Searched', container: 'bg-green-50', text: 'text-success', icon: Check, iconColor: '#16A34A' },
  REOPEN: { label: 'Reopen', container: 'bg-orange-50', text: 'text-warning', icon: RotateCcw, iconColor: '#D97706' },
  COMPLETED: { label: 'Completed', container: 'bg-green-50', text: 'text-success', icon: Check, iconColor: '#16A34A' },
  SEARCH_COMPLETED: { label: 'Search completed', container: 'bg-green-50', text: 'text-success', icon: Check, iconColor: '#16A34A' },
  CASE_RESOLVED: { label: 'Case resolved', container: 'bg-green-50', text: 'text-success', icon: Check, iconColor: '#16A34A' },
  OFFLINE: { label: 'Offline', container: 'bg-slate-100', text: 'text-muted', icon: WifiOff, iconColor: '#64748B' },
  CRITICAL: { label: 'Critical', container: 'bg-red-50', text: 'text-danger', icon: CircleAlert, iconColor: '#DC2626' },
};

type StatusBadgeProps = {
  status: StatusBadgeStatus;
  compact?: boolean;
};

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const badge = styles[status];
  const Icon = badge.icon;

  return (
    <View className={`flex-row items-center self-start rounded-full ${compact ? 'px-2.5 py-1' : 'px-3 py-1.5'} ${badge.container}`}>
      <Icon stroke={badge.iconColor} size={compact ? 13 : 15} strokeWidth={2.25} />
      <Text className={`ml-1.5 text-xs font-semibold ${badge.text}`}>{badge.label}</Text>
    </View>
  );
}
