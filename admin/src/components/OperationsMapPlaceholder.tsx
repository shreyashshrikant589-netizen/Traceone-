import { Compass, MapPinned } from 'lucide-react';

export default function OperationsMapPlaceholder() {
  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      <div className="absolute inset-0 bg-gradient-to-br from-blue/10 via-transparent to-teal/10" />
      <div className="absolute left-[22%] top-[28%] h-28 w-28 rounded-full border-2 border-blue/30 bg-blue/10" />
      <div className="absolute right-[22%] top-[42%] h-36 w-36 rounded-full border-2 border-teal/30 bg-teal/10" />
      <div className="absolute left-[58%] top-[18%] h-3 w-3 rounded-full bg-red-500 ring-8 ring-red-500/15" />
      <div className="absolute left-[31%] top-[63%] h-3 w-3 rounded-full bg-blue ring-8 ring-blue/15" />
      <div className="absolute right-[18%] top-[68%] h-3 w-3 rounded-full bg-teal ring-8 ring-teal/15" />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="max-w-sm rounded-2xl border border-white/80 bg-white/90 p-6 text-center shadow-soft backdrop-blur-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white"><MapPinned size={22} /></div>
          <h2 className="mt-4 text-lg font-semibold text-navy">Operations map placeholder</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Map integration will be connected by the Maps/Location team.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"><Compass size={14} /> Mock zone visualization</div>
        </div>
      </div>
    </div>
  );
}
