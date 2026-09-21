import { ArrowRight, KeyRound, QrCode } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function JoinCaseScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const inputs = useRef<Array<TextInput | null>>([]);
  const updateCode = (index: number, value: string) => {
    const next = value.replace(/\D/g, '').slice(-1);
    const chars = code.padEnd(6, ' ').split('');
    chars[index] = next;
    const joined = chars.join('').replace(/ /g, '');
    setCode(joined);
    setError('');
    if (next && index < 5) inputs.current[index + 1]?.focus();
  };
  const submitCode = () => {
    if (code.length !== 6) { setError('Enter all 6 digits to continue.'); return; }
    router.push({ pathname: '/case-preview', params: { token: code } });
  };
  return <SafeAreaView className="flex-1 bg-background"><ScrollView contentContainerClassName="px-6 pb-10" showsVerticalScrollIndicator={false}><View className="pt-7"><Text className="text-xs font-bold uppercase tracking-[2px] text-teal">Join a response</Text><Text className="mt-3 text-3xl font-bold text-navy">Join Case</Text><Text className="mt-3 text-base leading-6 text-muted">Use an authorized invite to view case information and join the right search effort.</Text></View><View className="mt-8 gap-3"><Card onPress={() => router.push('/qr-scanner')} className="flex-row items-center gap-4"><View className="h-12 w-12 items-center justify-center rounded-xl bg-blue-50"><QrCode stroke="#2563EB" size={23} /></View><View className="flex-1"><Text className="text-base font-bold text-navy">Scan QR</Text><Text className="mt-1 text-sm text-muted">Scan an invite token from an authorized coordinator.</Text></View><ArrowRight stroke="#2563EB" size={19} /></Card><View className="items-center py-2"><Text className="text-xs font-bold uppercase tracking-[1.5px] text-muted">or enter code</Text></View><Card><View className="flex-row items-center gap-3"><KeyRound stroke="#0D9488" size={20} /><Text className="text-base font-bold text-navy">6-Digit Code</Text></View><View className="mt-5 flex-row justify-between">{Array.from({ length: 6 }, (_, index) => <TextInput key={index} ref={(ref) => { inputs.current[index] = ref; }} accessibilityLabel={`Code digit ${index + 1}`} autoFocus={index === 0} keyboardType="number-pad" maxLength={1} textContentType="oneTimeCode" className={`h-14 w-[13%] rounded-xl border bg-background-muted text-center text-xl font-bold text-navy ${error ? 'border-danger' : 'border-border'}`} value={code[index] ?? ''} onChangeText={(value) => updateCode(index, value)} onKeyPress={({ nativeEvent }) => { if (nativeEvent.key === 'Backspace' && !code[index] && index > 0) inputs.current[index - 1]?.focus(); }} />)}</View>{error ? <Text className="mt-3 text-sm text-danger">{error}</Text> : null}<View className="mt-5"><Button label="Continue" fullWidth onPress={submitCode} /></View></Card></View><Text className="mt-7 text-center text-xs leading-5 text-muted">Only share invite codes with people you trust. The backend will verify the token before access is granted.</Text></ScrollView></SafeAreaView>;
}
