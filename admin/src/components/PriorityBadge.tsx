type PriorityBadgeProps = {
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
};

const styles: Record<PriorityBadgeProps['priority'], string> = {
  Critical: 'bg-red-100 text-red-700 border border-red-300',
  High: 'bg-red-50 text-red-600 border border-red-200',
  Medium: 'bg-amber-50 text-amber-700 border border-amber-200',
  Low: 'bg-teal/10 text-teal border border-teal/200',
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[priority]}`}>{priority}</span>;
}
