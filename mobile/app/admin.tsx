import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  FileCheck2,
  FileText,
  Globe,
  Layers,
  LogOut,
  MapPin,
  RefreshCw,
  ShieldAlert,
  UsersRound,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { BackButton } from '@/components/BackButton';
import { Card } from '@/components/Card';
import { ManagerMetricCard } from '@/components/ManagerMetricCard';
import { StatusBadge, type StatusBadgeStatus } from '@/components/StatusBadge';
import { createApiClient } from '@/services/api';
import type { Case } from '@/types';
import type { ManagerDashboardData } from '@/services/manager';
import type { PossibleMatch } from '@/services/possibleMatch';
import type { AppNotification } from '@/services/notifications';
import type { CaseTimelineEvent } from '@/services/caseDetails';

function getBadgeStatus(statusStr: string): StatusBadgeStatus {
  const s = String(statusStr).toUpperCase();
  if (s === 'LOCAL_SEARCH' || s === 'ACTIVE' || s === 'DRAFT') return 'LOCAL_SEARCH';
  if (s === 'PUBLIC_ESCALATION_PENDING') return 'PUBLIC_ESCALATION_PENDING';
  if (s === 'PUBLIC_SEARCH') return 'PUBLIC_SEARCH';
  if (s === 'RESOLVED' || s === 'CASE_RESOLVED') return 'CASE_RESOLVED';
  if (s === 'CLOSED' || s === 'SEARCH_COMPLETED' || s === 'COMPLETED') return 'COMPLETED';
  return 'LOCAL_SEARCH';
}

export default function AdminScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'volunteers' | 'monitoring' | 'reviews' | 'activity'>('overview');
  const [caseFilter, setCaseFilter] = useState<'ALL' | 'ACTIVE' | 'LOCAL' | 'PUBLIC' | 'RESOLVED'>('ALL');

  // Dashboard Data State
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);
  const [possibleMatches, setPossibleMatches] = useState<PossibleMatch[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<CaseTimelineEvent[]>([]);

  const [isDemoMode, setIsDemoMode] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' });
      const currentUser = await api.getCurrentUser().catch(() => null);
      const isRealAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'coordinator');

      if (isRealAdmin) {
        setIsDemoMode(false);
        const fetchedCases = await api.listCases().catch(() => []);
        setCases(fetchedCases);

        const activeCase = fetchedCases[0] ?? null;
        setSelectedCase(activeCase);

        if (activeCase) {
          const [dbData, matches, timeline] = await Promise.all([
            api.getDashboard(activeCase.id).catch(() => null),
            api.listPossibleMatches(activeCase.id).catch(() => []),
            api.listCaseTimeline(activeCase.id).catch(() => []),
          ]);
          setDashboardData(dbData);
          setPossibleMatches(matches);
          setTimelineEvents(timeline);
        }
      } else {
        // DEMO PRESENTATION MODE (Hackathon Command Center Access)
        setIsDemoMode(true);
        const demoCases: Case[] = [
          {
            id: 'case-demo-1',
            title: 'Aarohi Sharma',
            description: '24 yr female missing near North District · Community Park. High priority search active.',
            status: 'active',
            coordinatorId: 'mgr-demo-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'case-demo-2',
            title: 'Meera Kapoor',
            description: '31 yr female last seen Riverside East. Public search escalation pending coordinator review.',
            status: 'active',
            coordinatorId: 'mgr-demo-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'case-demo-3',
            title: 'Ishita Rao',
            description: '19 yr female missing near Central Market. Broadcast to all active community volunteers.',
            status: 'active',
            coordinatorId: 'mgr-demo-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'case-demo-4',
            title: 'Riya Das',
            description: '36 yr female found safely and reunited with family at Lake Road.',
            status: 'resolved',
            coordinatorId: 'mgr-demo-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        setCases(demoCases);
        const activeCase = demoCases[0];
        setSelectedCase(activeCase);

        setDashboardData({
          case: { id: activeCase.id, title: activeCase.title, status: activeCase.status },
          stats: {
            active_members: 18,
            total_zones: 6,
            searched_zones: 4,
            active_search_sessions: 5,
            evidence_count: 5,
            witness_report_count: 3,
            possible_match_count: 2,
            pending_reports: 1,
          },
          intelligence: {
            top_priority_zones: [
              { id: 'zone-1', name: 'Zone 04 · Community Park', priorityScore: 92, label: 'Critical' },
              { id: 'zone-2', name: 'Zone 02 · North Trail Entrance', priorityScore: 78, label: 'High' },
              { id: 'zone-3', name: 'Zone 01 · Parking Perimeter', priorityScore: 65, label: 'Medium' },
            ],
          },
        } as any);

        setPossibleMatches([
          {
            id: 'match-demo-1',
            caseId: activeCase.id,
            sightingId: 'sight-demo-1',
            confidenceScore: 88,
            status: 'PENDING',
            evidenceDetails: 'CCTV footage capture at North District Transit matches physical profile.',
            matchType: 'CCTV_FACIAL_SIMILARITY',
            explanation: 'High feature correspondence with reported clothing and height profile.',
            createdAt: new Date().toISOString(),
          } as any,
        ]);

        setTimelineEvents([
          { title: 'Search Activated', description: 'Command Center initiated North District search operation.', timestamp: '08:40 AM', type: 'LOCAL_SEARCH_STARTED' },
          { title: '18 Volunteers Dispatched', description: 'Volunteer search teams Alpha and Bravo deployed.', timestamp: '09:15 AM', type: 'VOLUNTEER_JOINED' },
          { title: 'AI Heuristic Optimization', description: 'Search zone priorities updated based on terrain gradient.', timestamp: '09:45 AM', type: 'PRIORITY_UPDATED' },
        ]);
      }
    } catch (error) {
      console.log('Admin dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setLoading(true);
    loadData();
  };

  const handleMatchDecision = async (matchId: string, decision: 'CONFIRM' | 'REJECT') => {
    if (!selectedCase) return;
    Alert.alert(
      decision === 'CONFIRM' ? 'Confirm Possible Match?' : 'Reject Match Candidate?',
      `Human Review Action: This decision will be logged under administrator authority in case ${selectedCase.title}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: decision === 'CONFIRM' ? 'Confirm Match' : 'Reject Candidate',
          style: decision === 'CONFIRM' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              if (isDemoMode) {
                setPossibleMatches((prev) => prev.filter((m) => m.id !== matchId));
                Alert.alert('Decision Recorded', 'Match candidate updated (Demo Presentation Mode).');
                return;
              }
              const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' });
              await api.reviewPossibleMatch(selectedCase.id, matchId, decision);
              Alert.alert('Decision Recorded', `Match decision updated successfully.`);
              loadData();
            } catch (err) {
              Alert.alert('Action Error', err instanceof Error ? err.message : 'Review action failed.');
            }
          },
        },
      ]
    );
  };

  const handleResolveCase = async (caseId: string) => {
    Alert.alert('Resolve Missing Person Case?', 'This will mark the search as completed and resolve the active case.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve Case',
        onPress: async () => {
          try {
            if (isDemoMode) {
              setCases((prev) => prev.map((c) => (c.id === caseId ? { ...c, status: 'RESOLVED' as any } : c)));
              Alert.alert('Case Resolved', 'Case marked as resolved (Demo Presentation Mode).');
              return;
            }
            const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' });
            await api.resolveCase(caseId);
            Alert.alert('Case Resolved', 'Case marked as resolved.');
            loadData();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Resolve failed.');
          }
        },
      },
    ]);
  };

  const handleCloseCase = async (caseId: string) => {
    Alert.alert('Close Case Record?', 'This will archive and close the search case.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close Case',
        style: 'destructive',
        onPress: async () => {
          try {
            if (isDemoMode) {
              setCases((prev) => prev.map((c) => (c.id === caseId ? { ...c, status: 'CLOSED' as any } : c)));
              Alert.alert('Case Closed', 'Case archived (Demo Presentation Mode).');
              return;
            }
            const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' });
            await api.closeCase(caseId);
            Alert.alert('Case Closed', 'Case archived.');
            loadData();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Close failed.');
          }
        },
      },
    ]);
  };

  // Derived Metrics
  const totalCases = cases.length;
  const activeCases = cases.filter((c) => !['RESOLVED', 'CLOSED'].includes(String(c.status).toUpperCase())).length;
  const publicCasesCount = cases.filter((c) => String(c.status).toUpperCase() === 'PUBLIC_SEARCH').length;
  const resolvedCasesCount = cases.filter((c) => ['RESOLVED', 'CLOSED'].includes(String(c.status).toUpperCase())).length;

  const totalZones = dashboardData?.stats.total_zones ?? 0;
  const searchedZones = dashboardData?.stats.searched_zones ?? 0;
  const searchCoveragePct = totalZones > 0 ? Math.round((searchedZones / totalZones) * 100) : 0;
  const activeVolunteers = dashboardData?.stats.active_members ?? 0;
  const totalEvidence = (dashboardData?.stats.evidence_count ?? 0) + (dashboardData?.stats.witness_report_count ?? 0);

  const filteredCases = cases.filter((item) => {
    const s = String(item.status).toUpperCase();
    if (caseFilter === 'ACTIVE') return !['RESOLVED', 'CLOSED'].includes(s);
    if (caseFilter === 'LOCAL') return s === 'LOCAL_SEARCH' || s === 'DRAFT' || s === 'ACTIVE';
    if (caseFilter === 'PUBLIC') return s === 'PUBLIC_SEARCH' || s === 'PUBLIC_ESCALATION_PENDING';
    if (caseFilter === 'RESOLVED') return s === 'RESOLVED' || s === 'CLOSED';
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="px-5 pb-14" showsVerticalScrollIndicator={false}>
        {/* Command Center Header */}
        <View className="pt-5 pb-4 border-b border-slate-100 flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-3 flex-1">
            <BackButton fallbackRoute="/admin-login" variant="circle" />
            <View className="flex-1">
              <View className="flex-row items-center gap-2 flex-wrap">
                <View className="h-6 px-2 rounded-full bg-navy items-center justify-center">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-sky-400">COMMAND CENTER</Text>
                </View>
                {isDemoMode ? (
                  <View className="h-6 px-2 rounded-full bg-amber-50 border border-amber-200 items-center justify-center">
                    <Text className="text-[10px] font-bold text-amber-700">DEMO PRESENTATION</Text>
                  </View>
                ) : null}
              </View>
              <Text className="mt-1.5 text-2xl font-black tracking-tight text-navy">Operations Portal</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={handleRefresh}
              className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100 active:bg-slate-200"
            >
              <RefreshCw size={18} color="#0F172A" />
            </Pressable>
            <Pressable
              onPress={() => router.push('/landing')}
              className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100 active:bg-slate-200"
            >
              <LogOut size={18} color="#DC2626" />
            </Pressable>
          </View>
        </View>

        {/* Tab Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 flex-row py-1">
          <TabChip label="Overview" active={activeTab === 'overview'} onPress={() => setActiveTab('overview')} />
          <TabChip label="Cases" active={activeTab === 'cases'} badge={totalCases} onPress={() => setActiveTab('cases')} />
          <TabChip label="Volunteers" active={activeTab === 'volunteers'} badge={activeVolunteers} onPress={() => setActiveTab('volunteers')} />
          <TabChip label="Search Ops" active={activeTab === 'monitoring'} onPress={() => setActiveTab('monitoring')} />
          <TabChip label="Reviews" active={activeTab === 'reviews'} badge={possibleMatches.length} onPress={() => setActiveTab('reviews')} />
          <TabChip label="Audit Activity" active={activeTab === 'activity'} onPress={() => setActiveTab('activity')} />
        </ScrollView>

        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#0F172A" />
            <Text className="mt-4 text-sm font-semibold text-muted">Synchronizing operations command data...</Text>
          </View>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <View className="mt-5">
                <Text className="text-xs font-bold uppercase tracking-[2px] text-teal mb-3">System Key Performance Indicators</Text>
                <View className="flex-row flex-wrap gap-3">
                  <ManagerMetricCard label="Total cases" value={totalCases} icon={FileText} />
                  <ManagerMetricCard label="Active search" value={activeCases} icon={FileCheck2} tone="teal" />
                  <ManagerMetricCard label="Public search" value={publicCasesCount} icon={Globe} tone="warning" />
                  <ManagerMetricCard label="Resolved / Closed" value={resolvedCasesCount} icon={CheckCircle2} tone="teal" />
                  <ManagerMetricCard label="Active volunteers" value={activeVolunteers} icon={UsersRound} />
                  <ManagerMetricCard label="Search coverage" value={`${searchCoveragePct}%`} icon={BarChart3} tone="teal" />
                  <ManagerMetricCard label="Pending reviews" value={possibleMatches.length} icon={ShieldAlert} tone="danger" />
                  <ManagerMetricCard label="Evidence reports" value={totalEvidence} icon={Layers} tone="warning" />
                </View>

                {/* Primary Case Banner */}
                {selectedCase ? (
                  <Card className="mt-6 border-l-4 border-l-teal bg-slate-50/50 p-5">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold uppercase tracking-wider text-teal">Active Selected Case</Text>
                      <StatusBadge status={getBadgeStatus(String(selectedCase.status))} />
                    </View>
                    <Text className="mt-2 text-xl font-bold text-navy">{selectedCase.title}</Text>
                    <Text className="mt-1 text-sm text-muted">{selectedCase.description || 'Missing person search operation.'}</Text>
                    <View className="mt-4 pt-3 border-t border-slate-200/60 flex-row flex-wrap gap-2">
                      <Button label="Case Details" onPress={() => router.push({ pathname: '/case-details', params: { caseId: selectedCase.id } })} />
                      <Button label="Search Map" variant="outline" onPress={() => router.push({ pathname: '/active-search', params: { caseId: selectedCase.id } })} />
                      <Button label="AI Priority" variant="outline" onPress={() => router.push({ pathname: '/ai-priority', params: { caseId: selectedCase.id } })} />
                    </View>
                  </Card>
                ) : null}
              </View>
            )}

            {/* CASES MANAGEMENT TAB */}
            {activeTab === 'cases' && (
              <View className="mt-5">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-xs font-bold uppercase tracking-[2px] text-teal">Authorized Case Registry</Text>
                  <Button label="Create Case" onPress={() => router.push('/create-case')} />
                </View>

                {/* Filter Pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-4">
                  {(['ALL', 'ACTIVE', 'LOCAL', 'PUBLIC', 'RESOLVED'] as const).map((filter) => (
                    <Pressable
                      key={filter}
                      onPress={() => setCaseFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg border ${
                        caseFilter === filter ? 'bg-navy border-navy' : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${caseFilter === filter ? 'text-white' : 'text-navy'}`}>
                        {filter}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {filteredCases.length === 0 ? (
                  <Card className="py-8 items-center justify-center">
                    <Text className="text-sm font-semibold text-muted">No cases match the selected filter.</Text>
                  </Card>
                ) : (
                  <View className="gap-3">
                    {filteredCases.map((c) => (
                      <Card key={c.id} className="p-4">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-2">
                            <Text className="text-xs font-mono font-bold text-slate-400">#{c.id.slice(0, 8)}</Text>
                            <StatusBadge status={getBadgeStatus(String(c.status))} />
                          </View>
                          <Text className="text-xs text-muted">{new Date(c.createdAt || Date.now()).toLocaleDateString()}</Text>
                        </View>
                        <Text className="mt-2 text-lg font-bold text-navy">{c.title}</Text>
                        {c.description ? <Text className="mt-1 text-sm text-muted" numberOfLines={2}>{c.description}</Text> : null}

                        <View className="mt-4 pt-3 border-t border-slate-100 flex-row flex-wrap gap-2">
                          <Button label="Details" variant="outline" onPress={() => router.push({ pathname: '/case-details', params: { caseId: c.id } })} />
                          <Button label="Timeline" variant="outline" onPress={() => router.push({ pathname: '/case-timeline', params: { caseId: c.id } })} />
                          {String(c.status).toUpperCase() !== 'RESOLVED' && String(c.status).toUpperCase() !== 'CLOSED' ? (
                            <>
                              <Button label="Resolve" variant="secondary" onPress={() => handleResolveCase(c.id)} />
                              <Button label="Close" variant="ghost" onPress={() => handleCloseCase(c.id)} />
                            </>
                          ) : null}
                        </View>
                      </Card>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* VOLUNTEERS TAB */}
            {activeTab === 'volunteers' && (
              <View className="mt-5">
                <Text className="text-xs font-bold uppercase tracking-[2px] text-teal mb-3">Volunteer Force & Members</Text>
                <Card className="p-4 mb-4 bg-teal-50/50 border border-teal-100">
                  <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-teal">
                      <UsersRound color="#FFF" size={20} />
                    </View>
                    <View>
                      <Text className="text-base font-bold text-navy">{activeVolunteers} Active Field Volunteers</Text>
                      <Text className="text-xs text-muted">Currently deployed across active search sessions</Text>
                    </View>
                  </View>
                </Card>

                <View className="gap-3">
                  <VolunteerStatusRow name="Verified Field Responders" count={Math.max(1, activeVolunteers)} status="Verified & Active" />
                  <VolunteerStatusRow name="Case Search Team Leaders" count={Math.max(1, Math.floor(activeVolunteers / 3))} status="Manager Access" />
                  <VolunteerStatusRow name="Public Sighting Contributors" count={dashboardData?.stats.witness_report_count ?? 0} status="Verified Submissions" />
                </View>
              </View>
            )}

            {/* SEARCH OPERATIONS MONITORING TAB */}
            {activeTab === 'monitoring' && (
              <View className="mt-5">
                <Text className="text-xs font-bold uppercase tracking-[2px] text-teal mb-3">Search Zone Operations</Text>

                <View className="flex-row gap-3 mb-4">
                  <Card className="flex-1 p-3.5 items-center">
                    <Text className="text-2xl font-bold text-navy">{totalZones}</Text>
                    <Text className="text-xs font-semibold text-muted">Total Zones</Text>
                  </Card>
                  <Card className="flex-1 p-3.5 items-center bg-teal-50 border-teal-100">
                    <Text className="text-2xl font-bold text-teal">{searchedZones}</Text>
                    <Text className="text-xs font-semibold text-teal">Searched</Text>
                  </Card>
                  <Card className="flex-1 p-3.5 items-center bg-amber-50 border-amber-100">
                    <Text className="text-2xl font-bold text-warning">{totalZones - searchedZones}</Text>
                    <Text className="text-xs font-semibold text-warning">Remaining</Text>
                  </Card>
                </View>

                {selectedCase ? (
                  <Card className="p-4 gap-3">
                    <Text className="text-base font-bold text-navy">Live Search Map & Sessions</Text>
                    <Text className="text-sm text-muted">Monitor volunteer GPS markers, search zone polygons, and active session progress.</Text>
                    <Button
                      label="Launch Live Map Command"
                      icon={MapPin}
                      fullWidth
                      onPress={() => router.push({ pathname: '/active-search', params: { caseId: selectedCase.id } })}
                    />
                  </Card>
                ) : null}
              </View>
            )}

            {/* HUMAN-IN-THE-LOOP REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <View className="mt-5">
                <Text className="text-xs font-bold uppercase tracking-[2px] text-teal mb-3">Human Verification Review Queue</Text>
                <Card className="p-4 mb-4 bg-amber-50/60 border border-amber-200">
                  <View className="flex-row items-center gap-3">
                    <AlertTriangle color="#D97706" size={22} />
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-navy">Human Review Boundary</Text>
                      <Text className="text-xs text-muted">AI proposals require explicit administrator confirmation before resolving cases.</Text>
                    </View>
                  </View>
                </Card>

                {possibleMatches.length === 0 ? (
                  <Card className="py-8 items-center justify-center">
                    <CheckCircle2 color="#059669" size={32} />
                    <Text className="mt-2 text-sm font-bold text-navy">Review Queue Clear</Text>
                    <Text className="text-xs text-muted mt-1">No pending AI match candidates require human review.</Text>
                  </Card>
                ) : (
                  <View className="gap-3">
                    {possibleMatches.map((match, idx) => {
                      const matchId = match.id ?? `match-${idx}`;
                      const score = Math.round((match.confidence || match.similarity || 0.85) * 100);
                      return (
                        <Card key={matchId} className="p-4 border-l-4 border-l-warning">
                          <View className="flex-row items-center justify-between">
                            <Text className="text-xs font-bold text-warning uppercase">Possible Match Candidate</Text>
                            <Text className="text-xs font-bold text-navy">{score}% Confidence</Text>
                          </View>
                          <Text className="mt-2 text-base font-bold text-navy">Sightings Match Candidate #{idx + 1}</Text>
                          <Text className="mt-1 text-sm text-muted">AI model identified spatial and visual match candidate across sightings evidence graph.</Text>
                          <View className="mt-4 flex-row gap-2">
                            <Button label="Confirm Match" onPress={() => handleMatchDecision(matchId, 'CONFIRM')} />
                            <Button label="Reject" variant="outline" onPress={() => handleMatchDecision(matchId, 'REJECT')} />
                          </View>
                        </Card>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* AUDIT ACTIVITY TAB */}
            {activeTab === 'activity' && (
              <View className="mt-5">
                <Text className="text-xs font-bold uppercase tracking-[2px] text-teal mb-3">Platform Audit & Activity Log</Text>

                {timelineEvents.length === 0 ? (
                  <Card className="py-8 items-center justify-center">
                    <Bell color="#94A3B8" size={28} />
                    <Text className="mt-2 text-sm font-semibold text-muted">No recent system events logged.</Text>
                  </Card>
                ) : (
                  <View className="gap-3">
                    {timelineEvents.map((evt, idx) => (
                      <Card key={`${evt.type}-${idx}`} className="p-3.5 border-l-2 border-l-navy">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs font-bold text-navy">{evt.title || evt.type}</Text>
                          <Text className="text-[10px] text-muted">{new Date(evt.timestamp || Date.now()).toLocaleTimeString()}</Text>
                        </View>
                        <Text className="mt-1 text-sm text-muted">{evt.description}</Text>
                      </Card>
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TabChip({ label, active, badge, onPress }: { label: string; active: boolean; badge?: number; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 flex-row items-center gap-1.5 px-4 py-2 rounded-xl border ${
        active ? 'bg-navy border-navy' : 'bg-white border-slate-200'
      }`}
    >
      <Text className={`text-xs font-bold ${active ? 'text-white' : 'text-navy'}`}>{label}</Text>
      {badge !== undefined && badge > 0 ? (
        <View className={`px-1.5 py-0.5 rounded-full ${active ? 'bg-sky-400' : 'bg-slate-100'}`}>
          <Text className={`text-[10px] font-bold ${active ? 'text-navy' : 'text-slate-600'}`}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function VolunteerStatusRow({ name, count, status }: { name: string; count: number; status: string }) {
  return (
    <Card className="p-3.5 flex-row items-center justify-between">
      <View>
        <Text className="text-sm font-bold text-navy">{name}</Text>
        <Text className="text-xs text-muted">{status}</Text>
      </View>
      <View className="h-8 px-3 rounded-lg bg-blue-50 items-center justify-center">
        <Text className="text-xs font-bold text-blue">{count} Members</Text>
      </View>
    </Card>
  );
}
