import { Eye, EyeOff, LockKeyhole, Mail, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AuthFeedback } from '@/components/AuthFeedback';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import type { AuthStatus } from '@/services/auth';
import { authService } from '@/services/auth';
import { createApiClient } from '@/services/api';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<{ adminId?: string; password?: string }>({});

  const submit = async () => {
    const nextErrors: typeof errors = {};
    const trimmedId = adminId.trim();

    if (!trimmedId) nextErrors.adminId = 'Enter your Admin ID or Email.';
    if (!password) nextErrors.password = 'Enter your password.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus('validation-error');
      return;
    }

    setStatus('loading');
    setErrorMessage(undefined);

    // DEMO LOGIN CHECK FOR HACKATHON PRESENTATION
    if (trimmedId === 'admin@123' && password === 'admin@123') {
      setStatus('success');
      router.replace('/admin');
      return;
    }

    // Standard Auth System Integration Check
    try {
      const result = await authService.signIn({ email: trimmedId, password });
      if (result.status !== 'success') {
        setStatus('authentication-error');
        setErrorMessage('Invalid Admin ID or Password');
        return;
      }

      const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' });
      const user = await api.getCurrentUser();
      if (user && (user.role === 'admin' || user.role === 'coordinator')) {
        setStatus('success');
        router.replace('/admin');
      } else {
        setStatus('authentication-error');
        setErrorMessage('Access Denied: Your account does not have Admin or Case Manager privileges.');
      }
    } catch (error) {
      setStatus('authentication-error');
      setErrorMessage('Invalid Admin ID or Password');
    }
  };

  return (
    <AuthShell title="Admin Portal" subtitle="Command Center Access for Hackathon Demo & Operations">
      <View className="gap-5">
        {/* Security Banner */}
        <View className="rounded-xl bg-navy/5 p-3.5 border border-navy/10 flex-row items-center gap-3">
          <ShieldAlert color="#0F172A" size={20} />
          <Text className="text-xs font-medium text-navy flex-1">
            Demo Credentials: ID <Text className="font-bold text-navy">admin@123</Text> | Password <Text className="font-bold text-navy">admin@123</Text>
          </Text>
        </View>

        <AuthFeedback status={status} message={errorMessage} />

        {/* Admin ID Input */}
        <Input
          label="Admin ID / Username"
          accessibilityLabel="Admin ID"
          autoCapitalize="none"
          autoComplete="username"
          placeholder="admin@123"
          icon={Mail}
          value={adminId}
          onChangeText={setAdminId}
          error={errors.adminId}
        />

        {/* Password Input with Show/Hide Toggle */}
        <View className="relative">
          <Input
            label="Password"
            accessibilityLabel="Password"
            autoComplete="password"
            placeholder="admin@123"
            icon={LockKeyhole}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-9 p-1"
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff color="#64748B" size={19} /> : <Eye color="#64748B" size={19} />}
          </Pressable>
        </View>

        {/* Login Action */}
        <Button label="Login to Command Center" fullWidth onPress={submit} />

        {/* Navigation Return */}
        <View className="items-center pt-2">
          <Button label="Return to Public Landing" variant="ghost" fullWidth onPress={() => router.push('/landing')} />
        </View>
      </View>
    </AuthShell>
  );
}
