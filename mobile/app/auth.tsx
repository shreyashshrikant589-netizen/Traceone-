import { LockKeyhole, Mail } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AuthFeedback } from '@/components/AuthFeedback';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import type { AuthStatus } from '@/services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = () => {
    const nextErrors: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus('validation-error');
      return;
    }
    router.replace('/role-selection');
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue coordinating safer searches.">
      <View className="gap-5">
        <AuthFeedback status={status} message={status === 'authentication-error' ? 'Authentication is ready for backend integration.' : undefined} />
        <Input label="Email" accessibilityLabel="Email address" autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@example.com" icon={Mail} value={email} onChangeText={setEmail} error={errors.email} />
        <Input label="Password" accessibilityLabel="Password" autoComplete="password" placeholder="Enter your password" icon={LockKeyhole} secureTextEntry value={password} onChangeText={setPassword} error={errors.password} />
        <Link href="/forgot-password" asChild><Text className="self-end text-sm font-semibold text-blue">Forgot Password?</Text></Link>
        <Button label="Sign In" fullWidth onPress={submit} />
        <View className="flex-row items-center justify-center gap-1 pt-2"><Text className="text-sm text-muted">New to TraceOne?</Text><Link href="/register" asChild><Text className="text-sm font-semibold text-blue">Create account</Text></Link></View>
      </View>
    </AuthShell>
  );
}
