import { MapPin, Search, Users, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { teams } from '../data/volunteers';

const filters = ['All', 'Active', 'Searching', 'Standby', 'Needs update'] as const;

export default function TeamsPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const visibleTeams = useMemo(() => teams.filter((team) => {
    const normalizedQuery = query.toLowerCase().trim();
    return (filter === 'All' || team.status === filter) && (!normalizedQuery || team.name.toLowerCase().includes(normalizedQuery) || team.leader.toLowerCase().includes(normalizedQuery) || team.assignedCase.toLowerCase().includes(normalizedQuery));
  }), [filter, query]);

  return (
    <div className="space-y-6"><div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">People operations</p><h1 className="mt-2 text-3xl font-semibold text-navy">Team management</h1><p className="mt-2 text-sm text-slate-500">Monitor team composition, assignments, zones, and operational readiness.</p></div><div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-soft">{teams.length} mock teams</div></div>
      <section className="grid gap-4 sm:grid-cols-3">{[['Active teams', teams.filter((team) => team.status === 'Active' || team.status === 'Searching').length, 'text-teal'], ['Members in field', teams.filter((team) => team.status !== 'Standby').reduce((total, team) => total + team.members, 0), 'text-blue'], ['Needs update', teams.filter((team) => team.status === 'Needs update').length, 'text-amber-700']].map(([label, value, color]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-3xl font-semibold ${color}`}>{value}</p></div>)}</section>
      <SectionCard title="Search teams" subtitle="Team registry"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-500 lg:max-w-md"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search team, leader, or case" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" /></label><div className="flex gap-2 overflow-x-auto pb-1">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${filter === item ? 'bg-navy text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{item}</button>)}</div></div><div className="mt-5 overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-slate-500">{['Team name', 'Team leader', 'Members', 'Assigned case', 'Search zone', 'Status'].map((heading) => <th key={heading} className="pb-3 pr-4 font-medium">{heading}</th>)}</tr></thead><tbody>{visibleTeams.map((team) => <tr key={team.id} className="border-b border-slate-100 last:border-0"><td className="py-4 pr-4"><div className="flex items-center gap-2 font-semibold text-slate-900"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue/10 text-blue"><Users size={15} /></span>{team.name}</div></td><td className="py-4 pr-4"><div className="flex items-center gap-2 text-slate-700"><UserRound size={15} className="text-slate-400" />{team.leader}</div></td><td className="py-4 pr-4 font-semibold text-slate-900">{team.members}</td><td className="py-4 pr-4 font-medium text-blue">{team.assignedCase}</td><td className="py-4 pr-4"><div className="flex items-center gap-2 text-slate-600"><MapPin size={15} className="text-teal" />{team.zone}</div></td><td className="py-4"><StatusBadge status={team.status === 'Needs update' ? 'Pending' : team.status === 'Searching' ? 'Searching' : team.status === 'Standby' ? 'Standby' : 'Active'} /></td></tr>)}</tbody></table>{visibleTeams.length === 0 ? <div className="py-10 text-center text-sm text-slate-500">No mock teams match this filter.</div> : null}</div></SectionCard>
    </div>
  );
}
