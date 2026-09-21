import { AlertTriangle, Activity, BellRing, CheckCircle2, Search, ShieldAlert, TrendingUp, Users, Zap } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AlertCard from '../components/AlertCard';
import DataTable from '../components/DataTable';
import PriorityBadge from '../components/PriorityBadge';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { activityTrend, aiPriority, criticalAlerts, emergencyCases, recentSightings, searchOperations, stats, statusChart, volunteerActivity, volunteerParticipation } from '../data/dashboardOverview';

const priorityColors = ['#DC2626', '#F59E0B', '#0D9488', '#94A3B8'];
const statusColors = ['#2563EB', '#0D9488', '#F59E0B', '#64748B'];

export default function DashboardPage() {
  const emergencyColumns = [
    { key: 'id', header: 'Case ID' },
    { key: 'name', header: 'Person' },
    { key: 'location', header: 'Location' },
    { key: 'team', header: 'Team' },
    { key: 'status', header: 'Status', render: (row: (typeof emergencyCases)[number]) => <StatusBadge status={row.status as 'Active' | 'Escalated' | 'Monitoring' | 'Resolved' | 'Pending' | 'Review'} /> },
    { key: 'priority', header: 'Priority', render: (row: (typeof emergencyCases)[number]) => <PriorityBadge priority={row.priority as 'High' | 'Medium' | 'Low'} /> },
    { key: 'updatedAt', header: 'Updated' },
  ];

  const sightingColumns = [
    { key: 'id', header: 'ID' },
    { key: 'type', header: 'Report Type' },
    { key: 'location', header: 'Location' },
    { key: 'confidence', header: 'Confidence' },
    { key: 'status', header: 'Status', render: (row: (typeof recentSightings)[number]) => <StatusBadge status={row.status as 'Active' | 'Escalated' | 'Monitoring' | 'Resolved' | 'Pending' | 'Review'} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Operations overview</p>
          <h1 className="mt-2 text-3xl font-semibold text-navy">TraceOne Admin Dashboard</h1>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-soft">
          Mock data • Frontend-only view
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            detail={stat.detail}
            tone={stat.tone}
            icon={
              stat.label.includes('Active') ? <Activity size={18} /> :
              stat.label.includes('Volunteer') ? <Users size={18} /> :
              stat.label.includes('Search') ? <Search size={18} /> :
              stat.label.includes('Alert') ? <AlertTriangle size={18} /> :
              stat.label.includes('Sightings') ? <CheckCircle2 size={18} /> :
              <ShieldAlert size={18} />
            }
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <SectionCard title="Search operations" subtitle="Operational trend" action={<span className="rounded-full bg-blue/10 px-2.5 py-1 text-xs font-semibold text-blue">Live</span>}>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityTrend}>
                <defs>
                  <linearGradient id="teams" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="volunteers" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#14B8A6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="teams" stroke="#2563EB" strokeWidth={2} fill="url(#teams)" name="Search teams" />
                <Area type="monotone" dataKey="volunteers" stroke="#0D9488" strokeWidth={2} fill="url(#volunteers)" name="Volunteers active" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Critical alerts" subtitle="Attention required" action={<span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">{criticalAlerts.length} active</span>}>
          <div className="space-y-3">
            {criticalAlerts.map((alert) => (
              <AlertCard key={alert.title} title={alert.title} detail={alert.detail} time={alert.time} severity={alert.severity as 'Critical' | 'Warning' | 'Info'} />
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Active emergency cases" subtitle="Priority queue" action={<button className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">View all</button>}>
          <DataTable
            columns={emergencyColumns}
            rows={emergencyCases}
          />
        </SectionCard>

        <SectionCard title="AI search priority" subtitle="Signal confidence">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={aiPriority} dataKey="value" nameKey="label" innerRadius={46} outerRadius={90} paddingAngle={3}>
                  {aiPriority.map((entry, index) => <Cell key={entry.label} fill={priorityColors[index % priorityColors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            {aiPriority.map((item, index) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: priorityColors[index % priorityColors.length] }} />
                  <span className="text-slate-600">{item.label}</span>
                </div>
                <span className="font-semibold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Recent sightings" subtitle="Latest reports" action={<button className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">Export</button>}>
          <DataTable columns={sightingColumns} rows={recentSightings} />
        </SectionCard>

        <SectionCard title="Volunteer activity" subtitle="Coverage distribution">
          <div className="space-y-4">
            {volunteerActivity.map((person) => (
              <div key={person.name} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{person.name}</p>
                    <p className="text-xs text-slate-500">{person.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-navy">{person.hours}h</p>
                    <p className="text-[11px] text-slate-500">{person.shifts} shifts</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_0.7fr_0.9fr]">
        <SectionCard title="Case status distribution" subtitle="Portfolio" action={<TrendingUp className="h-4 w-4 text-blue" />}>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChart}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {statusChart.map((entry, index) => (
                    <Cell key={entry.name} fill={statusColors[index % statusColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Search zones" subtitle="Coverage" action={<Zap className="h-4 w-4 text-teal" />}>
          <div className="space-y-4">
            {searchOperations.map((zone) => (
              <div key={zone.zone}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{zone.zone}</span>
                  <span className="text-slate-500">{zone.coverage}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue to-teal" style={{ width: `${zone.coverage}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{zone.teams} teams</span>
                  <StatusBadge status={zone.status as 'Active' | 'Escalated' | 'Monitoring' | 'Resolved' | 'Pending' | 'Review'} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Volunteer participation" subtitle="By region" action={<Users className="h-4 w-4 text-slate-500" />}>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volunteerParticipation} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={70} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563EB" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Alerts feed" subtitle="Operational updates">
          <div className="space-y-3">
            {criticalAlerts.map((alert) => (
              <div key={`${alert.title}-${alert.time}`} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mt-0.5 rounded-full bg-red-50 p-2 text-red-600">
                  <BellRing size={15} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{alert.time}</p>
                  <p className="mt-2 text-sm text-slate-600">{alert.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Team activity" subtitle="Field readiness">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Avg. response time</p>
              <p className="mt-2 text-3xl font-semibold text-navy">12 min</p>
              <p className="mt-2 text-xs text-teal">-2 min vs last week</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Escalations closed</p>
              <p className="mt-2 text-3xl font-semibold text-navy">91%</p>
              <p className="mt-2 text-xs text-slate-500">Within SLA</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <p className="text-sm text-slate-500">Operations health</p>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-blue to-teal" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Preparedness</span>
                <span className="font-semibold text-navy">86% stable</span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
