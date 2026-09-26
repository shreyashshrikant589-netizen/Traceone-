import type { CaseListStatus } from '@/types';

export type CaseDetail = {
  name: string;
  age: number;
  gender: string;
  photoUri?: string;
  status: CaseListStatus;
  location: string;
  lastSeenTime: string;
  clothing: string;
  physicalDescription: string;
  knownDestination: string;
  direction: string;
  searchProgress: number;
  searchZones: number;
  completedZones: number;
  volunteerCount: number;
  evidenceCount: number;
  priority: 'Critical' | 'High' | 'Standard';
  // Optional ownership identifiers for hybrid role support
  created_by?: string;
  case_manager_id?: string;
};

export type CaseTimelineEventType = 'CASE_CREATED' | 'LOCAL_SEARCH_STARTED' | 'VOLUNTEER_JOINED' | 'SEARCH_ZONE_ASSIGNED' | 'EVIDENCE_SUBMITTED' | 'WITNESS_REPORT' | 'PRIORITY_UPDATED' | 'PUBLIC_ESCALATION' | 'PUBLIC_SEARCH' | 'POSSIBLE_MATCH' | 'HUMAN_VERIFICATION' | 'POLICE_NOTIFICATION';

export type CaseTimelineEvent = {
  type: CaseTimelineEventType;
  title: string;
  description: string;
  timestamp: string;
};

export interface CaseDetailsService {
  getCaseDetails(): Promise<CaseDetail>;
  listCaseTimeline(): Promise<CaseTimelineEvent[]>;
}
