import type {
  Case,
  Evidence,
  Notification,
  SearchSession,
  SearchZone,
  Sighting,
  User,
  VolunteerAssignment,
} from '@/types';
import type { CreateCasePayload } from './cases';
import type { CaseDetail, CaseTimelineEvent } from './caseDetails';
import type { JoinCasePayload, JoinPreview } from './joinCase';
import type { SearchZoneView, VolunteerAssignmentView } from './volunteer';
import type { CreateEvidencePayload, CreateSearchNotePayload, ReportSightingPayload } from './reporting';
import type { PublicCase, PublicSearchAlert } from './publicSearch';
import type { AIPriorityResult } from './aiPriority';
import type { MatchReviewAction, PossibleMatch } from './possibleMatch';
import type { ManagerOverview } from './manager';
import type { ProfileData, SearchHistoryItem } from './profile';
import type { AppNotification } from './notifications';

export interface TraceOneApi {
  getCurrentUser(): Promise<User | null>;
  listCases(): Promise<Case[]>;
  getCase(caseId: string): Promise<Case | null>;
  listSearchZones(caseId: string): Promise<SearchZone[]>;
  listVolunteerAssignments(caseId: string): Promise<VolunteerAssignment[]>;
  listEvidence(caseId: string): Promise<Evidence[]>;
  listSightings(caseId: string): Promise<Sighting[]>;
  listNotifications(): Promise<Notification[]>;
  listSearchSessions(caseId: string): Promise<SearchSession[]>;
  createCase(payload: CreateCasePayload): Promise<Case>;
  getCaseDetails(caseId: string): Promise<CaseDetail>;
  listCaseTimeline(caseId: string): Promise<CaseTimelineEvent[]>;
  previewJoinCase(payload: JoinCasePayload): Promise<JoinPreview>;
  joinCase(payload: JoinCasePayload): Promise<void>;
  getMyAssignment(): Promise<VolunteerAssignmentView | null>;
  listSearchZones(): Promise<SearchZoneView[]>;
  createEvidence(payload: CreateEvidencePayload): Promise<void>;
  createSearchNote(payload: CreateSearchNotePayload): Promise<void>;
  reportSighting(payload: ReportSightingPayload): Promise<void>;
  listPublicCases(): Promise<PublicCase[]>;
  getPublicCase(caseReference: string): Promise<PublicCase>;
  getPublicSearchAlert(): Promise<PublicSearchAlert | null>;
  getSearchPriority(caseId: string): Promise<AIPriorityResult[]>;
  getPossibleMatch(caseId: string): Promise<PossibleMatch | null>;
  reviewPossibleMatch(caseId: string, action: MatchReviewAction): Promise<void>;
  getManagerOverview(): Promise<ManagerOverview>;
  publishCase(caseId: string): Promise<void>;
  notifyPolice(caseId: string): Promise<void>;
  getProfile(): Promise<ProfileData>;
  listSearchHistory(): Promise<SearchHistoryItem[]>;
  listNotifications(): Promise<AppNotification[]>;
  markNotificationRead(notificationId: string): Promise<void>;
}

export interface TraceOneApiConfig {
  baseUrl: string;
  accessToken?: string;
}

export function createApiClient(_config: TraceOneApiConfig): TraceOneApi {
  throw new Error('Production API client is not connected yet.');
}
