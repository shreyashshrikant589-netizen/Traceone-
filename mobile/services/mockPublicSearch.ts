import type { PublicCase, PublicSearchAlert } from './publicSearch';

export const mockPublicCases: PublicCase[] = [
  { name: 'Aarohi Sharma', age: 24, lastKnownArea: 'North District · Community Park', lastSeen: 'Today, 08:40', status: 'LOCAL_SEARCH', priority: 'High' },
  { name: 'Meera Kapoor', age: 31, lastKnownArea: 'Riverside East · Gate 2', lastSeen: 'Yesterday, 19:15', status: 'PUBLIC_SEARCH', priority: 'Critical' },
  { name: 'Ishita Rao', age: 19, lastKnownArea: 'Central Market', lastSeen: 'Mar 18, 16:20', status: 'PUBLIC_SEARCH', priority: 'High' },
];

export const mockPublicSearchAlert: PublicSearchAlert = {
  title: 'Public Search Alert', message: 'A community search is active in the North District. Share only relevant observations through TraceOne.', area: 'North District', updatedAt: 'Updated 12 minutes ago',
};
