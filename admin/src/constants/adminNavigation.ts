import { Activity, AlertTriangle, BellRing, BriefcaseBusiness, FileSearch, Filter, Landmark, LayoutDashboard, SearchCheck, ShieldCheck, Users, UserRoundCog, FileText, BadgeAlert, Siren, MapPinned, ClipboardList, Settings, LogOut, ArrowUpRight, UserCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavSection = {
  title: string;
  items: Array<{ label: string; path: string; icon: LucideIcon }>;
};

export const adminNavigation: NavSection[] = [
  {
    title: 'COMMAND',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Live Operations', path: '/live-operations', icon: Activity },
      { label: 'Cases', path: '/cases', icon: BriefcaseBusiness },
    ],
  },
  {
    title: 'PEOPLE',
    items: [
      { label: 'Volunteers', path: '/volunteers', icon: Users },
      { label: 'Teams', path: '/teams', icon: UserRoundCog },
      { label: 'Public Reports', path: '/public-reports', icon: FileText },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { label: 'AI Search Priority', path: '/ai-priority', icon: SearchCheck },
      { label: 'Possible Matches', path: '/possible-matches', icon: FileSearch },
      { label: 'Search Zones', path: '/search-zones', icon: MapPinned },
    ],
  },
  {
    title: 'SAFETY',
    items: [
      { label: 'Alerts', path: '/alerts', icon: BellRing },
      { label: 'Escalations', path: '/escalations', icon: Siren },
      { label: 'Police Notifications', path: '/police-notifications', icon: ShieldCheck },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { label: 'Evidence', path: '/evidence', icon: ClipboardList },
      { label: 'Notifications', path: '/notifications', icon: BadgeAlert },
      { label: 'Audit Logs', path: '/audit-logs', icon: Landmark },
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

export const quickStats = [
  { label: 'Current case', value: 'CASE-1042', accent: 'bg-blue/10 text-blue' },
  { label: 'Status', value: 'ACTIVE', accent: 'bg-teal/10 text-teal' },
];

export const topIcons = {
  search: SearchCheck,
  bell: BellRing,
  user: UserCircle2,
  logout: LogOut,
  arrow: ArrowUpRight,
};
