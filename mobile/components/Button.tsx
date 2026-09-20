import { ActivityIndicator, Pressable, Text } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
};

const variantStyles: Record<ButtonVariant, { button: string; text: string }> = {
  primary: { button: 'bg-blue', text: 'text-white' },
  secondary: { button: 'bg-teal-soft', text: 'text-teal' },
  outline: { button: 'border border-border bg-surface', text: 'text-navy' },
  danger: { button: 'bg-danger', text: 'text-white' },
  ghost: { button: 'bg-transparent', text: 'text-blue' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const styles = variantStyles[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      className={`min-h-[52px] items-center justify-center rounded-2xl px-5 ${styles.button} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50' : 'active:opacity-80'}`}>
      {loading ? <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#2563EB'} /> : <Text className={`text-center text-base font-semibold ${styles.text}`}>{label}</Text>}
    </Pressable>
  );
}