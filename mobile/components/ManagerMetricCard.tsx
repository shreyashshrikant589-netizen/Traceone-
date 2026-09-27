import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Card } from './Card';

type ManagerMetricCardProps = { label: string; value: string | number; icon: LucideIcon; tone?: 'blue' | 'teal' | 'warning' | 'danger' };
const tones = { blue: { bg: 'bg-blue-50', icon: '#2563EB' }, teal: { bg: 'bg-teal-50', icon: '#0D9488' }, warning: { bg: 'bg-amber-50', icon: '#D97706' }, danger: { bg: 'bg-red-50', icon: '#DC2626' } } as const;

export function ManagerMetricCard({ label, value, icon: Icon, tone = 'blue' }: ManagerMetricCardProps) { const style = tones[tone]; return <Card className="w-[47%]"><View className={`h-9 w-9 items-center justify-center rounded-lg ${style.bg}`}><Icon stroke={style.icon} size={18} /></View><Text className="mt-3 text-xs leading-4 text-muted">{label}</Text><Text className="mt-1 text-2xl font-bold text-navy">{value}</Text></Card>; }
