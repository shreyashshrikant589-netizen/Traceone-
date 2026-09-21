import type { AppNotification } from './notifications';

export const mockNotifications: AppNotification[] = [
  { id: 'n1', type: 'CRITICAL_ALERT', title: 'Critical Alert', description: 'A coordinator update needs your attention in the active search.', timestamp: '5 min ago', unread: true },
  { id: 'n2', type: 'HIGH_PRIORITY_ZONE', title: 'High-Priority Zone', description: 'Zone A priority was updated after new evidence.', timestamp: '18 min ago', unread: true },
  { id: 'n3', type: 'NEW_SIGHTING', title: 'New Sighting', description: 'A possible sighting was submitted for human verification.', timestamp: '32 min ago', unread: true },
  { id: 'n4', type: 'ZONE_COMPLETED', title: 'Zone Completed', description: 'Zone C was marked searched by the response team.', timestamp: '1 hr ago', unread: false },
  { id: 'n5', type: 'POLICE_STATUS', title: 'Police Status', description: 'A notification request is pending coordinator review.', timestamp: '2 hrs ago', unread: false },
  { id: 'n6', type: 'VOLUNTEER_JOINED', title: 'Volunteer Joined', description: 'A volunteer joined the North District response team.', timestamp: 'Yesterday', unread: false },
];
