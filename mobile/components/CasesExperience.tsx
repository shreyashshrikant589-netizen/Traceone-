import { ArrowDownUp, Filter, MapPin, Plus, Search, ShieldCheck, UserCheck, UsersRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from './Button';
import { Card } from './Card';
import { EmptyState } from './EmptyState';
import { StatusBadge, type StatusBadgeStatus } from './StatusBadge';
import { createApiClient } from '@/services/api';
import { getOfflineCases } from '@/services/offlineSync';
import type { Case } from '@/types';

type CaseCategoryTab = 'All' | 'Created by Me' | 'Joined Cases' | 'Active Searches' | 'Completed';

interface ExtendedCase extends Case {
  relationship: 'Creator' | 'Volunteer' | 'Participant';
  assignedZone?: string;
  location?: string;
  age?: number;
  priority?: string;
  time?: string;
}

export function CasesExperience() {
  const router = useRouter();
  const [tab, setTab] = useState<CaseCategoryTab>('All');
  const [query, setQuery] = useState('');
  const [sortNewest, setSortNewest] = useState(true);
  const [casesList, setCasesList] = useState<ExtendedCase[]>([]);

  useEffect(() => {
    const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' });
    Promise.all([
      api.listCases().catch(() => []),
      api.getCurrentUser().catch(() => null),
      getOfflineCases().catch(() => []),
    ]).then(([res, currentUser, offlineCases]) => {
      const offlineMapped: ExtendedCase[] = (offlineCases || []).map((c) => ({
        ...c,
        relationship: 'Creator',
        location: 'Local / Offline Saved',
        priority: 'High',
        time: 'Offline · Sync Pending',
      }));
      const onlineMapped: ExtendedCase[] = (res || []).map((c) => {
        const isOwner = currentUser?.id && (c.coordinatorId === currentUser.id || (c as any).created_by === currentUser.id || (c as any).case_manager_id === currentUser.id);
          const prio = String((c as any).priority || '').toUpperCase();
        return {
          ...c,
          relationship: isOwner ? 'Creator' : 'Volunteer',
          location: (c as any).venue_name || (c as any).event_name || 'Community Search Area',
          age: (c as any).age ?? 24,
          priority: prio === 'CRITICAL' ? 'Critical' : prio === 'HIGH' ? 'High' : 'Standard',
          time: (c as any).last_seen_at ? new Date((c as any).last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
          assignedZone: (c as any).assignedZone,
        };
      });
      setCasesList([...offlineMapped, ...onlineMapped]);
    }).catch(async () => {
      const offlineCases = await getOfflineCases().catch(() => []);
      const offlineMapped: ExtendedCase[] = (offlineCases || []).map((c) => ({
        ...c,
        relationship: 'Creator',
        location: 'Local / Offline Saved',
        priority: 'High',
        time: 'Offline · Sync Pending',
      }));
      setCasesList(offlineMapped);
    });
  }, []);

  const filteredCases = useMemo(() => {
    return casesList
      .filter((item) => {
        if (tab === 'Created by Me') return item.relationship === 'Creator';
        if (tab === 'Joined Cases') return item.relationship === 'Volunteer' || item.relationship === 'Participant';
        if (tab === 'Active Searches') return !['RESOLVED', 'CLOSED', 'resolved'].includes(String(item.status));
        if (tab === 'Completed') return ['RESOLVED', 'CLOSED', 'resolved'].includes(String(item.status));
        return true;
      })
      .filter((item) => `${item.title} ${item.location || ''} ${item.description || ''}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (sortNewest ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)));
  }, [casesList, query, sortNewest, tab]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="px-5 pb-12" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-start justify-between pt-5">
          <View>
            <View className="flex-row items-center gap-2">
              <View className="h-6 px-2.5 rounded-full bg-navy items-center justify-center">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-sky-400">MY CASES</Text>
              </View>
            </View>
            <Text className="mt-1.5 text-3xl font-bold text-navy">Cases Workspace</Text>
            <Text className="mt-1 text-base text-muted">Manage your created cases and joined search operations.</Text>
          </View>
          <Pressable
            accessibilityLabel="Create case"
            accessibilityRole="button"
            className="rounded-xl bg-blue p-3 active:opacity-80"
            onPress={() => router.push('/create-case')}
          >
            <Plus stroke="#FFFFFF" size={21} />
          </Pressable>
        </View>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-6 flex-row py-1">
          {(['All', 'Created by Me', 'Joined Cases', 'Active Searches', 'Completed'] as CaseCategoryTab[]).map((item) => (
            <Pressable
              key={item}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === item }}
              className={`mr-2 px-3.5 py-2 rounded-xl border ${
                tab === item ? 'bg-navy border-navy' : 'bg-white border-slate-200'
              }`}
              onPress={() => setTab(item)}
            >
              <Text className={`text-xs font-bold ${tab === item ? 'text-white' : 'text-navy'}`}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Search & Filters */}
        <View className="mt-4 flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center rounded-xl border border-border bg-surface px-3">
            <Search stroke="#64748B" size={18} />
            <TextInput
              accessibilityLabel="Search cases"
              className="flex-1 px-2 py-3 text-sm text-navy"
              placeholder="Search by name, location..."
              placeholderTextColor="#64748B"
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <Pressable
            accessibilityLabel="Sort cases"
            accessibilityRole="button"
            className="rounded-xl border border-border bg-surface p-3"
            onPress={() => setSortNewest((val) => !val)}
          >
            <ArrowDownUp stroke="#0F172A" size={19} />
          </Pressable>
        </View>

        {/* Case List */}
        <View className="mt-6 gap-3">
          {filteredCases.map((item) => (
            <CaseCardItem key={item.id} item={item} />
          ))}
          {!filteredCases.length ? (
            <EmptyState title="No cases found" description="No cases match the selected filter category." />
          ) : null}
        </View>

        <View className="mt-6">
          <Button label="Create New Case" icon={Plus} fullWidth onPress={() => router.push('/create-case')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CaseCardItem({ item }: { item: ExtendedCase }) {
  const router = useRouter();
  const isCreator = item.relationship === 'Creator';
  const isResolved = ['RESOLVED', 'CLOSED', 'resolved'].includes(String(item.status));

  return (
    <Card className={`p-4 border-l-4 ${isCreator ? 'border-l-blue-600' : 'border-l-teal'}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 flex-wrap mb-1">
            <View className={`px-2 py-0.5 rounded-full ${isCreator ? 'bg-blue-50 border border-blue-200' : 'bg-teal-50 border border-teal-200'}`}>
              <Text className={`text-[10px] font-bold ${isCreator ? 'text-blue-700' : 'text-teal-800'}`}>
                {isCreator ? 'CASE MANAGER (CREATOR)' : 'VOLUNTEER (PARTICIPANT)'}
              </Text>
            </View>
          </View>
          <Text className="text-xl font-bold text-navy">{item.title}</Text>
          <Text className="mt-1 text-sm text-muted">
            Age {item.age ?? 24} · {item.location ?? 'Community Search Area'}
          </Text>
        </View>
        <StatusBadge status={isResolved ? 'CASE_RESOLVED' : 'LOCAL_SEARCH'} compact />
      </View>

      {item.assignedZone ? (
        <View className="mt-3 p-2.5 rounded-lg bg-teal-50/60 border border-teal-100 flex-row items-center gap-2">
          <MapPin stroke="#0D9488" size={15} />
          <Text className="text-xs font-semibold text-teal-900 flex-1">
            Assigned Zone: {item.assignedZone}
          </Text>
        </View>
      ) : null}

      <View className="mt-4 gap-2 border-t border-border pt-3">
        <Row label="Last seen" value={item.time ?? 'Today, 08:40 AM'} />
        <Row label="Priority" value={item.priority ?? 'High'} valueClass={item.priority === 'Critical' ? 'text-danger' : 'text-warning'} />
      </View>

      <View className="mt-4 flex-row gap-2">
        <Button
          label="Open Case Workspace"
          fullWidth
          onPress={() => router.push({ pathname: '/case-details', params: { caseId: item.id } })}
        />
      </View>
    </Card>
  );
}

function Row({ label, value, valueClass = 'text-navy' }: { label: string; value: string; valueClass?: string }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-xs text-muted">{label}</Text>
      <Text className={`flex-1 text-right text-xs font-semibold ${valueClass}`}>{value}</Text>
    </View>
  );
}
