import { evidenceItems } from '../data/evidenceAudit';
import { possibleMatches } from '../data/possibleMatches';
import { publicReports } from '../data/publicReports';
import type { EvidenceItem } from '../data/evidenceAudit';
import type { PossibleMatch } from '../data/possibleMatches';
import type { PublicReport } from '../data/publicReports';
import { mockResponse, type ApiResponse, type ServiceOptions } from './api';

export function fetchPublicReports(_options?: ServiceOptions): Promise<ApiResponse<PublicReport[]>> {
  return mockResponse(publicReports);
}

export function fetchEvidence(_options?: ServiceOptions): Promise<ApiResponse<EvidenceItem[]>> {
  return mockResponse(evidenceItems);
}

export function fetchPossibleMatches(_options?: ServiceOptions): Promise<ApiResponse<PossibleMatch[]>> {
  return mockResponse(possibleMatches);
}
