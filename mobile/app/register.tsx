import { Check, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AuthFeedback } from '@/components/AuthFeedback';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { PasswordStrength } from '@/components/PasswordStrength';
import type { AuthStatus } from '@/services/auth';
import { authService } from '@/services/auth';

type RegisterErrors = Partial<Record<'fullName' | 'email' | 'phoneNumber' | 'password' | 'confirmPassword' | 'terms', string>>;

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '', termsAccepted: false });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string | undefined>(undefined);
  const update = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    const next: RegisterErrors = {};
    if (!form.fullName.trim()) next.fullName = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (form.phoneNumber.trim().length < 7) next.phoneNumber = 'Enter a valid phone number.';
    if (form.password.length < 8) next.password = 'Use at least 8 characters.';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    if (!form.termsAccepted) next.terms = 'Please acknowledge the terms to continue.';
    setErrors(next);
    if (Object.keys(next).length) {
      setStatus('validation-error');
      return;
    }
    setStatus('loading');
    setFeedbackMessage(undefined);
    const result = await authService.register(form);
    if (result.status === 'success') {
      setStatus('success');
      setFeedbackMessage('Account created successfully! Redirecting...');
      setTimeout(() => {
        router.replace('/auth');
      }, 1200);
    } else {
      setStatus(result.status);
      setFeedbackMessage(result.message ?? 'Registration could not be completed.');
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Join a trusted community helping searches move forward.">
      <View className="gap-5">
        <AuthFeedback status={status} message={feedbackMessage} />
        <Input label="Full Name" accessibilityLabel="Full name" autoComplete="name" placeholder="Your full name" icon={UserRound} value={form.fullName} onChangeText={(value) => update('fullName', value)} error={errors.fullName} />
        <Input label="Email" accessibilityLabel="Email address" autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@example.com" icon={Mail} value={form.email} onChangeText={(value) => update('email', value)} error={errors.email} />
        <Input label="Phone Number" accessibilityLabel="Phone number" autoComplete="tel" keyboardType="phone-pad" placeholder="Your phone number" icon={Phone} value={form.phoneNumber} onChangeText={(value) => update('phoneNumber', value)} error={errors.phoneNumber} />
        <Input label="Password" accessibilityLabel="Password" placeholder="Create a password" icon={LockKeyhole} secureTextEntry value={form.password} onChangeText={(value) => update('password', value)} error={errors.password} />
        <PasswordStrength password={form.password} />
        <Input label="Confirm Password" accessibilityLabel="Confirm password" placeholder="Repeat your password" icon={LockKeyhole} secureTextEntry value={form.confirmPassword} onChangeText={(value) => update('confirmPassword', value)} error={errors.confirmPassword} />
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: form.termsAccepted }} className="flex-row items-start gap-3" onPress={() => update('termsAccepted', !form.termsAccepted)}>
          <View className={`mt-0.5 h-5 w-5 items-center justify-center rounded-md border ${form.termsAccepted ? 'border-blue bg-blue' : 'border-border bg-surface'}`}>{form.termsAccepted ? <Check stroke="#FFFFFF" size={14} strokeWidth={3} /> : null}</View>
          <Text className="flex-1 text-sm leading-5 text-muted">I acknowledge the TraceOne terms and understand that people make the final call.</Text>
        </Pressable>
        {errors.terms ? <Text className="-mt-3 text-sm text-danger">{errors.terms}</Text> : null}
        <Button label="Create Account" fullWidth onPress={submit} />
        <View className="flex-row items-center justify-center gap-1 pt-1"><Text className="text-sm text-muted">Already have an account?</Text><Link href="/auth" asChild><Text className="text-sm font-semibold text-blue">Sign in</Text></Link></View>
      </View>
    </AuthShell>
  );
}
