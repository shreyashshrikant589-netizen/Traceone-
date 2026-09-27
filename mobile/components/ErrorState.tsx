import { AlertCircle } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

type ErrorStateProps = {
  title?: string;
  message?: string;
  resource?: 'case' | 'generic' | 'evidence-submit' | 'network';
  onRetry?: () => void;
};

const resourceErrors = { case: 'Unable to load case.', generic: 'Something went wrong.', 'evidence-submit': 'Unable to submit evidence.', network: 'Network connection unavailable.' } as const;

export function ErrorState({ title, message, resource, onRetry }: ErrorStateProps) {
  const displayTitle = resource ? resourceErrors[resource] : title ?? 'Something went wrong';
  return (
    <View className="items-center justify-center rounded-xl border border-red-100 bg-red-50 px-6 py-8">
      <AlertCircle stroke="#DC2626" size={28} />
      <Text className="mt-3 text-base font-semibold text-navy">{displayTitle}</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-muted">{message ?? 'Please try again.'}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" className="mt-4 rounded-lg px-3 py-2 active:opacity-70" onPress={onRetry}>
          <Text className="font-semibold text-blue">Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
