import { BellRing, Check, Compass, MapPin, Search, ShieldCheck, UsersRound } from 'lucide-react-native';
import { Text, View } from 'react-native';

type OnboardingIllustrationProps = {
  step: 0 | 1 | 2;
};

export function OnboardingIllustration({ step }: OnboardingIllustrationProps) {
  if (step === 0) {
    return (
      <View className="h-[250px] items-center justify-center rounded-3xl bg-blue-50">
        <View className="absolute left-8 top-8 h-16 w-16 rounded-full bg-white" />
        <View className="absolute bottom-8 right-8 h-20 w-20 rounded-full bg-teal-50" />
        <View className="items-center rounded-3xl border border-blue-100 bg-white px-8 py-7 shadow-sm">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-blue">
            <BellRing color="#FFFFFF" size={30} />
          </View>
          <Text className="mt-4 text-base font-bold text-navy">A report starts a response</Text>
          <View className="mt-3 flex-row items-center gap-2">
            <View className="h-2 w-16 rounded-full bg-blue" />
            <View className="h-2 w-10 rounded-full bg-border" />
            <View className="h-2 w-5 rounded-full bg-border" />
          </View>
        </View>
      </View>
    );
  }

  if (step === 1) {
    return (
      <View className="h-[250px] items-center justify-center rounded-3xl bg-teal-50">
        <View className="absolute left-8 top-8 rounded-2xl bg-white p-3"><UsersRound color="#0D9488" size={23} /></View>
        <View className="absolute bottom-9 right-9 rounded-2xl bg-white p-3"><MapPin color="#2563EB" size={23} /></View>
        <View className="relative h-40 w-40 items-center justify-center rounded-full border border-dashed border-teal-light bg-white">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-teal">
            <Compass color="#FFFFFF" size={42} />
          </View>
          <View className="absolute left-0 top-7 h-3 w-3 rounded-full bg-blue" />
          <View className="absolute right-1 top-14 h-3 w-3 rounded-full bg-warning" />
          <View className="absolute bottom-4 left-12 h-3 w-3 rounded-full bg-success" />
        </View>
      </View>
    );
  }

  return (
    <View className="h-[250px] items-center justify-center rounded-3xl bg-navy">
      <View className="absolute left-7 top-8 rounded-2xl bg-white/10 p-3"><Search color="#5EEAD4" size={23} /></View>
      <View className="absolute bottom-8 right-7 rounded-2xl bg-white/10 p-3"><ShieldCheck color="#93C5FD" size={23} /></View>
      <View className="w-[220px] rounded-2xl border border-white/10 bg-[#172554] p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-teal-light">Priority signal</Text>
          <Check color="#16A34A" size={17} />
        </View>
        <View className="mt-5 flex-row items-end gap-2">
          <View className="h-12 w-8 rounded-t-lg bg-blue" />
          <View className="h-20 w-8 rounded-t-lg bg-teal-light" />
          <View className="h-14 w-8 rounded-t-lg bg-blue-light" />
          <View className="h-28 w-8 rounded-t-lg bg-white" />
        </View>
        <Text className="mt-3 text-xs text-slate-300">Human-verified guidance</Text>
      </View>
    </View>
  );
}
