import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell, ChevronRight, CirclePlus, QrCode, ScanLine, UserRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { StatusBadge, type StatusBadgeStatus } from '@/components/StatusBadge';
import { ROLE_STORAGE_KEY, type UserRole } from '@/services/roles';
import { mockDashboard } from '@/services/mockDashboard';

const actionIcons = { 'Create Case': CirclePlus, 'Join Case': UserRound, 'Scan QR': QrCode, 'Report Sighting': ScanLine } as const;

export default function MainHomeScreen() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('VOLUNTEER');
  useEffect(() => { AsyncStorage.getItem(ROLE_STORAGE_KEY).then((value) => { if (value) setRole(value as UserRole); }); }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(450).easing(Easing.out(Easing.cubic))} className="flex-row items-center justify-between pb-6 pt-4">
          <View><Text className="text-sm font-medium text-muted">Good morning,</Text><Text className="mt-1 text-2xl font-bold text-navy">{mockDashboard.user.name}</Text></View>
          <View className="flex-row items-center gap-3"><Pressable accessibilityLabel="Notifications" accessibilityRole="button" className="rounded-xl border border-border bg-surface p-2.5" onPress={() => router.push('/main/notifications')}><Bell stroke="#0F172A" size={20} /></Pressable><View className="h-11 w-11 items-center justify-center rounded-full bg-navy"><Text className="text-base font-bold text-white">{mockDashboard.user.initials}</Text></View></View>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(80).duration(450)}>
          <View className="mb-3 flex-row items-center justify-between"><Text className="text-lg font-bold text-navy">Active search</Text><StatusBadge status={mockDashboard.activeSearch.status as StatusBadgeStatus} compact /></View>
          <Card className="overflow-hidden bg-navy p-0">
            <View className="p-5"><View className="flex-row items-start justify-between"><View><Text className="text-xs font-bold uppercase tracking-[1.5px] text-teal-light">{mockDashboard.activeSearch.caseName}</Text><Text className="mt-2 text-xl font-bold text-white">Continue your search</Text></View><View className="rounded-xl bg-white/10 p-2.5"><SearchPin /></View></View><View className="mt-6 flex-row gap-5"><Metric label="Zone" value={mockDashboard.activeSearch.zone} /><Metric label="Priority" value={mockDashboard.activeSearch.priority} /></View><View className="mt-5"><View className="mb-2 flex-row justify-between"><Text className="text-xs text-slate-300">Search progress</Text><Text className="text-xs font-bold text-teal-light">{mockDashboard.activeSearch.progress}%</Text></View><View className="h-2 rounded-full bg-white/15"><View className="h-full rounded-full bg-teal-light" style={{ width: `${mockDashboard.activeSearch.progress}%` }} /></View></View></View><Pressable accessibilityRole="button" className="flex-row items-center justify-between border-t border-white/10 px-5 py-4 active:bg-white/5" onPress={() => router.push('/main/search')}><Text className="font-semibold text-white">Continue Search</Text><ChevronRight stroke="#5EEAD4" size={19} /></Pressable>
          </Card>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(160).duration(450)} className="mt-7"><Text className="mb-3 text-lg font-bold text-navy">Quick actions</Text><View className="flex-row flex-wrap gap-3">{mockDashboard.quickActions.map((label) => { const Icon = actionIcons[label]; return <Pressable key={label} accessibilityLabel={label} accessibilityRole="button" className="min-h-[88px] min-w-[140px] flex-1 rounded-xl border border-border bg-surface p-4 shadow-sm active:bg-background-muted" onPress={label === 'Join Case' ? () => router.push('/join-case') : label === 'Create Case' ? () => router.push('/create-case') : undefined}><Icon stroke="#2563EB" size={20} /><Text className="mt-3 text-sm font-semibold text-navy">{label}</Text></Pressable>; })}</View></Animated.View>
        <Animated.View entering={FadeInDown.delay(240).duration(450)} className="mt-7"><SectionTitle title="Active cases" action="View all" onPress={() => router.push('/main/cases')} />{mockDashboard.activeCases.map((item) => <Card key={item.reference} className="mb-3"><View className="flex-row items-start justify-between"><View><Text className="text-base font-bold text-navy">{item.name}</Text><Text className="mt-1 text-sm text-muted">{item.reference} · {item.zone}</Text></View><StatusBadge status={item.status === 'In progress' ? 'IN_PROGRESS' : 'ASSIGNED'} compact /></View><View className="mt-4 flex-row items-center justify-between"><Text className="text-xs text-muted">Priority</Text><Text className="text-xs font-semibold text-warning">{item.priority}</Text></View></Card>)}</Animated.View>
        {role === 'VOLUNTEER' ? <VolunteerSection /> : null}
        {role === 'CASE_MANAGER' || role === 'ADMIN' ? <ManagerSection /> : null}
        {role === 'REPORTER' ? <ReporterSection /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SearchPin() { return <View className="h-5 w-5 items-center justify-center rounded-full border-2 border-teal-light"><View className="h-2 w-2 rounded-full bg-teal-light" /></View>; }
function Metric({ label, value }: { label: string; value: string }) { return <View className="flex-1"><Text className="text-xs text-slate-400">{label}</Text><Text className="mt-1 text-sm font-semibold text-white" numberOfLines={1}>{value}</Text></View>; }
function SectionTitle({ title, action, onPress }: { title: string; action: string; onPress: () => void }) { return <View className="mb-3 flex-row items-center justify-between"><Text className="text-lg font-bold text-navy">{title}</Text><Pressable accessibilityRole="button" onPress={onPress}><Text className="text-sm font-semibold text-blue">{action}</Text></Pressable></View>; }
function VolunteerSection() { return <View className="mt-7"><Text className="mb-3 text-lg font-bold text-navy">My assignment</Text><Card><View className="flex-row items-start justify-between"><View><Text className="text-base font-bold text-navy">{mockDashboard.volunteer.zone}</Text><Text className="mt-1 text-sm text-muted">Priority zone · {mockDashboard.volunteer.priority}</Text></View><StatusBadge status="IN_PROGRESS" compact /></View><View className="mt-5 flex-row items-center justify-between"><Text className="text-sm text-muted">Progress</Text><Text className="text-sm font-bold text-teal">{mockDashboard.volunteer.progress}%</Text></View><View className="mt-2 h-2 rounded-full bg-background-muted"><View className="h-full rounded-full bg-teal" style={{ width: `${mockDashboard.volunteer.progress}%` }} /></View></Card></View>; }
function ManagerSection() { const item = mockDashboard.manager; return <View className="mt-7"><Text className="mb-3 text-lg font-bold text-navy">Manager overview</Text><View className="flex-row flex-wrap gap-3">{[['Active cases', item.activeCases], ['Active volunteers', item.activeVolunteers], ['Search coverage', `${item.coverage}%`], ['Priority zones', item.priorityZones], ['Pending escalation', item.pendingEscalation]].map(([label, value]) => <Card key={String(label)} className="w-[47%]"><Text className="text-xs leading-4 text-muted">{label}</Text><Text className="mt-2 text-2xl font-bold text-navy">{value}</Text></Card>)}</View></View>; }
function ReporterSection() { return <View className="mt-7"><Text className="mb-3 text-lg font-bold text-navy">My cases</Text><Card><Text className="text-base font-bold text-navy">{mockDashboard.reporter.cases} active report</Text><Text className="mt-1 text-sm text-muted">Case status</Text><View className="mt-3"><StatusBadge status="LOCAL_SEARCH" compact /></View></Card></View>; }
