import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from './BackButton';

type AuthShellProps = {
  title: string;
  subtitle: string;
  fallbackRoute?: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, fallbackRoute = '/landing', children }: AuthShellProps) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="flex-grow px-6 pb-10" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="pt-4">
            <View className="mb-8">
              <BackButton fallbackRoute={fallbackRoute} variant="circle" />
            </View>
            <View className="mb-9"><Text className="text-3xl font-bold text-navy">{title}</Text><Text className="mt-3 text-base leading-6 text-muted">{subtitle}</Text></View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
