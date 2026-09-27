export type EvidenceType = 'LAST_SEEN' | 'WITNESS' | 'OBSERVATION' | 'DIRECTION' | 'EXIT' | 'CROWD_FLOW' | 'SEARCH_RESULT';

export type CreateEvidencePayload = {
  sessionToken: string;
  type: EvidenceType;
  location: string;
  time: string;
  description: string;
  photoUri?: string;
  confidence?: number;
  source?: string;
};

export type CreateSearchNotePayload = {
  sessionToken: string;
  text: string;
  photoUri?: string;
  location?: string;
};

export type ReportSightingPayload = {
  sessionToken: string;
  location: string;
  time: string;
  description: string;
  photoUri?: string;
  additionalObservation?: string;
};

export interface ReportingService {
  createEvidence(payload: CreateEvidencePayload): Promise<void>;
  createSearchNote(payload: CreateSearchNotePayload): Promise<void>;
  reportSighting(payload: ReportSightingPayload): Promise<void>;
}
