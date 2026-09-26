import { Info, Sparkles } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { BackButton } from '@/components/BackButton';
import { DynamicPriorityCard } from '@/components/DynamicPriorityCard';
import { createApiClient } from '@/services/api';
import type { AIPriorityResult } from '@/services/aiPriority';

export default function AIPriorityScreen() {
  const { caseId } = useLocalSearchParams<{ caseId?: string }>();
  const [results, setResults] = useState<AIPriorityResult[]>([]);
  const [error, setError] = useState<string>();
  useEffect(() => { if (!caseId) return; createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' }).getSearchPriority(caseId).then(setResults).catch(() => setError('Search intelligence is temporarily unavailable.')); }, [caseId]);
  return <SafeAreaView className="flex-1 bg-background" edges={['top']}><ScrollView contentContainerClassName="px-5 pb-10" showsVerticalScrollIndicator={false}><Animated.View entering={FadeInDown.duration(450).easing(Easing.out(Easing.cubic))} className="pt-6"><BackButton fallbackRoute="/case-details" variant="ghost" className="mb-3" /><View className="flex-row items-center gap-2"><View className="rounded-xl bg-navy p-2.5"><Sparkles stroke="#5EEAD4" size={19} /></View><Text className="text-xs font-bold uppercase tracking-[2px] text-teal">Search intelligence</Text></View><Text className="mt-4 text-3xl font-bold text-navy">AI-Assisted Search Priority</Text><Text className="mt-3 text-base leading-6 text-muted">Decision support to help human teams choose where attention may be most useful next.</Text></Animated.View><Card className="mt-6 flex-row items-start gap-3 border-blue-100 bg-blue-50"><Info stroke="#2563EB" size={20} /><Text className="flex-1 text-sm font-semibold leading-5 text-navy">Search priority is a recommendation, not an exact location prediction.</Text></Card>{error ? <Text className="mt-6 text-sm text-danger">{error}</Text> : results.length ? <View className="mt-5 gap-3">{results.map((result) => <DynamicPriorityCard key={result.zoneId} result={result} changed={false} />)}</View> : <Text className="mt-8 text-center text-sm text-muted">No search priority is available for this case yet.</Text>}</ScrollView></SafeAreaView>;
}
