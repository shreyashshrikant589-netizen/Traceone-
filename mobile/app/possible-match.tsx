import { AlertTriangle, UserRound } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { BackButton } from '@/components/BackButton';
import { createApiClient } from '@/services/api';
import type { PossibleMatch } from '@/services/possibleMatch';

export default function PossibleMatchScreen() {
  const { caseId, matchId } = useLocalSearchParams<{ caseId?: string; matchId?: string }>();
  const [match, setMatch] = useState<PossibleMatch | null>();
  const [error, setError] = useState<string>();
  const [reviewing, setReviewing] = useState(false);
  const review = async (decision: 'CONFIRM' | 'REJECT') => {
    if (!caseId || !matchId) return;
    setReviewing(true);
    try {
      await createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' }).reviewPossibleMatch(caseId, matchId, decision);
      setMatch((current) => current ? { ...current, status: decision === 'CONFIRM' ? 'CONFIRMED' : 'REJECTED' } : current);
    } catch {
      setError('This possible match could not be reviewed.');
    } finally {
      setReviewing(false);
    }
  };
  useEffect(() => { if (!caseId) return; createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' }).getPossibleMatch(caseId).then(setMatch).catch(() => setError('Possible match data is temporarily unavailable.')); }, [caseId]);
  return <SafeAreaView className="flex-1 bg-background" edges={['top']}><ScrollView contentContainerClassName="px-5 pb-10"><View className="pt-5"><BackButton fallbackRoute="/admin" variant="ghost" className="mb-3" /><Text className="text-xs font-bold uppercase tracking-[2px] text-teal">Human review</Text><Text className="mt-2 text-3xl font-bold text-navy">Possible Match</Text><Text className="mt-2 text-base leading-6 text-muted">A signal requires careful review by an authorized manager.</Text></View><Card className="mt-6 border-red-100 bg-red-50"><View className="flex-row items-center gap-3"><AlertTriangle stroke="#DC2626" size={24} /><Text className="flex-1 text-base font-bold text-danger">HUMAN VERIFICATION REQUIRED</Text></View><Text className="mt-3 text-sm leading-5 text-muted">This is not an identity confirmation. AI does not independently confirm a person’s identity.</Text></Card>{error ? <Text className="mt-6 text-sm text-danger">{error}</Text> : match ? <Card className="mt-4"><View className="h-40 items-center justify-center bg-navy"><UserRound stroke="#FFFFFF" size={38} /></View><Text className="mt-4 text-base font-bold text-navy">Status: {match.status ?? 'REVIEW_REQUIRED'}</Text><Text className="mt-2 text-sm text-muted">Similarity: {match.similarity_score === null || match.similarity_score === undefined ? 'Not provided' : match.similarity_score}</Text><Text className="mt-2 text-sm text-muted">Model: {match.model_version ?? 'No automated model available'}</Text>{matchId && (match.status === 'PENDING' || match.status === 'REVIEW_REQUIRED') ? <View className="mt-5 flex-row gap-3"><Pressable disabled={reviewing} className="flex-1 rounded-xl bg-teal p-3" onPress={() => void review('CONFIRM')}><Text className="text-center font-bold text-white">Confirm</Text></Pressable><Pressable disabled={reviewing} className="flex-1 rounded-xl bg-danger p-3" onPress={() => void review('REJECT')}><Text className="text-center font-bold text-white">Reject</Text></Pressable></View> : null}</Card> : <Text className="mt-8 text-center text-sm text-muted">No possible match is available.</Text>}</ScrollView></SafeAreaView>;
}
