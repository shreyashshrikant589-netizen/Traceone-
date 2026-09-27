export type PossibleMatch = {
  candidateImageUri?: string;
  similarity?: number;
  confidence?: number;
  evidence: string[];
  observations: string[];
  timestamp: string;
};

export type MatchReviewAction = 'CONFIRM' | 'REJECT' | 'REQUEST_REVIEW';

export interface PossibleMatchService {
  getPossibleMatch(caseId: string): Promise<PossibleMatch | null>;
  reviewPossibleMatch(caseId: string, action: MatchReviewAction): Promise<void>;
}
