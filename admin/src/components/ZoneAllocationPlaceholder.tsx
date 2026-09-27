import { Layers3, MapPinned } from 'lucide-react';
import type { SearchZone } from '../data/searchZones';

type ZoneAllocationPlaceholderProps = { zones: SearchZone[]; selectedId: string | null; onSelect: (id: string) => void };

const tones = { blue: 'border-blue bg-blue/15', teal: 'border-teal bg-teal/15', amber: 'border-amber-500 bg-amber-100/50', red: 'border-red-500 bg-red-100/50' };

export default function ZoneAllocationPlaceholder({ zones, selectedId, onSelect }: ZoneAllocationPlaceholderProps) {
  return (
    <div className="relative min-h-[500px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
      <div className="absolute inset-0 bg-gradient-to-br from-blue/10 via-transparent to-teal/10" />
      <div className="absolute left-4 top-4 z-10 rounded-xl border border-white/80 bg-white/90 px-3 py-2 shadow-soft backdrop-blur-sm"><div className="flex items-center gap-2 text-sm font-semibold text-navy"><Layers3 size={16} className="text-blue" /> Zone allocation preview</div><p className="mt-1 text-xs text-slate-500">Placeholder for future location integration</p></div>
      {zones.map((zone) => <button key={zone.id} onClick={() => onSelect(zone.id)} className={`absolute rounded-full border-2 transition hover:scale-105 ${tones[zone.coordinates.tone]} ${selectedId === zone.id ? 'z-20 ring-4 ring-navy/20' : 'z-10'}`} style={{ left: zone.coordinates.left, top: zone.coordinates.top, width: zone.coordinates.size, aspectRatio: '1' }} aria-label={`Select ${zone.id}`}><span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">{zone.id.replace('ZONE-', '')}</span></button>)}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-white/80 bg-white/90 p-3 text-xs text-slate-600 shadow-soft backdrop-blur-sm"><span className="font-semibold text-slate-700">Legend:</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-red-500" />High priority</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-blue" />Assigned</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-teal" />Searching / complete</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-amber-500" />Unassigned</span></div>
      <div className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/80 bg-white/90 text-navy shadow-soft backdrop-blur-sm"><MapPinned size={18} /></div>
    </div>
  );
}
