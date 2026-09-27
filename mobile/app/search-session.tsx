import { ArrowRight, LocateFixed, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SessionStatus } from '@/components/SessionStatus';
import { mockAssignment } from '@/services/mockVolunteer';

export default function SearchSessionReadyScreen() {
  const router = useRouter();
  return <SafeAreaView className="flex-1 bg-background" edges={['top']}><ScrollView contentContainerClassName="px-5 pb-10" showsVerticalScrollIndicator={false}><View className="pt-6"><Text className="text-xs font-bold uppercase tracking-[2px] text-teal">Assignment</Text><Text className="mt-2 text-3xl font-bold text-navy">View Zone</Text><Text className="mt-2 text-base leading-6 text-muted">Review your assignment before starting a search session.</Text></View><Card className="mt-7"><Text className="text-xs font-bold uppercase tracking-[1.5px] text-teal">Case</Text><Text className="mt-1 text-xl font-bold text-navy">{mockAssignment.caseName}</Text><View className="mt-5 gap-3"><Row label="Missing person" value={mockAssignment.missingPerson} /><Row label="Assigned zone" value={mockAssignment.assignedZone} /><Row label="Priority" value={mockAssignment.priority} /></View><View className="mt-5"><SessionStatus status="READY" locationStatus="GPS_CONNECTED" /></View></Card><Card className="mt-4 border-blue-100 bg-blue-50"><View className="flex-row items-start gap-3"><LocateFixed stroke="#2563EB" size={20} /><View className="flex-1"><Text className="text-sm font-bold text-navy">Why location access is needed</Text><Text className="mt-1 text-sm leading-5 text-muted">Location helps the future GPS integration confirm that you are searching the assigned zone. TraceOne does not start tracking until you begin a session.</Text></View></View></Card><Card className="mt-4"><View className="flex-row items-start gap-3"><ShieldCheck stroke="#0D9488" size={20} /><Text className="flex-1 text-sm leading-5 text-muted">Only authorized search activity should be recorded. Follow coordinator instructions and report observations carefully.</Text></View></Card><View className="mt-7"><Button label="Start Search" icon={ArrowRight} iconPosition="right" fullWidth onPress={() => router.push('/active-search')} /></View></ScrollView></SafeAreaView>;
}
function Row({ label, value }: { label: string; value: string }) { return <View className="flex-row items-center justify-between gap-4"><Text className="text-sm text-muted">{label}</Text><Text className="flex-1 text-right text-sm font-semibold text-navy">{value}</Text></View>; }
