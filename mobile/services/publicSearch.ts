import type { MockCaseStatus } from './mockCases';

export type PublicCase = {
  name: string;
  age: number;
  lastKnownArea: string;
  lastSeen: string;
  status: MockCaseStatus;
  priority?: 'Critical' | 'High' | 'Standard';
};

export type PublicSearchAlert = {
  title: string;
  message: string;
  area: string;
  updatedAt: string;
};

export interface PublicSearchService {
  listPublicCases(): Promise<PublicCase[]>;
  getPublicCase(caseReference: string): Promise<PublicCase>;
  getPublicSearchAlert(): Promise<PublicSearchAlert | null>;
}
