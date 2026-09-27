export type SearchZoneStatus = 'Unassigned' | 'Assigned' | 'Searching' | 'Completed' | 'Expanded' | 'Cancelled';

export type SearchZone = {
  id: string;
  caseId: string;
  assignedTeam: string;
  status: SearchZoneStatus;
  priority: 'High' | 'Medium' | 'Low';
  progress: number;
  lastUpdate: string;
  coordinates: { left: string; top: string; size: string; tone: 'blue' | 'teal' | 'amber' | 'red' };
  overlapsWith?: string;
};

export const searchZones: SearchZone[] = [
  { id: 'ZONE-041', caseId: 'CASE-1042', assignedTeam: 'Alpha-12', status: 'Searching', priority: 'High', progress: 68, lastUpdate: '4 min ago', coordinates: { left: '18%', top: '22%', size: '29%', tone: 'red' }, overlapsWith: 'ZONE-044' },
  { id: 'ZONE-044', caseId: 'CASE-1042', assignedTeam: 'Delta-03', status: 'Assigned', priority: 'High', progress: 34, lastUpdate: '12 min ago', coordinates: { left: '35%', top: '31%', size: '27%', tone: 'blue' }, overlapsWith: 'ZONE-041' },
  { id: 'ZONE-052', caseId: 'CASE-1071', assignedTeam: 'Bravo-08', status: 'Searching', priority: 'Medium', progress: 46, lastUpdate: '9 min ago', coordinates: { left: '61%', top: '19%', size: '24%', tone: 'teal' } },
  { id: 'ZONE-063', caseId: 'CASE-1108', assignedTeam: 'Unassigned', status: 'Unassigned', priority: 'Medium', progress: 0, lastUpdate: '1 hr ago', coordinates: { left: '55%', top: '58%', size: '19%', tone: 'amber' } },
  { id: 'ZONE-071', caseId: 'CASE-1126', assignedTeam: 'Echo-07', status: 'Completed', priority: 'Low', progress: 100, lastUpdate: 'Yesterday', coordinates: { left: '21%', top: '65%', size: '18%', tone: 'teal' } },
  { id: 'ZONE-078', caseId: 'CASE-1140', assignedTeam: 'Alpha-12', status: 'Expanded', priority: 'High', progress: 52, lastUpdate: '28 min ago', coordinates: { left: '72%', top: '57%', size: '25%', tone: 'red' } },
];
