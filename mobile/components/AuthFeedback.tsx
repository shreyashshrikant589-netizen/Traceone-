import { AlertCircle, CheckCircle2, WifiOff } from 'lucide-react-native';
import { ActivityIndicator, Text, View } from 'react-native';
import type { AuthStatus } from '@/services/auth';

type AuthFeedbackProps = {
  status: AuthStatus;
  message?: string;
};

export function AuthFeedback({ status, message }: AuthFeedbackProps) {
  if (status === 'idle' || status === 'validation-error') return null;
  if (status === 'loading') {
    return <View accessibilityLiveRegion="polite" className="flex-row items-center gap-2 rounded-xl bg-blue-50 px-4 py-3"><ActivityIndicator color="#2563EB" size="small" /><Text className="text-sm font-medium text-blue">Working securely...</Text></View>;
  }
  const isSuccess = status === 'success';
  const isNetwork = status === 'network-error';
  const text = message ?? (isSuccess ? 'Your request was completed.' : isNetwork ? 'Check your connection and try again.' : 'We could not complete that request.');
  return <View accessibilityLiveRegion="polite" className={`flex-row items-start gap-2 rounded-xl px-4 py-3 ${isSuccess ? 'bg-green-50' : 'bg-red-50'}`}>{isSuccess ? <CheckCircle2 stroke="#16A34A" size={19} /> : isNetwork ? <WifiOff stroke="#DC2626" size={19} /> : <AlertCircle stroke="#DC2626" size={19} />}<Text className={`flex-1 text-sm leading-5 ${isSuccess ? 'text-success' : 'text-danger'}`}>{text}</Text></View>;
}
