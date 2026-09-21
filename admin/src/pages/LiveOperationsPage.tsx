import { AlertTriangle, ArrowUpRight, BellRing, CircleDot, Expand, MapPin, RefreshCw, Search, Send, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import AlertCard from '../components/AlertCard';
import OperationsMapPlaceholder from '../components/OperationsMapPlaceholder';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { operationAlerts, operationsTeams, operationsZones } from '../data/operations';

export default function LiveOperationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Command center</p>
          <h1 className="mt-2 text-3xl font-semibold text-navy">Live Operations</h1>
          <p className="mt-2 text-sm text-slate-500">Coordinate active searches, field teams, and operational alerts from one view.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-teal/20 bg-teal/10 px-3 py-2 text-xs font-semibold text-teal"><CircleDot size={14} /> Operations live • mock data</div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[['Active emergency cases', '12', '2 critical', 'text-red-600'], ['Active search teams', '18', '4 need updates', 'text-blue'], ['Current search zones', '9', '68% average completion', 'text-teal'], ['Volunteers in field', '94', '12 on standby', 'text-navy']].map(([label, value, detail, color]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm text-slate-500">{label}</p><p className={`mt-3 text-3xl font-semibold ${color}`}>{value}</p><p className="mt-2 text-xs text-slate-500">{detail}</p></div>)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <SectionCard title="Current search zones" subtitle="Map view" action={<div className="flex items-center gap-2 text-xs text-slate-500"><RefreshCw size={14} /> Updated 2 min ago</div>}>
          <OperationsMapPlaceholder />
        </SectionCard>

        <SectionCard title="Active Teams" subtitle="Field coordination" action={<span className="rounded-full bg-blue/10 px-2.5 py-1 text-xs font-semibold text-blue">{operationsTeams.length} active</span>}>
          <div className="space-y-3">
            {operationsTeams.map((team) => <div key={team.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">{team.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Users size={12} /> {team.members} members</p></div><StatusBadge status={team.status === 'Needs update' ? 'Pending' : team.status === 'En route' ? 'Searching' : team.status} /></div>
              <div className="mt-3 flex items-start gap-2 text-xs text-slate-600"><MapPin size={14} className="mt-0.5 shrink-0 text-teal" /><span>{team.zone}</span></div>
              <p className="mt-2 text-[11px] text-slate-500">Last update: {team.lastUpdate}</p>
            </div>)}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Zone completion" subtitle="Search progress">
          <div className="space-y-5">{operationsZones.map((zone) => <div key={zone.name}><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">{zone.name}</p><p className="mt-1 text-xs text-slate-500">{zone.caseId} • {zone.teams} teams assigned</p></div><span className="text-sm font-semibold text-navy">{zone.completion}%</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${zone.completion < 50 ? 'bg-amber-500' : 'bg-gradient-to-r from-blue to-teal'}`} style={{ width: `${zone.completion}%` }} /></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500"><span>Volunteer: {zone.lastVolunteerUpdate}</span><span>Sighting: {zone.lastSighting}</span></div></div>)}</div>
        </SectionCard>

        <SectionCard title="Critical alerts" subtitle="Command attention" action={<span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">{operationAlerts.length} open</span>}>
          <div className="space-y-3">{operationAlerts.map((alert) => <AlertCard key={alert.title} title={alert.title} detail={alert.detail} time={alert.time} severity={alert.severity} />)}</div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <SectionCard title="Field updates" subtitle="Latest volunteer and sighting signals">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-teal/20 bg-teal/5 p-4"><div className="flex items-center gap-2 text-teal"><Users size={17} /><span className="text-xs font-semibold uppercase tracking-wide">Last volunteer update</span></div><p className="mt-3 text-sm font-semibold text-slate-900">Alpha-12 cleared the north entrance</p><p className="mt-1 text-xs text-slate-500">4 minutes ago • North District Park</p></div>
            <div className="rounded-xl border border-blue/20 bg-blue/5 p-4"><div className="flex items-center gap-2 text-blue"><Search size={17} /><span className="text-xs font-semibold uppercase tracking-wide">Last sighting</span></div><p className="mt-3 text-sm font-semibold text-slate-900">Witness report received at north entrance</p><p className="mt-1 text-xs text-slate-500">12 minutes ago • CASE-1042</p></div>
          </div>
        </SectionCard>

        <SectionCard title="Operation controls" subtitle="Frontend mock actions">
          <div className="grid grid-cols-2 gap-3">
            <Link to="/cases/CASE-1042" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 hover:border-blue hover:text-blue">View case <ArrowUpRight size={16} /></Link>
            <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left text-sm font-semibold text-slate-700 hover:border-blue hover:text-blue">Reassign team <Users size={16} /></button>
            <button className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal">Expand search <Expand size={16} /></button>
            <button className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-left text-sm font-semibold text-red-600 hover:bg-red-100">Send alert <Send size={16} /></button>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><BellRing size={14} /> Controls are visual placeholders until connected to backend workflows.</p>
        </SectionCard>
      </section>
    </div>
  );
}
