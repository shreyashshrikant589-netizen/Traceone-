export type ReportStatus = 'New' | 'Under Review' | 'Verified' | 'Rejected' | 'Needs More Information';

export type PublicReport = {
  id: string;
  caseId: string;
  submittedTime: string;
  location: string;
  description: string;
  source: string;
  verificationStatus: ReportStatus;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  submittedBy: string;
  contact: string;
};

export const publicReports: PublicReport[] = [
  { id: 'RPT-9021', caseId: 'CASE-1042', submittedTime: 'Today, 09:42', location: 'North District Park, east entrance', description: 'A person matching the submitted case description was seen near the east footpath.', source: 'Public web form', verificationStatus: 'New', priority: 'Critical', submittedBy: 'Anonymous witness', contact: 'Contact withheld' },
  { id: 'RPT-9028', caseId: 'CASE-1071', submittedTime: 'Today, 09:18', location: 'Old Town transit crossing', description: 'Witness noticed a blue jacket and backpack near the southbound platform.', source: 'Mobile report', verificationStatus: 'Under Review', priority: 'High', submittedBy: 'Samuel R.', contact: 'samuel.r@example.test' },
  { id: 'RPT-9041', caseId: 'CASE-1108', submittedTime: 'Yesterday, 18:26', location: 'Cedar Bridge, west footpath', description: 'Photo attached with a partially visible figure near the bridge access road.', source: 'Public web form', verificationStatus: 'Verified', priority: 'High', submittedBy: 'Amina K.', contact: 'Contact withheld' },
  { id: 'RPT-9049', caseId: 'CASE-1126', submittedTime: 'Yesterday, 15:04', location: 'East Industrial Route, gate 3', description: 'A vehicle was reported parked near the closed service entrance.', source: 'Partner referral', verificationStatus: 'Needs More Information', priority: 'Medium', submittedBy: 'Site security', contact: 'security@example.test' },
  { id: 'RPT-9062', caseId: 'CASE-1140', submittedTime: 'Sep 20, 2026, 11:36', location: 'West Station concourse', description: 'Report contained an unrelated photo and no matching details.', source: 'Public web form', verificationStatus: 'Rejected', priority: 'Low', submittedBy: 'Anonymous witness', contact: 'Contact withheld' },
];

export const reportTimeline = [
  { title: 'Report submitted', detail: 'Public submission received through the mock intake channel.', time: 'Today, 09:42' },
  { title: 'Automatically linked to case', detail: 'Submission associated with CASE-1042 for human review.', time: 'Today, 09:43' },
  { title: 'Awaiting verification', detail: 'No verification decision has been recorded.', time: 'Today, 09:44' },
];
