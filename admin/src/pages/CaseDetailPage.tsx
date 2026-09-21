import { ArrowLeft, Bot, CheckCircle2, Clock3, FileText, MapPinned, MessageSquareWarning, Radio, ShieldAlert, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import AlertCard from '../components/AlertCard';
import PriorityBadge from '../components/PriorityBadge';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { caseList, caseTimeline } from '../data/dashboard';

const tabs = ['Overview', 'Timeline', 'Search Teams', 'Search Zones', 'Sightings', 'Evidence', 'AI Priority', 'Possible Matches', 'Escalation', 'Audit Log'];

const tabIcons = [FileText, Clock3, Users, MapPinned, Radio, FileText, Bot, CheckCircle2, ShieldAlert, MessageSquareWarning];

export default function CaseDetailPage() {
  const { caseId } = useParams();
  const currentCase = caseList.find((item) => item.id === caseId) ?? caseList[0];

  return (
    <div className="space-y-6">
      <Link to="/cases" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue"><ArrowLeft size={16} /> Back to cases</Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue">{currentCase.id}</span><StatusBadge status={currentCase.status} /><PriorityBadge priority={currentCase.priority} /></div>
            <h1 className="mt-3 text-3xl font-semibold text-navy">{currentCase.missingPerson}</h1>
            <p className="mt-2 text-sm text-slate-500">Case detail workspace • Mock data for future API integration</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['Age', `${currentCase.age}`], ['Created', currentCase.createdAt], ['Manager', currentCase.caseManager], ['Updated', currentCase.updatedAt]].map(([label, value]) => <div key={label} className="min-w-[120px] rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-900">{value}</p></div>)}
          </div>
        </div>
        <div className="mt-6 flex gap-2 overflow-x-auto border-t border-slate-200 pt-4">
          {tabs.map((tab, index) => { const Icon = tabIcons[index]; return <button key={tab} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${index === 0 ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Icon size={14} />{tab}</button>; })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Overview" subtitle="Case summary">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs text-slate-500">Last known location</p><p className="mt-1 font-semibold text-slate-900">{currentCase.location}</p></div>
            <div><p className="text-xs text-slate-500">Assigned teams</p><p className="mt-1 font-semibold text-slate-900">{currentCase.assignedTeams.join(', ')}</p></div>
            <div><p className="text-xs text-slate-500">Current status</p><div className="mt-1"><StatusBadge status={currentCase.status} /></div></div>
            <div><p className="text-xs text-slate-500">Priority signal</p><div className="mt-1"><PriorityBadge priority={currentCase.priority} /></div></div>
          </div>
          <div className="mt-6 rounded-xl border border-blue/20 bg-blue/5 p-4"><p className="text-sm font-semibold text-navy">Operational note</p><p className="mt-1 text-sm leading-6 text-slate-600">This case workspace is populated with mock records. Actions are intentionally read-only until backend case workflows are connected.</p></div>
        </SectionCard>

        <SectionCard title="Case health" subtitle="Live readiness"><div className="space-y-4">
          {[['Search coverage', '82%', 'bg-teal'], ['Evidence verification', '64%', 'bg-blue'], ['Team readiness', '91%', 'bg-navy']].map(([label, value, color]) => <div key={label}><div className="mb-2 flex justify-between text-sm"><span className="text-slate-600">{label}</span><span className="font-semibold text-slate-900">{value}</span></div><div className="h-2.5 rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: value }} /></div></div>)}
+        </div></SectionCard>
+      </section>
+
+      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
+        <SectionCard title="Timeline" subtitle="Recent activity"><div className="space-y-5">
+          {caseTimeline.map((event, index) => <div key={event.id} className="relative flex gap-3"><div className="relative flex w-5 justify-center"><span className="mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue ring-2 ring-blue/20" />{index < caseTimeline.length - 1 ? <span className="absolute top-5 h-full w-px bg-slate-200" /> : null}</div><div className="pb-1"><p className="text-sm font-semibold text-slate-900">{event.title}</p><p className="mt-1 text-sm text-slate-600">{event.detail}</p><p className="mt-2 text-xs text-slate-500">{event.actor} • {event.timestamp}</p></div></div>)}
+        </div></SectionCard>
+
+        <SectionCard title="Possible matches" subtitle="AI-assisted review"><div className="space-y-3">
+          {[['Match candidate A', '87%', 'High confidence'], ['Match candidate B', '63%', 'Needs review'], ['Match candidate C', '41%', 'Low confidence']].map(([name, confidence, detail]) => <div key={name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"><div><p className="text-sm font-semibold text-slate-900">{name}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div><span className="text-lg font-semibold text-blue">{confidence}</span></div>)}
        </div></SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Search zones" subtitle="Coverage areas"><div className="space-y-3">{['North District Park', 'Riverfront Trail', 'Old Town Corridor'].map((zone, index) => <div key={zone} className="flex items-center justify-between rounded-xl border border-slate-200 p-3"><div className="flex items-center gap-2"><MapPinned size={16} className="text-teal" /><span className="text-sm font-medium text-slate-700">{zone}</span></div><span className="text-xs font-semibold text-slate-500">{82 - index * 9}%</span></div>)}</div></SectionCard>
        <SectionCard title="Sightings & evidence" subtitle="Review queue"><div className="space-y-3"><AlertCard title="Witness report #S-9021" detail="North entrance, verified by intake." time="12 min ago" severity="Info" /><AlertCard title="Photo evidence #E-1102" detail="Awaiting supervisor verification." time="28 min ago" severity="Warning" /></div></SectionCard>
        <SectionCard title="Escalation" subtitle="Safety controls"><div className="rounded-xl border border-red-200 bg-red-50 p-4"><div className="flex items-center gap-2 text-red-600"><ShieldAlert size={17} /><span className="text-sm font-semibold">Command review active</span></div><p className="mt-2 text-sm leading-6 text-red-700">The current priority requires command visibility. No external notification is sent from this frontend-only view.</p></div></SectionCard>
      </section>
    </div>
  );
}
