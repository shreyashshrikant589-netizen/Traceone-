import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight, Check, ClipboardPenLine, UsersRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { roleOptions, ROLE_STORAGE_KEY, type RoleOption, type UserRole } from '@/services/roles';

const roleIcons = {
  VOLUNTEER: UsersRound,
  REPORTER: ClipboardPenLine,
} as const;

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>();
  const visibleRoles = roleOptions.filter((role) => role.id === 'VOLUNTEER' || role.id === 'REPORTER');

  const continueToRole = async () => {
    if (!selectedRole) return;
    const role = roleOptions.find((option) => option.id === selectedRole);
    if (!role) return;
    await AsyncStorage.setItem(ROLE_STORAGE_KEY, selectedRole);
    router.replace(role.destination);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-6 pb-8" showsVerticalScrollIndicator={false}>
        <View className="pt-8">
          <Text className="text-xs font-bold uppercase tracking-[2px] text-teal">TraceOne</Text>
          <Text className="mt-3 text-3xl font-bold text-navy">How will you help?</Text>
          <Text className="mt-3 text-base leading-6 text-muted">Choose the role that best describes how you’ll use TraceOne.</Text>
        </View>
        <View className="mt-8 gap-3">
          {visibleRoles.map((role) => <RoleCard key={role.id} role={role} selected={selectedRole === role.id} onPress={() => setSelectedRole(role.id)} />)}
        </View>
        <View className="mt-8">
          <Button label="Continue" icon={ArrowRight} iconPosition="right" fullWidth disabled={!selectedRole} onPress={continueToRole} />
        </View>
        <Text className="mt-4 text-center text-xs leading-4 text-muted">Your selection customizes the interface. Access and permissions are controlled by the platform.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function RoleCard({ role, selected, onPress }: { role: RoleOption; selected: boolean; onPress: () => void }) {
  const Icon = roleIcons[role.id as keyof typeof roleIcons];
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} className={`rounded-2xl border p-4 ${selected ? 'border-blue bg-blue-50' : 'border-border bg-surface'} active:opacity-80`} onPress={onPress}>
      <View className="flex-row items-center gap-4">
        <View className={`h-12 w-12 items-center justify-center rounded-xl ${selected ? 'bg-blue' : 'bg-background-muted'}`}><Icon stroke={selected ? '#FFFFFF' : '#2563EB'} size={23} /></View>
        <View className="flex-1"><Text className="text-base font-bold text-navy">{role.title}</Text><Text className="mt-1 text-sm leading-5 text-muted">{role.description}</Text></View>
        <View className={`h-6 w-6 items-center justify-center rounded-full border ${selected ? 'border-blue bg-blue' : 'border-border bg-surface'}`}>{selected ? <Check stroke="#FFFFFF" size={15} strokeWidth={3} /> : null}</View>
      </View>
    </Pressable>
  );
}
