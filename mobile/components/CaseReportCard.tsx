import { Eye, MapPin, Ruler, Shirt, User } from 'lucide-react-native';
import { Image, Text, View } from 'react-native';
import type { AppearanceData } from '@/services/cases';

interface CaseReportCardProps {
  name: string;
  age?: string;
  gender?: string;
  photoUrl?: string | null;
  appearance?: Partial<AppearanceData> & {
    clothing?: string;
    physicalDescription?: string;
    direction?: string;
  };
  lastSeenLocation?: string;
  lastSeenTime?: string;
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View className="flex-row items-center gap-2 py-1.5">
      <Icon stroke="#64748B" size={15} />
      <Text className="text-xs text-muted w-24">{label}</Text>
      <Text className="text-sm text-navy flex-1 font-medium">{value}</Text>
    </View>
  );
}

export function CaseReportCard({ name, age, gender, photoUrl, appearance, lastSeenLocation, lastSeenTime }: CaseReportCardProps) {
  return (
    <View className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Header with photo */}
      <View className="bg-navy/5 px-5 py-4 flex-row items-center gap-4">
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            className="w-20 h-24 rounded-xl"
            resizeMode="cover"
          />
        ) : (
          <View className="w-20 h-24 rounded-xl bg-background-muted items-center justify-center">
            <User stroke="#94A3B8" size={32} />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-xl font-bold text-navy">{name}</Text>
          <View className="flex-row items-center gap-2 mt-1">
            {age ? <Text className="text-sm text-muted">{age} years old</Text> : null}
            {age && gender ? <Text className="text-muted">•</Text> : null}
            {gender ? <Text className="text-sm text-muted">{gender}</Text> : null}
          </View>
          {lastSeenLocation ? (
            <View className="flex-row items-center gap-1 mt-2">
              <MapPin stroke="#0D9488" size={13} />
              <Text className="text-xs text-teal-600 font-medium">{lastSeenLocation}</Text>
            </View>
          ) : null}
          {lastSeenTime ? (
            <Text className="text-xs text-muted mt-0.5">Last seen: {lastSeenTime}</Text>
          ) : null}
        </View>
      </View>

      {/* Appearance details */}
      {appearance ? (
        <View className="px-5 py-3 border-t border-border">
          <Text className="text-sm font-bold text-navy mb-2">Appearance Details</Text>

          {/* Physical */}
          <DetailRow icon={Ruler} label="Height" value={appearance.height} />
          <DetailRow icon={User} label="Build" value={appearance.build} />
          <DetailRow icon={Eye} label="Eye Color" value={appearance.eyeColor} />
          <DetailRow icon={User} label="Hair" value={
            [appearance.hairColor, appearance.hairStyle].filter(Boolean).join(', ') || undefined
          } />
          <DetailRow icon={User} label="Skin Tone" value={appearance.skinTone} />

          {/* Clothing */}
          {(appearance.shirtColor || appearance.shirtType || appearance.pantsColor || appearance.pantsType || appearance.footwear || appearance.accessories || appearance.clothing) ? (
            <>
              <View className="h-px bg-border my-2" />
              <Text className="text-xs font-bold text-muted mb-1">CLOTHING</Text>
              <DetailRow icon={Shirt} label="Top" value={
                [appearance.shirtColor, appearance.shirtType].filter(Boolean).join(' ') || undefined
              } />
              <DetailRow icon={Shirt} label="Bottom" value={
                [appearance.pantsColor, appearance.pantsType].filter(Boolean).join(' ') || undefined
              } />
              <DetailRow icon={Shirt} label="Footwear" value={appearance.footwear} />
              <DetailRow icon={Shirt} label="Accessories" value={appearance.accessories} />
              {appearance.clothing ? (
                <DetailRow icon={Shirt} label="Other" value={appearance.clothing} />
              ) : null}
            </>
          ) : null}

          {/* Extra */}
          {appearance.physicalDescription ? (
            <>
              <View className="h-px bg-border my-2" />
              <Text className="text-xs text-muted">{appearance.physicalDescription}</Text>
            </>
          ) : null}
          {appearance.direction ? (
            <DetailRow icon={MapPin} label="Direction" value={appearance.direction} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
