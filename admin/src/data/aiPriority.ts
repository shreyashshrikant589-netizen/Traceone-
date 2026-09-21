export type AIPriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type HumanReviewStatus = 'Needs review' | 'Reviewed' | 'Accepted for planning' | 'Verification requested' | 'Rejected';

export type AIPriorityItem = {
  id: string;
  caseId: string;
  zone: string;
  priority: AIPriorityLevel;
  confidence: number;
  supportingFactors: string[];
  lastUpdated: string;
  reviewStatus: HumanReviewStatus;
  trend: number;
};

export const aiPriorityItems: AIPriorityItem[] = [
  { id: 'AI-1042', caseId: 'CASE-1042', zone: 'North District Park', priority: 'Critical', confidence: 92, supportingFactors: ['Recent witness report', 'Time-sensitive case', 'Zone proximity signal'], lastUpdated: '4 min ago', reviewStatus: 'Needs review', trend: 18 },
  { id: 'AI-1071', caseId: 'CASE-1071', zone: 'Old Town Corridor', priority: 'High', confidence: 81, supportingFactors: ['Multiple public reports', 'Active search coverage', 'Pattern similarity'], lastUpdated: '12 min ago', reviewStatus: 'Reviewed', trend: 9 },
  { id: 'AI-1108', caseId: 'CASE-1108', zone: 'Cedar Bridge', priority: 'High', confidence: 76, supportingFactors: ['Recent activity window', 'Open search zone', 'Report recency'], lastUpdated: '23 min ago', reviewStatus: 'Verification requested', trend: 6 },
  { id: 'AI-1126', caseId: 'CASE-1126', zone: 'East Industrial Route', priority: 'Medium', confidence: 58, supportingFactors: ['Historical report cluster', 'Partial zone coverage'], lastUpdated: '41 min ago', reviewStatus: 'Accepted for planning', trend: -2 },
  { id: 'AI-1140', caseId: 'CASE-1140', zone: 'West Station', priority: 'Low', confidence: 31, supportingFactors: ['Older report', 'Limited corroboration'], lastUpdated: '1 hr ago', reviewStatus: 'Rejected', trend: -8 },
];

export const priorityDistribution = [
  { name: 'Critical', value: 1 },
  { name: 'High', value: 2 },
  { name: 'Medium', value: 1 },
  { name: 'Low', value: 1 },
];

export const confidenceTrend = [
  { name: '09:00', confidence: 54, reviewed: 22 },
  { name: '10:00', confidence: 61, reviewed: 31 },
  { name: '11:00', confidence: 66, reviewed: 40 },
  { name: '12:00', confidence: 72, reviewed: 48 },
  { name: '13:00', confidence: 69, reviewed: 57 },
  { name: '14:00', confidence: 78, reviewed: 64 },
];
