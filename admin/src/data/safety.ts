export type EscalationStatus = 'Pending' | 'Under Review' | 'Escalated' | 'Resolved';

export type Escalation = {
  id: string;
  caseId: string;
  trigger: string;
  severity: 'Critical' | 'High' | 'Medium';
  createdTime: string;
  manager: string;
  status: EscalationStatus;
};

export const escalations: Escalation[] = [
  { id: 'ESC-2041', caseId: 'CASE-1042', trigger: 'High-confidence public report', severity: 'Critical', createdTime: 'Today, 09:44', manager: 'R. Singh', status: 'Pending' },
  { id: 'ESC-2047', caseId: 'CASE-1071', trigger: 'Search coverage gap', severity: 'High', createdTime: 'Today, 08:58', manager: 'S. Lee', status: 'Under Review' },
  { id: 'ESC-2055', caseId: 'CASE-1108', trigger: 'Possible match requires review', severity: 'High', createdTime: 'Yesterday, 18:32', manager: 'N. Patel', status: 'Escalated' },
  { id: 'ESC-2063', caseId: 'CASE-1126', trigger: 'Volunteer safety check-in missed', severity: 'Medium', createdTime: 'Yesterday, 15:12', manager: 'A. Wu', status: 'Resolved' },
];

export const policeNotification = {
  caseId: 'CASE-1042',
  person: 'Aarohi Sharma',
  emergencyLevel: 'Critical',
  reason: 'Time-sensitive public report requires command review and potential external coordination.',
  evidenceSummary: 'One new public report, two active search teams, and an unverified high-priority signal.',
  searchStatus: 'Active search in North District Park',
  contactStatus: 'Integration status unavailable',
};
