import { AlertTriangle, Calendar, Camera, CheckCircle2, Clock, Copy, ImagePlus, MapPin, QrCode as QrIcon, Sparkles, Trash2, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import QRCode from 'react-native-qrcode-svg';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { AuthFeedback } from '@/components/AuthFeedback';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { CaseReportCard } from '@/components/CaseReportCard';
import { createApiClient, TraceOneApiError } from '@/services/api';
import { queueOfflineCase } from '@/services/offlineSync';
import { pickCasePhoto, takeCasePhoto, uploadCasePhoto } from '@/services/photo';
import type { AuthStatus } from '@/services/auth';
import type { AppearanceData, CreateCasePayload } from '@/services/cases';
import { saveLocalCaseInvite } from '@/services/joinCase';
import type { Case } from '@/types';

const initialForm: CreateCasePayload = {
  missingPersonName: '',
  age: '',
  gender: '',
  lastSeenLocation: '',
  lastSeenDate: '',
  lastSeenTime: '',
  clothing: '',
  physicalDescription: '',
  knownDestination: '',
  direction: '',
  eventVenue: '',
  additionalInformation: '',
};

const initialAppearance: AppearanceData = {
  height: '',
  build: '',
  hairColor: '',
  hairStyle: '',
  eyeColor: '',
  skinTone: '',
  shirtColor: '',
  shirtType: '',
  pantsColor: '',
  pantsType: '',
  footwear: '',
  accessories: '',
};

export default function CreateCaseScreen() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [appearance, setAppearance] = useState(initialAppearance);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [error, setError] = useState('');
  const [createdCase, setCreatedCase] = useState<Case | null>(null);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [inviteData, setInviteData] = useState<{ joinCode: string; inviteToken?: string } | null>(null);

  const update = (key: keyof CreateCasePayload, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const updateAppearance = (key: keyof AppearanceData, value: string) =>
    setAppearance((current) => ({ ...current, [key]: value }));

  const handlePickPhoto = async () => {
    const uri = await pickCasePhoto();
    if (uri) setPhotoUri(uri);
  };

  const handleTakePhoto = async () => {
    const uri = await takeCasePhoto();
    if (uri) setPhotoUri(uri);
  };

  const handlePhotoAction = () => {
    if (photoUri) {
      Alert.alert('Photo', 'Change or remove photo?', [
        { text: 'Pick from Library', onPress: handlePickPhoto },
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Remove', style: 'destructive', onPress: () => setPhotoUri(null) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Add Photo', 'Choose photo source', [
        { text: 'Pick from Library', onPress: handlePickPhoto },
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const submit = async () => {
    if (
      !form.missingPersonName.trim() ||
      !form.age.trim() ||
      !form.lastSeenLocation.trim()
    ) {
      setError('Please provide Missing Person Name, Age, and Last Known Location.');
      setStatus('validation-error');
      return;
    }

    const timeProvided = (form.lastSeenTime && form.lastSeenTime.trim()) || (form.lastSeenDate && form.lastSeenDate.trim());
    if (!timeProvided) {
      setError('Please provide Last Seen Date and/or Time.');
      setStatus('validation-error');
      return;
    }

    setError('');
    setStatus('loading');

    const isOffline =
      typeof window !== 'undefined' &&
      typeof window.navigator !== 'undefined' &&
      !window.navigator.onLine;

    // Combine date and time for backend last_seen_at
    const fullLastSeen = [form.lastSeenDate?.trim(), form.lastSeenTime?.trim()].filter(Boolean).join(' ') || new Date().toLocaleString();

    // Build the payload with appearance data
    const hasAppearanceData = Object.values(appearance).some((v) => v.trim() !== '');
    const payload: CreateCasePayload = {
      ...form,
      lastSeenTime: fullLastSeen,
      appearance: hasAppearanceData ? appearance : undefined,
    };

    if (isOffline) {
      const offlineCase = await queueOfflineCase(payload);
      setCreatedCase(offlineCase);
      setIsOfflineSaved(true);
      const offlineCode = String(Math.floor(100000 + Math.random() * 900000));
      setInviteData({
        joinCode: offlineCode,
        inviteToken: `offline-${offlineCase.id}-${offlineCode}`,
      });
      setStatus('success');
      return;
    }

    try {
      // 1. Upload photo first if selected — must succeed before creating case
      let uploadedPhotoUrl: string | undefined;
      if (photoUri) {
        setUploadingPhoto(true);
        try {
          const tempId = `pending_${Date.now()}`;
          uploadedPhotoUrl = await uploadCasePhoto(photoUri, tempId);
        } catch (photoError: any) {
          setUploadingPhoto(false);
          setError(photoError?.message || 'Photo upload failed. Please try again or remove photo.');
          setStatus('validation-error');
          return;
        } finally {
          setUploadingPhoto(false);
        }
      }

      if (uploadedPhotoUrl) {
        payload.photoUri = uploadedPhotoUrl;
      }

      // 2. Call real Backend API
      const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '' });
      const newCase = await api.createCase(payload);
      setCreatedCase(newCase);
      setIsOfflineSaved(false);

      // 3. Auto-generate secure 6-digit invite code for volunteers
      try {
        const inviteRes = await api.createInvite(newCase.id, {
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          max_uses: 100,
        });
        let finalCode = String(Math.floor(100000 + Math.random() * 900000));
        let finalToken = finalCode;
        if (inviteRes && typeof inviteRes === 'object' && ('join_code' in inviteRes || 'joinCode' in (inviteRes as any))) {
          finalCode = String((inviteRes as any).join_code || (inviteRes as any).joinCode);
          finalToken = String((inviteRes as any).invite_token || (inviteRes as any).inviteToken || finalCode);
        }
        setInviteData({
          joinCode: finalCode,
          inviteToken: finalToken,
        });
        void saveLocalCaseInvite({
          join_code: finalCode,
          case_id: newCase.id,
          invite_token: finalToken,
          title: newCase.title,
          case_number: newCase.case_number,
          saved_at: Date.now(),
        });
      } catch (inviteErr) {
        console.warn('Could not auto-generate invite for case:', inviteErr);
        const fallbackCode = String(Math.floor(100000 + Math.random() * 900000));
        setInviteData({
          joinCode: fallbackCode,
          inviteToken: fallbackCode,
        });
        void saveLocalCaseInvite({
          join_code: fallbackCode,
          case_id: newCase.id,
          invite_token: fallbackCode,
          title: newCase.title,
          case_number: newCase.case_number,
          saved_at: Date.now(),
        });
      }

      setStatus('success');
    } catch {
      // Local-first offline sync fallback
      const offlineCase = await queueOfflineCase(payload);
      setCreatedCase(offlineCase);
      setIsOfflineSaved(true);
      const offlineCode = String(Math.floor(100000 + Math.random() * 900000));
      setInviteData({
        joinCode: offlineCode,
        inviteToken: `offline-${offlineCase.id}-${offlineCode}`,
      });
      void saveLocalCaseInvite({
        join_code: offlineCode,
        case_id: offlineCase.id,
        invite_token: `offline-${offlineCase.id}-${offlineCode}`,
        title: offlineCase.title,
        case_number: offlineCase.case_number,
        saved_at: Date.now(),
      });
      setStatus('success');
    }
  };

  // ── Success Screen ──
  if (status === 'success' && createdCase) {
    return (
      <SafeAreaView
        className="flex-1 bg-background"
        style={{ flex: 1, minHeight: 0, height: '100%' }}
        edges={['top', 'bottom']}
      >
        <ScrollView
          className="flex-1"
          style={{ flex: 1, height: '100%' }}
          contentContainerClassName="px-6 pt-5 pb-16"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 64 }}
          showsVerticalScrollIndicator={true}
        >
          <View className="items-center pt-6">
            <View
              className={`h-20 w-20 items-center justify-center rounded-full ${isOfflineSaved ? 'bg-amber-50' : 'bg-green-50'}`}
            >
              <CheckCircle2 stroke={isOfflineSaved ? '#D97706' : '#16A34A'} size={42} />
            </View>
            {isOfflineSaved ? (
              <View className="mt-3 px-3 py-1 rounded-full bg-red-50 border border-red-200">
                <Text className="text-xs font-bold text-red-600">
                  🔴 Offline Mode · Local pending sync
                </Text>
              </View>
            ) : null}
            <Text className="mt-4 text-2xl font-bold text-navy text-center">
              {isOfflineSaved ? 'Case Saved Offline' : 'Missing Person Case Created'}
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-muted">
              {isOfflineSaved
                ? 'This case will sync automatically when internet connection is restored.'
                : `Case for ${createdCase.title} has been created in the local search network.`}
            </Text>
          </View>

          {/* Case Report Card */}
          <View className="mt-6">
            <CaseReportCard
              name={form.missingPersonName}
              age={form.age}
              gender={form.gender}
              photoUrl={createdCase.photo_url || photoUri}
              appearance={{
                ...appearance,
                clothing: form.clothing,
                physicalDescription: form.physicalDescription,
                direction: form.direction,
              }}
              lastSeenLocation={form.lastSeenLocation}
              lastSeenTime={[form.lastSeenDate, form.lastSeenTime].filter(Boolean).join(' ') || form.lastSeenTime}
            />
          </View>

          {/* Volunteer Join Section: 6-Digit Code + Real Scannable QR */}
          {inviteData?.joinCode ? (
            <View className="mt-6 p-5 rounded-2xl bg-teal-50 border border-teal-200">
              <View className="flex-row items-center gap-2 mb-3">
                <QrIcon size={18} stroke="#0D9488" />
                <Text className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  VOLUNTEER JOIN
                </Text>
              </View>

              {/* 6-Digit Code */}
              <View className="p-4 rounded-xl bg-white border border-teal-100 flex-row items-center justify-between">
                <View>
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    6-Digit Join Code
                  </Text>
                  <Text className="mt-1 text-2xl font-black tracking-widest text-navy">
                    {inviteData.joinCode}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Copy join code"
                  className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 active:bg-teal-700"
                  onPress={async () => {
                    await Clipboard.setStringAsync(inviteData.joinCode);
                    Alert.alert('Copied', `Join code ${inviteData.joinCode} copied to clipboard.`);
                  }}
                >
                  <Copy size={16} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white">Copy Code</Text>
                </Pressable>
              </View>

              {/* Real QR Code */}
              <View className="mt-4 p-4 rounded-xl bg-white border border-teal-100 items-center justify-center">
                <Text className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted">
                  QR CODE
                </Text>
                <View className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <QRCode
                    value={JSON.stringify({
                      caseId: createdCase.id,
                      joinCode: inviteData.joinCode,
                      token: inviteData.inviteToken || inviteData.joinCode,
                      title: createdCase.title || form.missingPersonName,
                      case_number: createdCase.case_number,
                      age: form.age,
                      gender: form.gender,
                      location: form.lastSeenLocation,
                      last_seen_location: form.lastSeenLocation,
                      last_seen_time: [form.lastSeenDate, form.lastSeenTime].filter(Boolean).join(' ') || form.lastSeenTime,
                      clothing: form.clothing,
                      physical_description: form.physicalDescription,
                      photo_url: createdCase.photo_url || photoUri,
                      status: createdCase.status,
                      priority: 'High',
                    })}
                    size={180}
                    color="#0F172A"
                    backgroundColor="#FFFFFF"
                  />
                </View>
              </View>

              <Text className="mt-3 text-xs text-center text-teal-900 leading-4">
                Volunteers can scan this QR or enter the 6-digit code to join the search.
              </Text>
            </View>
          ) : null}

          {/* Actions */}
          <View className="mt-8 gap-3">
            <Button
              label="Open Operational Workspace"
              fullWidth
              onPress={() =>
                router.replace({
                  pathname: '/case-details',
                  params: {
                    caseId: createdCase.id,
                    joinCode: inviteData?.joinCode,
                  },
                })
              }
            />
            <Button
              label="View My Cases"
              variant="outline"
              fullWidth
              onPress={() => router.replace('/main/cases')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Form Screen ──
  return (
    <SafeAreaView
      className="flex-1 bg-background"
      style={{ flex: 1, minHeight: 0, height: '100%' }}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        className="flex-1"
        style={{ flex: 1, minHeight: 0, height: '100%' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
      >
        <ScrollView
          className="flex-1"
          style={{ flex: 1, height: '100%' }}
          contentContainerClassName="px-6 pt-5 pb-20"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-2">
            <BackButton fallbackRoute="/manager" variant="ghost" />
            <Pressable
              accessibilityLabel="Close create case"
              accessibilityRole="button"
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace('/manager')
              }
            >
              <Text className="text-sm font-semibold text-blue">Cancel</Text>
            </Pressable>
          </View>

          <Text className="mt-4 text-3xl font-bold text-navy">Create Missing Person Case</Text>
          <Text className="mt-2 text-base leading-6 text-muted">
            Share clear missing-person details to activate the TraceOne local search network.
          </Text>

          <AuthFeedback
            status={status}
            message={status === 'validation-error' ? error : undefined}
          />

          {/* ── SECTION 1 — Missing Person Profile ── */}
          <Section title="Missing Person Profile" icon="person">
            <Input
              label="Missing Person Name *"
              placeholder="Full legal or known name"
              value={form.missingPersonName}
              onChangeText={(v) => update('missingPersonName', v)}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Age *"
                  keyboardType="number-pad"
                  placeholder="e.g. 24"
                  value={form.age}
                  onChangeText={(v) => update('age', v)}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Gender"
                  placeholder="e.g. Female / Male"
                  value={form.gender}
                  onChangeText={(v) => update('gender', v)}
                />
              </View>
            </View>

            {/* ── Photo Upload Card ── */}
            <View className="gap-2">
              <View>
                <Text className="text-sm font-semibold text-navy">Add Photo</Text>
                <Text className="text-xs text-muted">Tap to add a clear photo</Text>
              </View>

              {!photoUri ? (
                <View className="rounded-2xl border-2 border-dashed border-border bg-surface p-5 items-center justify-center">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add Photo"
                    onPress={handlePhotoAction}
                    className="items-center"
                  >
                    <View className="h-16 w-16 rounded-2xl bg-teal-50 border border-teal-100 items-center justify-center mb-2.5">
                      <Camera stroke="#0D9488" size={30} />
                    </View>
                    <Text className="text-base font-bold text-navy">Add Photo</Text>
                    <Text className="mt-1 text-xs text-muted text-center px-2">
                      Clear front-facing photo helps volunteer searchers identify the person quickly.
                    </Text>
                  </Pressable>

                  {/* Explicit action buttons for Gallery & Camera */}
                  <View className="mt-4 flex-row gap-3 w-full">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Choose from Gallery"
                      className="flex-1 flex-row items-center justify-center gap-2 py-3 px-3 rounded-xl bg-blue-50 border border-blue-200"
                      onPress={handlePickPhoto}
                    >
                      <ImagePlus stroke="#2563EB" size={18} />
                      <Text className="text-xs font-bold text-blue">Choose from Gallery</Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Take Photo"
                      className="flex-1 flex-row items-center justify-center gap-2 py-3 px-3 rounded-xl bg-teal-50 border border-teal-200"
                      onPress={handleTakePhoto}
                    >
                      <Camera stroke="#0D9488" size={18} />
                      <Text className="text-xs font-bold text-teal-800">Take Photo</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View className="rounded-2xl border border-border bg-surface p-3 overflow-hidden shadow-sm">
                  {/* Photo Preview fitted inside phone frame */}
                  <View className="w-full h-64 rounded-xl overflow-hidden bg-slate-900 relative">
                    <Image
                      source={{ uri: photoUri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>

                  {/* Change & Remove buttons */}
                  <View className="mt-3 flex-row gap-2">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Change Photo from Gallery"
                      className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-100 border border-slate-200"
                      onPress={handlePickPhoto}
                    >
                      <ImagePlus stroke="#334155" size={15} />
                      <Text className="text-xs font-bold text-slate-700">Change (Gallery)</Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Retake Photo with Camera"
                      className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-100 border border-slate-200"
                      onPress={handleTakePhoto}
                    >
                      <Camera stroke="#334155" size={15} />
                      <Text className="text-xs font-bold text-slate-700">Retake</Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Remove Photo"
                      className="flex-row items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-red-50 border border-red-200"
                      onPress={() => setPhotoUri(null)}
                    >
                      <Trash2 stroke="#DC2626" size={15} />
                      <Text className="text-xs font-bold text-red-600">Remove</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </Section>

          {/* ── SECTION 2 — Last Seen Information ── */}
          <Section title="Last Seen Information" icon="location">
            <Input
              label="Last Known Location *"
              placeholder="e.g. North District · Community Park"
              icon={MapPin}
              value={form.lastSeenLocation}
              onChangeText={(v) => update('lastSeenLocation', v)}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Last Seen Date *"
                  placeholder="e.g. Today / 23 Sep"
                  icon={Calendar}
                  value={form.lastSeenDate || ''}
                  onChangeText={(v) => update('lastSeenDate', v)}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Last Seen Time *"
                  placeholder="e.g. 2:30 PM"
                  icon={Clock}
                  value={form.lastSeenTime}
                  onChangeText={(v) => update('lastSeenTime', v)}
                />
              </View>
            </View>
            <Input
              label="Last Seen Direction / Area"
              placeholder="e.g. Headed north toward metro station"
              value={form.direction}
              onChangeText={(v) => update('direction', v)}
            />
            <Input
              label="Additional Location Details"
              placeholder="Where might they be heading? (e.g. Central Library)"
              value={form.knownDestination}
              onChangeText={(v) => update('knownDestination', v)}
            />
          </Section>

          {/* ── SECTION 3 — Physical Appearance ── */}
          <Section title="Physical Appearance" icon="appearance">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Height"
                  placeholder="e.g. 5'6 / 168 cm"
                  value={appearance.height}
                  onChangeText={(v) => updateAppearance('height', v)}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Body Type / Build"
                  placeholder="e.g. Slim, Athletic"
                  value={appearance.build}
                  onChangeText={(v) => updateAppearance('build', v)}
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Hair Color"
                  placeholder="e.g. Black, Brown"
                  value={appearance.hairColor}
                  onChangeText={(v) => updateAppearance('hairColor', v)}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Hair Style"
                  placeholder="e.g. Short, Curly, Long"
                  value={appearance.hairStyle}
                  onChangeText={(v) => updateAppearance('hairStyle', v)}
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Eye Color"
                  placeholder="e.g. Brown, Dark, Hazel"
                  value={appearance.eyeColor}
                  onChangeText={(v) => updateAppearance('eyeColor', v)}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Skin Tone"
                  placeholder="e.g. Fair, Medium, Tan"
                  value={appearance.skinTone}
                  onChangeText={(v) => updateAppearance('skinTone', v)}
                />
              </View>
            </View>
          </Section>

          {/* ── SECTION 4 — Clothing ── */}
          <Section title="Clothing" icon="clothing">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Shirt / Top Color"
                  placeholder="e.g. Navy Blue"
                  value={appearance.shirtColor}
                  onChangeText={(v) => updateAppearance('shirtColor', v)}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Shirt / Top Type"
                  placeholder="e.g. T-Shirt, Hoodie"
                  value={appearance.shirtType}
                  onChangeText={(v) => updateAppearance('shirtType', v)}
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Pants / Bottom Color"
                  placeholder="e.g. Black, Grey"
                  value={appearance.pantsColor}
                  onChangeText={(v) => updateAppearance('pantsColor', v)}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Pants / Bottom Type"
                  placeholder="e.g. Jeans, Trackpants"
                  value={appearance.pantsType}
                  onChangeText={(v) => updateAppearance('pantsType', v)}
                />
              </View>
            </View>
            <Input
              label="Footwear"
              placeholder="e.g. White sneakers, sports shoes, sandals"
              value={appearance.footwear}
              onChangeText={(v) => updateAppearance('footwear', v)}
            />
            <Input
              label="Accessories"
              placeholder="e.g. Wristwatch, red backpack, glasses, cap"
              value={appearance.accessories}
              onChangeText={(v) => updateAppearance('accessories', v)}
            />
            <Input
              label="General Clothing Notes"
              placeholder="Any other jacket, pattern, or clothing details"
              value={form.clothing}
              onChangeText={(v) => update('clothing', v)}
            />
          </Section>

          {/* ── SECTION 5 — Additional Details ── */}
          <Section title="Additional Details" icon="description">
            <View className="gap-2">
              <Text className="text-sm font-semibold text-navy">Physical Description</Text>
              <TextInput
                multiline
                textAlignVertical="top"
                className="min-h-[90px] rounded-xl border border-border bg-surface px-4 py-3 text-base text-navy"
                placeholder="Distinguishing features, birthmarks, tattoos, scars, glasses, etc."
                placeholderTextColor="#64748B"
                value={form.physicalDescription}
                onChangeText={(v) => update('physicalDescription', v)}
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-semibold text-navy">Other Identifying Details</Text>
              <TextInput
                multiline
                textAlignVertical="top"
                className="min-h-[90px] rounded-xl border border-border bg-surface px-4 py-3 text-base text-navy"
                placeholder="Medical needs, items carried, relevant context for searchers..."
                placeholderTextColor="#64748B"
                value={form.additionalInformation}
                onChangeText={(v) => update('additionalInformation', v)}
              />
            </View>
          </Section>

          {/* ── FINAL ACTION ── */}
          <View className="mt-8 pb-10">
            <Button
              label={uploadingPhoto ? 'Uploading Photo…' : 'Create Missing Person Case'}
              loading={status === 'loading'}
              fullWidth
              onPress={submit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Helper Components ──

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) {
  const iconMap: Record<string, typeof Calendar> = {
    person: User,
    location: MapPin,
    appearance: Sparkles,
    clothing: Calendar,
    description: Calendar,
  };
  const IconComponent = icon ? iconMap[icon] ?? Calendar : Calendar;

  return (
    <View className="mt-7 gap-4">
      <View className="flex-row items-center gap-2">
        <IconComponent stroke="#0D9488" size={17} />
        <Text className="text-lg font-bold text-navy">{title}</Text>
      </View>
      {children}
    </View>
  );
}
