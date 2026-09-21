import { ChevronRight, MapPin } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { Card } from './Card';
import { StatusBadge, type StatusBadgeStatus } from './StatusBadge';

type CaseCardProps = {
  title: string;
  reference: string;
  location?: string;
  status: StatusBadgeStatus;
  onPress?: () => void;
};

export function CaseCard({ title, reference, location, status, onPress }: CaseCardProps) {
  return (
    <Card onPress={onPress}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-navy">{title}</Text>
          <Text className="mt-1 text-sm text-muted">{reference}</Text>
        </View>
        <StatusBadge status={status} compact />
      </View>
      {location ? (
        <View className="mt-4 flex-row items-center gap-2">
          <MapPin stroke="#64748B" size={16} />
          <Text className="flex-1 text-sm text-muted">{location}</Text>
        </View>
      ) : null}
      {onPress ? (
        <Pressable accessibilityLabel={`Open ${title}`} className="absolute bottom-4 right-4 p-1" onPress={onPress}>
          <ChevronRight stroke="#2563EB" size={20} />
        </Pressable>
      ) : null}
    </Card>
  );
}
