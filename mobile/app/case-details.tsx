import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BellRing,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  FilePlus2,
  Flag,
  KeyRound,
  Layers,
  MapPin,
  MapPinned,
  QrCode,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Zap,
  Camera,
  Copy,
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { TraceOneMap } from '@/components/MapPlaceholder';
import { StatusBadge, type StatusBadgeStatus } from '@/components/StatusBadge';
import { ZoneCard } from '@/components/ZoneCard';
import { createApiClient } from '@/services/api';
import { findLocalCaseInvite } from '@/services/joinCase';
import { fetchActiveVolunteerLocations, fetchMapZones } from '@/services/mapsAdapter';
import { mockCaseDetail } from '@/services/mockCaseDetails';
import type { CaseDetail, CaseTimelineEvent } from '@/services/caseDetails';
import type { SearchZone } from '@maps/zones/types';
import type { GPSLocation } from '@maps/location/types';
import type { VolunteerLocationUpdate } from '@maps/volunteers/types';

export default function CaseDetailsScreen() {
  const router = useRouter();
  const { caseId, joinCode } = useLocalSearchParams<{ caseId?: string; joinCode?: string }>();
  const [item, setItem] = useState<CaseDetail>(mockCaseDetail);
  const [timelineEvents, setTimelineEvents] = useState<CaseTimelineEvent[]>([]);
  const [recentObservations, setRecentObservations] = useState<
    Array<{
      id: string;
      kind: 'evidence' | 'sighting';
      description: string;
      timeAgo: string;
      by: string;
      location?: string;
      status?: string;
    }>
  >([]);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [policeStatus, setPoliceStatus] = useState<'PENDING' | 'REQUESTED'>('PENDING');
  const [isResolved, setIsResolved] = useState(false);
  const [userRole, setUserRole] = useState<'creator' | 'manager' | 'volunteer'>('creator');

  // Map state
  const [mapZones, setMapZones] = useState<SearchZone[]>([]);
  const [volunteerLocs, setVolunteerLocs] = useState<VolunteerLocationUpdate[]>([]);
  const [lastSeenLocation] = useState<GPSLocation>({
    latitude: 18.5204,
    longitude: 73.8567,
    accuracy: 15,
    altitude: null,
    speed: null,
    heading: null,
    timestamp: Date.now(),
  });

  const loadCaseData = useCallback(async () => {
    const targetId = caseId || 'case-demo-1';
    const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' });

    try {
      const [fetchedDetail, fetchedTimeline, currentUser, fetchedEvidence, fetchedSightings] = await Promise.all([
        api.getCaseDetails(targetId).catch(() => mockCaseDetail),
        api.listCaseTimeline(targetId).catch(() => []),
        api.getCurrentUser().catch(() => null),
        api.listEvidence(targetId).catch(() => []),
        api.listSightings(targetId).catch(() => []),
      ]);

      if (fetchedDetail) setItem(fetchedDetail);
      if (fetchedTimeline && fetchedTimeline.length > 0) setTimelineEvents(fetchedTimeline);

      const obs: Array<{
        id: string;
        kind: 'evidence' | 'sighting';
        description: string;
        timeAgo: string;
        by: string;
        location?: string;
        status?: string;
      }> = [];

      if (fetchedEvidence && Array.isArray(fetchedEvidence) && fetchedEvidence.length > 0) {
        fetchedEvidence.forEach((ev) => {
          obs.push({
            id: ev.id,
            kind: 'evidence',
            description: ev.description,
            timeAgo: 'Recently reported',
            by: ev.submittedBy ? `Submitted by ${ev.submittedBy.slice(0, 8)}` : 'Field Volunteer',
            status: 'VERIFIED',
          });
        });
      }

      if (fetchedSightings && Array.isArray(fetchedSightings) && fetchedSightings.length > 0) {
        fetchedSightings.forEach((sg) => {
          obs.push({
            id: sg.id,
            kind: 'sighting',
            description: sg.description,
            timeAgo: 'Recently reported',
            by: sg.reportedBy ? `Submitted by ${sg.reportedBy.slice(0, 8)}` : 'Eyewitness',
            status: 'PENDING',
          });
        });
      }

      if (obs.length === 0) {
        obs.push(
          {
            id: 'obs-demo-1',
            kind: 'evidence',
            description: 'Discarded blue water bottle found near Trail Gate 2.',
            timeAgo: '2 min ago',
            by: 'Submitted by Shreyash',
            location: 'Search Zone A · Trail Gate 2',
            status: 'VERIFIED',
          },
          {
            id: 'obs-demo-2',
            kind: 'sighting',
            description: 'Possible sighting: female matching physical profile moving toward Lake Pavilion.',
            timeAgo: '5 min ago',
            by: 'Submitted by Field Volunteer Alpha',
            location: 'Search Zone B · Lake Pavilion',
            status: 'PENDING',
          }
        );
      }

      setRecentObservations(obs);

      if (currentUser) {
  const isManager =
    currentUser.role === 'admin' ||
    currentUser.role === 'coordinator' ||
    (item && (String(item.created_by) === String(currentUser.id) ||
      String(item.case_manager_id) === String(currentUser.id)));
  if (isManager) {
    setUserRole('manager');
  } else if (currentUser.role === 'volunteer') {
    setUserRole('volunteer');
  } else {
    setUserRole('creator');
  }
}


      // Load zones and volunteer positions for map using mapsAdapter
      const [zonesData, volLocsData] = await Promise.all([
        fetchMapZones(api, targetId).catch(() => []),
        fetchActiveVolunteerLocations(api, targetId).catch(() => []),
      ]);

      if (zonesData && zonesData.length > 0) {
        setMapZones(zonesData);
      } else {
        setMapZones([
          {
            id: 'zone-1',
            caseId: targetId,
            name: 'Zone A · Community Park Trail',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  { latitude: 18.52, longitude: 73.856 },
                  { latitude: 18.52, longitude: 73.858 },
                  { latitude: 18.522, longitude: 73.858 },
                  { latitude: 18.522, longitude: 73.856 },
                  { latitude: 18.52, longitude: 73.856 },
                ],
              ],
            },
            priorityScore: 87,
            status: 'ASSIGNED',
            assignedTo: 'vol-1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ]);
      }

      if (volLocsData && volLocsData.length > 0) {
        setVolunteerLocs(volLocsData);
      } else {
        setVolunteerLocs([
          {
            latitude: 18.521,
            longitude: 73.857,
            volunteerId: 'vol-alpha',
            caseId: targetId,
            sessionId: 'session-demo',
            accuracy: 8,
            altitude: null,
            speed: null,
            heading: null,
            timestamp: Date.now(),
            zoneId: 'zone-1',
          },
        ]);
      }

      // Ensure active 6-digit code exists for sharing/scanning
      if (joinCode) {
        setGeneratedCode(joinCode.replace(/\D/g, ''));
      } else {
        const local = await findLocalCaseInvite('', targetId);
        if (local && local.join_code) {
          setGeneratedCode(local.join_code.replace(/\D/g, ''));
        } else {
          setGeneratedCode('842195');
        }
      }
    } catch {
      // Robust mock fallback
      if (!generatedCode) setGeneratedCode(joinCode ? joinCode.replace(/\D/g, '') : '842195');
    }
  }, [caseId, joinCode, generatedCode]);

  useEffect(() => {
    loadCaseData();
  }, [loadCaseData]);

  const isCreatorOrManager = userRole === 'creator' || userRole === 'manager';

  const generateInvite = async () => {
    try {
      const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' });
      const invite = await api.createInvite(caseId || 'case-demo-1', {
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      });
      const code = invite.join_code ? String(invite.join_code).replace(/\D/g, '') : String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedCode(code);
      Alert.alert('Invite Token Generated', `6-Digit Code: ${code}\nShare this token or QR invite with verified field volunteers.`);
    } catch {
      const demoCode = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedCode(demoCode);
      Alert.alert('Invite Token Generated', `6-Digit Code: ${demoCode}\nShare this token or QR invite with verified field volunteers.`);
    }
  };

  const handleResolveCase = () => {
    Alert.alert('Resolve Case?', 'Mark this missing person case as resolved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve Case',
        onPress: () => {
          setIsResolved(true);
          setItem((prev) => ({ ...prev, status: 'CASE_RESOLVED' }));
          Alert.alert('Case Resolved', 'Case marked as resolved in the local search network.');
        },
      },
    ]);
  };

  const handlePublishCase = () => {
    Alert.alert('Make Case Public?', 'Share authorized case details with the public search feed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Publish',
        onPress: () => {
          setPublished(true);
          setItem((prev) => ({ ...prev, status: 'PUBLIC_SEARCH' }));
          Alert.alert('Case Escalated', 'Case published to the public search feed.');
        },
      },
    ]);
  };

  const handleNotifyPolice = () => {
    Alert.alert('Notify Police Channel?', 'Send structured missing person case dispatch summary to police channel.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Notify Police',
        onPress: () => {
          setPoliceStatus('REQUESTED');
          Alert.alert('Police Notified', 'Notification dispatch request created.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="px-5 pb-14" showsVerticalScrollIndicator={false}>
        {/* Header Navigation & Role Badge */}
        <View className="pt-5">
          <BackButton fallbackRoute="/main/cases" variant="ghost" className="mb-3" />
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <View className={`px-2.5 py-0.5 rounded-full ${isCreatorOrManager ? 'bg-blue-50 border border-blue-200' : 'bg-teal-50 border border-teal-200'}`}>
                  <Text className={`text-[10px] font-bold ${isCreatorOrManager ? 'text-blue-700' : 'text-teal-800'}`}>
                    {isCreatorOrManager ? 'CASE MANAGER (CREATOR WORKSPACE)' : 'VOLUNTEER PARTICIPANT'}
                  </Text>
                </View>
              </View>
              <Text className="text-3xl font-bold text-navy">{item.name}</Text>
              <Text className="mt-1 text-sm text-muted">Authorized response case · {item.location}</Text>
            </View>
            <StatusBadge status={isResolved ? 'CASE_RESOLVED' : published ? 'PUBLIC_SEARCH' : (item.status as StatusBadgeStatus)} />
          </View>
        </View>

        {/* Person Summary Card */}
        <Card className="mt-5 overflow-hidden p-0">
          <View className="h-44 items-center justify-center bg-navy">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-white/10">
              <UserRound stroke="#FFFFFF" size={37} />
            </View>
            <Text className="mt-3 text-xs text-slate-300">Photo verified by coordinator</Text>
          </View>
          <View className="flex-row divide-x divide-border p-4">
            <Metric label="Age" value={String(item.age)} />
            <Metric label="Gender" value={item.gender} />
            <Metric label="Priority" value={item.priority} critical={item.priority === 'Critical'} />
          </View>
        </Card>

        {/* 📍 LIVE OPERATIONAL MAP SECTION */}
        <Section title="📍 Live Location & Search Map">
          <Card className="p-0 overflow-hidden">
            <TraceOneMap
              zones={mapZones}
              currentLocation={lastSeenLocation}
              currentLocationAccuracy={lastSeenLocation.accuracy}
              volunteerLocations={volunteerLocs}
              height={250}
              layers={['SEARCH_ZONES', 'VOLUNTEER_LOCATION', 'LAST_SEEN_LOCATION']}
            />
            <View className="p-4 border-t border-slate-100 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <MapPin stroke="#0D9488" size={18} />
                <Text className="text-xs font-semibold text-navy">Last seen near {item.location}</Text>
              </View>
              <Button
                label="Expand Map"
                variant="outline"
                onPress={() => router.push({ pathname: '/active-search', params: { caseId: caseId || 'case-demo-1' } })}
              />
            </View>
          </Card>
        </Section>

        {/* 👥 VOLUNTEERS & CASE MEMBERS SECTION */}
        <Section title="👥 Volunteers & Case Responders">
          <Card className="p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                  <UsersRound stroke="#0D9488" size={20} />
                </View>
                <View>
                  <Text className="text-base font-bold text-navy">{item.volunteerCount} Active Field Responders</Text>
                  <Text className="text-xs text-muted">Deployed across assigned search perimeters</Text>
                </View>
              </View>
            </View>
          </Card>
        </Section>

        {/* 📲 VOLUNTEER SEARCH INVITE: QR CODE & 6-DIGIT CODE */}
        <Section title="📲 Volunteer Invite & QR Code">
          <Card className="p-5 border border-teal-200 bg-teal-50/50">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2.5">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-teal-600">
                  <QrCode stroke="#FFFFFF" size={20} />
                </View>
                <View>
                  <Text className="text-sm font-bold text-navy">Share Case with Volunteers</Text>
                  <Text className="text-[11px] text-muted">Scan QR or enter 6-digit code to join</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open camera scanner"
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-teal-200 active:bg-teal-50"
                onPress={() => router.push('/qr-scanner')}
              >
                <Camera size={14} color="#0D9488" />
                <Text className="text-xs font-bold text-teal-700">Scan QR</Text>
              </Pressable>
            </View>

            {/* 6-Digit Code Box */}
            <View className="p-4 rounded-xl bg-white border border-teal-100 flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  6-Digit Join Code
                </Text>
                <Text className="mt-0.5 text-2xl font-black tracking-widest text-navy">
                  {(generatedCode || '842195').replace(/(\d{3})(\d{3})/, '$1 $2')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Copy join code"
                className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 active:bg-teal-700"
                onPress={async () => {
                  const codeToCopy = (generatedCode || '842195').replace(/\D/g, '');
                  await Clipboard.setStringAsync(codeToCopy);
                  Alert.alert('Copied', `Join code ${codeToCopy} copied to clipboard.`);
                }}
              >
                <Copy size={15} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">Copy Code</Text>
              </Pressable>
            </View>

            {/* Scannable QR Code */}
            <View className="mt-4 p-4 rounded-xl bg-white border border-teal-100 items-center justify-center">
              <Text className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted">
                LIVE SCANNABLE QR CODE
              </Text>
              <View className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm items-center justify-center">
                <QRCode
                  value={JSON.stringify({
                    caseId: caseId || 'case-demo-1',
                    joinCode: (generatedCode || '842195').replace(/\D/g, ''),
                    token: (generatedCode || '842195').replace(/\D/g, ''),
                    title: item.name,
                    case_number: caseId || 'TO-2026-0842',
                    age: item.age,
                    gender: item.gender,
                    location: item.location,
                    last_seen_location: item.location,
                    last_seen_time: item.lastSeenTime,
                    clothing: item.clothing,
                    physical_description: item.physicalDescription,
                    status: item.status,
                    priority: item.priority,
                  })}
                  size={180}
                  color="#0F172A"
                  backgroundColor="#FFFFFF"
                />
              </View>
              <Text className="mt-3 text-xs text-center text-teal-900 leading-4">
                Open TraceOne from another profile/phone → Tap "Join Case" → Scan this QR code or enter the 6-digit code.
              </Text>
            </View>

            {/* Regenerate Button */}
            {isCreatorOrManager ? (
              <View className="mt-3.5 flex-row gap-2">
                <Button
                  label="Regenerate Invite Code"
                  variant="outline"
                  icon={KeyRound}
                  fullWidth
                  onPress={generateInvite}
                />
              </View>
            ) : null}
          </Card>
        </Section>

        {/* 🗺️ SEARCH ZONES & ASSIGNMENT SECTION */}
        <Section title="🗺️ Search Zones & Assignments">
          <Card className="mb-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-navy">Search Progress</Text>
              <Text className="text-lg font-bold text-teal">{item.searchProgress}%</Text>
            </View>
            <View className="mt-3 h-2 rounded-full bg-background-muted">
              <View className="h-full rounded-full bg-teal" style={{ width: `${item.searchProgress}%` }} />
            </View>
            <View className="mt-5 flex-row justify-between">
              <Stat label="Volunteers" value={item.volunteerCount} />
              <Stat label="Evidence" value={item.evidenceCount} />
              <Stat label="Zones complete" value={`${item.completedZones}/${item.searchZones}`} />
            </View>
          </Card>

          <ZoneCard
            name="Zone A"
            details="Community Park Trail Perimeter"
            priorityScore={87}
            reason="Near last known location"
            status="ASSIGNED"
            onPress={() => router.push('/search-session')}
          />
        </Section>

        {/* 🔎 SEARCH ACTIVITY & OBSERVATIONS */}
        <Section
          title="🔎 Search Activity & Observations"
          subtitle="Record evidence or sightings to assist human coordinators."
        >
          <View className="gap-3.5">
            {/* 📋 Report Evidence / Observation Card */}
            <Card className="p-4 bg-white border border-slate-200">
              <View className="flex-row items-start gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <FilePlus2 stroke="#0F172A" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-navy">📋 Report Evidence / Observation</Text>
                  <Text className="mt-0.5 text-xs text-muted">Log physical evidence or search notes</Text>
                </View>
              </View>
              <View className="mt-3 pt-3 border-t border-slate-100">
                <Button
                  label="Report Evidence / Observation"
                  icon={FilePlus2}
                  fullWidth
                  onPress={() =>
                    router.push({
                      pathname: '/session-entry',
                      params: { kind: 'evidence', caseId: caseId || 'case-demo-1' },
                    })
                  }
                />
              </View>
            </Card>

            {/* 👁️ Report Possible Sighting Card */}
            <Card className="p-4 bg-white border border-slate-200">
              <View className="flex-row items-start gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <ScanLine stroke="#D97706" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-navy">👁️ Report Possible Sighting</Text>
                  <Text className="mt-0.5 text-xs text-muted">Log a witnessed visual sighting and location</Text>
                </View>
              </View>
              <View className="mt-3 pt-3 border-t border-slate-100">
                <Button
                  label="Report Possible Sighting"
                  variant="outline"
                  icon={ScanLine}
                  fullWidth
                  onPress={() =>
                    router.push({
                      pathname: '/session-entry',
                      params: { kind: 'sighting', caseId: caseId || 'case-demo-1' },
                    })
                  }
                />
              </View>
            </Card>

            <Button
              label="Start Live Search Session"
              variant="secondary"
              icon={Search}
              iconPosition="right"
              fullWidth
              onPress={() => router.push({ pathname: '/search-session', params: { caseId: caseId || 'case-demo-1' } })}
            />
          </View>
        </Section>

        {/* 👁️ RECENT OBSERVATIONS */}
        <Section title="👁️ Recent Observations" subtitle="Real-time field evidence and sightings logged for this case.">
          <Card className="p-4">
            {recentObservations.length > 0 ? (
              <View className="divide-y divide-slate-100">
                {recentObservations.map((obs) => (
                  <View key={obs.id} className="py-3 flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <View className={`px-2 py-0.5 rounded-full ${obs.kind === 'evidence' ? 'bg-slate-100' : 'bg-amber-50'}`}>
                          <Text className={`text-[10px] font-bold uppercase tracking-wider ${obs.kind === 'evidence' ? 'text-navy' : 'text-amber-800'}`}>
                            {obs.kind === 'evidence' ? 'Evidence reported' : 'Possible sighting reported'}
                          </Text>
                        </View>
                        {obs.status && (
                          <Text className="text-[10px] font-bold text-teal">{obs.status}</Text>
                        )}
                      </View>
                      <Text className="mt-1.5 text-sm font-semibold text-navy">{obs.description}</Text>
                      {obs.location ? (
                        <Text className="mt-1 text-xs text-muted">Location: {obs.location}</Text>
                      ) : null}
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-muted">{obs.timeAgo}</Text>
                      <Text className="text-[11px] font-bold text-slate-600 mt-1">{obs.by}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="py-4 items-center justify-center">
                <Text className="text-sm font-semibold text-navy">No observations recorded yet</Text>
                <Text className="mt-1 text-xs text-center text-muted">
                  Field evidence and eyewitness sightings submitted by volunteers will appear here.
                </Text>
              </View>
            )}
          </Card>
        </Section>

        {/* 🧠 AI SEARCH INTELLIGENCE SECTION */}
        <Section title="🧠 AI Search Intelligence (Decision Support)">
          <Card className="p-4 bg-gradient-to-br from-slate-50 to-teal-50/40 border border-teal-100">
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-xl bg-navy">
                <Sparkles color="#5EEAD4" size={18} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-navy">AI Search Priority & Radius</Text>
                <Text className="text-xs text-muted">Decision support for search teams</Text>
              </View>
            </View>
            <Text className="mt-3 text-sm leading-5 text-muted">
              Model recommends focusing on Zone 04 · Park Trail (92% priority score) based on terrain gradient and exit proximity.
            </Text>
            <View className="mt-4">
              <Button
                label="View AI Priority Map & Explanations"
                icon={Zap}
                fullWidth
                onPress={() => router.push({ pathname: '/ai-priority', params: { caseId: caseId || 'case-demo-1' } })}
              />
            </View>
          </Card>
        </Section>

        {/* 📷 HUMAN VERIFICATION & MATCH REVIEW QUEUE */}
        <Section title="📷 Human Verification Review Queue">
          <Card className="p-4 border-l-4 border-l-warning">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-wider text-warning">Candidate Review Required</Text>
              <Text className="text-xs font-bold text-navy">88% Match</Text>
            </View>
            <Text className="mt-2 text-base font-bold text-navy">Sightings Match Candidate #1</Text>
            <Text className="mt-1 text-sm text-muted">
              AI model correlated CCTV footage feature set with missing person physical profile.
            </Text>
            <View className="mt-4">
              <Button
                label="Open Review Queue"
                icon={AlertTriangle}
                fullWidth
                onPress={() => router.push({ pathname: '/possible-match', params: { caseId: caseId || 'case-demo-1', matchId: 'match-demo-1' } })}
              />
            </View>
          </Card>
        </Section>

        {/* 📜 CASE TIMELINE & AUDIT LOG */}
        <Section title="📜 Case Timeline & Audit Events">
          <Card className="p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Clock3 stroke="#64748B" size={18} />
                <Text className="text-base font-bold text-navy">Audit History</Text>
              </View>
              <Text className="text-xs text-muted">{timelineEvents.length || 12} events logged</Text>
            </View>
            <View className="mt-4 pt-3 border-t border-slate-100">
              <Button
                label="View Complete Case Timeline"
                variant="outline"
                icon={ArrowRight}
                iconPosition="right"
                fullWidth
                onPress={() => router.push({ pathname: '/case-timeline', params: { caseId: caseId || 'case-demo-1' } })}
              />
            </View>
          </Card>
        </Section>

        {/* 🚨 CASE MANAGER & CREATOR ADMINISTRATIVE CONTROLS */}
        {isCreatorOrManager ? (
          <Section title="🚨 Manager & Creator Controls">
            <Card className="p-4 gap-3 bg-slate-50 border border-slate-200">
              <Text className="text-xs font-bold uppercase tracking-widest text-slate-500">Administrative Governance</Text>

              <View className="gap-2">
                <Button
                  label={published ? 'Case Published to Public Feed' : 'Approve Public Search Escalation'}
                  variant={published ? 'secondary' : 'primary'}
                  disabled={published}
                  icon={ShieldAlert}
                  fullWidth
                  onPress={handlePublishCase}
                />
                <Button
                  label={policeStatus === 'REQUESTED' ? 'Police Dispatch Notified' : 'Dispatch Police Notification Summary'}
                  variant="outline"
                  icon={Flag}
                  disabled={policeStatus === 'REQUESTED'}
                  fullWidth
                  onPress={handleNotifyPolice}
                />
                <Button
                  label={isResolved ? 'Case Resolved' : 'Mark Case Resolved'}
                  variant="secondary"
                  icon={CheckCircle2}
                  disabled={isResolved}
                  fullWidth
                  onPress={handleResolveCase}
                />
              </View>
            </Card>
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View className="mt-7">
      <Text className="text-lg font-bold text-navy">{title}</Text>
      {subtitle ? <Text className="mt-0.5 mb-3 text-xs text-muted">{subtitle}</Text> : <View className="mb-3" />}
      {children}
    </View>
  );
}

function Metric({ label, value, critical }: { label: string; value: string; critical?: boolean }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-xs text-muted">{label}</Text>
      <Text className={`mt-1 text-sm font-bold ${critical ? 'text-danger' : 'text-navy'}`}>{value}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View>
      <Text className="text-xs text-muted">{label}</Text>
      <Text className="mt-1 text-lg font-bold text-navy">{value}</Text>
    </View>
  );
}
