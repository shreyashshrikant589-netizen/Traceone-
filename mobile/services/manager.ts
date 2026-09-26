export type PoliceStatus = 'PENDING' | 'NOTIFIED' | 'ACKNOWLEDGED' | 'CLOSED';
export type ManagerAction = 'PUBLISH_CASE' | 'NOTIFY_POLICE';

export type ManagerOverview = {
  activeCases: number;
  searchCoverage: number;
  activeVolunteers: number;
  priorityZones: number;
  evidence: number;
  witnessReports: number;
  pendingEscalation: number;
  possibleMatches: number;
  policeStatus: PoliceStatus;
};

export type ManagerDashboardData = {
  case: { id: string; case_number?: string; title?: string; status?: string };
  stats: { active_members: number; total_zones: number; searched_zones: number; active_search_sessions: number; evidence_count: number; witness_report_count: number; possible_match_count: number; pending_reports: number; };
  intelligence?: { top_priority_zones?: unknown[] };
};

export interface ManagerService {
  getOverview(): Promise<ManagerOverview>;
  publishCase(caseId: string): Promise<void>;
  notifyPolice(caseId: string): Promise<void>;
}
