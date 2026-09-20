import { Text, View } from 'react-native';

type StatusTone = 'active' | 'pending' | 'success' | 'warning' | 'offline';

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

const toneStyles: Record<StatusTone, { wrapper: string; text: string; dot: string }> = {
  active: { wrapper: 'bg-blue-soft', text: 'text-blue', dot: 'bg-blue' },
  pending: { wrapper: 'bg-amber-50', text: 'text-warning', dot: 'bg-warning' },
  success: { wrapper: 'bg-green-50', text: 'text-success', dot: 'bg-success' },
  warning: { wrapper: 'bg-red-50', text: 'text-danger', dot: 'bg-danger' },
  offline: { wrapper: 'bg-slate-100', text: 'text-muted', dot: 'bg-muted' },
};

export function StatusBadge({ label, tone = 'active' }: StatusBadgeProps) {
  const styles = toneStyles[tone];

  return (
    <View className={`flex-row items-center self-start rounded-full px-3 py-1.5 ${styles.wrapper}`}>
      <View className={`mr-2 h-2 w-2 rounded-full ${styles.dot}`} />
      <Text className={`text-xs font-bold uppercase tracking-wide ${styles.text}`}>{label}</Text>
    </View>
  );
}