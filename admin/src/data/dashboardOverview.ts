export const stats = [
  { label: 'Active Cases', value: '128', detail: 'Across 14 zones', tone: 'blue' as const },
  { label: 'Active Volunteers', value: '94', detail: '12 on standby', tone: 'teal' as const },
  { label: 'Active Search Teams', value: '18', detail: '5 high-priority teams', tone: 'blue' as const },
  { label: 'Critical Alerts', value: '4', detail: '2 require escalation', tone: 'red' as const },
  { label: 'Open Sightings', value: '31', detail: '7 this hour', tone: 'slate' as const },
  { label: 'Pending Verification', value: '12', detail: '5 awaiting supervisor', tone: 'teal' as const },
];

export const emergencyCases = [
  { id: 'CASE-1042', name: 'Aarohi Sharma', location: 'North District Park', status: 'Active', priority: 'High', team: 'Alpha-12', updatedAt: '5 min ago' },
  { id: 'CASE-1071', name: 'Marco Silva', location: 'Old Town Corridor', status: 'Monitoring', priority: 'High', team: 'Bravo-08', updatedAt: '18 min ago' },
  { id: 'CASE-1108', name: 'Lina Hassan', location: 'Cedar Bridge', status: 'Review', priority: 'Medium', team: 'Delta-03', updatedAt: '34 min ago' },
  { id: 'CASE-1126', name: 'Theo Brooks', location: 'East Industrial Route', status: 'Pending', priority: 'Medium', team: 'Echo-07', updatedAt: '1 hr ago' },
];

export const searchOperations = [
  { zone: 'North District', coverage: 82, teams: 5, status: 'Active' },
  { zone: 'Old Town', coverage: 69, teams: 4, status: 'Monitoring' },
  { zone: 'Riverside', coverage: 74, teams: 4, status: 'Active' },
  { zone: 'Industrial Route', coverage: 58, teams: 3, status: 'Pending' },
];

export const aiPriority = [
  { label: 'High Signal', value: 42 },
  { label: 'Medium', value: 31 },
  { label: 'Low', value: 17 },
  { label: 'Needs Review', value: 10 },
];

export const recentSightings = [
  { id: 'S-9021', type: 'Witness Report', location: 'Riverfront Trail', confidence: '92%', status: 'Verified' },
  { id: 'S-9028', type: 'Vehicle Observation', location: 'Old Town Crossing', confidence: '80%', status: 'Pending' },
  { id: 'S-9041', type: 'Footprint Evidence', location: 'Cedar Bridge', confidence: '88%', status: 'Review' },
  { id: 'S-9049', type: 'Public Tip', location: 'North Market', confidence: '73%', status: 'Verified' },
];

export const criticalAlerts = [
  { title: 'Riverfront zone screening', detail: 'New witness report requires supervisor review before next deployment.', time: '2 min ago', severity: 'Critical' },
  { title: 'Volunteer coverage gap', detail: 'North district is below staffing target for late afternoon operations.', time: '17 min ago', severity: 'Warning' },
  { title: 'Possible match cluster', detail: 'AI priority confidence rose above threshold for 3 related person profiles.', time: '31 min ago', severity: 'Info' },
];

export const volunteerActivity = [
  { name: 'N. Patel', shifts: 7, status: 'On site', hours: 14 },
  { name: 'S. Lee', shifts: 5, status: 'Available', hours: 11 },
  { name: 'A. Wu', shifts: 6, status: 'On route', hours: 13 },
  { name: 'M. Chen', shifts: 4, status: 'Available', hours: 8 },
];

export const statusChart = [
  { name: 'Active', value: 42 },
  { name: 'Monitoring', value: 26 },
  { name: 'Review', value: 18 },
  { name: 'Resolved', value: 14 },
];

export const activityTrend = [
  { name: 'Mon', volunteers: 54, teams: 12 },
  { name: 'Tue', volunteers: 62, teams: 14 },
  { name: 'Wed', volunteers: 78, teams: 16 },
  { name: 'Thu', volunteers: 71, teams: 15 },
  { name: 'Fri', volunteers: 88, teams: 18 },
  { name: 'Sat', volunteers: 92, teams: 19 },
  { name: 'Sun', volunteers: 81, teams: 17 },
];

export const volunteerParticipation = [
  { name: 'North', value: 32 },
  { name: 'Old Town', value: 24 },
  { name: 'Riverfront', value: 18 },
  { name: 'Industrial', value: 16 },
  { name: 'East', value: 10 },
];
