import { LoaderCircle } from 'lucide-react';

type LoadingStateProps = { label?: string };

export default function LoadingState({ label = 'Loading' }: LoadingStateProps) {
  return <div className="flex min-h-32 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500" role="status" aria-live="polite"><LoaderCircle className="animate-spin text-blue" size={18} />{label}</div>;
}
