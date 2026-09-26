import {
  AlertTriangle,
  Compass,
  FilePlus2,
  Flag,
  MapPin,
  MessageSquarePlus,
  Navigation,
  Pause,
  Play,
  Radio,
  Square,
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { BackButton } from '@/components/BackButton';
import { SessionStatus } from '@/components/SessionStatus';
import { TraceOneMap } from '@/components/MapPlaceholder';
import type { SearchSessionStatus } from '@/services/searchSession';
import { createApiClient } from '@/services/api';
import { startForegroundLocationTracking, type TrackingState } from '@/services/activeSearchLocation';
import { SupabaseRealtimeAdapter, createRealtimeChannelKey } from '@/services/realtime';
import { supabase } from '@/services/supabase';
import { fetchActiveVolunteerLocations, fetchMapZones } from '@/services/mapsAdapter';
import type { SearchZone } from '@maps/zones/types';
import type { GPSLocation } from '@maps/location/types';
import type { VolunteerLocationUpdate } from '@maps/volunteers/types';
import type { CaseDetail } from '@/services/caseDetails';

export default function ActiveSearchScreen() {
  const router = useRouter();
  const { caseId, sessionId, zoneId } = useLocalSearchParams<{
    caseId?: string;
    sessionId?: string;
    zoneId?: string;
  }>();

  const [status, setStatus] = useState<SearchSessionStatus>('ACTIVE');
  const [trackingState, setTrackingState] = useState<TrackingState>('STOPPED');
  const [seconds, setSeconds] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null);
  const [recordedLocations, setRecordedLocations] = useState<GPSLocation[]>([]);
  const [zones, setZones] = useState<SearchZone[]>([]);
  const [assignedZone, setAssignedZone] = useState<SearchZone | null>(null);
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [otherVolunteers, setOtherVolunteers] = useState<VolunteerLocationUpdate[]>([]);

  const api = useMemo(
    () => createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' }),
    [],
  );

  useEffect(() => {
    if (status !== 'ACTIVE') return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Load case details, initial search zones, and active volunteer locations
  useEffect(() => {
    if (!caseId) return;

    void api
      .getCaseDetails(caseId)
      .then(setCaseDetail)
      .catch(() => undefined);

    void fetchMapZones(api, caseId)
      .then((fetchedZones) => {
        setZones(fetchedZones);
        if (zoneId) {
          const match = fetchedZones.find((z) => z.id === zoneId);
          if (match) {
            setAssignedZone(match);
            return;
          }
        }
        if (fetchedZones.length > 0) {
          setAssignedZone(fetchedZones[0]);
        }
      })
      .catch(() => undefined);

    void fetchActiveVolunteerLocations(api, caseId)
      .then(setOtherVolunteers)
      .catch(() => undefined);

    // If session ID exists, load previously stored location records
    if (sessionId) {
      void api
        .getLocationHistory(caseId, sessionId)
        .then((history) => {
          if (history && history.length > 0) {
            const parsed = history.map((h) => ({
              latitude: h.location.coordinates[1],
              longitude: h.location.coordinates[0],
              accuracy: h.accuracy_m ?? null,
              altitude: null,
              speed: h.speed ?? null,
              heading: h.heading ?? null,
              timestamp: Date.parse(h.recorded_at),
            }));
            setRecordedLocations(parsed);
          }
        })
        .catch(() => undefined);
    }
  }, [caseId, sessionId, zoneId, api]);

  // Live GPS tracking using real device location provider
  useEffect(() => {
    if (status !== 'ACTIVE' || !caseId || !sessionId) {
      setTrackingState('STOPPED');
      return;
    }
    return startForegroundLocationTracking(
      api,
      caseId,
      sessionId,
      setTrackingState,
      15000,
      (loc) => {
        setCurrentLocation(loc);
        setRecordedLocations((prev) => [...prev, loc]);
      },
    );
  }, [api, caseId, sessionId, status]);

  // Supabase Realtime updates for other volunteers in the same case
  useEffect(() => {
    if (!caseId) return;
    const adapter = new SupabaseRealtimeAdapter(supabase);
    const channel = createRealtimeChannelKey('locations', caseId);

    void adapter
      .connect()
      .then(() =>
        adapter.subscribe(channel, (event) => {
          if (event.eventType === 'VOLUNTEER_LOCATION_UPDATED') {
            const row = event.payload as Record<string, unknown>;
            const rawLocation = row.location as { coordinates?: [number, number] } | undefined;
            const lat =
              typeof row.latitude === 'number'
                ? row.latitude
                : typeof rawLocation?.coordinates?.[1] === 'number'
                  ? rawLocation.coordinates[1]
                  : null;
            const lon =
              typeof row.longitude === 'number'
                ? row.longitude
                : typeof rawLocation?.coordinates?.[0] === 'number'
                  ? rawLocation.coordinates[0]
                  : null;
            const volId =
              typeof row.volunteer_id === 'string'
                ? row.volunteer_id
                : typeof row.volunteerId === 'string'
                  ? row.volunteerId
                  : null;

            if (lat != null && lon != null && volId) {
              setOtherVolunteers((prev) => {
                const filtered = prev.filter((v) => v.volunteerId !== volId);
                return [
                  ...filtered,
                  {
                    latitude: lat,
                    longitude: lon,
                    volunteerId: volId,
                    caseId,
                    accuracy: typeof row.accuracy_m === 'number' ? row.accuracy_m : null,
                    altitude: null,
                    speed: typeof row.speed === 'number' ? row.speed : null,
                    heading: typeof row.heading === 'number' ? row.heading : null,
                    timestamp: Date.now(),
                    zoneId: typeof row.zone_id === 'string' ? row.zone_id : null,
                  },
                ];
              });
            }
          }
        }),
      )
      .catch(() => undefined);

    return () => {
      void adapter.unsubscribe(channel);
      void adapter.disconnect();
    };
  }, [caseId]);

  // Deterministic search coverage calculation based on real assigned zone and real recorded GPS points
  const coverage = useMemo(() => {
    const allLocations = currentLocation
      ? [...recordedLocations, currentLocation]
      : recordedLocations;

    if (!assignedZone) {
      return { percentage: 0, coveredPoints: 0, totalPoints: 0, explanation: 'Awaiting zone data' };
    }

    if (assignedZone.status === 'SEARCHED') {
      return { percentage: 100, coveredPoints: 1, totalPoints: 1, explanation: 'Zone marked fully searched' };
    }

    if (allLocations.length === 0) {
      return { percentage: 0, coveredPoints: 0, totalPoints: 0, explanation: '0 search points recorded' };
    }

    // Extract polygon coordinates
    let polygonRings: Array<Array<{ latitude: number; longitude: number }>> = [];
    if (assignedZone.geometry.type === 'Polygon') {
      polygonRings = assignedZone.geometry.coordinates;
    } else if (assignedZone.geometry.type === 'MultiPolygon') {
      polygonRings = assignedZone.geometry.coordinates.flat();
    }

    if (polygonRings.length === 0 || polygonRings[0].length < 3) {
      const percentage = Math.min(100, allLocations.length * 5);
      return {
        percentage,
        coveredPoints: allLocations.length,
        totalPoints: 20,
        explanation: `${allLocations.length} search GPS coordinates logged`,
      };
    }

    const ring = polygonRings[0];
    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;
    for (const pt of ring) {
      if (pt.latitude < minLat) minLat = pt.latitude;
      if (pt.latitude > maxLat) maxLat = pt.latitude;
      if (pt.longitude < minLng) minLng = pt.longitude;
      if (pt.longitude > maxLng) maxLng = pt.longitude;
    }

    // Ray-casting algorithm to test if sector center is within the zone polygon
    const isInside = (lat: number, lng: number) => {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i].longitude,
          yi = ring[i].latitude;
        const xj = ring[j].longitude,
          yj = ring[j].latitude;
        const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    };

    const GRID_SIZE = 5;
    const latStep = (maxLat - minLat) / GRID_SIZE;
    const lngStep = (maxLng - minLng) / GRID_SIZE;

    const sectors: Array<{ lat: number; lng: number }> = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cLat = minLat + (r + 0.5) * latStep;
        const cLng = minLng + (c + 0.5) * lngStep;
        if (isInside(cLat, cLng)) {
          sectors.push({ lat: cLat, lng: cLng });
        }
      }
    }

    const totalPoints = sectors.length > 0 ? sectors.length : 1;
    const thresholdSq = Math.pow(Math.max(latStep, lngStep) * 1.3, 2);

    let coveredPoints = 0;
    for (const sector of sectors) {
      const isCovered = allLocations.some((loc) => {
        const dLat = loc.latitude - sector.lat;
        const dLng = loc.longitude - sector.lng;
        return dLat * dLat + dLng * dLng <= thresholdSq;
      });
      if (isCovered) {
        coveredPoints++;
      }
    }

    const percentage = Math.min(100, Math.round((coveredPoints / totalPoints) * 100));
    return {
      percentage,
      coveredPoints,
      totalPoints,
      explanation: `${coveredPoints} of ${totalPoints} zone sectors traversed`,
    };
  }, [assignedZone, currentLocation, recordedLocations]);

  const finish = () =>
    Alert.alert(
      'Finish this search session?',
      'Your session will be marked ready for coordinator review.',
      [
        { text: 'Keep searching', style: 'cancel' },
        { text: 'Finish Search', style: 'destructive', onPress: () => setStatus('FINISHED') },
      ],
    );

  const time = `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(
    Math.floor(seconds / 60) % 60,
  ).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  if (status === 'FINISHED') {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-7">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <Flag stroke="#16A34A" size={32} />
          </View>
          <Text className="mt-5 text-2xl font-bold text-navy">Search session finished</Text>
          <Text className="mt-3 text-center text-base leading-6 text-muted">
            Your search coverage of {coverage.percentage}% has been recorded for coordinator review.
          </Text>
          <View className="mt-8 w-full gap-3">
            <Pressable
              accessibilityRole="button"
              className="min-h-[50px] items-center justify-center rounded-xl bg-teal px-5"
              onPress={() =>
                router.replace(
                  caseId
                    ? { pathname: '/case-details', params: { caseId } }
                    : '/main/cases',
                )
              }
            >
              <Text className="text-base font-bold text-white">Return to Case Details</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="px-5 pb-10 pt-4" showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400).easing(Easing.out(Easing.cubic))}>
          <BackButton fallbackRoute="/case-details" variant="ghost" className="mb-3" />
          <Text className="text-xs font-bold uppercase tracking-[2px] text-teal">Active Search</Text>
          <Text className="mt-1 text-3xl font-bold text-navy">
            {assignedZone?.name || 'Assigned Search Zone'}
          </Text>
          <Text className="mt-1 text-sm text-muted">
            {caseDetail?.name ? `Case: ${caseDetail.name}` : 'TraceOne Volunteer Operation'}
          </Text>
          <View className="mt-4">
            <SessionStatus
              status={status}
              locationStatus={trackingState === 'TRACKING' ? 'GPS_CONNECTED' : 'LOCATION_UNAVAILABLE'}
            />
          </View>
        </Animated.View>

        {/* 1. REAL ASSIGNED SEARCH ZONE CARD */}
        <Card className="mt-4 p-4 border border-teal-100 bg-teal-50/40">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                SEARCH ZONE
              </Text>
              <Text className="mt-0.5 text-lg font-bold text-navy">
                {assignedZone?.name || 'Zone Pending Assignment'}
              </Text>
            </View>
            <View className="px-2.5 py-1 rounded-full bg-teal border border-teal-600">
              <Text className="text-[10px] font-bold uppercase text-white">
                {assignedZone?.status || 'ASSIGNED'}
              </Text>
            </View>
          </View>
          {assignedZone?.priorityScore ? (
            <Text className="mt-2 text-xs text-muted">
              Priority Score: {assignedZone.priorityScore} / 100
            </Text>
          ) : null}
        </Card>

        {/* 2. REAL DEVICE GPS / LIVE LOCATION */}
        <Card className="mt-3 p-4 bg-white border border-slate-200">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View
                className={`h-2.5 w-2.5 rounded-full ${
                  trackingState === 'TRACKING' ? 'bg-green-500' : 'bg-amber-400'
                }`}
              />
              <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                LIVE LOCATION
              </Text>
            </View>
            <Text className="text-xs font-semibold text-teal">
              {trackingState === 'TRACKING'
                ? 'GPS Active'
                : trackingState === 'STARTING'
                  ? 'Acquiring GPS…'
                  : trackingState === 'PERMISSION_DENIED'
                    ? 'Permission Denied'
                    : 'Location Standby'}
            </Text>
          </View>

          {currentLocation ? (
            <View className="mt-3 flex-row items-center justify-between pt-2 border-t border-slate-100">
              <View className="flex-row items-center gap-1.5">
                <Navigation size={14} stroke="#0D9488" />
                <Text className="text-xs font-mono font-bold text-navy">
                  {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}
                </Text>
              </View>
              {currentLocation.accuracy != null ? (
                <Text className="text-[11px] text-muted">
                  Accuracy: ±{Math.round(currentLocation.accuracy)}m
                </Text>
              ) : null}
            </View>
          ) : (
            <View className="mt-3 flex-row items-center gap-2 pt-2 border-t border-slate-100">
              {trackingState === 'STARTING' ? (
                <ActivityIndicator size="small" color="#0D9488" />
              ) : (
                <Radio size={14} stroke="#64748B" />
              )}
              <Text className="text-xs text-muted">
                {trackingState === 'PERMISSION_DENIED'
                  ? 'Enable device location permissions to track search progress.'
                  : 'Waiting for device GPS fix…'}
              </Text>
            </View>
          )}
        </Card>

        {/* 3. REAL SEARCH COVERAGE PERCENTAGE */}
        <Card className="mt-3 p-4 bg-white border border-slate-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              SEARCH COVERAGE
            </Text>
            <Text className="text-lg font-black text-navy">{coverage.percentage}%</Text>
          </View>

          {/* Real Coverage Progress Bar */}
          <View className="mt-2.5 h-3.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
            <View
              className="h-full rounded-full bg-teal"
              style={{ width: `${coverage.percentage}%` }}
            />
          </View>

          <View className="mt-2.5 flex-row items-center justify-between">
            <Text className="text-xs text-muted">{coverage.explanation}</Text>
            <Text className="text-[11px] font-medium text-slate-500">
              {recordedLocations.length} GPS fixes logged
            </Text>
          </View>
        </Card>

        {/* 4. EXISTING TRACEONE OPERATIONAL MAP */}
        <View className="mt-4">
          <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            OPERATIONAL SEARCH MAP
          </Text>
          <Card className="p-0 overflow-hidden border border-slate-200">
            <TraceOneMap
              zones={zones}
              currentLocation={currentLocation}
              currentLocationAccuracy={currentLocation?.accuracy}
              volunteerLocations={otherVolunteers}
              height={260}
              layers={['SEARCH_ZONES', 'VOLUNTEER_LOCATION']}
            />
          </Card>
        </View>

        {/* Search Timer Card */}
        <Card className="mt-4 items-center bg-navy p-5">
          <Text className="text-xs font-bold uppercase tracking-[2px] text-slate-400">
            SEARCH TIMER
          </Text>
          <Text className="mt-1 text-3xl font-bold tracking-wider text-white">{time}</Text>
          <Text className="mt-1 text-xs text-teal-light">
            Status: {status === 'ACTIVE' ? 'Search in Progress' : 'Paused'}
          </Text>
        </Card>

        {/* Search Actions */}
        <View className="mt-5 flex-row flex-wrap gap-3">
          <Action
            icon={status === 'PAUSED' ? Play : Pause}
            label={status === 'PAUSED' ? 'Resume' : 'Pause Search'}
            onPress={() => setStatus(status === 'PAUSED' ? 'ACTIVE' : 'PAUSED')}
          />
          <Action
            icon={MessageSquarePlus}
            label="Add Note"
            onPress={() =>
              router.push({
                pathname: '/session-entry',
                params: { kind: 'note', caseId, sessionId },
              })
            }
          />
          <Action
            icon={FilePlus2}
            label="Report Evidence"
            onPress={() =>
              router.push({
                pathname: '/session-entry',
                params: { kind: 'evidence', caseId, sessionId },
              })
            }
          />
          <Action
            icon={Flag}
            label="Report Sighting"
            onPress={() =>
              router.push({
                pathname: '/session-entry',
                params: { kind: 'sighting', caseId, sessionId },
              })
            }
          />
        </View>

        {/* Finish Search Button */}
        <View className="mt-6">
          <Pressable
            accessibilityRole="button"
            className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-xl bg-danger active:opacity-80"
            onPress={finish}
          >
            <Square stroke="#FFFFFF" size={18} />
            <Text className="text-base font-semibold text-white">Finish Search</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({
  icon: Icon,
  label,
  onPress,
}: {
  icon: typeof Pause;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-[84px] w-[47%] rounded-xl border border-border bg-surface p-4 shadow-sm active:bg-background-muted"
      onPress={onPress}
    >
      <Icon stroke="#2563EB" size={20} />
      <Text className="mt-2 text-sm font-semibold text-navy">{label}</Text>
    </Pressable>
  );
}
