import { MapPinned } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Card } from './Card';
import { StatusBadge, type StatusBadgeStatus } from './StatusBadge';

type ZoneCardProps = {
  name: string;
  details?: string;
  priorityScore?: number;
  reason?: string;
  status: StatusBadgeStatus;
  onPress?: () => void;
};

export function ZoneCard({ name, details, priorityScore, reason, status, onPress }: ZoneCardProps) {
  return (
    <Card onPress={onPress} className="flex-row items-center gap-3">
      <View className="h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
        <MapPinned stroke="#2563EB" size={21} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-navy">{name}</Text>
        {details ? <Text className="mt-1 text-sm text-muted">{details}</Text> : null}
        {reason ? <Text className="mt-1 text-xs text-muted">Reason: {reason}</Text> : null}
      </View>
      {priorityScore !== undefined ? <Text className="mr-1 text-sm font-bold text-warning">{priorityScore}</Text> : null}
      <StatusBadge status={status} compact />
    </Card>
  );
}
