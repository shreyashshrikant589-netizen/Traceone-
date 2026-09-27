import { TriangleAlert } from 'lucide-react';

type ErrorStateProps = { title?: string; detail?: string; onRetry?: () => void };

export default function ErrorState({ title = 'Something went wrong', detail = 'The information could not be loaded. Please try again.', onRetry }: ErrorStateProps) {
  return <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center" role="alert"><TriangleAlert className="text-red-600" size={24} /><p className="mt-3 text-sm font-semibold text-red-800">{title}</p><p className="mt-1 max-w-sm text-xs leading-5 text-red-700">{detail}</p>{onRetry ? <button onClick={onRetry} className="mt-4 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700">Try again</button> : null}</div>;
}
