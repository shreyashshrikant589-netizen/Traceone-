export type PossibleMatch = {
  id?: string;
  status?: 'PENDING' | 'REVIEW_REQUIRED' | 'CONFIRMED' | 'REJECTED';
  source_image_url?: string;
  candidate_image_url?: string;
  model_version?: string | null;
  similarity_score?: number | null;
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
