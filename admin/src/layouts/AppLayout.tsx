import { Bell, ChevronRight, LogOut, Menu, Search, UserCircle2, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { adminNavigation, quickStats } from '../constants/adminNavigation';
import { logout } from '../services/authService';

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <aside className={`${mobileNavOpen ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-40 w-[280px] flex-col border-r border-slate-200 bg-white shadow-2xl lg:static lg:flex lg:shadow-none`}>
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-sm font-bold text-white">T</div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">TraceOne</div>
              <div className="text-lg font-semibold text-navy">Admin Portal</div>
            </div>
            <button type="button" onClick={() => setMobileNavOpen(false)} className="ml-auto rounded-lg border border-slate-200 p-2 text-slate-500 lg:hidden" aria-label="Close navigation menu">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            {adminNavigation.map((section) => (
              <div key={section.title} className="mb-6">
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{section.title}</p>
                <nav className="space-y-1.5">
                  {section.items.map(({ label, path, icon: Icon }) => (
                    <NavLink
                      key={path}
                      to={path}
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                          isActive ? 'bg-navy text-white shadow-soft' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue/10 text-blue">
                  <UserCircle2 size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">R. Singh</div>
                  <div className="text-xs text-slate-500">Operations Lead</div>
                </div>
              </div>
              <button type="button" onClick={handleLogout} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:text-slate-900" aria-label="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setMobileNavOpen(true)} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-navy lg:hidden" aria-label="Open navigation menu">
                  <Menu size={18} />
                </button>
                <nav className="hidden items-center gap-2 text-sm text-slate-500 md:flex">
                  <span>Admin</span>
                  <ChevronRight size={14} />
                  <span className="font-medium text-slate-700">Dashboard</span>
                </nav>
              </div>

              <div className="flex flex-1 items-center justify-end gap-3">
                <label className="hidden min-w-[220px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 md:flex">
                  <Search size={16} />
                  <input
                    type="search"
                    placeholder="Search cases, alerts..."
                    className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                    aria-label="Global search"
                  />
                </label>

                <button className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:text-slate-900" aria-label="Notifications">
                  <Bell size={17} />
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
                </button>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">RS</div>
                  <div className="hidden text-left sm:block">
                    <div className="text-sm font-semibold text-slate-900">R. Singh</div>
                    <div className="text-[11px] text-slate-500">Supervisor</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
              <div className="flex flex-wrap items-center gap-3">
                {quickStats.map((item) => (
                  <div key={item.label} className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-medium ${item.accent}`}>
                    <span>{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </header>

          <div className="p-5 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
