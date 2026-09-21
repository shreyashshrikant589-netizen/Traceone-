import type { LucideIcon } from 'lucide-react-native';
import { Inbox } from 'lucide-react-native';
import { Text, View } from 'react-native';

type EmptyStateProps = {
  title?: string;
  resource?: 'active-cases' | 'assignments' | 'evidence' | 'notifications' | 'search-history';
  description?: string;
  icon?: LucideIcon;
};

const resourceLabels = { 'active-cases': 'No active cases.', assignments: 'No assignments.', evidence: 'No evidence.', notifications: 'No notifications.', 'search-history': 'No search history.' } as const;

export function EmptyState({ title, resource, description, icon: Icon = Inbox }: EmptyStateProps) {
  const displayTitle = resource ? resourceLabels[resource] : title ?? 'Nothing here yet.';
  return (
    <View className="items-center justify-center rounded-xl border border-dashed border-border bg-background-muted px-6 py-10">
      <Icon stroke="#64748B" size={28} strokeWidth={1.8} />
      <Text className="mt-4 text-base font-semibold text-navy">{displayTitle}</Text>
      {description ? <Text className="mt-2 text-center text-sm leading-5 text-muted">{description}</Text> : null}
    </View>
  );
}
