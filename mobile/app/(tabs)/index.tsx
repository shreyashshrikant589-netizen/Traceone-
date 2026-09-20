import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}>
        <View className="pb-6 pt-4">
          <Header eyebrow="TraceOne" title="Good morning, Nishant" actionLabel="Profile" />
        </View>

        <Card className="mb-6 overflow-hidden border-0 bg-navy p-5">
          <View className="mb-8 flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="mb-2 text-xs font-bold uppercase tracking-[2px] text-teal-300">Search together</Text>
              <Text className="text-2xl font-bold leading-8 text-white">Every search starts with one step.</Text>
              <Text className="mt-3 text-sm leading-6 text-slate-300">Coordinate volunteers and keep every decision grounded in verified information.</Text>
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal"><Text className="text-2xl text-white">+</Text></View>
          </View>
          <View className="flex-row items-center justify-between border-t border-slate-700 pt-4">
            <View><Text className="text-xs text-slate-400">ACTIVE CASES</Text><Text className="mt-1 text-2xl font-bold text-white">03</Text></View>
            <View><Text className="text-xs text-slate-400">SEARCH COVERAGE</Text><Text className="mt-1 text-2xl font-bold text-white">68%</Text></View>
            <StatusBadge label="Ready" tone="success" />
          </View>
        </Card>

        <View className="mb-3 flex-row items-center justify-between"><Text className="text-lg font-bold text-navy">Quick actions</Text><Text className="text-sm font-semibold text-blue">View all</Text></View>
        <View className="mb-7 flex-row gap-3">
          <Card interactive className="flex-1"><Text className="mb-5 text-2xl text-blue">+</Text><Text className="text-base font-bold text-navy">Create case</Text><Text className="mt-1 text-xs leading-5 text-muted">Start a coordinated search</Text></Card>
          <Card interactive className="flex-1"><Text className="mb-5 text-2xl text-teal">⌁</Text><Text className="text-base font-bold text-navy">Join case</Text><Text className="mt-1 text-xs leading-5 text-muted">Use a code or QR</Text></Card>
        </View>

        <View className="mb-3 flex-row items-center justify-between"><Text className="text-lg font-bold text-navy">Your response pulse</Text><StatusBadge label="Local search" tone="active" /></View>
        <Card>
          <View className="mb-4 flex-row items-center justify-between"><View><Text className="text-base font-bold text-navy">Search coordination</Text><Text className="mt-1 text-sm text-muted">One team is currently active</Text></View><Text className="text-2xl font-bold text-teal">68%</Text></View>
          <View className="h-2 overflow-hidden rounded-full bg-slate-100"><View className="h-full w-[68%] rounded-full bg-teal" /></View>
          <Text className="mt-3 text-xs leading-5 text-muted">AI assists decisions. People make the final call.</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
