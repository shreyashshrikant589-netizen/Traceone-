import { UserRound } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Card } from './Card';
import { StatusBadge, type StatusBadgeStatus } from './StatusBadge';

type VolunteerCardProps = {
  name: string;
  role?: string;
  status: StatusBadgeStatus;
  onPress?: () => void;
};

export function VolunteerCard({ name, role, status, onPress }: VolunteerCardProps) {
  return (
    <Card onPress={onPress} className="flex-row items-center gap-3">
      <View className="h-11 w-11 items-center justify-center rounded-full bg-navy-soft">
        <UserRound stroke="#FFFFFF" size={20} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-navy">{name}</Text>
        {role ? <Text className="mt-1 text-sm text-muted">{role}</Text> : null}
      </View>
      <StatusBadge status={status} compact />
    </Card>
  );
}
