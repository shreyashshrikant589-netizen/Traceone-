import { CheckCircle2, CloudOff, RefreshCw, Wifi } from 'lucide-react-native';
import { Text, View } from 'react-native';

type OfflineBannerProps = {
  state: 'offline' | 'pending' | 'syncing' | 'synced';
  detail?: string;
};

const content = {
  offline: { title: 'Your device is currently offline.', detail: 'Waiting for network...', icon: CloudOff, color: '#DC2626', background: 'bg-red-50' },
  pending: { title: 'Evidence saved locally.', detail: 'Waiting for network...', icon: CloudOff, color: '#D97706', background: 'bg-amber-50' },
  syncing: { title: 'Syncing...', detail: 'Your saved updates are being prepared.', icon: RefreshCw, color: '#2563EB', background: 'bg-blue-50' },
  synced: { title: 'Synced successfully.', detail: 'Your latest updates are up to date.', icon: CheckCircle2, color: '#16A34A', background: 'bg-green-50' },
} as const;

export function OfflineBanner({ state, detail }: OfflineBannerProps) {
  const item = content[state];
  const Icon = item.icon;
  return <View accessibilityLiveRegion="polite" className={`flex-row items-start gap-3 rounded-xl px-4 py-3 ${item.background}`}><Icon stroke={item.color} size={19} /><View className="flex-1"><Text className="text-sm font-bold text-navy">{item.title}</Text><Text className="mt-1 text-xs leading-4 text-muted">{detail ?? item.detail}</Text></View></View>;
}
