import type { Case } from '@/types';

export type CreateCasePayload = {
  missingPersonName: string;
  age: string;
  gender: string;
  photoUri?: string;
  lastSeenLocation: string;
  lastSeenTime: string;
  clothing: string;
  physicalDescription: string;
  knownDestination: string;
  direction: string;
  eventVenue: string;
  additionalInformation: string;
};

export interface CaseService {
  createCase(payload: CreateCasePayload): Promise<Case>;
}
