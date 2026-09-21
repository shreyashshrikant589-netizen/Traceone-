import { ActivityIndicator, Text, View } from 'react-native';

type LoadingProps = {
  label?: string;
  resource?: 'cases' | 'assignment' | 'search-zones' | 'evidence' | 'profile';
  fullScreen?: boolean;
};

const resourceLabels = { cases: 'Loading cases...', assignment: 'Loading assignment...', 'search-zones': 'Loading search zones...', evidence: 'Loading evidence...', profile: 'Loading profile...' } as const;

export function Loading({ label, resource, fullScreen = false }: LoadingProps) {
  const displayLabel = resource ? resourceLabels[resource] : label ?? 'Loading';
  return (
    <View className={`${fullScreen ? 'flex-1' : 'py-8'} items-center justify-center gap-3`}>
      <ActivityIndicator color="#2563EB" size="small" />
      <Text className="text-sm text-muted">{displayLabel}</Text>
    </View>
  );
}
