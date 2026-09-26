import { ArrowRight, CheckCircle2, Lock, Network, ShieldCheck, ShieldAlert, Sparkles, UserPlus, BriefcaseBusiness } from 'lucide-react-native';


import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SearchCoordinationIllustration } from '@/components/SearchCoordinationIllustration';

export default function LandingScreen() {
  const router = useRouter();
  const [showAdminModal, setShowAdminModal] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScrollView
        style={{ flex: 1 }}
        className="flex-1"
        contentContainerClassName="px-6 pb-12"
        showsVerticalScrollIndicator={true}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between pb-6 pt-5">
          <View className="flex-row items-center gap-2.5">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-navy shadow-sm">
              <Text className="text-xl font-black text-white">T</Text>
            </View>
            <View>
              <Text className="text-xl font-bold tracking-tight text-navy">TraceOne</Text>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-teal">Emergency Safety</Text>
            </View>
          </View>
          <View className="rounded-full bg-teal-50 px-3.5 py-1.5 border border-teal-100">
            <Text className="text-xs font-bold uppercase tracking-wide text-teal">Hackathon Edition</Text>
          </View>
        </View>

        {/* Motto & Hero Title */}
        <View className="rounded-2xl bg-blue-50/50 p-4 border border-blue-100/60 mb-5">
          <Text className="text-xs font-bold uppercase tracking-[2px] text-teal">TraceOne Platform</Text>
          <Text className="mt-1 text-sm font-semibold text-navy">"Intelligent Search. Coordinated Response. Safer Communities."</Text>
        </View>

        <Text className="text-[34px] leading-[41px] font-extrabold tracking-tight text-navy">
          Every Search{'\n'}Starts With One Step.
        </Text>
        <Text className="mt-3.5 text-base leading-6 text-muted">
          Coordinate volunteers, share verified information, and organize smarter searches when every minute matters.
        </Text>

        {/* 3-Tier Workflow Pill */}
        <Card className="mt-6 border border-teal-100 bg-teal-50/40 p-4">
          <Text className="text-xs font-bold uppercase tracking-widest text-teal">Standard Search Workflow</Text>
          <View className="mt-3 flex-row items-center justify-between">
            <View className="items-center flex-1">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-navy"><Text className="text-xs font-bold text-white">1</Text></View>
              <Text className="mt-1.5 text-center text-[11px] font-bold text-navy">LOCAL FIRST</Text>
            </View>
            <Text className="text-muted text-xs font-bold">→</Text>
            <View className="items-center flex-1">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-teal"><Text className="text-xs font-bold text-white">2</Text></View>
              <Text className="mt-1.5 text-center text-[11px] font-bold text-teal">PUBLIC SEARCH</Text>
            </View>
            <Text className="text-muted text-xs font-bold">→</Text>
            <View className="items-center flex-1">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-warning"><Text className="text-xs font-bold text-white">3</Text></View>
              <Text className="mt-1.5 text-center text-[11px] font-bold text-navy">AI EXPANSION</Text>
            </View>
          </View>
        </Card>

        {/* Illustration */}
        <View className="mt-6">
          <SearchCoordinationIllustration />
        </View>

        {/* Primary Actions */}
        <View className="mt-7 gap-3">
          <Button label="Get Started" icon={ArrowRight} iconPosition="right" fullWidth onPress={() => router.push('/onboarding')} />
          <Button label="Sign In to Existing Account" variant="outline" fullWidth onPress={() => router.push('/auth')} />
        </View>

        {/* Core Capabilities */}
        <View className="mt-8 gap-3">
          <FeatureCard icon={Network} title="VOLUNTEER COORDINATION" description="Organize verified volunteers into structured search teams with QR & 6-digit codes." />
          <FeatureCard icon={Sparkles} title="AI SEARCH PRIORITIZATION" description="Dynamic heuristic scoring ranks search zones using terrain, time & evidence." />
          <FeatureCard icon={ShieldCheck} title="HUMAN-IN-THE-LOOP VERIFICATION" description="Collect evidence & sightings with human verification boundaries." />
        </View>

        <Text className="mt-7 text-center text-xs font-medium leading-5 text-muted">
          AI assists decisions. Authorized commanders make the final call.
        </Text>

        {/* ADMIN PORTAL SECTION */}
        <View className="mt-10 rounded-2xl bg-navy p-6 shadow-md">
          <View className="flex-row items-center gap-2.5">
            <View className="h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <ShieldAlert color="#38BDF8" size={18} />
            </View>
            <Text className="text-xs font-bold uppercase tracking-[2px] text-sky-400">ADMIN PORTAL</Text>
          </View>
          <Text className="mt-2 text-xl font-bold text-white">Command & Operations</Text>
          <Text className="mt-1.5 text-sm leading-5 text-slate-300">
            Manage cases, volunteers, search operations, escalation approvals, and system audit logs.
          </Text>
          <View className="mt-5 gap-2.5">
            <Button label="Admin Login" icon={Lock} fullWidth onPress={() => router.push('/admin-login')} />
          <Button label="Case Manager Login" icon={BriefcaseBusiness} fullWidth onPress={() => router.push('/auth')} />
            <Button
              label="Admin Registration Request"
              variant="outline"
              icon={UserPlus}
              fullWidth
              onPress={() => setShowAdminModal(true)}
            />
          </View>
        </View>

        {/* Admin Registration Onboarding Modal */}
        {showAdminModal ? (
          <Modal visible={showAdminModal} transparent animationType="fade" onRequestClose={() => setShowAdminModal(false)}>
            <View className="flex-1 items-center justify-center bg-black/60 px-6">
              <View className="w-full rounded-2xl bg-white p-6 shadow-xl">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-blue-50 mb-4">
                  <Lock color="#2563EB" size={24} />
                </View>
                <Text className="text-xl font-bold text-navy">Secure Admin Onboarding</Text>
                <Text className="mt-2 text-sm leading-5 text-muted">
                  Admin accounts require an active Case Manager invite token or platform bootstrap authority. Unrestricted public admin registration is prohibited to protect sensitive missing-person cases.
                </Text>
                <View className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <Text className="text-xs font-bold text-navy uppercase">Existing Admin Account?</Text>
                  <Text className="mt-1 text-xs text-muted">
                    Use Admin Login with your designated administrator or manager credentials.
                  </Text>
                </View>
                <View className="mt-6 gap-2">
                  <Button label="Proceed to Admin Login" fullWidth onPress={() => { setShowAdminModal(false); router.push('/admin-login'); }} />
                  <Button label="Close" variant="ghost" fullWidth onPress={() => setShowAdminModal(false)} />
                </View>
              </View>
            </View>
          </Modal>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof Network; title: string; description: string }) {
  return (
    <Card className="flex-row items-start gap-4 p-4 border border-slate-100">
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
        <Icon color="#2563EB" size={21} />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-bold tracking-[1.5px] text-teal">{title}</Text>
        <Text className="mt-1 text-sm leading-5 text-muted">{description}</Text>
      </View>
    </Card>
  );
}
