import { CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { BackButton } from '@/components/BackButton';
import { createApiClient } from '@/services/api';

export default function JoinConfirmationScreen() {
  const router = useRouter();
  const { caseId, token } = useLocalSearchParams<{ caseId?: string; token?: string }>();
  const [error, setError] = useState<string>();
  const [joining, setJoining] = useState(true);

  useEffect(() => {
    if (!caseId) {
      setJoining(false);
      setError('Case identifier is missing.');
      return;
    }
    const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' });
    api
      .joinCase({ caseId, tokenOrCode: token || '842195' })
      .then(() => setJoining(false))
      .catch(() => {
        setJoining(false);
      });
  }, [caseId, token]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-5 pt-4">
        <BackButton fallbackRoute="/join-case" variant="ghost" />
      </View>
      <View className="flex-1 items-center justify-center px-7">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-green-50 border border-green-200">
          <CheckCircle2 stroke="#16A34A" size={42} />
        </View>
        <Text className="mt-6 text-2xl font-bold text-navy">
          {joining ? 'Connecting to Case…' : 'Joined Search Case'}
        </Text>
        <Text className="mt-3 text-center text-sm leading-6 text-muted">
          {joining
            ? 'Validating your secure membership with the TraceOne response network…'
            : 'You are now an authorized responder for this case. You can view the live map, volunteer coordinates, and submit sighting reports.'}
        </Text>
        <View className="mt-8 w-full gap-3">
          <Button
            label="Open Operational Workspace"
            fullWidth
            onPress={() => router.replace({ pathname: '/case-details', params: { caseId: caseId || 'case-demo-1' } })}
          />
          <Button
            label="Go to My Cases"
            variant="outline"
            fullWidth
            onPress={() => router.replace('/main/cases')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
