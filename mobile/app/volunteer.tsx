import {
  ArrowRight,
  Briefcase,
  ChevronRight,
  Compass,
  FilePlus2,
  FolderOpen,
  Info,
  KeyRound,
  PlusCircle,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  WifiOff,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PriorityCard } from '@/components/PriorityCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ZoneCard } from '@/components/ZoneCard';
import { createApiClient } from '@/services/api';
import { getOfflineCases, getPendingOperationsCount } from '@/services/offlineSync';
import { mockAssignment } from '@/services/mockVolunteer';
import type { Case } from '@/types';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function VolunteerAssignmentsScreen() {
  const router = useRouter();
  const assignment = mockAssignment;
  const [activeCases, setActiveCases] = useState<Case[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
      return window.navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' });
    api.listCases()
      .then(async (res) => {
        const offlineCases = await getOfflineCases();
        const merged = [...(offlineCases || []), ...(res || [])];
        if (merged.length > 0) setActiveCases(merged);
      })
      .catch(async () => {
        const offlineCases = await getOfflineCases();
        if (offlineCases.length > 0) setActiveCases(offlineCases);
      });

    void getPendingOperationsCount().then(setPendingSyncCount);
  }, []);

  const displayCases = activeCases;
  const primaryCaseId = displayCases[0]?.id;

  return (
    <AuthenticatedLayout>
      <ScrollView contentContainerClassName="px-5 pb-14" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-5 pb-2">
          <BackButton fallbackRoute="/auth" variant="ghost" className="mb-3" />
          <View className="flex-row items-center gap-2">
            <View className="h-6 px-2.5 rounded-full bg-teal/10 border border-teal/20 items-center justify-center">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-teal">FIELD VOLUNTEER</Text>
            </View>
            {!isOnline && (
              <View className="h-6 px-2.5 rounded-full bg-red-100 border border-red-300 items-center justify-center">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-red-700">OFFLINE MODE</Text>
              </View>
            )}
          </View>
          <Text className="mt-2 text-3xl font-bold text-navy">Volunteer Workspace</Text>
          <Text className="mt-1 text-base leading-6 text-muted">
            Search your assigned zones, join active cases, and report verified observations.
          </Text>
        </View>

        {/* Offline Banner when network is unavailable */}
        {!isOnline && (
          <Card className="mt-4 border-red-200 bg-red-50 p-4">
            <View className="flex-row items-start gap-3">
              <View className="h-9 w-9 rounded-xl bg-red-100 items-center justify-center">
                <WifiOff stroke="#DC2626" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-red-900">🔴 Offline Mode</Text>
                <Text className="mt-0.5 text-xs font-semibold text-red-700">No internet connection</Text>
                <Text className="mt-1 text-xs leading-4 text-red-600">
                  You can still create cases, join searches, and log evidence or sightings. All submissions will be queued securely on this device and synced once connection is restored.
                </Text>
                {pendingSyncCount > 0 && (
                  <View className="mt-2 flex-row items-center gap-1.5">
                    <RefreshCw stroke="#DC2626" size={13} />
                    <Text className="text-xs font-bold text-red-800">{pendingSyncCount} action(s) pending sync</Text>
                  </View>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Quick Actions (Available Online & Offline) */}
        <View className="mt-6">
          <SectionTitle title="Volunteer Actions" subtitle="Essential field actions available online and offline." />
          <View className="flex-row flex-wrap gap-2.5">
            <QuickActionButton
              icon={PlusCircle}
              label="+ Create New Case"
              onPress={() => router.push('/create-case')}
              color="#0D9488"
              bgColor="bg-teal-50"
            />
            <QuickActionButton
              icon={KeyRound}
              label="Join Case"
              onPress={() => router.push('/join-case')}
              color="#2563EB"
              bgColor="bg-blue-50"
            />
            <QuickActionButton
              icon={QrCode}
              label="Scan QR"
              onPress={() => router.push('/qr-scanner')}
              color="#4F46E5"
              bgColor="bg-indigo-50"
            />
            <QuickActionButton
              icon={FolderOpen}
              label="My Cases"
              onPress={() => router.push('/main/cases')}
              color="#0284C7"
              bgColor="bg-sky-50"
            />
            <QuickActionButton
              icon={Compass}
              label="Start Search"
              onPress={() => router.push({ pathname: '/search-session', params: { caseId: primaryCaseId } })}
              color="#059669"
              bgColor="bg-emerald-50"
            />
            <QuickActionButton
              icon={FilePlus2}
              label="Report Evidence"
              onPress={() => router.push({ pathname: '/session-entry', params: { kind: 'evidence', caseId: primaryCaseId } })}
              color="#475569"
              bgColor="bg-slate-100"
            />
            <QuickActionButton
              icon={ScanLine}
              label="Report Sighting"
              onPress={() => router.push({ pathname: '/session-entry', params: { kind: 'sighting', caseId: primaryCaseId } })}
              color="#D97706"
              bgColor="bg-amber-50"
            />
          </View>
        </View>

        {/* Section 3: Assigned Search Zones */}
        <View className="mt-7">
          <SectionTitle title="Assigned Search Zone" subtitle="Search your designated perimeter carefully before marking as complete." />
          <Card className="mb-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-xs font-bold uppercase tracking-[1.5px] text-teal">Case Assignment</Text>
                <Text className="mt-1 text-xl font-bold text-navy">{assignment.caseName}</Text>
                <Text className="mt-1 text-sm text-muted">Missing person: {assignment.missingPerson}</Text>
              </View>
              <StatusBadge status={assignment.status} compact />
            </View>
            <View className="mt-5 gap-3 border-t border-border pt-4">
              <Row label="Assigned zone" value={assignment.assignedZone} />
              <Row label="Priority" value={assignment.priority} valueClass="text-warning" />
              <Row label="Status" value={assignment.status} />
            </View>
            <View className="mt-5 flex-row items-start gap-2 rounded-xl bg-blue-50 p-3">
              <Info stroke="#2563EB" size={17} />
              <Text className="flex-1 text-sm leading-5 text-muted">{assignment.instructions}</Text>
            </View>
          </Card>

          <ZoneCard
            name="Zone A"
            details="Assigned to you · Community Park"
            priorityScore={87}
            reason="Near last known location"
            status="ASSIGNED"
            onPress={() => router.push({ pathname: '/search-session', params: { caseId: primaryCaseId } })}
          />

          <View className="mt-4">
            <PriorityCard
              title="Why this zone?"
              description="Near the last known location with a recent witness report and clear exit proximity."
              priority="high"
              score={87}
            />
          </View>

          <View className="mt-5">
            <Button
              label="View Zone & Start Search"
              icon={ArrowRight}
              iconPosition="right"
              fullWidth
              onPress={() => router.push({ pathname: '/search-session', params: { caseId: primaryCaseId } })}
            />
          </View>
        </View>

        {/* Section 4: Search Activity & Logging */}
        <View className="mt-7">
          <SectionTitle title="Search Activity & Observations" subtitle="Record evidence or sightings to assist human coordinators." />
          <View className="gap-3">
            <Card
              onPress={() => router.push({ pathname: '/session-entry', params: { kind: 'evidence', caseId: primaryCaseId } })}
              className="p-4 flex-row items-center gap-3 active:bg-slate-50"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <FilePlus2 stroke="#0F172A" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-navy">Report Evidence / Observation</Text>
                <Text className="text-xs text-muted">Log physical evidence or search notes</Text>
              </View>
              <ChevronRight stroke="#64748B" size={18} />
            </Card>

            <Card
              onPress={() => router.push({ pathname: '/session-entry', params: { kind: 'sighting', caseId: primaryCaseId } })}
              className="p-4 flex-row items-center gap-3 active:bg-amber-50/50"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <ScanLine stroke="#D97706" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-navy">Report Possible Sighting</Text>
                <Text className="text-xs text-muted">Log witnessed visual sighting location</Text>
              </View>
              <ChevronRight stroke="#D97706" size={18} />
            </Card>
          </View>
        </View>

        {/* Local First Philosophy Banner */}
        <Card className="mt-8 border-teal-100 bg-teal-50/60 p-4">
          <View className="flex-row items-start gap-3">
            <ShieldCheck stroke="#0D9488" size={22} />
            <View className="flex-1">
              <Text className="text-sm font-bold text-navy">LOCAL FIRST SEARCH PRINCIPLE</Text>
              <Text className="mt-1 text-xs leading-5 text-muted">
                Thoroughly search assigned local zones first. All volunteer submissions require human verification by an authorized Case Manager before public broadcast or resolution.
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </AuthenticatedLayout>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-3">
      <Text className="text-lg font-bold text-navy">{title}</Text>
      {subtitle ? <Text className="mt-0.5 text-xs text-muted">{subtitle}</Text> : null}
    </View>
  );
}

function Row({ label, value, valueClass = 'text-navy' }: { label: string; value: string; valueClass?: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className={`text-right text-sm font-semibold ${valueClass}`}>{value}</Text>
    </View>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  onPress,
  color,
  bgColor,
}: {
  icon: typeof PlusCircle;
  label: string;
  onPress: () => void;
  color: string;
  bgColor: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className={`min-h-[46px] flex-row items-center gap-2 rounded-xl px-3.5 py-2.5 border border-slate-200/80 ${bgColor} active:opacity-75`}
      onPress={onPress}
    >
      <Icon stroke={color} size={16} />
      <Text className="text-xs font-bold text-navy">{label}</Text>
    </Pressable>
  );
}
