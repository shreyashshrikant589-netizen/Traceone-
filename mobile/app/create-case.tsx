import { Calendar, Camera, CheckCircle2, Clock, ImagePlus, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthFeedback } from '@/components/AuthFeedback';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import type { AuthStatus } from '@/services/auth';
import type { CreateCasePayload } from '@/services/cases';

const initialForm: CreateCasePayload = { missingPersonName: '', age: '', gender: '', lastSeenLocation: '', lastSeenTime: '', clothing: '', physicalDescription: '', knownDestination: '', direction: '', eventVenue: '', additionalInformation: '' };

export default function CreateCaseScreen() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [photoSelected, setPhotoSelected] = useState(false);
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [error, setError] = useState('');
  const update = (key: keyof CreateCasePayload, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = () => {
    if (!form.missingPersonName.trim() || !form.age.trim() || !form.lastSeenLocation.trim() || !form.lastSeenTime.trim()) { setError('Complete the missing person, age, location, and time fields.'); setStatus('validation-error'); return; }
    setError(''); setStatus('loading'); setTimeout(() => setStatus('success'), 600);
  };

  if (status === 'success') return <SafeAreaView className="flex-1 bg-background"><View className="flex-1 items-center justify-center px-7"><View className="h-16 w-16 items-center justify-center rounded-full bg-green-50"><CheckCircle2 stroke="#16A34A" size={34} /></View><Text className="mt-5 text-2xl font-bold text-navy">Case draft prepared</Text><Text className="mt-3 text-center text-base leading-6 text-muted">Your information is ready for backend submission. No case has been created yet.</Text><View className="mt-7 w-full"><Button label="Back to Cases" fullWidth onPress={() => router.replace('/main/cases')} /></View></View></SafeAreaView>;

  return <SafeAreaView className="flex-1 bg-background"><KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerClassName="px-6 pb-10" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><View className="pt-5"><Pressable accessibilityLabel="Close create case" accessibilityRole="button" onPress={() => router.back()}><Text className="text-sm font-semibold text-blue">Cancel</Text></Pressable><Text className="mt-6 text-3xl font-bold text-navy">Create Case</Text><Text className="mt-2 text-base leading-6 text-muted">Share the clearest information first. You can add context as you go.</Text><AuthFeedback status={status} message={status === 'validation-error' ? error : status === 'network-error' ? 'The case service is unavailable. Your draft was not submitted.' : undefined} />
  <Section title="Person"><Input label="Missing Person Name" placeholder="Full name" value={form.missingPersonName} onChangeText={(v) => update('missingPersonName', v)} /><View className="flex-row gap-3"><View className="flex-1"><Input label="Age" keyboardType="number-pad" placeholder="Age" value={form.age} onChangeText={(v) => update('age', v)} /></View><View className="flex-1"><Input label="Gender" placeholder="Optional" value={form.gender} onChangeText={(v) => update('gender', v)} /></View></View><Pressable accessibilityRole="button" className="h-28 items-center justify-center rounded-xl border border-dashed border-border bg-background-muted" onPress={() => setPhotoSelected(true)}>{photoSelected ? <><Camera stroke="#16A34A" size={24} /><Text className="mt-2 text-sm font-semibold text-success">Photo selected</Text></> : <><ImagePlus stroke="#2563EB" size={24} /><Text className="mt-2 text-sm font-semibold text-blue">Add photo</Text><Text className="mt-1 text-xs text-muted">Image picker interface</Text></>}</Pressable></Section>
  <Section title="Last seen"><Input label="Location" placeholder="Last known location" icon={MapPin} value={form.lastSeenLocation} onChangeText={(v) => update('lastSeenLocation', v)} /><DateField label="Time" icon={Clock} value={form.lastSeenTime} placeholder="Select date and time" onPress={() => update('lastSeenTime', 'Today, 10:30 AM')} /></Section>
  <Section title="Description"><Field label="Clothing" placeholder="What were they wearing?" value={form.clothing} onChangeText={(v) => update('clothing', v)} /><Field label="Physical Description" placeholder="Height, hair, distinguishing features" value={form.physicalDescription} onChangeText={(v) => update('physicalDescription', v)} /><Field label="Known Destination" placeholder="Where might they be going?" value={form.knownDestination} onChangeText={(v) => update('knownDestination', v)} /><Field label="Direction" placeholder="Last known direction of travel" value={form.direction} onChangeText={(v) => update('direction', v)} /></Section>
  <Section title="Search Context"><Field label="Event / Venue" placeholder="Relevant event or venue" value={form.eventVenue} onChangeText={(v) => update('eventVenue', v)} /><Field label="Additional Information" placeholder="Anything else responders should know" multiline value={form.additionalInformation} onChangeText={(v) => update('additionalInformation', v)} /></Section>
  <Button label="Prepare Case" loading={status === 'loading'} fullWidth onPress={submit} /></View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <View className="mt-8 gap-4"><View className="flex-row items-center gap-2"><Calendar stroke="#0D9488" size={17} /><Text className="text-lg font-bold text-navy">{title}</Text></View>{children}</View>; }
function Field({ label, multiline = false, ...props }: { label: string; multiline?: boolean; placeholder: string; value: string; onChangeText: (value: string) => void }) { return <View className="gap-2"><Text className="text-sm font-semibold text-navy">{label}</Text><TextInput {...props} multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} className={`rounded-xl border border-border bg-surface px-4 py-3 text-base text-navy ${multiline ? 'min-h-[100px]' : 'min-h-[52px]'}`} placeholderTextColor="#64748B" /></View>; }
function DateField({ label, icon: Icon, value, placeholder, onPress }: { label: string; icon: typeof Clock; value: string; placeholder: string; onPress: () => void }) { return <View className="gap-2"><Text className="text-sm font-semibold text-navy">{label}</Text><Pressable accessibilityRole="button" className="min-h-[52px] flex-row items-center rounded-xl border border-border bg-surface px-4" onPress={onPress}><Icon stroke="#64748B" size={19} /><Text className={`ml-3 text-base ${value ? 'text-navy' : 'text-muted'}`}>{value || placeholder}</Text></Pressable></View>; }
