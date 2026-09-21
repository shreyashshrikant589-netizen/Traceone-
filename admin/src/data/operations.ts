export type TeamStatus = 'Active' | 'En route' | 'Standby' | 'Needs update';

export type OperationsTeam = {
  id: string;
  name: string;
  members: number;
  zone: string;
  status: TeamStatus;
  lastUpdate: string;
};

export type OperationsZone = {
  name: string;
  caseId: string;
  completion: number;
  teams: number;
  lastVolunteerUpdate: string;
  lastSighting: string;
};

export const operationsTeams: OperationsTeam[] = [
  { id: 'team-alpha', name: 'Alpha-12', members: 6, zone: 'North District Park', status: 'Active', lastUpdate: '4 min ago' },
  { id: 'team-bravo', name: 'Bravo-08', members: 5, zone: 'Old Town Corridor', status: 'En route', lastUpdate: '9 min ago' },
  { id: 'team-delta', name: 'Delta-03', members: 4, zone: 'Cedar Bridge', status: 'Active', lastUpdate: '12 min ago' },
  { id: 'team-echo', name: 'Echo-07', members: 3, zone: 'East Industrial Route', status: 'Needs update', lastUpdate: '26 min ago' },
];

export const operationsZones: OperationsZone[] = [
  { name: 'North District Park', caseId: 'CASE-1042', completion: 68, teams: 2, lastVolunteerUpdate: '4 min ago', lastSighting: 'North entrance, 12 min ago' },
  { name: 'Old Town Corridor', caseId: 'CASE-1071', completion: 46, teams: 1, lastVolunteerUpdate: '9 min ago', lastSighting: 'Transit crossing, 21 min ago' },
  { name: 'Cedar Bridge', caseId: 'CASE-1108', completion: 81, teams: 1, lastVolunteerUpdate: '12 min ago', lastSighting: 'East footpath, 34 min ago' },
  { name: 'East Industrial Route', caseId: 'CASE-1126', completion: 32, teams: 1, lastVolunteerUpdate: '26 min ago', lastSighting: 'No new sighting' },
];

export const operationAlerts = [
  { title: 'Team Echo-07 needs an update', detail: 'Last field check-in was 26 minutes ago.', severity: 'Warning' as const, time: '2 min ago' },
  { title: 'High-confidence sighting received', detail: 'North District Park report needs supervisor review.', severity: 'Critical' as const, time: '12 min ago' },
  { title: 'Zone coverage below target', detail: 'Old Town Corridor is at 46% completion.', severity: 'Info' as const, time: '18 min ago' },
];
