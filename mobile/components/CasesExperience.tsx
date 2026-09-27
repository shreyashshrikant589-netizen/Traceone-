import { ArrowDownUp, Filter, Plus, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from './Button';
import { Card } from './Card';
import { EmptyState } from './EmptyState';
import { StatusBadge, type StatusBadgeStatus } from './StatusBadge';
import { mockCases, type MockCase, type MockCaseStatus } from '@/services/mockCases';

type CaseTab = 'Active' | 'Completed' | 'Public';
const tabStatuses: Record<CaseTab, MockCaseStatus[]> = { Active: ['LOCAL_SEARCH', 'PUBLIC_ESCALATION_PENDING'], Completed: ['SEARCH_COMPLETED', 'CASE_RESOLVED'], Public: ['PUBLIC_SEARCH'] };

export function CasesExperience() {
  const router = useRouter();
  const [tab, setTab] = useState<CaseTab>('Active');
  const [query, setQuery] = useState('');
  const [sortNewest, setSortNewest] = useState(true);
  const cases = useMemo(() => mockCases.filter((item) => tabStatuses[tab].includes(item.status)).filter((item) => `${item.name} ${item.location}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sortNewest ? a.updated.localeCompare(b.updated) : b.updated.localeCompare(a.updated)), [query, sortNewest, tab]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-start justify-between pt-5"><View><Text className="text-3xl font-bold text-navy">Cases</Text><Text className="mt-2 text-base text-muted">Keep every search organized and moving.</Text></View><Pressable accessibilityLabel="Create case" accessibilityRole="button" className="rounded-xl bg-blue p-3 active:opacity-80" onPress={() => router.push('/create-case')}><Plus stroke="#FFFFFF" size={21} /></Pressable></View>
        <View className="mt-6 flex-row rounded-xl bg-background-muted p-1">{(['Active', 'Completed', 'Public'] as CaseTab[]).map((item) => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: tab === item }} className={`flex-1 items-center rounded-lg py-2.5 ${tab === item ? 'bg-surface shadow-sm' : ''}`} onPress={() => setTab(item)}><Text className={`text-sm font-semibold ${tab === item ? 'text-navy' : 'text-muted'}`}>{item}</Text></Pressable>)}</View>
        <View className="mt-5 flex-row items-center gap-2"><View className="flex-1 flex-row items-center rounded-xl border border-border bg-surface px-3"><Search stroke="#64748B" size={18} /><TextInput accessibilityLabel="Search cases" className="flex-1 px-2 py-3 text-sm text-navy" placeholder="Search cases" placeholderTextColor="#64748B" value={query} onChangeText={setQuery} /></View><Pressable accessibilityLabel="Filter cases" accessibilityRole="button" className="rounded-xl border border-border bg-surface p-3"><Filter stroke="#0F172A" size={19} /></Pressable><Pressable accessibilityLabel="Sort cases" accessibilityRole="button" className="rounded-xl border border-border bg-surface p-3" onPress={() => setSortNewest((value) => !value)}><ArrowDownUp stroke="#0F172A" size={19} /></Pressable></View>
        <View className="mt-6 gap-3">{cases.map((item) => <CaseListCard key={item.name} item={item} />)}{!cases.length ? <EmptyState title="No cases found" description="Try another tab or adjust your search." /> : null}</View>
        <View className="mt-6"><Button label="Create Case" icon={Plus} fullWidth onPress={() => router.push('/create-case')} /></View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CaseListCard({ item }: { item: MockCase }) {
  const router = useRouter();
  return <Card onPress={() => router.push('/case-details')}><View className="flex-row items-start justify-between gap-3"><View className="flex-1"><Text className="text-lg font-bold text-navy">{item.name}</Text><Text className="mt-1 text-sm text-muted">Age {item.age} · {item.location}</Text></View><StatusBadge status={item.status as StatusBadgeStatus} compact /></View><View className="mt-4 gap-2 border-t border-border pt-3"><Info label="Last seen" value={`${item.time} · ${item.location}`} /><Info label="Search priority" value={item.priority} valueClass={item.priority === 'Critical' ? 'text-danger' : 'text-warning'} /><Info label="Updated" value={item.updated} /></View></Card>;
}
function Info({ label, value, valueClass = 'text-navy' }: { label: string; value: string; valueClass?: string }) { return <View className="flex-row justify-between gap-3"><Text className="text-xs text-muted">{label}</Text><Text className={`flex-1 text-right text-xs font-semibold ${valueClass}`}>{value}</Text></View>; }
