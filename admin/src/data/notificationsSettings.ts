export type NotificationType = 'Critical alert' | 'New sighting' | 'Volunteer update' | 'AI priority update' | 'Possible match' | 'Escalation' | 'System notification';

export type AdminNotification = {
  id: string;
  type: NotificationType;
  title: string;
  detail: string;
  time: string;
  caseId?: string;
  read: boolean;
};

export const notifications: AdminNotification[] = [
  { id: 'NOT-401', type: 'Critical alert', title: 'High-priority public report received', detail: 'RPT-9021 requires review before the next search deployment.', time: '2 min ago', caseId: 'CASE-1042', read: false },
  { id: 'NOT-402', type: 'New sighting', title: 'New sighting submitted', detail: 'A report was received near North District Park east entrance.', time: '12 min ago', caseId: 'CASE-1042', read: false },
  { id: 'NOT-403', type: 'Volunteer update', title: 'Alpha-12 checked in', detail: 'The team submitted a field update from the north entrance.', time: '18 min ago', caseId: 'CASE-1042', read: true },
  { id: 'NOT-404', type: 'AI priority update', title: 'Priority signal updated', detail: 'A decision-support score changed for CASE-1071.', time: '31 min ago', caseId: 'CASE-1071', read: false },
  { id: 'NOT-405', type: 'Possible match', title: 'Possible match requires review', detail: 'MATCH-3008 is waiting for human verification.', time: '41 min ago', caseId: 'CASE-1071', read: true },
  { id: 'NOT-406', type: 'Escalation', title: 'Escalation assigned to you', detail: 'ESC-2041 is pending command review.', time: '1 hr ago', caseId: 'CASE-1042', read: true },
  { id: 'NOT-407', type: 'System notification', title: 'Scheduled maintenance window', detail: 'Mock maintenance notice for the next portal release.', time: 'Yesterday', read: true },
];

export const notificationTypes: NotificationType[] = ['Critical alert', 'New sighting', 'Volunteer update', 'AI priority update', 'Possible match', 'Escalation', 'System notification'];

export const appInfo = { version: 'Admin Portal 0.1.0', environment: 'Frontend mock environment', support: 'TraceOne Operations Support' };
