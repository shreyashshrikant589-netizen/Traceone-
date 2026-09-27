import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  testID?: string;
};

const variantStyles: Record<ButtonVariant, { container: string; label: string; icon: string }> = {
  primary: { container: 'bg-blue', label: 'text-white', icon: '#FFFFFF' },
  secondary: { container: 'bg-teal', label: 'text-white', icon: '#FFFFFF' },
  outline: { container: 'border border-border bg-surface', label: 'text-navy', icon: '#0F172A' },
  ghost: { container: 'bg-transparent', label: 'text-blue', icon: '#2563EB' },
  danger: { container: 'bg-danger', label: 'text-white', icon: '#FFFFFF' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  testID,
}: ButtonProps) {
  const styles = variantStyles[variant];
  const isDisabled = disabled || loading;
  const iconElement = Icon ? <Icon stroke={styles.icon} size={18} strokeWidth={2.25} /> : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`min-h-[52px] flex-row items-center justify-center gap-2 rounded-xl px-5 ${styles.container} ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-50' : 'active:opacity-80'}`}
      disabled={isDisabled}
      onPress={onPress}
      testID={testID}>
      {loading ? <ActivityIndicator color={styles.icon} /> : iconPosition === 'left' ? iconElement : null}
      {!loading ? <Text className={`text-center text-base font-semibold ${styles.label}`}>{label}</Text> : null}
      {!loading && iconPosition === 'right' ? iconElement : null}
    </Pressable>
  );
}
