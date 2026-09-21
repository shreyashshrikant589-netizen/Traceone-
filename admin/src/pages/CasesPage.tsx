import { Search, SlidersHorizontal, Eye, ArrowUpRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PriorityBadge from '../components/PriorityBadge';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { caseList } from '../data/dashboard';
import type { CaseStatus } from '../types';

const filters: Array<'All' | CaseStatus> = ['All', 'Active', 'Critical', 'Searching', 'Resolved', 'Escalated', 'Closed'];

export default function CasesPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All' | CaseStatus>('All');
  const visibleCases = useMemo(() => caseList.filter((item) => {
    const matchesFilter = filter === 'All' || item.status === filter;
    const normalizedQuery = query.toLowerCase().trim();
    const matchesQuery = !normalizedQuery || item.id.toLowerCase().includes(normalizedQuery) || item.missingPerson.toLowerCase().includes(normalizedQuery);
    return matchesFilter && matchesQuery;
  }), [filter, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Case registry</p>
          <h1 className="mt-2 text-3xl font-semibold text-navy">Case management</h1>
          <p className="mt-2 text-sm text-slate-500">Mock operational records ready for future API integration.</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-soft">{caseList.length} mock records</div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[['Open cases', caseList.filter((item) => !['Resolved', 'Closed'].includes(item.status)).length, 'text-navy'], ['Escalated', caseList.filter((item) => item.status === 'Escalated' || item.status === 'Critical').length, 'text-red-600'], ['Resolved', caseList.filter((item) => item.status === 'Resolved' || item.status === 'Closed').length, 'text-teal']].map(([label, value, color]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-2 text-3xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </section>

      <SectionCard title="All cases" subtitle="Search and filter">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-500 lg:max-w-md">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search case ID or person name" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
          </label>
          <div className="flex items-center gap-2 text-xs text-slate-500"><SlidersHorizontal size={15} /> Filters</div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === item ? 'bg-navy text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{item}</button>)}
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[1120px] w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200 text-slate-500">
              {['Case ID', 'Missing Person', 'Age', 'Last Known Location', 'Created At', 'Priority', 'Status', 'Assigned Teams', 'Case Manager', 'Actions'].map((heading) => <th key={heading} className="pb-3 pr-4 font-medium">{heading}</th>)}
            </tr></thead>
            <tbody>
              {visibleCases.map((item) => <tr key={item.id} className="border-b border-slate-100 last:border-0">
                <td className="py-4 pr-4"><Link to={`/cases/${item.id}`} className="font-semibold text-blue hover:underline">{item.id}</Link></td>
                <td className="py-4 pr-4 font-medium text-slate-900">{item.missingPerson}</td>
                <td className="py-4 pr-4 text-slate-600">{item.age}</td>
                <td className="py-4 pr-4 text-slate-600">{item.location}</td>
                <td className="py-4 pr-4 text-slate-600">{item.createdAt}</td>
                <td className="py-4 pr-4"><PriorityBadge priority={item.priority} /></td>
                <td className="py-4 pr-4"><StatusBadge status={item.status} /></td>
                <td className="py-4 pr-4 text-slate-600">{item.assignedTeams.join(', ')}</td>
                <td className="py-4 pr-4 text-slate-600">{item.caseManager}</td>
                <td className="py-4"><Link to={`/cases/${item.id}`} aria-label={`View ${item.id}`} className="inline-flex rounded-lg border border-slate-200 p-2 text-slate-600 hover:text-blue"><Eye size={16} /></Link></td>
              </tr>)}
            </tbody>
          </table>
          {visibleCases.length === 0 ? <EmptyState title="No active cases" detail="Try changing the status filter or search terms." /> : null}
        </div>
      </SectionCard>
    </div>
  );
}
