import { BrainCircuit, Map, SlidersHorizontal } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPlaceholder } from '@/components/MapPlaceholder';
import { PriorityCard } from '@/components/PriorityCard';
import { ZoneCard } from '@/components/ZoneCard';
import { mockSearchZones } from '@/services/mockVolunteer';

export default function MainSearchScreen() {
  const router = useRouter();
  const [showMap, setShowMap] = useState(true);
  return <SafeAreaView className="flex-1 bg-background" edges={['top']}><ScrollView contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}><View className="flex-row items-start justify-between pt-5"><View><Text className="text-xs font-bold uppercase tracking-[2px] text-teal">Volunteer workspace</Text><Text className="mt-2 text-3xl font-bold text-navy">Search Zones</Text><Text className="mt-2 text-base text-muted">Prioritized areas for the active search.</Text></View><Pressable accessibilityLabel="Toggle map" accessibilityRole="button" className="rounded-xl border border-border bg-surface p-3" onPress={() => setShowMap((value) => !value)}><Map stroke="#2563EB" size={20} /></Pressable></View><Pressable accessibilityRole="button" className="mt-5 flex-row items-center gap-3 rounded-2xl bg-navy p-4 active:opacity-80" onPress={() => router.push('/ai-priority')}><BrainCircuit stroke="#5EEAD4" size={22} /><View className="flex-1"><Text className="text-sm font-bold text-white">AI-Assisted Search Priority</Text><Text className="mt-1 text-xs text-slate-300">Decision support for human teams</Text></View><ArrowRightIcon /></Pressable>{showMap ? <View className="mt-6"><MapPlaceholder layers={['LAST_SEEN_LOCATION', 'SEARCH_BOUNDARY', 'SEARCH_ZONES', 'VOLUNTEER_LOCATION', 'EXITS', 'ROADS', 'PARKING', 'TRANSPORT_NODES', 'HOSPITALS', 'POLICE_STATIONS', 'SAFE_POINTS']} /></View> : null}<View className="mt-7 flex-row items-center justify-between"><Text className="text-lg font-bold text-navy">Priority zones</Text><SlidersHorizontal stroke="#64748B" size={19} /></View><View className="mt-3 gap-3">{mockSearchZones.map((zone) => <View key={zone.name}><ZoneCard name={zone.name} details={`Priority ${zone.priorityScore}`} priorityScore={zone.priorityScore} reason={zone.reason} status={zone.status} /><View className="mt-2"><PriorityCard title={`${zone.name} priority`} description={zone.reason} priority={zone.priorityScore >= 80 ? 'high' : 'normal'} score={zone.priorityScore} /></View></View>)}</View></ScrollView></SafeAreaView>;
}

function ArrowRightIcon() { return <Text className="text-xl font-bold text-teal-light">›</Text>; }
