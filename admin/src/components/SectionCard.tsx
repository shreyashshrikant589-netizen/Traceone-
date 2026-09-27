import type { ReactNode } from 'react';

type SectionCardProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

export default function SectionCard({ title, subtitle, action, children }: SectionCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          {subtitle ? <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{subtitle}</p> : null}
          <h2 className="mt-1 text-xl font-semibold text-navy">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
