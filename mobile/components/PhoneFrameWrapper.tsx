import React from 'react';
import { Platform, Text, View } from 'react-native';

interface PhoneFrameWrapperProps {
  children: React.ReactNode;
}

export function PhoneFrameWrapper({ children }: PhoneFrameWrapperProps) {
  // On native iOS/Android, render full-screen app directly without frame
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  // On Web / Desktop browser, render realistic smartphone frame
  return (
    <View className="flex-1 min-h-screen w-full bg-slate-950 items-center justify-center py-6 px-4">
      {/* Desktop Top Brand Header */}
      <View className="flex-row items-center gap-2.5 mb-4">
        <View className="h-7 w-7 items-center justify-center rounded-lg bg-navy">
          <Text className="text-sm font-black text-white">T</Text>
        </View>
        <Text className="text-sm font-bold tracking-tight text-white">TraceOne</Text>
        <View className="rounded-full bg-teal-500/20 px-2.5 py-0.5 border border-teal-500/30">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Desktop Web Preview</Text>
        </View>
      </View>

      {/* Smartphone Device Frame */}
      <View
        className="relative w-full max-w-[412px] h-[840px] max-h-[92vh] rounded-[48px] bg-slate-900 border-[12px] border-slate-900 shadow-2xl overflow-hidden flex-col"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px 2px rgba(13, 148, 136, 0.15)',
        }}
      >
        {/* Dynamic Island / Top Camera Pill */}
        <View pointerEvents="none" className="absolute top-2.5 left-0 right-0 items-center z-50 pointer-events-none">
          <View className="h-4.5 w-24 rounded-full bg-black flex-row items-center justify-end px-2 gap-1.5 shadow-sm">
            <View className="h-2 w-2 rounded-full bg-slate-900 border border-slate-800" />
            <View className="h-1.5 w-1.5 rounded-full bg-blue-900/60" />
          </View>
        </View>

        {/* Screen Viewport containing the existing TraceOne App */}
        <View className="flex-1 bg-white rounded-[36px] overflow-hidden relative w-full h-full">
          {children}
        </View>

        {/* Bottom Home Indicator Bar (Web styling preview) */}
        <View pointerEvents="none" className="absolute bottom-1.5 left-0 right-0 items-center z-50 pointer-events-none">
          <View className="h-1 w-32 rounded-full bg-slate-400/40" />
        </View>
      </View>

      {/* Desktop Footer Caption */}
      <Text className="mt-3 text-center text-[11px] font-medium text-slate-400">
        Emergency Search & Public Safety Platform · Mobile Device Mode
      </Text>
    </View>
  );
}
