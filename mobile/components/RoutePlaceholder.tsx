import { ArrowRight } from 'lucide-react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Button } from './Button';
import { Header } from './Header';

type RoutePlaceholderProps = {
  title: string;
  description: string;
  nextLabel?: string;
  nextHref?: Href;
  showBack?: boolean;
};

export function RoutePlaceholder({ title, description, nextLabel, nextHref, showBack = true }: RoutePlaceholderProps) {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-grow px-6 pb-8" showsVerticalScrollIndicator={false}>
        <View className="pt-4">
          <Header title={title} onBackPress={showBack ? () => router.back() : undefined} />
          <View className="mt-10 rounded-xl border border-border bg-background-muted p-5">
            <Text className="text-lg font-semibold text-navy">TraceOne frontend route</Text>
            <Text className="mt-2 text-base leading-6 text-muted">{description}</Text>
          </View>
          {nextHref && nextLabel ? (
            <View className="mt-6">
              <Button label={nextLabel} icon={ArrowRight} iconPosition="right" fullWidth onPress={() => router.push(nextHref)} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
