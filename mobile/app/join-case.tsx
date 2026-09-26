import { ArrowRight, KeyRound, QrCode } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { BackButton } from '@/components/BackButton';
import { Card } from '@/components/Card';

export default function JoinCaseScreen() {
  const router = useRouter();
  const { caseId } = useLocalSearchParams<{ caseId?: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const inputs = useRef<Array<TextInput | null>>([]);

  const updateCode = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 1) {
      // User pasted multiple digits
      const full = digits.slice(0, 6);
      setCode(full);
      setError('');
      const targetFocus = Math.min(full.length, 5);
      inputs.current[targetFocus]?.focus();
      return;
    }

    const next = digits.slice(-1);
    const chars = code.padEnd(6, ' ').split('');
    chars[index] = next;
    const joined = chars.join('').replace(/ /g, '');
    setCode(joined);
    setError('');
    if (next && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const submitCode = () => {
    const clean = code.trim();
    if (clean.length !== 6) {
      setError('Please enter all 6 digits to continue.');
      return;
    }
    router.push({ pathname: '/case-preview', params: { token: clean, caseId } });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-6 pb-12" showsVerticalScrollIndicator={false}>
        <View className="pt-5">
          <BackButton fallbackRoute="/volunteer" variant="ghost" className="mb-3" />
          <Text className="text-xs font-bold uppercase tracking-[2px] text-teal">Join a Response</Text>
          <Text className="mt-2 text-3xl font-extrabold text-navy">Join Case</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            Enter an authorized 6-digit code or scan the coordinator's QR code to join an active search operation.
          </Text>
        </View>

        <View className="mt-7 gap-4">
          {/* Scan QR Option */}
          <Card onPress={() => router.push('/qr-scanner')} className="flex-row items-center gap-4 bg-blue-50/40 border border-blue-100">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <QrCode stroke="#2563EB" size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-navy">Scan QR Code</Text>
              <Text className="mt-0.5 text-xs text-muted">Scan the invite code displayed on the case manager's screen.</Text>
            </View>
            <ArrowRight stroke="#2563EB" size={19} />
          </Card>

          <View className="items-center py-1">
            <Text className="text-xs font-bold uppercase tracking-[1.5px] text-muted">or enter 6-digit code</Text>
          </View>

          {/* 6-Digit Code Input */}
          <Card className="p-5">
            <View className="flex-row items-center gap-2.5">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                <KeyRound stroke="#0D9488" size={18} />
              </View>
              <Text className="text-base font-bold text-navy">6-Digit Join Code</Text>
            </View>

            <View className="mt-5 flex-row justify-between">
              {Array.from({ length: 6 }, (_, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputs.current[index] = ref;
                  }}
                  accessibilityLabel={`Code digit ${index + 1}`}
                  autoFocus={index === 0}
                  keyboardType="number-pad"
                  maxLength={6}
                  textContentType="oneTimeCode"
                  className={`h-14 w-[13.5%] rounded-xl border bg-background-muted text-center text-xl font-black text-navy ${
                    error ? 'border-danger' : 'border-border'
                  }`}
                  value={code[index] ?? ''}
                  onChangeText={(val) => updateCode(index, val)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
                      inputs.current[index - 1]?.focus();
                    }
                  }}
                />
              ))}
            </View>

            {error ? <Text className="mt-3 text-xs font-semibold text-danger">{error}</Text> : null}

            <View className="mt-6">
              <Button label="Continue to Case Preview" fullWidth onPress={submitCode} />
            </View>
          </Card>
        </View>

        <Text className="mt-8 text-center text-xs leading-5 text-muted">
          Only join cases from trusted coordinators. All volunteer access is verified through the TraceOne security network.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
