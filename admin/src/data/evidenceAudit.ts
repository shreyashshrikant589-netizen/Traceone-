export type EvidenceType = 'Photo' | 'Video' | 'Document' | 'Note' | 'Location Report';
export type EvidenceStatus = 'New' | 'Under Review' | 'Verified' | 'Rejected';

export type EvidenceItem = {
  id: string;
  caseId: string;
  type: EvidenceType;
  submittedBy: string;
  timestamp: string;
  verificationStatus: EvidenceStatus;
  relatedReference: string;
  summary: string;
};

export const evidenceItems: EvidenceItem[] = [
  { id: 'EVD-1102', caseId: 'CASE-1042', type: 'Photo', submittedBy: 'Public report RPT-9021', timestamp: 'Today, 09:42', verificationStatus: 'Under Review', relatedReference: 'Sighting S-9021', summary: 'Image submitted with a witness report near the north entrance.' },
  { id: 'EVD-1097', caseId: 'CASE-1042', type: 'Location Report', submittedBy: 'Alpha-12', timestamp: 'Today, 09:18', verificationStatus: 'Verified', relatedReference: 'Zone ZONE-041', summary: 'Field team reported a cleared search segment and updated coordinates.' },
  { id: 'EVD-1088', caseId: 'CASE-1071', type: 'Video', submittedBy: 'Public report RPT-9028', timestamp: 'Today, 08:52', verificationStatus: 'New', relatedReference: 'Sighting S-9028', summary: 'Short public-submitted clip requiring manual review.' },
  { id: 'EVD-1076', caseId: 'CASE-1108', type: 'Document', submittedBy: 'N. Patel', timestamp: 'Yesterday, 18:20', verificationStatus: 'Verified', relatedReference: 'Zone ZONE-063', summary: 'Search briefing document attached to the active case record.' },
  { id: 'EVD-1069', caseId: 'CASE-1126', type: 'Note', submittedBy: 'A. Wu', timestamp: 'Yesterday, 15:12', verificationStatus: 'Rejected', relatedReference: 'Sighting S-9049', summary: 'Note did not contain enough identifying or operational detail.' },
];

export type AuditLog = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  caseId: string;
  result: 'Success' | 'Pending' | 'Rejected';
  detail: string;
  metadata: string[];
};

export const auditLogs: AuditLog[] = [
  { id: 'AUD-7001', timestamp: 'Today, 09:44', user: 'R. Singh', action: 'Reviewed escalation', resource: 'ESC-2041', caseId: 'CASE-1042', result: 'Success', detail: 'Escalation opened for command review after a public report.', metadata: ['Role: Operations Lead', 'Surface: Escalation queue', 'Outcome: Review started'] },
  { id: 'AUD-6994', timestamp: 'Today, 09:42', user: 'System intake', action: 'Created evidence record', resource: 'EVD-1102', caseId: 'CASE-1042', result: 'Success', detail: 'Evidence record created from a public submission.', metadata: ['Source: Public report', 'Type: Photo', 'Verification: Under Review'] },
  { id: 'AUD-6988', timestamp: 'Today, 09:18', user: 'N. Patel', action: 'Updated search zone', resource: 'ZONE-041', caseId: 'CASE-1042', result: 'Success', detail: 'Search progress updated by an assigned field team.', metadata: ['Team: Alpha-12', 'Progress: 68%', 'Zone status: Searching'] },
  { id: 'AUD-6972', timestamp: 'Yesterday, 18:20', user: 'A. Wu', action: 'Rejected evidence', resource: 'EVD-1069', caseId: 'CASE-1126', result: 'Rejected', detail: 'Evidence note did not meet verification requirements.', metadata: ['Type: Note', 'Review queue: Evidence', 'External delivery: None'] },
  { id: 'AUD-6960', timestamp: 'Yesterday, 15:12', user: 'S. Lee', action: 'Requested human verification', resource: 'MATCH-3008', caseId: 'CASE-1071', result: 'Pending', detail: 'Possible match routed for human verification.', metadata: ['Surface: Possible matches', 'AI output: Decision support only', 'Next step: Reviewer action'] },
];
