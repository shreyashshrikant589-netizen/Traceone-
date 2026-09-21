export type MatchStatus = 'Possible Match' | 'Requires Human Verification' | 'Verified' | 'Rejected';

export type PossibleMatch = {
  id: string;
  caseId: string;
  candidateLabel: string;
  confidence: number;
  supportingInformation: string[];
  source: string;
  createdTime: string;
  verificationStatus: MatchStatus;
};

export const possibleMatches: PossibleMatch[] = [
  { id: 'MATCH-3001', caseId: 'CASE-1042', candidateLabel: 'Candidate profile A', confidence: 89, supportingInformation: ['Facial feature similarity', 'Age range overlap', 'Recent public sighting'], source: 'AI image comparison', createdTime: 'Today, 09:36', verificationStatus: 'Requires Human Verification' },
  { id: 'MATCH-3008', caseId: 'CASE-1071', candidateLabel: 'Candidate profile B', confidence: 77, supportingInformation: ['Clothing description overlap', 'Time window alignment', 'Report cluster proximity'], source: 'AI + public reports', createdTime: 'Today, 08:52', verificationStatus: 'Possible Match' },
  { id: 'MATCH-3014', caseId: 'CASE-1108', candidateLabel: 'Candidate profile C', confidence: 71, supportingInformation: ['Height range overlap', 'Known route similarity'], source: 'Case intelligence review', createdTime: 'Yesterday, 18:20', verificationStatus: 'Requires Human Verification' },
  { id: 'MATCH-3022', caseId: 'CASE-1126', candidateLabel: 'Candidate profile D', confidence: 58, supportingInformation: ['Location history overlap', 'Partial description match'], source: 'AI pattern analysis', createdTime: 'Yesterday, 14:04', verificationStatus: 'Rejected' },
  { id: 'MATCH-3030', caseId: 'CASE-1140', candidateLabel: 'Candidate profile E', confidence: 94, supportingInformation: ['Human-reviewed records', 'Multiple corroborating reports', 'Identity documents reviewed'], source: 'Human verification team', createdTime: 'Sep 20, 2026, 11:10', verificationStatus: 'Verified' },
];
