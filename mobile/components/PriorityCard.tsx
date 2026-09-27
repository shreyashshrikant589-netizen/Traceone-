import { AlertTriangle } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Card } from './Card';

type PriorityCardProps = {
  title: string;
  description: string;
  priority?: 'normal' | 'high' | 'critical';
  score?: number;
  onPress?: () => void;
};

const priorityStyles = {
  normal: { container: 'bg-blue-50', icon: '#2563EB', label: 'text-blue', text: 'Normal priority' },
  high: { container: 'bg-amber-50', icon: '#D97706', label: 'text-warning', text: 'High priority' },
  critical: { container: 'bg-red-50', icon: '#DC2626', label: 'text-danger', text: 'Critical priority' },
} as const;

export function PriorityCard({ title, description, priority = 'normal', score, onPress }: PriorityCardProps) {
  const styles = priorityStyles[priority];

  return (
    <Card onPress={onPress}>
      <View className="flex-row items-start gap-3">
        <View className={`h-10 w-10 items-center justify-center rounded-lg ${styles.container}`}>
          <AlertTriangle stroke={styles.icon} size={19} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-navy">{title}</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">{description}</Text>
          <View className="mt-3 flex-row items-center justify-between"><Text className={`text-xs font-semibold ${styles.label}`}>{styles.text}</Text>{score !== undefined ? <Text className={`text-sm font-bold ${styles.label}`}>{score}/100</Text> : null}</View>
        </View>
      </View>
    </Card>
  );
}
