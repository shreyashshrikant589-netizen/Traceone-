import { CircleAlert, LocateFixed } from 'lucide-react-native';
import { Text, View } from 'react-native';
import type { LocationStatus, SearchSessionStatus } from '@/services/searchSession';

export function SessionStatus({ status, locationStatus }: { status: SearchSessionStatus; locationStatus: LocationStatus }) {
  const active = locationStatus === 'GPS_CONNECTED';
  return <View className="flex-row flex-wrap gap-2"><View className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${active ? 'bg-green-50' : 'bg-red-50'}`}>{active ? <LocateFixed stroke="#16A34A" size={14} /> : <CircleAlert stroke="#DC2626" size={14} />}<Text className={`text-xs font-semibold ${active ? 'text-success' : 'text-danger'}`}>{active ? 'GPS Connected' : 'Location Unavailable'}</Text></View><View className="rounded-full bg-blue-50 px-3 py-1.5"><Text className="text-xs font-semibold text-blue">{status === 'PAUSED' ? 'Paused' : status === 'ACTIVE' ? 'Search active' : 'Ready to start'}</Text></View></View>;
}
