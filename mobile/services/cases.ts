import type { Case } from '@/types';

export type AppearanceData = {
  height: string;
  build: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  skinTone: string;
  shirtColor: string;
  shirtType: string;
  pantsColor: string;
  pantsType: string;
  footwear: string;
  accessories: string;
};

export type CreateCasePayload = {
  missingPersonName: string;
  age: string;
  gender: string;
  photoUri?: string;
  lastSeenLocation: string;
  lastSeenDate?: string;
  lastSeenTime: string;
  clothing: string;
  physicalDescription: string;
  knownDestination: string;
  direction: string;
  eventVenue: string;
  additionalInformation: string;
  appearance?: AppearanceData;
};

export interface CaseService {
  createCase(payload: CreateCasePayload): Promise<Case>;
}

export type CaseMember = {
  id: string;
  case_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string | null;
  left_at: string | null;
};
