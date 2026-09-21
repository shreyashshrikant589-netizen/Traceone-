import { ArrowRight, ClipboardList, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PriorityCard } from '@/components/PriorityCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ZoneCard } from '@/components/ZoneCard';
import { mockAssignment } from '@/services/mockVolunteer';

export default function VolunteerAssignmentsScreen() {
  const router = useRouter();
  const assignment = mockAssignment;
  return <SafeAreaView className="flex-1 bg-background" edges={['top']}><ScrollView contentContainerClassName="px-5 pb-10" showsVerticalScrollIndicator={false}><View className="pt-5"><Text className="text-xs font-bold uppercase tracking-[2px] text-teal">Volunteer workspace</Text><Text className="mt-2 text-3xl font-bold text-navy">My Assignments</Text><Text className="mt-2 text-base leading-6 text-muted">Stay clear on where to search and what to report.</Text></View><Card className="mt-7"><View className="flex-row items-start justify-between"><View className="flex-1"><Text className="text-xs font-bold uppercase tracking-[1.5px] text-teal">Case</Text><Text className="mt-1 text-xl font-bold text-navy">{assignment.caseName}</Text><Text className="mt-1 text-sm text-muted">Missing person: {assignment.missingPerson}</Text></View><StatusBadge status={assignment.status} compact /></View><View className="mt-5 gap-3 border-t border-border pt-4"><Row label="Assigned zone" value={assignment.assignedZone} /><Row label="Priority" value={assignment.priority} valueClass="text-warning" /><Row label="Status" value={assignment.status} /></View><View className="mt-5 flex-row items-start gap-2 rounded-xl bg-blue-50 p-3"><Info stroke="#2563EB" size={17} /><Text className="flex-1 text-sm leading-5 text-muted">{assignment.instructions}</Text></View></Card><View className="mt-7"><View className="mb-3 flex-row items-center gap-2"><ClipboardList stroke="#0D9488" size={19} /><Text className="text-lg font-bold text-navy">Assigned zone</Text></View><ZoneCard name="Zone A" details="Assigned to you · Community Park" priorityScore={87} reason="Near last known location" status="ASSIGNED" onPress={() => router.push('/search-session')} /></View><View className="mt-4"><PriorityCard title="Why this zone?" description="Near the last known location with a recent witness report and clear exit proximity." priority="high" score={87} /></View><View className="mt-7"><Button label="View Zone & Start Search" icon={ArrowRight} iconPosition="right" fullWidth onPress={() => router.push('/search-session')} /></View></ScrollView></SafeAreaView>;
}

function Row({ label, value, valueClass = 'text-navy' }: { label: string; value: string; valueClass?: string }) { return <View className="flex-row items-center justify-between gap-4"><Text className="text-sm text-muted">{label}</Text><Text className={`text-right text-sm font-semibold ${valueClass}`}>{value}</Text></View>; }
