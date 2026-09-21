import { Inbox } from 'lucide-react';

type EmptyStateProps = { title: string; detail?: string };

export default function EmptyState({ title, detail }: EmptyStateProps) {
  return <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center"><Inbox className="text-slate-400" size={24} /><p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>{detail ? <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{detail}</p> : null}</div>;
}
