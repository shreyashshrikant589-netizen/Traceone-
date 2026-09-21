import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="flex-grow px-6 pb-10" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="pt-4">
            <Pressable accessibilityLabel="Go back" accessibilityRole="button" className="mb-8 h-10 w-10 items-center justify-center rounded-xl border border-border active:bg-background-muted" onPress={() => router.back()}><ArrowLeft stroke="#0F172A" size={20} /></Pressable>
            <View className="mb-9"><Text className="text-3xl font-bold text-navy">{title}</Text><Text className="mt-3 text-base leading-6 text-muted">{subtitle}</Text></View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
