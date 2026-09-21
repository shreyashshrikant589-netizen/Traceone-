type AlertCardProps = {
  title: string;
  detail: string;
  time: string;
  severity: 'Critical' | 'Warning' | 'Info';
};

const styles = {
  Critical: 'bg-red-50 text-red-600 border border-red-200',
  Warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  Info: 'bg-blue/10 text-blue border border-blue/200',
};

export default function AlertCard({ title, detail, time, severity }: AlertCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{time}</p>
        </div>
        <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${styles[severity]}`}>{severity}</span>
      </div>
      <p className="mt-3 text-sm text-slate-600">{detail}</p>
    </div>
  );
}
