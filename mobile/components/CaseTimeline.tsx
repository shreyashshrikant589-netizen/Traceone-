import type { LucideIcon } from 'lucide-react-native';
import { BellRing, CheckCircle2, FileCheck2, Flag, MapPin, Search, ShieldAlert, ShieldCheck, UserPlus, UsersRound } from 'lucide-react-native';
import { Text, View } from 'react-native';
import type { CaseTimelineEvent, CaseTimelineEventType } from '@/services/caseDetails';

const eventIcons: Record<CaseTimelineEventType, LucideIcon> = {
  CASE_CREATED: FileCheck2,
  LOCAL_SEARCH_STARTED: Search,
  VOLUNTEER_JOINED: UserPlus,
  SEARCH_ZONE_ASSIGNED: MapPin,
  EVIDENCE_SUBMITTED: FileCheck2,
  WITNESS_REPORT: UsersRound,
  PRIORITY_UPDATED: Flag,
  PUBLIC_ESCALATION: ShieldAlert,
  PUBLIC_SEARCH: Search,
  POSSIBLE_MATCH: BellRing,
  HUMAN_VERIFICATION: ShieldCheck,
  POLICE_NOTIFICATION: ShieldAlert,
};

export function CaseTimeline({ events }: { events: CaseTimelineEvent[] }) {
  return <View className="gap-0">{events.map((event, index) => { const Icon = eventIcons[event.type]; return <View key={`${event.type}-${event.timestamp}`} className="flex-row"><View className="mr-4 items-center"><View className={`h-10 w-10 items-center justify-center rounded-full ${event.type === 'POLICE_NOTIFICATION' || event.type === 'PUBLIC_ESCALATION' ? 'bg-red-50' : 'bg-blue-50'}`}><Icon stroke={event.type === 'POLICE_NOTIFICATION' || event.type === 'PUBLIC_ESCALATION' ? '#DC2626' : '#2563EB'} size={18} /></View>{index < events.length - 1 ? <View className="my-1 w-px flex-1 bg-border" /> : null}</View><View className="flex-1 pb-6"><View className="flex-row items-start justify-between gap-3"><Text className="flex-1 text-base font-bold text-navy">{event.title}</Text><Text className="text-right text-xs text-muted">{event.timestamp}</Text></View><Text className="mt-1.5 text-sm leading-5 text-muted">{event.description}</Text></View></View>; })}</View>;
}
