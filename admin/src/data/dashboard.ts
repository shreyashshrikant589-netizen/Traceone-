import type { AlertItem, CaseItem, CaseTimelineEvent, Metric } from '../types';

export const metrics: Metric[] = [
  { label: 'Active Cases', value: '128', trend: '+12% vs last week', positive: true },
  { label: 'Volunteers Ready', value: '94', trend: '+8% this morning', positive: true },
  { label: 'Verified Sightings', value: '31', trend: '7 pending review', positive: true },
  { label: 'Escalations', value: '4', trend: '2 critical', positive: false },
];

export const alerts: AlertItem[] = [
  { id: 'A-2041', title: 'Riverfront zone screening', time: '2 min ago', severity: 'critical', detail: 'New witness report needs review before next deployment.' },
  { id: 'A-2047', title: 'Volunteer coverage gap', time: '17 min ago', severity: 'warning', detail: 'North district is operating below target staffing.' },
  { id: 'A-2055', title: 'Case priority review', time: '41 min ago', severity: 'info', detail: 'AI prioritization flagged a pattern match for manual confirmation.' },
];

export const caseList: CaseItem[] = [
  { id: 'CASE-1042', missingPerson: 'Aarohi Sharma', age: 22, location: 'North District Park', createdAt: 'Sep 18, 2026', assignedTeams: ['Alpha-12', 'K9 Unit'], caseManager: 'R. Singh', status: 'Critical', priority: 'High', updatedAt: '5 min ago' },
  { id: 'CASE-1071', missingPerson: 'Marco Silva', age: 34, location: 'Old Town Corridor', createdAt: 'Sep 17, 2026', assignedTeams: ['Bravo-08'], caseManager: 'S. Lee', status: 'Searching', priority: 'High', updatedAt: '18 min ago' },
  { id: 'CASE-1108', missingPerson: 'Lina Hassan', age: 16, location: 'Cedar Bridge', createdAt: 'Sep 15, 2026', assignedTeams: ['Delta-03', 'River Team'], caseManager: 'N. Patel', status: 'Active', priority: 'Medium', updatedAt: '33 min ago' },
  { id: 'CASE-1126', missingPerson: 'Theo Brooks', age: 47, location: 'East Industrial Route', createdAt: 'Sep 12, 2026', assignedTeams: ['Echo-07'], caseManager: 'A. Wu', status: 'Resolved', priority: 'Low', updatedAt: '1 hour ago' },
  { id: 'CASE-1140', missingPerson: 'Maya Okafor', age: 28, location: 'West Station', createdAt: 'Sep 10, 2026', assignedTeams: ['Foxtrot-02'], caseManager: 'D. Shah', status: 'Escalated', priority: 'High', updatedAt: '2 hours ago' },
  { id: 'CASE-1148', missingPerson: 'Jon Bell', age: 61, location: 'Lakeside Trail', createdAt: 'Sep 4, 2026', assignedTeams: ['Charlie-04'], caseManager: 'K. Morgan', status: 'Closed', priority: 'Low', updatedAt: 'Yesterday' },
];

export const caseTimeline: CaseTimelineEvent[] = [
  { id: 'event-1', title: 'Case escalated to command', detail: 'Priority raised after a high-confidence public sighting.', actor: 'R. Singh', timestamp: 'Today, 09:42', type: 'escalation' },
  { id: 'event-2', title: 'Search team deployed', detail: 'Alpha-12 and K9 Unit assigned to North District Park.', actor: 'Dispatch desk', timestamp: 'Today, 09:18', type: 'search' },
  { id: 'event-3', title: 'New sighting received', detail: 'Witness report submitted from the north entrance.', actor: 'Public report', timestamp: 'Today, 08:56', type: 'sighting' },
  { id: 'event-4', title: 'Case opened', detail: 'Initial report verified by the intake team.', actor: 'Intake team', timestamp: 'Sep 18, 2026, 16:20', type: 'case' },
];
