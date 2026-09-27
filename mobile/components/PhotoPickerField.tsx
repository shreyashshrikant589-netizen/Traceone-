import { Camera, ImagePlus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, Text, View } from 'react-native';

type PhotoPickerFieldProps = { value?: string; onChange: (uri?: string) => void };

export function PhotoPickerField({ value, onChange }: PhotoPickerFieldProps) {
  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75, allowsEditing: true });
    if (!result.canceled) onChange(result.assets[0]?.uri);
  };
  return <Pressable accessibilityRole="button" accessibilityLabel="Add optional photo" className="min-h-[92px] flex-row items-center gap-3 rounded-xl border border-dashed border-border bg-background-muted px-4 active:bg-blue-50" onPress={pick}><View className="h-11 w-11 items-center justify-center rounded-xl bg-blue-50">{value ? <Camera stroke="#16A34A" size={21} /> : <ImagePlus stroke="#2563EB" size={21} />}</View><View className="flex-1"><Text className="text-sm font-semibold text-navy">{value ? 'Photo attached' : 'Add optional photo'}</Text><Text className="mt-1 text-xs text-muted">{value ? 'Tap to replace image' : 'Use a clear, relevant image only'}</Text></View></Pressable>;
}
