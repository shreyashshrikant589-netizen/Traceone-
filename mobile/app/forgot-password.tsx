import { CheckCircle2, Mail } from 'lucide-react-native';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AuthFeedback } from '@/components/AuthFeedback';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import type { AuthStatus } from '@/services/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [error, setError] = useState<string>();
  const submit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      setStatus('validation-error');
      return;
    }
    setError(undefined);
    setStatus('success');
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we’ll help you get back into your account.">
      {status === 'success' ? (
        <View className="items-center rounded-2xl border border-green-100 bg-green-50 px-6 py-8">
          <CheckCircle2 stroke="#16A34A" size={36} />
          <Text className="mt-4 text-xl font-bold text-navy">Check your inbox</Text>
          <Text className="mt-2 text-center text-sm leading-5 text-muted">If an account exists for {email}, you’ll receive password reset instructions.</Text>
          <View className="mt-5 w-full"><Link href="/auth" asChild><Button label="Back to Sign In" fullWidth /></Link></View>
        </View>
      ) : (
        <View className="gap-5">
          <AuthFeedback status={status} message={status === 'network-error' ? 'We could not reach the reset service.' : undefined} />
          <Input label="Email" accessibilityLabel="Email address" autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@example.com" icon={Mail} value={email} onChangeText={(value) => { setEmail(value); setError(undefined); setStatus('idle'); }} error={error} />
          <Button label="Send Reset Link" fullWidth onPress={submit} />
          <Link href="/auth" asChild><Text className="self-center text-sm font-semibold text-blue">Back to Sign In</Text></Link>
        </View>
      )}
    </AuthShell>
  );
}
