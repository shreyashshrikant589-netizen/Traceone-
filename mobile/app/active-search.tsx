import { FilePlus2, Flag, MessageSquarePlus, Pause, Play, Square } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { SessionStatus } from '@/components/SessionStatus';
import { mockAssignment } from '@/services/mockVolunteer';
import type { SearchSessionStatus } from '@/services/searchSession';

export default function ActiveSearchScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<SearchSessionStatus>('ACTIVE');
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { if (status !== 'ACTIVE') return; const timer = setInterval(() => setSeconds((value) => value + 1), 1000); return () => clearInterval(timer); }, [status]);
  const finish = () => Alert.alert('Finish this search session?', 'Your session will be marked ready for coordinator review.', [{ text: 'Keep searching', style: 'cancel' }, { text: 'Finish Search', style: 'destructive', onPress: () => setStatus('FINISHED') }]);
  const time = `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  if (status === 'FINISHED') return <SafeAreaView className="flex-1 bg-background"><View className="flex-1 items-center justify-center px-7"><View className="h-16 w-16 items-center justify-center rounded-full bg-green-50"><Flag stroke="#16A34A" size={32} /></View><Text className="mt-5 text-2xl font-bold text-navy">Search session finished</Text><Text className="mt-3 text-center text-base leading-6 text-muted">Your session summary is ready for the future coordinator workflow.</Text></View></SafeAreaView>;
  return <SafeAreaView className="flex-1 bg-background" edges={['top']}><View className="flex-1 px-5 pb-6 pt-6"><Animated.View entering={FadeInDown.duration(400).easing(Easing.out(Easing.cubic))}><Text className="text-xs font-bold uppercase tracking-[2px] text-teal">Active Search</Text><Text className="mt-2 text-3xl font-bold text-navy">{mockAssignment.assignedZone}</Text><Text className="mt-2 text-base text-muted">{mockAssignment.caseName}</Text><View className="mt-5"><SessionStatus status={status} locationStatus="GPS_CONNECTED" /></View></Animated.View><Card className="mt-7 items-center bg-navy"><Text className="text-xs font-bold uppercase tracking-[2px] text-slate-400">Search timer</Text><Text className="mt-3 text-5xl font-bold tracking-wider text-white">{time}</Text><Text className="mt-2 text-sm text-teal-light">Location status: GPS Connected</Text></Card><View className="mt-6 flex-row flex-wrap gap-3"><Action icon={status === 'PAUSED' ? Play : Pause} label={status === 'PAUSED' ? 'Resume' : 'Pause Search'} onPress={() => setStatus(status === 'PAUSED' ? 'ACTIVE' : 'PAUSED')} /><Action icon={MessageSquarePlus} label="Add Note" onPress={() => router.push({ pathname: '/session-entry', params: { kind: 'note' } })} /><Action icon={FilePlus2} label="Report Evidence" onPress={() => router.push({ pathname: '/session-entry', params: { kind: 'evidence' } })} /><Action icon={Flag} label="Report Sighting" onPress={() => router.push({ pathname: '/session-entry', params: { kind: 'sighting' } })} /></View><View className="mt-auto"><Pressable accessibilityRole="button" className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-xl bg-danger active:opacity-80" onPress={finish}><Square stroke="#FFFFFF" size={18} /><Text className="text-base font-semibold text-white">Finish Search</Text></Pressable></View></View></SafeAreaView>;
}
function Action({ icon: Icon, label, onPress }: { icon: typeof Pause; label: string; onPress: () => void }) { return <Pressable accessibilityRole="button" className="min-h-[88px] w-[47%] rounded-xl border border-border bg-surface p-4 shadow-sm active:bg-background-muted" onPress={onPress}><Icon stroke="#2563EB" size={21} /><Text className="mt-3 text-sm font-semibold text-navy">{label}</Text></Pressable>; }
