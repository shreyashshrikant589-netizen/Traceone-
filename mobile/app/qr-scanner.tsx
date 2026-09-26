import { CameraView, useCameraPermissions } from 'expo-camera';
import { ArrowLeft, Flashlight, FlashlightOff, KeyRound, QrCode, ScanLine } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, SafeAreaView, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { PermissionCard } from '@/components/PermissionCard';

export default function QRScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');

  const handleScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setError('');
    router.push({ pathname: '/case-preview', params: { token: data } });
  };

  const handleManualSubmit = () => {
    const clean = manualCode.trim();
    if (clean.length < 6) {
      setError('Please enter at least a 6-digit code.');
      return;
    }
    router.push({ pathname: '/case-preview', params: { token: clean } });
  };

  // Web Browser / Desktop preview mode
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView className="flex-1 bg-navy px-6 justify-center">
        <View className="items-center mb-6">
          <View className="h-16 w-16 rounded-2xl bg-teal-500/20 border border-teal-500/40 items-center justify-center mb-4">
            <QrCode stroke="#2DD4BF" size={34} />
          </View>
          <Text className="text-2xl font-bold text-white text-center">QR Scanner</Text>
          <Text className="mt-2 text-sm text-slate-300 text-center max-w-xs">
            Web Desktop Preview: Enter the 6-digit code or paste the QR payload from the case coordinator.
          </Text>
        </View>

        <View className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800">
          <Text className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
            6-Digit Join Code
          </Text>
          <TextInput
            placeholder="e.g. 842195"
            placeholderTextColor="#64748B"
            keyboardType="number-pad"
            className="h-13 bg-slate-950 border border-slate-700 rounded-xl px-4 text-white text-lg font-bold tracking-widest text-center"
            value={manualCode}
            onChangeText={(t) => {
              setManualCode(t);
              setError('');
            }}
          />

          {error ? <Text className="mt-2 text-xs text-red-400">{error}</Text> : null}

          <View className="mt-4 gap-2">
            <Button label="Preview & Join Case" fullWidth onPress={handleManualSubmit} />
            <Button
              label="Back to Cases"
              variant="outline"
              fullWidth
              onPress={() => router.back()}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission) {
    return <SafeAreaView className="flex-1 bg-navy" />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 justify-center bg-background px-6">
        <View className="items-center">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 mb-3">
            <ScanLine stroke="#2563EB" size={36} />
          </View>
          <Text className="text-center text-xl font-bold text-navy">Camera Access Needed</Text>
          <Text className="mt-2 text-center text-sm leading-6 text-muted max-w-xs">
            Allow camera permission to scan volunteer QR invites, or use the 6-digit join code directly.
          </Text>
        </View>

        <View className="mt-6">
          <PermissionCard
            kind="camera"
            state={permission.canAskAgain ? 'not-requested' : 'blocked'}
            onRequest={requestPermission}
          />
        </View>

        <View className="mt-5 gap-2.5">
          <Button
            label="Enter 6-Digit Code Instead"
            fullWidth
            onPress={() => router.replace('/join-case')}
          />
          <Button label="Cancel" variant="outline" fullWidth onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-navy">
      <CameraView
        className="flex-1"
        facing="back"
        enableTorch={flash}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      >
        <SafeAreaView className="flex-1 justify-between">
          {/* Top Bar */}
          <View className="flex-row items-center justify-between px-5 pt-4">
            <Pressable
              accessibilityLabel="Cancel scanner"
              accessibilityRole="button"
              className="rounded-xl bg-black/40 p-3"
              onPress={() => router.back()}
            >
              <ArrowLeft stroke="#FFFFFF" size={21} />
            </Pressable>
            <Pressable
              accessibilityLabel={flash ? 'Turn flash off' : 'Turn flash on'}
              accessibilityRole="button"
              className="rounded-xl bg-black/40 p-3"
              onPress={() => setFlash((value) => !value)}
            >
              {flash ? <FlashlightOff stroke="#FFFFFF" size={21} /> : <Flashlight stroke="#FFFFFF" size={21} />}
            </Pressable>
          </View>

          {/* Scanner Box */}
          <View className="items-center">
            <View className="h-64 w-64 rounded-3xl border-2 border-white/80 relative">
              <View className="absolute -left-1 -top-1 h-8 w-8 border-l-4 border-t-4 border-teal-400" />
              <View className="absolute -right-1 -top-1 h-8 w-8 border-r-4 border-t-4 border-teal-400" />
              <View className="absolute -bottom-1 -left-1 h-8 w-8 border-b-4 border-l-4 border-teal-400" />
              <View className="absolute -bottom-1 -right-1 h-8 w-8 border-b-4 border-r-4 border-teal-400" />
            </View>
            <Text className="mt-6 px-8 text-center text-sm font-semibold text-white">
              Point camera at the authorized Case QR code
            </Text>
            {error ? (
              <View className="mx-7 mt-4 rounded-xl bg-red-600/90 px-4 py-3">
                <Text className="text-center text-sm font-semibold text-white">{error}</Text>
              </View>
            ) : null}
          </View>

          {/* Bottom Controls */}
          <View className="px-7 pb-8 gap-3 items-center">
            <Pressable
              accessibilityRole="button"
              className="flex-row items-center gap-2 bg-white/20 px-4 py-2 rounded-xl"
              onPress={() => router.push('/join-case')}
            >
              <KeyRound size={16} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">Enter 6-Digit Code Instead</Text>
            </Pressable>

            {scanned ? (
              <Pressable
                accessibilityRole="button"
                className="items-center mt-2"
                onPress={() => {
                  setScanned(false);
                  setError('');
                }}
              >
                <Text className="text-sm font-bold text-teal-400">Scan Again</Text>
              </Pressable>
            ) : null}
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
