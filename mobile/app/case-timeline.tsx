import { ArrowLeft, Clock3 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { CaseTimeline } from '@/components/CaseTimeline';
import { StatusBadge } from '@/components/StatusBadge';
import { mockCaseDetail, mockCaseTimeline } from '@/services/mockCaseDetails';

export default function CaseTimelineScreen() {
  const router = useRouter();
  return <SafeAreaView className="flex-1 bg-background" edges={['top']}><ScrollView contentContainerClassName="px-5 pb-10" showsVerticalScrollIndicator={false}><Pressable accessibilityLabel="Go back" accessibilityRole="button" className="mt-4 h-10 w-10 items-center justify-center rounded-xl border border-border" onPress={() => router.back()}><ArrowLeft stroke="#0F172A" size={20} /></Pressable><View className="mt-6"><Text className="text-xs font-bold uppercase tracking-[2px] text-teal">Case timeline</Text><Text className="mt-2 text-3xl font-bold text-navy">{mockCaseDetail.name}</Text><View className="mt-3 flex-row items-center gap-3"><StatusBadge status={mockCaseDetail.status} compact /><View className="flex-row items-center gap-1"><Clock3 stroke="#64748B" size={14} /><Text className="text-xs text-muted">12 events</Text></View></View></View><Card className="mt-6 border-red-100 bg-red-50"><Text className="text-sm font-bold text-danger">Human verification in progress</Text><Text className="mt-1 text-sm leading-5 text-muted">The latest possible match remains subject to human review before action is taken.</Text></Card><View className="mt-8"><CaseTimeline events={mockCaseTimeline} /></View></ScrollView></SafeAreaView>;
}
