import { LockKeyhole, Mail } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AuthFeedback } from '@/components/AuthFeedback';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import type { AuthStatus } from '@/services/auth';
import { authService } from '@/services/auth';
import { createApiClient } from '@/services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = async () => {
    const nextErrors: typeof errors = {};
    const trimmedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) nextErrors.email = 'Enter a valid email address.';
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus('validation-error');
      return;
    }
    setStatus('loading');
    setErrorMessage(undefined);
    const result = await authService.signIn({ email: trimmedEmail, password });
    if (result.status !== 'success') {
      setStatus(result.status);
      setErrorMessage(result.message ?? 'Invalid email or password.');
      return;
    }
    try {
      const user = await createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' }).getCurrentUser();
      if (!user) {
        setStatus('authentication-error');
        setErrorMessage('Unable to load user profile. Please try again.');
        return;
      }
      setStatus('success');
      router.replace(user.role === 'coordinator' ? '/manager' : user.role === 'admin' ? '/admin' : user.role === 'reporter' ? '/reporter' : '/volunteer');
    } catch (error) {
      setStatus('success');
      router.replace('/volunteer');
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue coordinating safer searches.">
      <View className="gap-5">
        <AuthFeedback status={status} message={errorMessage} />
        <Input label="Email" accessibilityLabel="Email address" autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@example.com" icon={Mail} value={email} onChangeText={setEmail} error={errors.email} />
        <Input label="Password" accessibilityLabel="Password" autoComplete="password" placeholder="Enter your password" icon={LockKeyhole} secureTextEntry value={password} onChangeText={setPassword} error={errors.password} />
        <Link href="/forgot-password" asChild><Text className="self-end text-sm font-semibold text-blue">Forgot Password?</Text></Link>
        <Button label="Sign In" fullWidth onPress={submit} />
        <View className="flex-row items-center justify-center gap-1 pt-2"><Text className="text-sm text-muted">New to TraceOne?</Text><Link href="/register" asChild><Text className="text-sm font-semibold text-blue">Create account</Text></Link></View>
      </View>
    </AuthShell>
  );
}
