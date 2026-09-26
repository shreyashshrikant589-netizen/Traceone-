import {
  AlertTriangle,
  BarChart3,
  BellRing,
  CheckCircle2,
  FileCheck2,
  FilePlus2,
  Flag,
  KeyRound,
  MapPinned,
  QrCode,
  ShieldAlert,
  Sparkles,
  UsersRound,
  Zap,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ManagerMetricCard } from '@/components/ManagerMetricCard';
import { StatusBadge } from '@/components/StatusBadge';
import { mockManagerOverview } from '@/services/mockManager';
import { createApiClient } from '@/services/api';
import type { ManagerOverview } from '@/services/manager';
import type { SearchExpansion } from '@/services/searchExpansion';

export default function ManagerScreen() {
  const router = useRouter();
  const [published, setPublished] = useState(false);
  const [policeStatus, setPoliceStatus] = useState(mockManagerOverview.policeStatus);
  const [overview, setOverview] = useState<ManagerOverview>(mockManagerOverview);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [aiExpansion, setAiExpansion] = useState<SearchExpansion | null>(null);

  const loadData = useCallback(async () => {
    try {
      const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' });
      const cases = await api.listCases().catch(() => []);
      const selected = cases[0];
      if (!selected) return;

      const [data, expansionList] = await Promise.all([
        api.getDashboard(selected.id).catch(() => null),
        api.listSearchExpansions(selected.id).catch(() => []),
      ]);

      if (data) {
        setOverview({
          activeCases: cases.filter((item) => !['CLOSED', 'RESOLVED'].includes(String(item.status))).length,
          searchCoverage: data.stats.total_zones ? Math.round((data.stats.searched_zones / data.stats.total_zones) * 100) : 0,
          activeVolunteers: data.stats.active_members,
          priorityZones: data.intelligence?.top_priority_zones?.length ?? 0,
          evidence: data.stats.evidence_count,
          witnessReports: data.stats.witness_report_count,
          pendingEscalation: data.case.status === 'PUBLIC_ESCALATION_PENDING' ? 1 : 0,
          possibleMatches: data.stats.possible_match_count,
          policeStatus: 'PENDING',
        });
      }

      if (expansionList && expansionList.length > 0) {
        setAiExpansion(expansionList[0]);
      } else {
        setAiExpansion({
          id: 'exp-demo-1',
          case_id: selected.id,
          stage: 'LOCAL_SEARCH',
          new_radius_m: 3500,
          reason: 'High density of unverified witness reports near North Trail Exit.',
          recommended_by: 'ai-heuristic-v2',
          status: 'RECOMMENDED',
          created_at: new Date().toISOString(),
        });
      }
    } catch {
      // Keep robust defaults
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const generateInvite = async () => {
    try {
      const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' });
      const cases = await api.listCases().catch(() => []);
      const targetCaseId = cases[0]?.id ?? 'case-demo-1';
      const invite = await api.createInvite(targetCaseId, { expires_at: new Date(Date.now() + 86400000).toISOString() });
      setGeneratedCode(invite.join_code || '842-195');
      Alert.alert('Invite Token Generated', `6-Digit Code: ${invite.join_code || '842-195'}\nShare this token with verified field volunteers.`);
    } catch {
      const demoCode = '842-195';
      setGeneratedCode(demoCode);
      Alert.alert('Invite Token Generated', `6-Digit Code: ${demoCode}\nShare this token with verified field volunteers.`);
    }
  };

  const handleApproveExpansion = (approve: boolean) => {
    Alert.alert(
      approve ? 'Approve AI Dynamic Search Radius Expansion?' : 'Reject Radius Expansion Recommendation?',
      approve
        ? 'Human Decision: Expands search perimeter to 3.5 km and adds 2 priority search zones.'
        : 'Human Decision: Expansion request rejected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: approve ? 'Approve Expansion' : 'Reject Recommendation',
          style: approve ? 'default' : 'destructive',
          onPress: () => {
            if (aiExpansion) {
              setAiExpansion({ ...aiExpansion, status: approve ? 'APPROVED' : 'REJECTED' });
            }
            Alert.alert('Decision Recorded', `Search expansion ${approve ? 'approved and activated' : 'rejected'}.`);
          },
        },
      ]
    );
  };

  const publish = () =>
    Alert.alert('Make this case public?', 'This will share the authorized case information with eligible registered volunteers.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm & Publish', onPress: () => setPublished(true) },
    ]);

  const notifyPolice = () =>
    Alert.alert('Notify Police Channel?', 'This will share the authorized case summary with the designated police dispatch API.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Notify Police', onPress: () => setPoliceStatus('NOTIFIED') },
    ]);

  return (
    <AuthenticatedLayout>
      <ScrollView contentContainerClassName="px-5 pb-14" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-5">
          <BackButton fallbackRoute="/auth" variant="ghost" className="mb-3" />
          <View className="flex-row items-center gap-2">
            <View className="h-6 px-2.5 rounded-full bg-navy items-center justify-center">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-sky-400">COORDINATOR</Text>
            </View>
          </View>
          <Text className="mt-2 text-3xl font-bold text-navy">Case Manager Control Center</Text>
          <Text className="mt-1 text-base leading-6 text-muted">
            Coordinate authorized local search operations with human oversight.
          </Text>
        </View>

        {/* Operational Metrics */}
        <View className="mt-6 flex-row flex-wrap gap-3">
          <ManagerMetricCard label="Active cases" value={overview.activeCases} icon={FileCheck2} />
          <ManagerMetricCard label="Search coverage" value={`${overview.searchCoverage}%`} icon={BarChart3} tone="teal" />
          <ManagerMetricCard label="Active volunteers" value={overview.activeVolunteers} icon={UsersRound} />
          <ManagerMetricCard label="Priority zones" value={overview.priorityZones} icon={MapPinned} tone="warning" />
          <ManagerMetricCard label="Evidence" value={overview.evidence} icon={FileCheck2} tone="teal" />
          <ManagerMetricCard label="Witness reports" value={overview.witnessReports} icon={BellRing} />
          <ManagerMetricCard label="Pending escalation" value={overview.pendingEscalation} icon={ShieldAlert} tone="danger" />
          <ManagerMetricCard label="Possible matches" value={overview.possibleMatches} icon={AlertTriangle} tone="warning" />
        </View>

        {/* Case Actions */}
        <SectionTitle title="Case Management & Invites" />
        <Card className="p-4 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-navy">Case Operations</Text>
            <Button label="Create New Case" icon={FilePlus2} onPress={() => router.push('/create-case')} />
          </View>
          <View className="mt-2 flex-row gap-3">
            <Button label="Generate Invite Code" variant="outline" icon={KeyRound} fullWidth onPress={generateInvite} />
          </View>
          {generatedCode ? (
            <View className="mt-2 p-3 rounded-xl bg-teal-50 border border-teal-200 flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-bold text-teal uppercase">Active Invite Code</Text>
                <Text className="text-xl font-mono font-bold text-navy">{generatedCode}</Text>
              </View>
              <View className="h-8 px-2.5 rounded-lg bg-teal items-center justify-center">
                <Text className="text-xs font-bold text-white">Share Code</Text>
              </View>
            </View>
          ) : null}
        </Card>

        {/* Active Primary Case Control */}
        <SectionTitle title="Active Case Control" />
        <Card className="p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-navy">Aarohi Sharma</Text>
            <StatusBadge status="LOCAL_SEARCH" compact />
          </View>
          <View className="mt-4 gap-3 border-t border-slate-100 pt-3">
            <ControlRow label="Case status" value="Local search active" />
            <ControlRow label="Last seen" value="North District · 08:40" />
            <ControlRow label="Search zones" value="5 of 8 complete" />
            <ControlRow label="Volunteers" value="18 active field responders" />
            <ControlRow label="Evidence" value="12 verified submissions" />
            <ControlRow label="Priority score" value="High · 87/100" valueClass="text-warning" />
          </View>
          <View className="mt-5 gap-2">
            <Button label="View Case Details" fullWidth onPress={() => router.push('/case-details')} />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button label="View Timeline" variant="outline" fullWidth onPress={() => router.push('/case-timeline')} />
              </View>
              <View className="flex-1">
                <Button label="Live Map" variant="secondary" fullWidth onPress={() => router.push({ pathname: '/active-search', params: { caseId: 'case-demo-1' } })} />
              </View>
            </View>
          </View>
        </Card>

        {/* AI Intelligence & Dynamic Search Expansion */}
        <SectionTitle title="AI Search Intelligence (Decision Support)" />
        <Card className="p-4 bg-gradient-to-br from-slate-50 to-teal-50/30 border border-teal-100">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-navy">
              <Sparkles color="#5EEAD4" size={18} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-navy">AI Dynamic Search Radius Expansion</Text>
              <Text className="text-xs text-muted">Decision support model recommendation</Text>
            </View>
          </View>

          <Text className="mt-3 text-sm leading-5 text-muted">
            {aiExpansion?.reason || 'High density of unverified witness reports near North Trail Exit. AI model proposes expanding search radius to 3.5 km.'}
          </Text>

          <View className="mt-4 p-3 rounded-xl bg-white border border-slate-200 flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-semibold text-muted">Proposed Radius</Text>
              <Text className="text-lg font-bold text-navy">{aiExpansion?.new_radius_m ? (aiExpansion.new_radius_m / 1000).toFixed(1) : '3.5'} km</Text>
            </View>
            <View className="h-7 px-2.5 rounded-full bg-amber-50 border border-amber-200 items-center justify-center">
              <Text className="text-xs font-bold text-amber-700">{aiExpansion?.status || 'RECOMMENDED'}</Text>
            </View>
          </View>

          <View className="mt-4 flex-row gap-2">
            <Button
              label={aiExpansion?.status === 'APPROVED' ? 'Expansion Approved' : 'Approve Radius Expansion'}
              disabled={aiExpansion?.status === 'APPROVED'}
              fullWidth
              onPress={() => handleApproveExpansion(true)}
            />
          </View>
          <View className="mt-2">
            <Button
              label="View AI Priority Map"
              variant="outline"
              icon={Zap}
              fullWidth
              onPress={() => router.push({ pathname: '/ai-priority', params: { caseId: 'case-demo-1' } })}
            />
          </View>
        </Card>

        {/* Human Verification & Match Reviews */}
        <SectionTitle title="Human Verification & Review Queue" />
        <Card className="p-4 border-l-4 border-l-warning">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-bold uppercase tracking-wider text-warning">Pending Review Candidate</Text>
            <Text className="text-xs font-bold text-navy">88% Similarity</Text>
          </View>
          <Text className="mt-2 text-base font-bold text-navy">Sightings Match Candidate #1</Text>
          <Text className="mt-1 text-sm text-muted">
            CCTV feature correspondence matched physical description near North District Transit.
          </Text>
          <View className="mt-4">
            <Button
              label="Open Review Queue"
              icon={AlertTriangle}
              fullWidth
              onPress={() => router.push({ pathname: '/possible-match', params: { caseId: 'case-demo-1', matchId: 'match-demo-1' } })}
            />
          </View>
        </Card>

        {/* Public Escalation */}
        <SectionTitle title="Public Escalation Control" />
        <Card className="p-4">
          <View className="flex-row items-start gap-3">
            <ShieldAlert stroke="#D97706" size={21} />
            <View className="flex-1">
              <Text className="text-base font-bold text-navy">{published ? 'Case Public Request Approved' : 'Escalate to Public Search'}</Text>
              <Text className="mt-1 text-sm leading-5 text-muted">
                Only authorized case information will be shared with eligible public volunteers.
              </Text>
            </View>
          </View>
          <View className="mt-4">
            <Button
              label={published ? 'Case Published to Public' : 'Approve Public Escalation'}
              variant={published ? 'secondary' : 'primary'}
              disabled={published}
              fullWidth
              onPress={publish}
            />
          </View>
        </Card>

        {/* Police Notification Channel */}
        <SectionTitle title="Police Notification Dispatch" />
        <Card className="p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="rounded-xl bg-blue-50 p-2.5">
                <Flag stroke="#2563EB" size={20} />
              </View>
              <View>
                <Text className="text-base font-bold text-navy">Police Channel Status</Text>
                <Text className="mt-0.5 text-xs text-muted">Automated dispatch summary</Text>
              </View>
            </View>
            <View className="rounded-full bg-amber-50 px-3 py-1 border border-amber-200">
              <Text className="text-xs font-semibold text-warning">{policeStatus}</Text>
            </View>
          </View>
          <Text className="mt-3 text-sm leading-5 text-muted">
            Prepares structured missing person summary for police dispatch channel.
          </Text>
          <View className="mt-4">
            <Button
              label={policeStatus === 'NOTIFIED' ? 'Police Notification Sent' : 'Notify Police Dispatch'}
              variant="outline"
              fullWidth
              disabled={policeStatus === 'NOTIFIED'}
              onPress={notifyPolice}
            />
          </View>
        </Card>
      </ScrollView>
    </AuthenticatedLayout>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text className="mb-3 mt-7 text-lg font-bold text-navy">{title}</Text>;
}

function ControlRow({ label, value, valueClass = 'text-navy' }: { label: string; value: string; valueClass?: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className={`text-right text-sm font-semibold ${valueClass}`}>{value}</Text>
    </View>
  );
}
