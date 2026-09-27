import { ArrowRight, CheckCircle2, Network, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SearchCoordinationIllustration } from '@/components/SearchCoordinationIllustration';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-6 pb-10" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between pb-7 pt-5">
          <View className="flex-row items-center gap-2.5">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-navy"><Text className="text-lg font-bold text-white">T</Text></View>
            <Text className="text-xl font-bold text-navy">TraceOne</Text>
          </View>
          <View className="rounded-full bg-teal-50 px-3 py-1.5"><Text className="text-xs font-bold uppercase tracking-wide text-teal">Together</Text></View>
        </View>
        <Text className="text-xs font-bold uppercase tracking-[2px] text-teal">Emergency search & public safety</Text>
        <Text className="mt-4 text-[36px] leading-[43px] font-bold tracking-tight text-navy">Every Search{`\n`}Starts With One Step.</Text>
        <Text className="mt-5 text-base leading-6 text-muted">Coordinate volunteers, share verified information, and organize smarter searches when every minute matters.</Text>
        <View className="mt-8"><SearchCoordinationIllustration /></View>
        <View className="mt-8 flex-row gap-3">
          <Button label="Get Started" icon={ArrowRight} iconPosition="right" fullWidth onPress={() => router.push('/onboarding')} />
        </View>
        <Button label="See How It Works" variant="ghost" fullWidth onPress={() => router.push('/onboarding')} />
        <View className="mt-8 gap-3">
          <FeatureCard icon={Network} title="COORDINATE" description="Organize volunteers into structured search teams." />
          <FeatureCard icon={CheckCircle2} title="PRIORITIZE" description="Use AI-assisted search priority to guide where teams search next." />
          <FeatureCard icon={ShieldCheck} title="VERIFY" description="Collect sightings and evidence with human verification." />
        </View>
        <Text className="mt-9 text-center text-xs font-medium leading-5 text-muted">AI assists decisions. People make the final call.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof Network; title: string; description: string }) {
  return (
    <Card className="flex-row items-start gap-4">
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-blue-50"><Icon color="#2563EB" size={21} /></View>
      <View className="flex-1"><Text className="text-xs font-bold tracking-[1.5px] text-teal">{title}</Text><Text className="mt-1.5 text-sm leading-5 text-muted">{description}</Text></View>
    </Card>
  );
}
