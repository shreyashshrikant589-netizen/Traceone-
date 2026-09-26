import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Button } from '@/components/Button';
import { BackButton } from '@/components/BackButton';
import { OnboardingIllustration } from '@/components/OnboardingIllustration';

const ONBOARDING_COMPLETE = '@traceone/onboarding-complete';
const slides = [
  { title: 'Report When Someone Goes Missing', description: 'Start a clear, coordinated response with the information your community needs to act safely.' },
  { title: 'Search Together', description: 'Turn willing volunteers into structured teams with shared zones, updates, and verified sightings.' },
  { title: 'Smarter Search Decisions', description: 'Use clear signals to focus attention while keeping human judgment at the center of every decision.' },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const contentOpacity = useSharedValue(1);
  const slide = slides[step];

  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  const changeStep = (nextStep: number) => {
    contentOpacity.value = withTiming(0, { duration: 120, easing: Easing.out(Easing.cubic) }, () => {
      contentOpacity.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });
    });
    setStep(nextStep);
  };

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE, 'true');
    router.replace('/auth');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pb-6 pt-5">
        <View className="flex-row items-center justify-between">
          <BackButton fallbackRoute="/landing" variant="ghost" />
          <Pressable accessibilityRole="button" className="px-2 py-2 active:opacity-70" onPress={finish}><Text className="text-sm font-semibold text-muted">Skip</Text></Pressable>
        </View>
        <Animated.View style={contentStyle} className="mt-8"><OnboardingIllustration step={step as 0 | 1 | 2} /></Animated.View>
        <Animated.View style={contentStyle} className="mt-9 flex-1">
          <Text className="text-[30px] leading-[38px] font-bold text-navy">{slide.title}</Text>
          <Text className="mt-4 text-base leading-6 text-muted">{slide.description}</Text>
        </Animated.View>
        <View className="mb-6 flex-row items-center gap-2">
          {slides.map((item, index) => <View key={item.title} className={`h-2 rounded-full ${index === step ? 'w-8 bg-blue' : 'w-2 bg-border'}`} />)}
          <Text className="ml-auto text-xs font-semibold text-muted">{step + 1} / {slides.length}</Text>
        </View>
        {step === slides.length - 1 ? (
          <Button label="Get Started" icon={ArrowRight} iconPosition="right" fullWidth onPress={finish} />
        ) : (
          <View className="flex-row items-center gap-3">
            <Pressable accessibilityLabel="Previous slide" accessibilityRole="button" className="h-[52px] w-[52px] items-center justify-center rounded-xl border border-border" disabled={step === 0} onPress={() => changeStep(step - 1)}><ChevronLeft color={step === 0 ? '#CBD5E1' : '#0F172A'} size={21} /></Pressable>
            <View className="flex-1"><Button label="Next" icon={ChevronRight} iconPosition="right" fullWidth onPress={() => changeStep(step + 1)} /></View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
