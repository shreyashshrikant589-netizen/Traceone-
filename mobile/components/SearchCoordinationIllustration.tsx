import { Activity, Check, MapPin, Search, ShieldCheck, UserRound } from 'lucide-react-native';
import { Text, View } from 'react-native';

const markers = [
  { className: 'left-[17%] top-[22%]', color: '#2563EB' },
  { className: 'right-[18%] top-[31%]', color: '#0D9488' },
  { className: 'left-[38%] bottom-[20%]', color: '#D97706' },
] as const;

export function SearchCoordinationIllustration() {
  return (
    <View className="h-[250px] overflow-hidden rounded-3xl bg-navy px-5 py-4">
      <View className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-blue-400/20" />
      <View className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full border border-teal-300/15" />
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-semibold uppercase tracking-[2px] text-teal-light">Live coordination</Text>
          <Text className="mt-1 text-lg font-bold text-white">North district search</Text>
        </View>
        <View className="rounded-full bg-white/10 p-2">
          <Activity color="#5EEAD4" size={18} />
        </View>
      </View>
      <View className="absolute bottom-5 left-5 right-5 top-[76px] rounded-2xl border border-white/10 bg-[#172554]">
        <View className="absolute left-[18%] top-[31%] h-px w-[64%] rotate-[18deg] bg-teal-light/60" />
        <View className="absolute left-[39%] top-[42%] h-px w-[30%] -rotate-[32deg] bg-blue-light/60" />
        <View className="absolute left-[29%] top-[42%] h-20 w-32 rounded-full border border-dashed border-white/15" />
        {markers.map((marker) => (
          <View key={marker.className} className={`absolute ${marker.className} items-center`}>
            <View className="rounded-full border-2 border-white/80 p-1" style={{ backgroundColor: marker.color }}>
              <UserRound color="#FFFFFF" size={14} />
            </View>
            <View className="mt-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: marker.color }} />
          </View>
        ))}
        <View className="absolute bottom-[18%] right-[19%] rounded-full bg-white p-2 shadow-lg">
          <MapPin color="#DC2626" fill="#FEE2E2" size={20} />
        </View>
        <View className="absolute left-[8%] top-[13%] rounded-lg bg-white px-2.5 py-1.5 shadow-lg">
          <View className="flex-row items-center gap-1.5">
            <Search color="#2563EB" size={13} />
            <Text className="text-[10px] font-bold text-navy">Zone 04</Text>
          </View>
        </View>
        <View className="absolute bottom-[12%] left-[12%] flex-row items-center gap-1.5 rounded-lg bg-teal px-2.5 py-1.5">
          <ShieldCheck color="#FFFFFF" size={13} />
          <Text className="text-[10px] font-bold text-white">Verified</Text>
        </View>
        <View className="absolute right-[8%] top-[12%] rounded-lg bg-white px-2.5 py-1.5 shadow-lg">
          <View className="flex-row items-center gap-1.5">
            <Check color="#16A34A" size={13} />
            <Text className="text-[10px] font-bold text-navy">3 teams active</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
