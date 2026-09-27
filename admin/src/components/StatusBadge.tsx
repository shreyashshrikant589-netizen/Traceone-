type StatusBadgeProps = {
  status: 'Active' | 'Critical' | 'Escalated' | 'Monitoring' | 'Resolved' | 'Pending' | 'Review' | 'Closed' | 'Searching' | 'Standby' | 'Available' | 'Offline' | 'Unassigned' | 'Assigned' | 'Completed' | 'Expanded' | 'Cancelled';
};

const styles: Record<StatusBadgeProps['status'], string> = {
  Active: 'bg-teal/10 text-teal border border-teal/20',
  Critical: 'bg-red-50 text-red-600 border border-red-200',
  Escalated: 'bg-red-50 text-red-600 border border-red-200',
  Monitoring: 'bg-blue/10 text-blue border border-blue/200',
  Resolved: 'bg-slate-100 text-slate-700 border border-slate-200',
  Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  Review: 'bg-violet-50 text-violet-700 border border-violet-200',
  Closed: 'bg-slate-100 text-slate-600 border border-slate-200',
  Searching: 'bg-blue/10 text-blue border border-blue/200',
  Standby: 'bg-slate-100 text-slate-600 border border-slate-200',
  Available: 'bg-teal/10 text-teal border border-teal/20',
  Offline: 'bg-slate-100 text-slate-500 border border-slate-200',
  Unassigned: 'bg-amber-50 text-amber-700 border border-amber-200',
  Assigned: 'bg-blue/10 text-blue border border-blue/20',
  Completed: 'bg-teal/10 text-teal border border-teal/20',
  Expanded: 'bg-violet-50 text-violet-700 border border-violet-200',
  Cancelled: 'bg-slate-100 text-slate-500 border border-slate-200',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}>{status}</span>;
}
