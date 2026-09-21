import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen() {
  const router = useRouter();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.94);

  useEffect(() => {
    let isMounted = true;
    opacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    const routeNext = async () => {
      const completed = await AsyncStorage.getItem('@traceone/onboarding-complete');
      if (isMounted) router.replace(completed === 'true' ? '/auth' : '/landing');
    };
    const timeout = setTimeout(routeNext, 1900);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [opacity, router, scale]);

  const contentStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  return (
    <SafeAreaView className="flex-1 bg-navy">
      <View className="flex-1 items-center justify-center px-8">
        <Animated.View style={contentStyle} className="items-center">
          <View className="mb-7 h-20 w-20 items-center justify-center rounded-3xl bg-teal">
            <Text className="text-4xl font-bold text-white">T</Text>
          </View>
          <Text className="text-4xl font-bold tracking-tight text-white">TraceOne</Text>
          <Text className="mt-3 text-center text-base font-medium tracking-wide text-slate-300">Search Together. Find Faster.</Text>
        </Animated.View>
      </View>
      <Text className="pb-8 text-center text-xs font-medium uppercase tracking-[2px] text-slate-400">Emergency search & public safety</Text>
    </SafeAreaView>
  );
}
