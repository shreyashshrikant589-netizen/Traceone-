import { Text, View } from 'react-native';

type PasswordStrengthProps = { password: string };

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const score = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const label = score < 2 ? 'Weak' : score < 4 ? 'Good' : 'Strong';
  const color = score < 2 ? '#DC2626' : score < 4 ? '#D97706' : '#16A34A';
  return <View accessibilityLabel={`Password strength: ${label}`} className="gap-2"><View className="flex-row gap-1.5">{[0, 1, 2, 3].map((item) => <View key={item} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: item < score ? color : '#E2E8F0' }} />)}</View>{password ? <Text className="text-xs font-medium" style={{ color }}>{label} password</Text> : <Text className="text-xs text-muted">Use 8+ characters with a number and symbol.</Text>}</View>;
}
