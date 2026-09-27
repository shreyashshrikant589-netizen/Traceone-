import type { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone?: 'blue' | 'teal' | 'red' | 'slate';
};

const toneStyles = {
  blue: 'bg-blue/10 text-blue',
  teal: 'bg-teal/10 text-teal',
  red: 'bg-red-50 text-red-600',
  slate: 'bg-slate-100 text-slate-700',
};

export default function StatCard({ label, value, detail, icon, tone = 'blue' }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-navy">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${toneStyles[tone]}`}>{icon}</div>
      </div>
      <p className="mt-4 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
