import { Camera, FileCheck2 } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Card } from './Card';
import type { EvidenceType } from '@/services/reporting';

type EvidenceCardProps = { type: EvidenceType; description: string; location?: string; time?: string; confidence?: number; source?: string; photoUri?: string; onPress?: () => void };

export function EvidenceCard({ type, description, location, time, confidence, source, photoUri, onPress }: EvidenceCardProps) {
  return <Card onPress={onPress}><View className="flex-row items-start gap-3"><View className="h-10 w-10 items-center justify-center rounded-lg bg-teal-50"><FileCheck2 stroke="#0D9488" size={19} /></View><View className="flex-1"><View className="flex-row items-center justify-between gap-2"><Text className="text-xs font-bold uppercase tracking-[1.2px] text-teal">{type.replace('_', ' ')}</Text>{photoUri ? <Camera stroke="#64748B" size={15} /> : null}</View><Text className="mt-1 text-base font-semibold text-navy">{description}</Text>{location ? <Text className="mt-2 text-sm text-muted">{location}{time ? ` · ${time}` : ''}</Text> : null}{confidence !== undefined || source ? <Text className="mt-2 text-xs text-muted">{confidence !== undefined ? `Confidence ${confidence}%` : ''}{confidence !== undefined && source ? ' · ' : ''}{source ? `Source: ${source}` : ''}</Text> : null}</View></View></Card>;
}
