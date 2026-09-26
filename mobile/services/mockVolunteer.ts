import type { SearchZoneView, VolunteerAssignmentView } from './volunteer';

export const mockAssignment: VolunteerAssignmentView = {
  caseName: 'Aarohi Sharma', missingPerson: 'Aarohi Sharma', assignedZone: 'Zone A · Community Park', priority: 'High', status: 'ASSIGNED', instructions: 'Search the north walking path in pairs. Record observations only after confirming the location and time.',
};

export const mockSearchZones: SearchZoneView[] = [
  { name: 'Zone A', priorityScore: 87, status: 'ASSIGNED', reason: 'Near last known location' },
  { name: 'Zone B', priorityScore: 74, status: 'UNSEARCHED', reason: 'Recent witness report' },
  { name: 'Zone C', priorityScore: 61, status: 'IN_PROGRESS', reason: 'Exit proximity' },
  { name: 'Zone D', priorityScore: 48, status: 'REOPEN', reason: 'Crowd flow' },
  { name: 'Zone E', priorityScore: 29, status: 'UNSEARCHED', reason: 'Not searched yet' },
];
