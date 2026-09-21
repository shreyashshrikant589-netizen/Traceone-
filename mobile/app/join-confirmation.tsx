import { CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, Text, View } from 'react-native';
import { Button } from '@/components/Button';

export default function JoinConfirmationScreen() {
  const router = useRouter();
  return <SafeAreaView className="flex-1 bg-background"><View className="flex-1 items-center justify-center px-7"><View className="h-20 w-20 items-center justify-center rounded-full bg-green-50"><CheckCircle2 stroke="#16A34A" size={42} /></View><Text className="mt-6 text-2xl font-bold text-navy">Join request sent</Text><Text className="mt-3 text-center text-base leading-6 text-muted">Your request is ready for backend validation. The case will appear in your workspace once access is confirmed.</Text><View className="mt-8 w-full"><Button label="Back to Cases" fullWidth onPress={() => router.replace('/main/cases')} /></View></View></SafeAreaView>;
}
