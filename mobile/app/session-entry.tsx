import { Calendar, CheckCircle2, ChevronDown, Clock, Crosshair, MapPin, WifiOff } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { BackButton } from '@/components/BackButton';
import { PhotoPickerField } from '@/components/PhotoPickerField';
import { createApiClient } from '@/services/api';
import { queueOfflineEvidence, queueOfflineSighting } from '@/services/offlineSync';
import type { EvidenceType } from '@/services/reporting';
import type { Case } from '@/types';

export default function SessionEntryScreen() {
  const router = useRouter();
  const { kind = 'note', caseId: paramCaseId } = useLocalSearchParams<{ kind?: string; caseId?: string }>();
  const [targetCaseId, setTargetCaseId] = useState<string>(paramCaseId ?? '');
  const [caseName, setCaseName] = useState<string>('');
  const [activeCases, setActiveCases] = useState<Case[]>([]);
  const [value, setValue] = useState('');
  const [photoUri, setPhotoUri] = useState<string>();
  const [type, setType] = useState<EvidenceType>('OBSERVATION');
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [time, setTime] = useState('');
  const [source, setSource] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);

  useEffect(() => {
    const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' });
    api.listCases()
      .then((cases) => {
        if (cases && cases.length > 0) {
          setActiveCases(cases);
          if (!targetCaseId) {
            setTargetCaseId(cases[0].id);
            setCaseName(cases[0].title);
          }
        }
      })
      .catch(() => undefined);

    if (paramCaseId) {
      api.getCaseDetails(paramCaseId)
        .then((detail) => {
          if (detail?.name) setCaseName(detail.name);
        })
        .catch(() => undefined);
    }
  }, [targetCaseId, paramCaseId]);

  const effectiveCaseId = targetCaseId || paramCaseId || (activeCases[0]?.id ?? 'case-demo-1');

  const handleGetCurrentLocation = () => {
    setLocatingGps(true);
    setError(null);

    if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined' && window.navigator.geolocation) {
      window.navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setCoords({ latitude: lat, longitude: lon });
          setLocation(`GPS: ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
          setLocatingGps(false);
        },
        () => {
          setLocatingGps(false);
          setError('GPS location unavailable or permission denied. Please enter location manually.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocatingGps(false);
      setError('GPS is unavailable on this device. Please enter location manually.');
    }
  };

  const handleSubmit = async () => {
    if (!value.trim()) return;
    setSubmitting(true);
    setError(null);

    const isOffline = typeof window !== 'undefined' && typeof window.navigator !== 'undefined' && !window.navigator.onLine;

    try {
      if (isOffline) {
        if (isEvidence) {
          await queueOfflineEvidence({
            sessionToken: effectiveCaseId,
            type,
            location,
            time: time || new Date().toLocaleTimeString(),
            description: value,
            photoUri,
            source,
            coordinates: coords,
          });
        } else if (isSighting) {
          await queueOfflineSighting({
            sessionToken: effectiveCaseId,
            location,
            time: time || new Date().toLocaleTimeString(),
            description: value,
            photoUri,
            additionalObservation: source,
            coordinates: coords,
          });
        }
        setIsOfflineSaved(true);
        setSuccess(true);
        return;
      }

      const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' });
      if (isEvidence) {
        await api.createEvidence({
          sessionToken: effectiveCaseId,
          type,
          location,
          time: time || new Date().toLocaleTimeString(),
          description: value,
          photoUri,
          source,
          coordinates: coords,
        });
      } else if (isSighting) {
        await api.reportSighting({
          sessionToken: effectiveCaseId,
          location,
          time: time || new Date().toLocaleTimeString(),
          description: value,
          photoUri,
          additionalObservation: source,
          coordinates: coords,
        });
      } else {
        await api.createSearchNote({
          sessionToken: effectiveCaseId,
          text: value,
          location,
          photoUri,
          coordinates: coords,
        });
      }
      setIsOfflineSaved(false);
      setSuccess(true);
    } catch {
      // Offline fallback: queue locally so field observations are never lost
      if (isEvidence) {
        await queueOfflineEvidence({
          sessionToken: effectiveCaseId,
          type,
          location,
          time: time || new Date().toLocaleTimeString(),
          description: value,
          photoUri,
          source,
          coordinates: coords,
        });
      } else if (isSighting) {
        await queueOfflineSighting({
          sessionToken: effectiveCaseId,
          location,
          time: time || new Date().toLocaleTimeString(),
          description: value,
          photoUri,
          additionalObservation: source,
          coordinates: coords,
        });
      }
      setIsOfflineSaved(true);
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  const isEvidence = kind === 'evidence';
  const isSighting = kind === 'sighting';
  const title = isEvidence ? 'Report Evidence / Observation' : isSighting ? 'Report Possible Sighting' : 'Add Search Note';

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-7">
          <View className={`h-20 w-20 items-center justify-center rounded-full ${isOfflineSaved ? 'bg-amber-50' : 'bg-green-50'}`}>
            <CheckCircle2 stroke={isOfflineSaved ? '#D97706' : '#16A34A'} size={40} />
          </View>
          {isOfflineSaved ? (
            <View className="mt-3 flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300">
              <WifiOff stroke="#B45309" size={14} />
              <Text className="text-xs font-bold text-amber-800">Saved Offline · Sync Pending</Text>
            </View>
          ) : (
            <View className="mt-3 px-3 py-1 rounded-full bg-green-100 border border-green-300">
              <Text className="text-xs font-bold text-green-800">Verified Submission Prepared</Text>
            </View>
          )}
          <Text className="mt-4 text-2xl font-bold text-navy text-center">
            {isOfflineSaved
              ? isEvidence
                ? 'Evidence saved offline — will sync when connection returns.'
                : 'Sighting saved offline — will sync when connection returns.'
              : isEvidence
                ? 'Evidence submitted successfully'
                : 'Sighting submitted successfully'}
          </Text>
          <Text className="mt-3 text-center text-base leading-6 text-muted">
            {isOfflineSaved
              ? 'Stored safely on your device in the offline sync queue. It will automatically upload to coordinators as soon as connection is restored.'
              : `Observation recorded for ${caseName || 'the missing person investigation'}. All submitted findings require human verification by an authorized Case Manager.`}
          </Text>
          <View className="mt-8 w-full gap-3">
            <Button
              label="Back to Case Workspace"
              fullWidth
              onPress={() => router.replace({ pathname: '/case-details', params: { caseId: effectiveCaseId } })}
            />
            <Button
              label="Volunteer Workspace"
              variant="outline"
              fullWidth
              onPress={() => router.replace('/volunteer')}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="px-6 pb-12" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="pt-5">
            <BackButton fallbackRoute={`/case-details?caseId=${effectiveCaseId}`} variant="ghost" className="mb-3" />
            <View className="flex-row items-center gap-2 mb-1.5">
              <View className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200">
                <Text className="text-xs font-bold text-teal-800">CASE: {caseName || 'Missing Person Investigation'}</Text>
              </View>
            </View>
            <Text className="text-3xl font-bold text-navy">{title}</Text>
          </View>
          <Text className="mt-2 text-base leading-6 text-muted">
            {isEvidence
              ? 'Log physical evidence or search notes to assist human coordinators.'
              : isSighting
                ? 'Log witnessed visual sighting location. Use factual details.'
                : 'Add contextual notes for the search team.'}
          </Text>

          {isEvidence ? (
            <Section title="Evidence & Observations">
              <SelectField
                label="Observation Type"
                value={type}
                onPress={() => {
                  const types: EvidenceType[] = ['OBSERVATION', 'WITNESS', 'LAST_SEEN', 'DIRECTION', 'EXIT', 'CROWD_FLOW', 'SEARCH_RESULT'];
                  const nextIndex = (types.indexOf(type) + 1) % types.length;
                  setType(types[nextIndex]);
                }}
              />
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-navy">Location *</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleGetCurrentLocation}
                    disabled={locatingGps}
                    className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 active:bg-blue-100"
                  >
                    <Crosshair stroke="#2563EB" size={14} />
                    <Text className="text-xs font-bold text-blue">
                      {locatingGps ? 'Locating GPS...' : 'Use Current GPS Location'}
                    </Text>
                  </Pressable>
                </View>
                <View className="flex-row rounded-xl border border-border bg-surface px-4 min-h-[52px] items-center">
                  <MapPin stroke="#64748B" size={18} />
                  <TextInput
                    accessibilityLabel="Location"
                    className="flex-1 px-2 py-3 text-base text-navy"
                    placeholder="Where was this observed? (or tap Use Current GPS Location)"
                    placeholderTextColor="#64748B"
                    value={location}
                    onChangeText={(val) => {
                      setLocation(val);
                      if (coords && !val.startsWith('GPS:')) setCoords(null);
                    }}
                  />
                </View>
                {coords ? (
                  <Text className="text-[11px] font-semibold text-emerald-700">
                    ✓ Real GPS coordinates captured: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                  </Text>
                ) : null}
              </View>
              <Field
                label="Time Observed"
                placeholder="When did this occur? (e.g. Today, 09:15 AM)"
                icon={Calendar}
                value={time}
                onChangeText={setTime}
              />
              <Field
                label="Description / Observation *"
                placeholder="Describe only what was physically observed or heard."
                multiline
                value={value}
                onChangeText={setValue}
              />
              <PhotoPickerField value={photoUri} onChange={setPhotoUri} />
              <Field
                label="Additional Notes / Source (optional)"
                placeholder="Volunteer, park visitor, witness or other permitted source"
                value={source}
                onChangeText={setSource}
              />
            </Section>
          ) : isSighting ? (
            <Section title="Visual Sighting Details">
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-navy">Sighting Location *</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleGetCurrentLocation}
                    disabled={locatingGps}
                    className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 active:bg-blue-100"
                  >
                    <Crosshair stroke="#2563EB" size={14} />
                    <Text className="text-xs font-bold text-blue">
                      {locatingGps ? 'Locating GPS...' : 'Use My Current Location'}
                    </Text>
                  </Pressable>
                </View>
                <View className="flex-row rounded-xl border border-border bg-surface px-4 min-h-[52px] items-center">
                  <MapPin stroke="#64748B" size={18} />
                  <TextInput
                    accessibilityLabel="Sighting Location"
                    className="flex-1 px-2 py-3 text-base text-navy"
                    placeholder="Exact spot where seen (or tap Use My Current Location)"
                    placeholderTextColor="#64748B"
                    value={location}
                    onChangeText={(val) => {
                      setLocation(val);
                      if (coords && !val.startsWith('GPS:')) setCoords(null);
                    }}
                  />
                </View>
                {coords ? (
                  <Text className="text-[11px] font-semibold text-emerald-700">
                    ✓ Real GPS coordinates captured: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                  </Text>
                ) : null}
              </View>
              <Field
                label="Date & Time Seen *"
                placeholder="When were they seen? (e.g. 10 minutes ago, 08:30 AM)"
                icon={Calendar}
                value={time}
                onChangeText={setTime}
              />
              <Field
                label="Sighting Description / Appearance *"
                placeholder="Example: I saw a person wearing a blue shirt and dark jeans moving toward the parking area."
                multiline
                value={value}
                onChangeText={setValue}
              />
              <PhotoPickerField value={photoUri} onChange={setPhotoUri} />
              <Field
                label="Direction of Travel & Additional Notes"
                placeholder="Direction headed, anyone with them, emotional or physical state..."
                multiline
                value={source}
                onChangeText={setSource}
              />
            </Section>
          ) : (
            <Section title="Search Note">
              <Field
                label="Search Notes *"
                placeholder="Write clear, factual search details..."
                multiline
                value={value}
                onChangeText={setValue}
              />
              <PhotoPickerField value={photoUri} onChange={setPhotoUri} />
              <Field
                label="Location (optional)"
                placeholder="Current zone or landmark"
                icon={MapPin}
                value={location}
                onChangeText={setLocation}
              />
            </Section>
          )}

          <View className="mt-8 gap-3">
            <Button
              label={
                submitting
                  ? 'Submitting...'
                  : isSighting
                    ? 'Submit Sighting'
                    : isEvidence
                      ? 'Submit Evidence'
                      : 'Save Search Note'
              }
              fullWidth
              disabled={!value.trim() || submitting}
              onPress={handleSubmit}
            />
            <Button
              label="Cancel"
              variant="outline"
              fullWidth
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/volunteer'))}
            />
            {error ? <Text className="mt-2 text-sm text-red-600 text-center">{error}</Text> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <View className="mt-7 gap-4"><Text className="text-lg font-bold text-navy">{title}</Text>{children}</View>; }
function Field({ label, placeholder, value, onChangeText, multiline = false, icon: Icon }: { label: string; placeholder: string; value: string; onChangeText: (value: string) => void; multiline?: boolean; icon?: typeof MapPin }) { return <View className="gap-2"><Text className="text-sm font-semibold text-navy">{label}</Text><View className={`flex-row rounded-xl border border-border bg-surface px-4 ${multiline ? 'min-h-[120px]' : 'min-h-[52px] items-center'}`}>{Icon ? <Icon stroke="#64748B" size={18} /> : null}<TextInput accessibilityLabel={label} multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} className={`flex-1 px-2 py-3 text-base text-navy ${multiline ? 'min-h-[110px]' : ''}`} placeholder={placeholder} placeholderTextColor="#64748B" value={value} onChangeText={onChangeText} /></View></View>; }
function SelectField({ label, value, onPress }: { label: string; value: string; onPress: () => void }) { return <View className="gap-2"><Text className="text-sm font-semibold text-navy">{label}</Text><Pressable accessibilityRole="button" className="min-h-[52px] flex-row items-center justify-between rounded-xl border border-border bg-surface px-4" onPress={onPress}><Text className="text-base text-navy">{value.replace('_', ' ')}</Text><ChevronDown stroke="#64748B" size={19} /></Pressable></View>; }
